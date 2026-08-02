import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import LearningCertificate from '../models/LearningCertificate.js';
import Module from '../models/Module.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import CourseCertificate from '../models/CourseCertificate.js';
import { allocateCertificateNumber } from './certificateNumberService.js';
import { renderCourseCertificatePdf } from './certificatePdfRenderer.js';
import { evaluateCourseCertification } from './courseCertificationEvaluator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CERTIFICATE_DIR = path.join(__dirname, '../../uploads/certificates/unified');
const VERIFY_BASE_URL = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');

const verificationCode = () => crypto.randomBytes(12).toString('hex').toUpperCase();
export const moduleIssuanceKey = (userId, moduleId) => `MODULE:${userId}:${moduleId}`;
export const courseIssuanceKey = (userId, courseId) => `COURSE:${userId}:${courseId}`;

const sanitizePdfError = (error) => String(error?.message || error || 'PDF generation failed').slice(0, 1000);

export const generateLearningCertificatePdf = async (certificateOrId) => {
    const certificate =
        typeof certificateOrId === 'string'
            ? await LearningCertificate.findById(certificateOrId)
            : certificateOrId;
    if (!certificate) throw new Error('Certificate not found.');

    certificate.pdf.status = 'GENERATING';
    certificate.pdf.attempts = (certificate.pdf.attempts || 0) + 1;
    certificate.pdf.lastAttemptAt = new Date();
    certificate.pdf.error = undefined;
    await certificate.save();

    try {
        await fs.mkdir(CERTIFICATE_DIR, { recursive: true });
        const fileName = `${certificate.type.toLowerCase()}-${certificate._id}.pdf`;
        const outputPath = path.join(CERTIFICATE_DIR, fileName);
        await renderCourseCertificatePdf({
            outputPath,
            userName: certificate.recipientSnapshot.name,
            courseTitle: certificate.subjectSnapshot?.courseTitle,
            moduleTitle: certificate.subjectSnapshot?.moduleTitle,
            certificateType: certificate.type,
            certificateNumber: certificate.certificateNumber,
            verificationCode: certificate.verificationCode,
            completionPercent: certificate.eligibilitySnapshot?.completionPercent ?? 100,
            assessmentScore: certificate.examSnapshot?.score,
            issuedAt: certificate.issuedAt,
            verificationUrl: `${VERIFY_BASE_URL}/api/learning-certificates/verify/${certificate.verificationCode}`,
        });
        const bytes = await fs.readFile(outputPath);
        certificate.pdf.status = 'READY';
        certificate.pdf.path = outputPath;
        certificate.pdf.url = `/api/learning-certificates/${certificate._id}/download`;
        certificate.pdf.checksum = crypto.createHash('sha256').update(bytes).digest('hex');
        certificate.pdf.error = undefined;
        await certificate.save();
    } catch (error) {
        certificate.pdf.status = 'FAILED';
        certificate.pdf.error = sanitizePdfError(error);
        await certificate.save();
    }
    return certificate;
};

const createIdempotent = async ({
    type,
    issuanceKey,
    user,
    course,
    module,
    source,
    sourceId,
    eligibilitySnapshot,
    ruleSnapshot,
    examSnapshot,
    manualReason,
    actor,
}) => {
    const existing = await LearningCertificate.findOne({ issuanceKey });
    if (existing) {
        if (source === 'MANUAL' && manualReason) {
            existing.audit.push({
                action: 'MANUAL_ISSUE_REQUESTED',
                actor,
                reason: manualReason,
                metadata: { existingCertificate: true },
            });
            await existing.save();
        }
        return existing;
    }
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const certificateNumber = await allocateCertificateNumber({ certificateType: type, course, module });
        try {
            return await LearningCertificate.create({
                type,
                issuanceKey,
                user: user._id,
                course: course?._id,
                module: module?._id,
                source,
                sourceId,
                certificateNumber,
                verificationCode: verificationCode(),
                recipientSnapshot: { name: user.name || 'Learner', email: user.email },
                subjectSnapshot: { courseTitle: course?.title, moduleTitle: module?.title },
                eligibilitySnapshot,
                ruleSnapshot,
                examSnapshot,
                manualReason,
                audit: [{ action: 'ISSUED', actor, reason: manualReason }],
            });
        } catch (error) {
            if (error?.code === 11000) {
                const raced = await LearningCertificate.findOne({ issuanceKey });
                if (raced) return raced;
                continue;
            }
            throw error;
        }
    }
    throw new Error('Unable to issue a collision-free certificate.');
};

