import nodemailer from 'nodemailer';
import fs from 'fs/promises';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const handleFormSubmission = async (req, res) => {

    try {
        const { formType, ...formData } = req.body;

        if (!formType) {
            return res.status(400).json({ status: 'fail', message: 'formType is required.' });
        }

        let emailBody = `<h1>New ${formType} Submission</h1><table border="1" cellpadding="5" cellspacing="0">`;
        for (const [key, value] of Object.entries(formData)) {
            if (value) {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
                emailBody += `<tr><td><strong>${formattedKey}</strong></td><td>${String(value).replace(/\n/g, '<br>')}</td></tr>`;
            }
        }
        emailBody += `</table>`;

        const mailOptions = {
            from: `"Verble Forms" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || 'admin@verble.app',
            subject: `New Submission: ${formType}`,
            html: emailBody,
            attachments: [],
        };

        if (req.file) {
            console.log("Attaching file:", req.file.originalname);
            mailOptions.attachments.push({
                filename: req.file.originalname,
                path: req.file.path,
            });
        } else {
            console.log("No file was attached to this submission.");
        }

        await transporter.sendMail(mailOptions);
        console.log(`Form submission for "${formType}" sent successfully.`);

        res.status(200).json({ status: 'success', message: 'Your submission has been sent successfully. Thank you!' });

    } catch (error) {
        console.error("FORM SUBMISSION ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.warn("Cleanup failed for uploaded temp file:", req.file.path));
        }
    }
};
