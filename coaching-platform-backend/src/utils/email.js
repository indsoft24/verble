import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Verify email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env file');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Add connection timeout
        connectionTimeout: 10000,
        greetingTimeout: 10000,
    });

    // Verify transporter configuration
    try {
        await transporter.verify();
        console.log('[Email] Server is ready to send emails');
    } catch (error) {
        console.error('[Email] SMTP verification failed:', error.message);
        throw new Error(`Email server verification failed: ${error.message}. Please check your Gmail App Password.`);
    }

    const mailOptions = {
        from: `"Verble Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.message || options.html?.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[Email] Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        throw error;
    }
};

export default sendEmail;