export const issueModuleCertificate = async ({
    userId,
    moduleId,
    completion,
    source = 'AUTOMATIC',
    manualReason,
    actor,
    bypassEligibility = false,
}) => {
    const resolvedCompletion =
        completion || (await ModuleCompletion.findOne({ user: userId, module: moduleId }));
    const [user, module] = await Promise.all([
        User.findById(userId).select('name email'),
        Module.findById(moduleId).populate('course', 'title'),
    ]);
    if (!user || !module) throw new Error('User or module not found.');
    if (!bypassEligibility && !resolvedCompletion?.isCompleted) return null;
    const certificate = await createIdempotent({
        type: 'MODULE',
        issuanceKey: moduleIssuanceKey(userId, moduleId),
        user,
        course: module.course,
        module,
        source,
        eligibilitySnapshot: {
            completedAt: resolvedCompletion?.completedAt || resolvedCompletion?.updatedAt || new Date(),
            videosCompleted: resolvedCompletion?.videosCompleted,
            totalVideos: resolvedCompletion?.totalVideos,
            quizPassed: resolvedCompletion?.quizPassed,
            quizScore: resolvedCompletion?.quizScore,
            completionPercent: 100,
            manuallyOverridden: bypassEligibility,
        },
        ruleSnapshot: { completionRequired: true, quizRequired: Boolean(resolvedCompletion?.quizPassed) },
        manualReason,
        actor,
    });
    if (['PENDING', 'FAILED'].includes(certificate.pdf.status)) {
        await generateLearningCertificatePdf(certificate);
    }
    return certificate;
};

