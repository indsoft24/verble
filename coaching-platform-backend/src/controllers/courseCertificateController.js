import asyncHandler from 'express-async-handler';
import CourseCertificate from '../models/CourseCertificate.js';
import Course from '../models/Course.js';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import {
    generateCourseCertificate,
    getCourseEligibility,
    getCourseReportCard,
    getOrCreateCourseRule,
    ensureDemoCertificatePdf,
    invalidateDemoCertificatePdf,
} from '../services/courseCertificateService.js';
import { evaluateCourseCertification } from '../services/courseCertificationEvaluator.js';
import {
    getCertificateBranding,
    updateCertificateBranding,
    setSignatureImagePath,
    setLogoImagePath,
    brandingForApi,
} from '../services/certificateBrandingService.js';

export const getCourseCertificateEligibility = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const eligibility = await getCourseEligibility(req.user._id, courseId);
    res.status(200).json({ status: 'success', data: eligibility });
});

export const getCourseCertificationEvaluation = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const evaluation = await evaluateCourseCertification(req.user._id, courseId);
    res.status(200).json({ status: 'success', data: evaluation });
});

export const getCourseReportCardController = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const result = await getCourseReportCard(req.user._id, courseId);
    res.status(200).json({ status: 'success', data: result });
});

export const generateMyCourseCertificate = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const certificate = await generateCourseCertificate(req.user._id, courseId);
    res.status(200).json({
        status: 'success',
        data: {
            certificate: {
                _id: certificate._id,
                course: certificate.course,
                courseTitle: certificate.courseTitle,
                certificateNumber: certificate.certificateNumber,
                verificationCode: certificate.verificationCode,
                pdfUrl: certificate.pdfUrl,
                issuedAt: certificate.issuedAt,
            },
        },
    });
});

export const getMyCourseCertificates = asyncHandler(async (req, res) => {
    const certificates = await CourseCertificate.find({ user: req.user._id })
        .sort({ issuedAt: -1 })
        .select('-pdfPath');
    res.status(200).json({ status: 'success', data: { certificates } });
});

export const getAdminCertificateRules = asyncHandler(async (_req, res) => {
    const courses = await Course.find().select('_id title isPublished').sort({ title: 1 });
    const rules = await Promise.all(
        courses.map(async (course) => {
            const rule = await getOrCreateCourseRule(course._id);
            return { course, rule };
        })
    );
    res.status(200).json({ status: 'success', data: { rules } });
});

export const updateAdminCertificateRule = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const {
        isEnabled,
        requireAssessment,
        passingScore,
        minimumCompletionPercent,
        readOnlyMode,
        requireModuleQuizzes,
        minimumModuleQuizScore,
        requireDailySubmissions,
        minimumDailySubmissionPercent,
        dailySubmissionLookbackDays,
        minimumOverallSubmissionPercent,
    } = req.body;
    const rule = await getOrCreateCourseRule(courseId);
    if (typeof isEnabled === 'boolean') rule.isEnabled = isEnabled;
    if (typeof requireAssessment === 'boolean') rule.requireAssessment = requireAssessment;
    if (typeof readOnlyMode === 'boolean') rule.readOnlyMode = readOnlyMode;
    if (typeof passingScore === 'number') rule.passingScore = passingScore;
    if (typeof minimumCompletionPercent === 'number') rule.minimumCompletionPercent = minimumCompletionPercent;
    if (typeof requireModuleQuizzes === 'boolean') rule.requireModuleQuizzes = requireModuleQuizzes;
    if (typeof minimumModuleQuizScore === 'number') rule.minimumModuleQuizScore = minimumModuleQuizScore;
    if (typeof requireDailySubmissions === 'boolean') rule.requireDailySubmissions = requireDailySubmissions;
    if (typeof minimumDailySubmissionPercent === 'number') {
        rule.minimumDailySubmissionPercent = minimumDailySubmissionPercent;
    }
    if (typeof dailySubmissionLookbackDays === 'number') {
        rule.dailySubmissionLookbackDays = dailySubmissionLookbackDays;
    }
    if (typeof minimumOverallSubmissionPercent === 'number') {
        rule.minimumOverallSubmissionPercent = minimumOverallSubmissionPercent;
    }
    rule.updatedBy = req.user._id;
    await rule.save();
    res.status(200).json({ status: 'success', data: { rule } });
});

export const getAdminCertificateBranding = asyncHandler(async (_req, res) => {
    const branding = await getCertificateBranding();
    const data = await brandingForApi(branding);
    res.status(200).json({ status: 'success', data: { branding: data } });
});

