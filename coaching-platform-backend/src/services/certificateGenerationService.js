// src/services/certificateGenerationService.js
// Note: This service requires pdfkit package
// Install with: npm install pdfkit
// For file system operations, we'll use fs/promises

import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Certificate from '../models/Certificate.js';
import CertificateAssessmentSubmission from '../models/CertificateAssessmentSubmission.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { mirrorLegacyCertificate } from './learningCertificateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a certificate PDF for a user
 * @param {string} userId - User ID
 * @param {string} submissionId - Assessment submission ID
 * @returns {Promise<{pdfPath: string, pdfUrl: string}>}
 */
export const generateCertificate = async (userId, submissionId) => {
    // Get user and submission data
    const user = await User.findById(userId).select('name email');
    const submission = await CertificateAssessmentSubmission.findById(submissionId)
        .populate('assessment', 'title');

    if (!user || !submission) {
        throw new Error('User or submission not found');
    }

    if (!submission.passed) {
        throw new Error('User has not passed the assessment');
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ user: userId });
    if (certificate && certificate.pdfPath) {
        // Certificate already generated
        return {
            pdfPath: certificate.pdfPath,
            pdfUrl: certificate.pdfUrl,
            certificateNumber: certificate.certificateNumber,
        };
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const verificationCode = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

    // Create certificates directory if it doesn't exist
    const certificatesDir = path.join(__dirname, '../../uploads/certificates');
    await fs.mkdir(certificatesDir, { recursive: true });

    // Generate PDF
    const fileName = `certificate-${userId}-${Date.now()}.pdf`;
    const pdfPath = path.join(certificatesDir, fileName);
    const pdfUrl = `/api/certificates/download/${fileName}`;

    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Pipe PDF to file
    const stream = createWriteStream(pdfPath);
    doc.pipe(stream);

    // Certificate Design
    // Background border
    doc.rect(50, 50, 740, 500)
        .lineWidth(3)
        .stroke('#1a237e');

    // Header
    doc.fontSize(36)
        .fillColor('#1a237e')
        .text('CERTIFICATE OF COMPLETION', 400, 120, { align: 'center' });

    // Subtitle
    doc.fontSize(18)
        .fillColor('#424242')
        .text('This is to certify that', 400, 180, { align: 'center' });

    // Name
    doc.fontSize(32)
        .fillColor('#1a237e')
        .font('Helvetica-Bold')
        .text(user.name.toUpperCase(), 400, 220, { align: 'center' });

    // Achievement text
    doc.fontSize(16)
        .fillColor('#424242')
        .font('Helvetica')
        .text('has successfully completed the', 400, 280, { align: 'center' });

    // Course name
    doc.fontSize(20)
        .fillColor('#1a237e')
        .font('Helvetica-Bold')
        .text('Full Course Certificate Assessment', 400, 310, { align: 'center' });

    // Score
    doc.fontSize(14)
        .fillColor('#424242')
        .font('Helvetica')
        .text(`with a score of ${submission.score}%`, 400, 350, { align: 'center' });

    // Date
    const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.fontSize(12)
        .fillColor('#757575')
        .text(`Issued on: ${issueDate}`, 400, 400, { align: 'center' });

    // Certificate number
    doc.fontSize(10)
        .fillColor('#9e9e9e')
        .text(`Certificate Number: ${certificateNumber}`, 400, 450, { align: 'center' });

    // Verification code
    doc.fontSize(9)
        .fillColor('#9e9e9e')
        .text(`Verification Code: ${verificationCode}`, 400, 470, { align: 'center' });

    // Signature line
    doc.moveTo(150, 480)
        .lineTo(300, 480)
        .stroke('#1a237e');
    doc.fontSize(10)
        .fillColor('#424242')
        .text('Authorized Signature', 225, 490, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    // Create or update certificate record
    if (certificate) {
        certificate.certificateNumber = certificateNumber;
        certificate.verificationCode = verificationCode;
        certificate.pdfPath = pdfPath;
        certificate.pdfUrl = pdfUrl;
        certificate.issuedDate = new Date();
        certificate.score = submission.score;
        await certificate.save();
    } else {
        certificate = await Certificate.create({
            user: userId,
            assessmentSubmission: submissionId,
            certificateNumber,
            verificationCode,
            userName: user.name,
            userEmail: user.email,
            issuedDate: new Date(),
            score: submission.score,
            pdfPath,
            pdfUrl,
        });
    }

    // Update submission
    submission.certificateGenerated = true;
    submission.certificateGeneratedAt = new Date();
    await submission.save();
    await mirrorLegacyCertificate(certificate);

    return {
        pdfPath,
        pdfUrl,
        certificateNumber,
        verificationCode,
    };
};

/**
 * Get certificate by user ID
 */
export const getCertificateByUserId = async (userId) => {
    return await Certificate.findOne({ user: userId })
        .populate('user', 'name email')
        .populate('assessmentSubmission');
};

/**
 * Verify certificate by verification code
 */
export const verifyCertificate = async (verificationCode) => {
    return await Certificate.findOne({ verificationCode })
        .populate('user', 'name email')
        .populate('assessmentSubmission');
};
