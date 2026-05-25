import asyncHandler from 'express-async-handler';
import CourseCertificate from '../models/CourseCertificate.js';
import Course from '../models/Course.js';
import fs from 'fs/promises';
import {
    generateCourseCertificate,
    getCourseEligibility,
    getOrCreateCourseRule,
} from '../services/courseCertificateService.js';

export const getCourseCertificateEligibility = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const eligibility = await getCourseEligibility(req.user._id, courseId);
    res.status(200).json({ status: 'success', data: eligibility });
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
    const { isEnabled, requireAssessment, passingScore, minimumCompletionPercent, readOnlyMode } = req.body;
    const rule = await getOrCreateCourseRule(courseId);
    if (typeof isEnabled === 'boolean') rule.isEnabled = isEnabled;
    if (typeof requireAssessment === 'boolean') rule.requireAssessment = requireAssessment;
    if (typeof readOnlyMode === 'boolean') rule.readOnlyMode = readOnlyMode;
    if (typeof passingScore === 'number') rule.passingScore = passingScore;
    if (typeof minimumCompletionPercent === 'number') rule.minimumCompletionPercent = minimumCompletionPercent;
    rule.updatedBy = req.user._id;
    await rule.save();
    res.status(200).json({ status: 'success', data: { rule } });
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