export const updateAdminCertificateBranding = asyncHandler(async (req, res) => {
    const { signatoryName, signatoryTitle, issuerTagline } = req.body;
    const branding = await updateCertificateBranding(
        { signatoryName, signatoryTitle, issuerTagline },
        req.user._id
    );
    await invalidateDemoCertificatePdf();
    const data = await brandingForApi(branding);
    res.status(200).json({ status: 'success', data: { branding: data } });
});

export const uploadAdminCertificateSignature = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        res.status(400);
        throw new Error('Signature image file is required.');
    }
    const branding = await setSignatureImagePath(req.file.path, req.user._id);
    await invalidateDemoCertificatePdf();
    const data = await brandingForApi(branding);
    res.status(200).json({ status: 'success', data: { branding: data } });
});

export const uploadAdminCertificateLogo = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        res.status(400);
        throw new Error('Logo image file is required.');
    }
    const branding = await setLogoImagePath(req.file.path, req.user._id);
    await invalidateDemoCertificatePdf();
    const data = await brandingForApi(branding);
    res.status(200).json({ status: 'success', data: { branding: data } });
});

export const streamAdminCertificateSignature = asyncHandler(async (_req, res) => {
    const branding = await getCertificateBranding();
    if (!branding.signatureImagePath) {
        res.status(404);
        throw new Error('No signature uploaded.');
    }
    const exists = await fs.access(branding.signatureImagePath).then(() => true).catch(() => false);
    if (!exists) {
        res.status(404);
        throw new Error('Signature file missing.');
    }
    res.setHeader('Content-Type', 'image/png');
    createReadStream(branding.signatureImagePath).pipe(res);
});

export const streamAdminCertificateLogo = asyncHandler(async (_req, res) => {
    const { getDefaultLogoPath } = await import('../services/certificateBrandingService.js');
    const logoPath = await getDefaultLogoPath();
    if (!logoPath) {
        res.status(404);
        throw new Error('Logo not available.');
    }
    res.setHeader('Content-Type', 'image/png');
    createReadStream(logoPath).pipe(res);
});

export const downloadDemoCertificateAdmin = asyncHandler(async (req, res) => {
    const forceRegenerate = req.query.refresh === '1' || req.query.refresh === 'true';
    const pdfPath = await ensureDemoCertificatePdf({ forceRegenerate });
    const asDownload = req.query.download === '1' || req.query.download === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `${asDownload ? 'attachment' : 'inline'}; filename="verble-course-certificate-demo.pdf"`
    );
    createReadStream(pdfPath).pipe(res);
});

export const getAdminIssuedCertificates = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const skip = (page - 1) * limit;
    const courseId = req.query.courseId?.toString();
    const query = courseId ? { course: courseId } : {};

    const [certificates, total] = await Promise.all([
        CourseCertificate.find(query)
            .sort({ issuedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-pdfPath')
            .populate('user', 'name email')
            .populate('course', 'title'),
        CourseCertificate.countDocuments(query),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            certificates,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        },
    });
});

export const downloadMyCourseCertificate = asyncHandler(async (req, res) => {
    const { certificateId } = req.params;
    const certificate = await CourseCertificate.findOne({ _id: certificateId, user: req.user._id });
    if (!certificate || !certificate.pdfPath) {
        res.status(404);
        throw new Error('Certificate file not found.');
    }

    const exists = await fs.access(certificate.pdfPath).then(() => true).catch(() => false);
    if (!exists) {
        res.status(404);
        throw new Error('Certificate file is missing from storage.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="course-certificate-${certificate.certificateNumber}.pdf"`);
    const { createReadStream } = await import('fs');
    createReadStream(certificate.pdfPath).pipe(res);
});

export const publicDownloadCourseCertificate = asyncHandler(async (req, res) => {
    const { verificationCode } = req.params;
    const certificate = await CourseCertificate.findOne({ verificationCode });
    if (!certificate || !certificate.pdfPath) {
        res.status(404);
        throw new Error('Certificate file not found.');
    }
    const exists = await fs.access(certificate.pdfPath).then(() => true).catch(() => false);
    if (!exists) {
        res.status(404);
        throw new Error('Certificate file is missing from storage.');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="course-certificate-${certificate.certificateNumber}.pdf"`);
    const { createReadStream } = await import('fs');
    createReadStream(certificate.pdfPath).pipe(res);
});
