// src/controllers/certificateController.js
import asyncHandler from 'express-async-handler';
import { generateCertificate, getCertificateByUserId, verifyCertificate } from '../services/certificateGenerationService.js';
import CertificateAssessmentSubmission from '../models/CertificateAssessmentSubmission.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Generate certificate for user (after passing assessment)
 * @route   POST /api/certificates/generate
 * @access  Private
 */
export const generateUserCertificate = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Check if user has passed assessment
    const submission = await CertificateAssessmentSubmission.findOne({
        user: userId,
        passed: true,
    });

    if (!submission) {
        res.status(400);
        throw new Error('You must pass the certificate assessment before generating a certificate');
    }

    try {
        const result = await generateCertificate(userId, submission._id);
        res.status(200).json({
            status: 'success',
            data: {
                certificate: {
                    pdfUrl: result.pdfUrl,
                    certificateNumber: result.certificateNumber,
                    verificationCode: result.verificationCode,
                },
            },
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to generate certificate: ${error.message}`);
    }
});

/**
 * @desc    Get user's certificate
 * @route   GET /api/certificates/my-certificate
 * @access  Private
 */
export const getMyCertificate = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const certificate = await getCertificateByUserId(userId);

    if (!certificate) {
        res.status(404);
        throw new Error('Certificate not found. Please generate your certificate first.');
    }

    res.status(200).json({
        status: 'success',
        data: {
            certificate: {
                _id: certificate._id,
                certificateNumber: certificate.certificateNumber,
                userName: certificate.userName,
                issuedDate: certificate.issuedDate,
                score: certificate.score,
                pdfUrl: certificate.pdfUrl,
                verificationCode: certificate.verificationCode,
            },
        },
    });
});

/**
 * @desc    Download certificate PDF
 * @route   GET /api/certificates/download/:fileName
 * @access  Private
 */
export const downloadCertificate = asyncHandler(async (req, res) => {
    const { fileName } = req.params;
    const userId = req.user._id;

    // Verify user owns this certificate
    const certificate = await getCertificateByUserId(userId);
    if (!certificate || !certificate.pdfPath) {
        res.status(404);
        throw new Error('Certificate not found');
    }

    // Extract filename from path
    const filePath = certificate.pdfPath;
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!fileExists) {
        res.status(404);
        throw new Error('Certificate file not found');
    }

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`);
    
    const { createReadStream } = await import('fs');
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
});

/**
 * @desc    Verify certificate by verification code (public)
 * @route   GET /api/certificates/verify/:verificationCode
 * @access  Public
 */
export const verifyCertificateByCode = asyncHandler(async (req, res) => {
    const { verificationCode } = req.params;

    const certificate = await verifyCertificate(verificationCode);

    if (!certificate) {
        res.status(404);
        throw new Error('Certificate not found with this verification code');
    }

    res.status(200).json({
        status: 'success',
        data: {
            certificate: {
                certificateNumber: certificate.certificateNumber,
                userName: certificate.userName,
                issuedDate: certificate.issuedDate,
                score: certificate.score,
                verified: true,
            },
        },
    });
});
