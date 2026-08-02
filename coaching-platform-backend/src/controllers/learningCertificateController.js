import asyncHandler from 'express-async-handler';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import LearningCertificate from '../models/LearningCertificate.js';
import Certificate from '../models/Certificate.js';
import CourseCertificate from '../models/CourseCertificate.js';
import CertificateNumberingSettings from '../models/CertificateNumberingSettings.js';
import User from '../models/User.js';
import { evaluateCourseCertification } from '../services/courseCertificationEvaluator.js';
import {
    generateLearningCertificatePdf,
    issueCourseCertificate,
    issueModuleCertificate,
} from '../services/learningCertificateService.js';

const fail = (res, status, message) => {
    res.status(status);
    throw new Error(message);
};
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listMyLearningCertificates = asyncHandler(async (req, res) => {
    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    const certificates = await LearningCertificate.find(query)
        .select('-pdf.path -audit')
        .populate('course', 'title')
        .populate('module', 'title')
        .sort({ issuedAt: -1 });
    res.json({ status: 'success', data: { certificates } });
});

export const verifyLearningCertificate = asyncHandler(async (req, res) => {
    const code = req.params.verificationCode;
    const unified = await LearningCertificate.findOne({ verificationCode: code })
        .select('type certificateNumber verificationCode recipientSnapshot.name subjectSnapshot issuedAt revokedAt')
        .lean();
    if (unified) {
        return res.json({
            status: 'success',
            data: {
                certificate: {
                    type: unified.type,
                    certificateNumber: unified.certificateNumber,
                    verificationCode: unified.verificationCode,
                    recipientName: unified.recipientSnapshot.name,
                    subject: unified.subjectSnapshot,
                    issuedAt: unified.issuedAt,
                    valid: !unified.revokedAt,
                    revokedAt: unified.revokedAt || null,
                },
            },
        });
    }
    const [legacy, legacyCourse] = await Promise.all([
        Certificate.findOne({ verificationCode: code }).select('certificateNumber userName issuedDate').lean(),
        CourseCertificate.findOne({ verificationCode: code })
            .select('certificateNumber userName courseTitle issuedAt')
            .lean(),
    ]);
    const found = legacy || legacyCourse;
    if (!found) fail(res, 404, 'Certificate not found.');
    res.json({
        status: 'success',
        data: {
            certificate: {
                type: legacyCourse ? 'COURSE' : 'LEGACY',
                certificateNumber: found.certificateNumber,
                recipientName: found.userName,
                subject: legacyCourse ? { courseTitle: found.courseTitle } : {},
                issuedAt: found.issuedAt || found.issuedDate,
                valid: true,
                legacy: true,
            },
        },
    });
});

