/**
 * WhatsApp Business Cloud API service for OTP and login PIN delivery.
 *
 * Supports:
 *  - mock — logs to console (development)
 *  - meta — Meta WhatsApp Cloud API with approved templates
 *
 * Required env when WHATSAPP_API_PROVIDER=meta:
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_OTP_TEMPLATE_NAME          — registration OTP template
 * Optional:
 *   WHATSAPP_LOGIN_PIN_TEMPLATE_NAME    — login PIN template (falls back to OTP template)
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

const getTemplateConfig = (purpose) => {
    const otpName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    const pinName = process.env.WHATSAPP_LOGIN_PIN_TEMPLATE_NAME || otpName;
    const language = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US';
    const hasButton = process.env.WHATSAPP_OTP_TEMPLATE_HAS_BUTTON !== 'false';

    if (purpose === 'login_pin') {
        return { name: pinName, language, hasButton };
    }
    // otp + otp_fallback both use the approved OTP template
    return { name: otpName, language, hasButton };
};

/**
 * @param {string} phoneNumber - E.164 e.g. +919876543210
 * @param {string} code - 6-digit code
 * @param {{ name?: string, purpose?: 'otp' | 'login_pin' }} [options]
 */
export const sendWhatsAppCode = async (phoneNumber, code, options = {}) => {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g. +919876543210).');
    }
    if (!code || !/^\d{6}$/.test(code)) {
        throw new Error('Code must be a 6-digit number.');
    }

    const purpose = options.purpose || 'otp';
    const provider = (process.env.WHATSAPP_API_PROVIDER || 'mock').toLowerCase();

    switch (provider) {
        case 'mock':
            return sendViaMock(phoneNumber, code, { ...options, purpose });
        case 'meta':
            return sendViaMetaCloudApi(phoneNumber, code, purpose);
        default:
            throw new Error(
                `Unsupported WhatsApp provider: ${provider}. Set WHATSAPP_API_PROVIDER to "mock" or "meta".`
            );
    }
};

/** Registration / verification OTP */
export const sendWhatsAppOtp = async (phoneNumber, otp, options = {}) =>
    sendWhatsAppCode(phoneNumber, otp, { ...options, purpose: 'otp' });

/** Login PIN after verification / forgot PIN */
export const sendWhatsAppLoginPin = async (phoneNumber, pin, options = {}) =>
    sendWhatsAppCode(phoneNumber, pin, { ...options, purpose: 'login_pin' });

const sendViaMock = async (phoneNumber, code, options) => {
    const masked = phoneNumber.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3');
    const label = options.purpose === 'login_pin' ? 'LOGIN PIN' : 'OTP';
    console.log(
        `[WhatsApp:mock] ${label} for ${masked}${options.name ? ` (${options.name})` : ''}: ${code}` +
            (options.purpose === 'otp' ? ` — valid ${OTP_VALIDITY_MINUTES} min` : '')
    );
    return { success: true, messageId: `mock-${Date.now()}`, provider: 'mock', purpose: options.purpose };
};

const sendViaMetaCloudApi = async (phoneNumber, code, purpose) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const { name: templateName, language: templateLanguage, hasButton } = getTemplateConfig(purpose);
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

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
            parameters: [{ type: 'text', text: code }],
        },
    ];

    if (hasButton) {
        templateComponents.push({
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: code }],
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
        const label = purpose === 'login_pin' ? 'PIN' : 'OTP';
        console.log(
            `[WhatsApp:meta] ${label} sent via template "${templateName}" to ${recipient.slice(0, 4)}**** — messageId: ${messageId}`
        );
        return { success: true, messageId, provider: 'meta', purpose, templateName };
    } catch (error) {
        const apiError = error.response?.data?.error;
        const detail = apiError?.message || error.message;

        // If dedicated login-pin template is not approved yet, fall back to OTP template.
        const otpTemplate = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
        if (
            purpose === 'login_pin' &&
            otpTemplate &&
            templateName !== otpTemplate &&
            (apiError?.code === 132001 || /template name .* does not exist/i.test(detail))
        ) {
            console.warn(
                `[WhatsApp:meta] Template "${templateName}" unavailable; falling back to OTP template "${otpTemplate}"`
            );
            return sendViaMetaCloudApi(phoneNumber, code, 'otp_fallback');
        }

        console.error('[WhatsApp:meta] Send failed:', apiError || error.message);
        throw new Error(`Failed to send WhatsApp ${purpose === 'login_pin' ? 'login PIN' : 'OTP'}: ${detail}`);
    }
};

export default {
    sendWhatsAppOtp,
    sendWhatsAppLoginPin,
    sendWhatsAppCode,
    isWhatsAppConfigured,
};
