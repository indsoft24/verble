import sendEmail from './email.js';

const maskPhone = (phone) => {
    if (!phone || phone.length < 6) return '***';
    return phone.replace(/(\+\d{1,3})(\d{2})\d+(\d{2})/, '$1$2****$3');
};

/**
 * @param {import('../models/User.js').default | { email: string; name?: string; phoneNumber?: string }} user
 * @param {string} plainPin
 */
export const sendLoginPinEmail = async (user, plainPin) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const phoneDisplay = maskPhone(user.phoneNumber);

    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 520px;">
            <h2>Your Verble login PIN</h2>
            <p>Hello${user.name ? ` ${user.name}` : ''},</p>
            <p>Use this PIN with your phone number <strong>${phoneDisplay}</strong> to sign in:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0D47A1;">${plainPin}</p>
            <p>Sign in at: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
            <p>For security, change your PIN after your first login from your profile settings.</p>
            <p>If you did not request this, please contact support.</p>
            <hr>
            <p>Thank you,<br>The Verble Team</p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Your Verble login PIN',
        html: htmlMessage,
    });
};
