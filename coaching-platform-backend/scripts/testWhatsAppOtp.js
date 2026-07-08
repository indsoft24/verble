/**
 * Quick WhatsApp OTP smoke test.
 * Usage: node scripts/testWhatsAppOtp.js +919876543210
 */
import dotenv from 'dotenv';
import { sendWhatsAppOtp, isWhatsAppConfigured } from '../src/utils/whatsappService.js';

dotenv.config();

const phone = process.argv[2] || process.env.TEST_WHATSAPP_NUMBER;

if (!phone) {
    console.error('Usage: node scripts/testWhatsAppOtp.js <+91XXXXXXXXXX>');
    process.exit(1);
}

const provider = process.env.WHATSAPP_API_PROVIDER || 'mock';
console.log(`Provider: ${provider}`);
console.log(`Template: ${process.env.WHATSAPP_OTP_TEMPLATE_NAME || '(not set)'}`);
console.log(`Language: ${process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US'}`);
console.log(`Configured: ${isWhatsAppConfigured()}`);

const otp = String(Math.floor(100000 + Math.random() * 900000));

try {
    const result = await sendWhatsAppOtp(phone, otp, { name: 'Verble Test' });
    console.log('SUCCESS:', JSON.stringify({ ...result, otp: provider === 'mock' ? otp : '(sent via API)' }));
} catch (error) {
    console.error('FAILED:', error.message);
    process.exit(1);
}