export const issueCourseCertificate = async ({
    userId,
    courseId,
    evaluation,
    source = 'AUTOMATIC',
    manualReason,
    actor,
    bypassEligibility = false,
}) => {
    const [user, course] = await Promise.all([
        User.findById(userId).select('name email'),
        Course.findById(courseId).select('title'),
    ]);
    if (!user || !course) throw new Error('User or course not found.');
    const resolved = evaluation || (await evaluateCourseCertification(userId, courseId));
    if (!bypassEligibility && !resolved.isEligible) {
        throw new Error(resolved.reasons?.[0] || 'Learner is not eligible for this certificate.');
    }
    const certificate = await createIdempotent({
        type: 'COURSE',
        issuanceKey: courseIssuanceKey(userId, courseId),
        user,
        course,
        source,
        eligibilitySnapshot: {
            passed: resolved.passed,
            completionPercent: resolved.completionPercent,
            assessmentScore: resolved.assessmentScore,
            pillars: resolved.pillars,
            reasons: resolved.reasons,
        },
        ruleSnapshot: resolved.rule?.toObject?.() || resolved.rule || {},
        examSnapshot: {
            score: resolved.assessmentScore,
            attemptId: resolved.assessmentAttempt?._id,
            bankVersion: resolved.assessmentAttempt?.bankVersion,
        },
        manualReason,
        actor,
    });
    if (['PENDING', 'FAILED'].includes(certificate.pdf.status)) {
        await generateLearningCertificatePdf(certificate);
    }
    const legacy = await CourseCertificate.findOne({ user: userId, course: courseId });
    if (!legacy) {
        try {
            await CourseCertificate.create({
                user: userId,
                course: courseId,
                certificateNumber: certificate.certificateNumber,
                verificationCode: certificate.verificationCode,
                userName: certificate.recipientSnapshot.name,
                userEmail: certificate.recipientSnapshot.email,
                courseTitle: certificate.subjectSnapshot.courseTitle,
                completionPercent: certificate.eligibilitySnapshot.completionPercent ?? 100,
                assessmentScore: certificate.examSnapshot?.score ?? null,
                pdfPath: certificate.pdf.path,
                pdfUrl: `/api/course-certificates/public-download/${certificate.verificationCode}`,
                issuedAt: certificate.issuedAt,
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;
        }
    } else if (
        legacy.certificateNumber === certificate.certificateNumber &&
        certificate.pdf.status === 'READY'
    ) {
        legacy.pdfPath = certificate.pdf.path;
        legacy.pdfUrl = `/api/course-certificates/public-download/${certificate.verificationCode}`;
        await legacy.save();
    }
    return certificate;
};

export const tryAutomaticCourseCertificate = async (userId, courseId) => {
    try {
        const evaluation = await evaluateCourseCertification(userId, courseId);
        if (!evaluation.isEligible) return null;
        return await issueCourseCertificate({ userId, courseId, evaluation });
    } catch (error) {
        console.error('[Certificate] Automatic course issuance failed:', sanitizePdfError(error));
        return null;
    }
};

export const onModuleCompletionTransition = async (completion, wasCompleted = false) => {
    if (!completion?.isCompleted || wasCompleted) return null;
    let moduleCertificate = null;
    try {
        moduleCertificate = await issueModuleCertificate({
            userId: completion.user,
            moduleId: completion.module,
            completion,
        });
    } catch (error) {
        console.error('[Certificate] Module issuance failed:', sanitizePdfError(error));
    }
    await tryAutomaticCourseCertificate(completion.user, completion.course);
    return moduleCertificate;
};

export const mirrorLegacyCertificate = async (legacyCertificate) => {
    if (!legacyCertificate) return null;
    const user = await User.findById(legacyCertificate.user).select('name email');
    if (!user) return null;
    let checksum;
    let pdfStatus = 'FAILED';
    if (legacyCertificate.pdfPath) {
        try {
            const bytes = await fs.readFile(legacyCertificate.pdfPath);
            checksum = crypto.createHash('sha256').update(bytes).digest('hex');
            pdfStatus = 'READY';
        } catch {
            pdfStatus = 'FAILED';
        }
    }
    const issuanceKey = `LEGACY_CERTIFICATE:${legacyCertificate._id}`;
    return LearningCertificate.findOneAndUpdate(
        { issuanceKey },
        {
            $setOnInsert: {
                type: 'LEGACY',
                issuanceKey,
                user: user._id,
                source: 'LEGACY_CERTIFICATE',
                sourceId: legacyCertificate._id,
                certificateNumber: legacyCertificate.certificateNumber,
                verificationCode: legacyCertificate.verificationCode,
                recipientSnapshot: {
                    name: legacyCertificate.userName || user.name || 'Learner',
                    email: legacyCertificate.userEmail || user.email,
                },
                subjectSnapshot: {},
                eligibilitySnapshot: { score: legacyCertificate.score, legacy: true },
                ruleSnapshot: { legacy: true },
                examSnapshot: { score: legacyCertificate.score },
                issuedAt: legacyCertificate.issuedDate || legacyCertificate.createdAt,
                audit: [{ action: 'MIRRORED', reason: 'Legacy certificate compatibility' }],
            },
            $set: {
                pdf: {
                    status: pdfStatus,
                    path: legacyCertificate.pdfPath,
                    url: legacyCertificate.pdfUrl,
                    checksum,
                    error: pdfStatus === 'FAILED' ? 'Legacy PDF file is missing.' : undefined,
                },
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};