export const downloadLearningCertificate = asyncHandler(async (req, res) => {
    const certificate = await LearningCertificate.findById(req.params.certificateId);
    if (!certificate) fail(res, 404, 'Certificate not found.');
    const isOwner = certificate.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') fail(res, 403, 'You cannot download this certificate.');
    if (certificate.revokedAt) fail(res, 410, 'Certificate has been revoked.');
    if (certificate.pdf.status !== 'READY' || !certificate.pdf.path) fail(res, 409, 'Certificate PDF is not ready.');
    const exists = await fs.access(certificate.pdf.path).then(() => true).catch(() => false);
    if (!exists) fail(res, 404, 'Certificate file is missing.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateNumber}.pdf"`);
    createReadStream(certificate.pdf.path).pipe(res);
});

const adminCertificateQuery = (params) => {
    const query = {};
    if (params.type) query.type = params.type;
    if (params.courseId) query.course = params.courseId;
    if (params.moduleId) query.module = params.moduleId;
    if (params.userId) query.user = params.userId;
    if (params.pdfStatus) query['pdf.status'] = params.pdfStatus;
    if (params.revoked === 'true') query.revokedAt = { $ne: null };
    if (params.revoked === 'false') query.revokedAt = null;
    if (params.from || params.to) {
        query.issuedAt = {};
        if (params.from) query.issuedAt.$gte = new Date(params.from);
        if (params.to) query.issuedAt.$lte = new Date(params.to);
    }
    if (params.search) {
        const regex = new RegExp(escapeRegex(params.search).slice(0, 100), 'i');
        query.$or = [
            { certificateNumber: regex },
            { verificationCode: regex },
            { 'recipientSnapshot.name': regex },
            { 'recipientSnapshot.email': regex },
        ];
    }
    return query;
};

export const listAdminLearningCertificates = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit || '50', 10)));
    const query = adminCertificateQuery(req.query);
    const [certificates, total] = await Promise.all([
        LearningCertificate.find(query)
            .select('-pdf.path')
            .populate('user', 'name email')
            .populate('course', 'title')
            .populate('module', 'title')
            .sort({ issuedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        LearningCertificate.countDocuments(query),
    ]);
    res.json({
        status: 'success',
        data: { certificates, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
});

export const exportAdminLearningCertificates = asyncHandler(async (req, res) => {
    const certificates = await LearningCertificate.find(adminCertificateQuery(req.query))
        .select('-pdf.path -audit')
        .sort({ issuedAt: -1 })
        .limit(10000)
        .lean();
    res.setHeader('Content-Disposition', 'attachment; filename="issued-certificates.json"');
    res.json({ exportedAt: new Date(), count: certificates.length, certificates });
});

export const manualIssueCourseCertificate = asyncHandler(async (req, res) => {
    const { type = 'COURSE', userEmail, courseId, moduleId, reason } = req.body;
    let { userId } = req.body;
    if (!userId && typeof userEmail === 'string') {
        const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('_id').lean();
        userId = user?._id;
    }
    if (
        !['COURSE', 'MODULE'].includes(type) ||
        !userId ||
        (type === 'COURSE' && !courseId) ||
        (type === 'MODULE' && !moduleId) ||
        typeof reason !== 'string' ||
        reason.trim().length < 5
    ) {
        fail(res, 400, 'A valid type, user/subject IDs, and a meaningful reason are required.');
    }
    let certificate;
    if (type === 'MODULE') {
        certificate = await issueModuleCertificate({
            userId,
            moduleId,
            source: 'MANUAL',
            manualReason: reason.trim(),
            actor: req.user._id,
            bypassEligibility: true,
        });
    } else {
        const evaluation = await evaluateCourseCertification(userId, courseId);
        certificate = await issueCourseCertificate({
            userId,
            courseId,
            evaluation,
            source: 'MANUAL',
            manualReason: reason.trim(),
            actor: req.user._id,
            bypassEligibility: true,
        });
    }
    res.status(201).json({ status: 'success', data: { certificate } });
});

export const revokeLearningCertificate = asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) fail(res, 400, 'A revocation reason is required.');
    const certificate = await LearningCertificate.findById(req.params.certificateId);
    if (!certificate) fail(res, 404, 'Certificate not found.');
    if (!certificate.revokedAt) {
        certificate.revokedAt = new Date();
        certificate.revokedBy = req.user._id;
        certificate.revocationReason = reason;
        certificate.audit.push({ action: 'REVOKED', actor: req.user._id, reason });
        await certificate.save();
    }
    res.json({ status: 'success', data: { certificate } });
});

export const unrevokeLearningCertificate = asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) fail(res, 400, 'An unrevoke reason is required.');
    const certificate = await LearningCertificate.findById(req.params.certificateId);
    if (!certificate) fail(res, 404, 'Certificate not found.');
    certificate.revokedAt = undefined;
    certificate.revokedBy = undefined;
    certificate.revocationReason = undefined;
    certificate.audit.push({ action: 'UNREVOKED', actor: req.user._id, reason });
    await certificate.save();
    res.json({ status: 'success', data: { certificate } });
});

export const regenerateLearningCertificate = asyncHandler(async (req, res) => {
    const certificate = await LearningCertificate.findById(req.params.certificateId);
    if (!certificate) fail(res, 404, 'Certificate not found.');
    certificate.audit.push({ action: 'PDF_REGENERATED', actor: req.user._id, reason: req.body.reason });
    await certificate.save();
    await generateLearningCertificatePdf(certificate);
    res.json({ status: 'success', data: { certificate } });
});

export const getEligibilityDetail = asyncHandler(async (req, res) => {
    const evaluation = await evaluateCourseCertification(req.params.userId, req.params.courseId);
    res.json({ status: 'success', data: evaluation });
});

export const listNumberingSettings = asyncHandler(async (_req, res) => {
    const settings = await CertificateNumberingSettings.find().sort({ certificateType: 1, scopeType: 1 });
    res.json({ status: 'success', data: { settings } });
});

export const upsertNumberingSettings = asyncHandler(async (req, res) => {
    const { scopeType, scopeId = null, certificateType, template, prefix, padding, reset, active } = req.body;
    if (!scopeType || !certificateType) fail(res, 400, 'scopeType and certificateType are required.');
    if (scopeType !== 'GLOBAL' && !scopeId) fail(res, 400, 'scopeId is required for course/module settings.');
    const settings = await CertificateNumberingSettings.findOneAndUpdate(
        { scopeType, scopeId: scopeType === 'GLOBAL' ? null : scopeId, certificateType },
        { $set: { template, prefix, padding, reset, active, updatedBy: req.user._id } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ status: 'success', data: { settings } });
});

export const deleteNumberingSettings = asyncHandler(async (req, res) => {
    const deleted = await CertificateNumberingSettings.findByIdAndDelete(req.params.settingsId);
    if (!deleted) fail(res, 404, 'Numbering settings not found.');
    res.json({ status: 'success', data: { deleted: true } });
});
