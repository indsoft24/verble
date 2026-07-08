/**
 * WhatsApp Business Cloud API service for OTP delivery.
 *
 * Supports:
 *  - mock — logs OTP to console (development)
 *  - meta — Meta WhatsApp Cloud API with approved authentication template
 *
 * Required env vars when WHATSAPP_API_PROVIDER=meta:
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_OTP_TEMPLATE_NAME
 * Optional:
 *   WHATSAPP_API_VERSION (default v21.0)
 *   WHATSAPP_OTP_TEMPLATE_LANGUAGE (default en_US)
 *   WHATSAPP_OTP_TEMPLATE_HAS_BUTTON (default true)
 */

import axios from 'axios';

const OTP_VALIDITY_MINUTES = 10;

const toWhatsAppRecipient = (phoneNumber) => phoneNumber.replace(/\D/g, '');

export const isWhatsAppConfigured = () => {
    const provider = (process.env.WHATSAPP_API_PROVIDER || 'mock').toLowerCase();
    if (provider === 'mock') return true;
    return Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN &&
            process.env.WHATSAPP_PHONE_NUMBER_ID &&
            process.env.WHATSAPP_OTP_TEMPLATE_NAME
    );
};

/**
 * @param {string} phoneNumber - E.164 e.g. +919876543210
 * @param {string} otp - 6-digit code
 * @param {{ name?: string }} [options]
 */
export const sendWhatsAppOtp = async (phoneNumber, otp, options = {}) => {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g. +919876543210).');
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        throw new Error('OTP must be a 6-digit number.');
    }

    const provider = (process.env.WHATSAPP_API_PROVIDER || 'mock').toLowerCase();

    switch (provider) {
        case 'mock':
            return sendViaMock(phoneNumber, otp, options);
        case 'meta':
            return sendViaMetaCloudApi(phoneNumber, otp, options);
        default:
            throw new Error(
                `Unsupported WhatsApp provider: ${provider}. Set WHATSAPP_API_PROVIDER to "mock" or "meta".`
            );
    }
};

const sendViaMock = async (phoneNumber, otp, options) => {
    const masked = phoneNumber.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3');
    console.log(
        `[WhatsApp:mock] OTP for ${masked}${options.name ? ` (${options.name})` : ''}: ${otp} — valid ${OTP_VALIDITY_MINUTES} min`
    );
    return { success: true, messageId: `mock-${Date.now()}`, provider: 'mock' };
};

const sendViaMetaCloudApi = async (phoneNumber, otp) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US';

    if (!accessToken || !phoneNumberId || !templateName) {
        throw new Error(
            'WhatsApp API not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_OTP_TEMPLATE_NAME in .env'
        );
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const recipient = toWhatsAppRecipient(phoneNumber);

    const templateComponents = [
        {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
        },
    ];

    if (process.env.WHATSAPP_OTP_TEMPLATE_HAS_BUTTON !== 'false') {
        templateComponents.push({
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
        });
    }

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
            name: templateName,
            language: { code: templateLanguage },
            components: templateComponents,
        },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        const messageId = response.data?.messages?.[0]?.id;
        console.log(`[WhatsApp:meta] OTP sent to ${recipient.slice(0, 4)}**** — messageId: ${messageId}`);
        return { success: true, messageId, provider: 'meta' };
    } catch (error) {
        const apiError = error.response?.data?.error;
        const detail = apiError?.message || error.message;
        console.error('[WhatsApp:meta] Send failed:', apiError || error.message);
        throw new Error(`Failed to send WhatsApp OTP: ${detail}`);
    }
};

export default { sendWhatsAppOtp, isWhatsAppConfigured };
