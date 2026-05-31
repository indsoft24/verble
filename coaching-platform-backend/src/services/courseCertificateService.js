import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { renderCourseCertificatePdf } from './certificatePdfRenderer.js';
import CourseCertificateRule from '../models/CourseCertificateRule.js';
import CourseCertificate from '../models/CourseCertificate.js';
import User from '../models/User.js';
import { evaluateCourseCertification } from './courseCertificationEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateCertificateNumber = () => `CCERT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
const generateVerificationCode = () => uuidv4().replace(/-/g, '').slice(0, 18).toUpperCase();

export const getOrCreateCourseRule = async (courseId) => {
    let rule = await CourseCertificateRule.findOne({ course: courseId });
    if (!rule) {
        rule = await CourseCertificateRule.create({ course: courseId });
    }
    return rule;
};

export const getCourseEligibility = async (userId, courseId) => {
    const evaluation = await evaluateCourseCertification(userId, courseId);
    return {
        course: evaluation.course,
        rule: evaluation.rule,
        totalModules: evaluation.totalModules,
        completedModules: evaluation.completedModules,
        completionPercent: evaluation.completionPercent,
        assessmentScore: evaluation.assessmentScore,
        isEligible: evaluation.isEligible,
        passed: evaluation.passed,
        pillars: evaluation.pillars,
        reasons: evaluation.reasons,
        reportCardAvailable: evaluation.passed,
    };
};

export const getCourseReportCard = async (userId, courseId) => {
    const evaluation = await evaluateCourseCertification(userId, courseId);
    if (!evaluation.passed) {
        return { available: false, reasons: evaluation.reasons, pillars: evaluation.pillars };
    }
    return { available: true, reportCard: evaluation.reportCard, pillars: evaluation.pillars };
};

const generateCoursePdf = async ({
    userName,
    courseTitle,
    certificateNumber,
    verificationCode,
    completionPercent,
    assessmentScore,
    issuedAt,
}) => {
    const certificatesDir = path.join(__dirname, '../../uploads/certificates');
    await fs.mkdir(certificatesDir, { recursive: true });
    const fileName = `course-certificate-${Date.now()}-${uuidv4().slice(0, 6)}.pdf`;
    const pdfPath = path.join(certificatesDir, fileName);

    await renderCourseCertificatePdf({
        outputPath: pdfPath,
        userName,
        courseTitle,
        certificateNumber,
        verificationCode,
        completionPercent,
        assessmentScore,
        issuedAt,
    });

    return { pdfPath };
};

export const generateCourseCertificate = async (userId, courseId) => {
    const eligibility = await getCourseEligibility(userId, courseId);
    if (!eligibility.isEligible) {
        throw new Error(eligibility.reasons[0] || 'You are not eligible for certificate generation.');
    }

    const user = await User.findById(userId).select('name email');
    if (!user) throw new Error('User not found.');

    let certificate = await CourseCertificate.findOne({ user: userId, course: courseId });
    if (certificate?.pdfPath) {
        return certificate;
    }

    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    const { pdfPath } = await generateCoursePdf({
        userName: user.name,
        courseTitle: eligibility.course.title,
        certificateNumber,
        verificationCode,
        completionPercent: eligibility.completionPercent,
        assessmentScore: eligibility.assessmentScore,
        issuedAt: new Date(),
    });

    certificate = await CourseCertificate.findOneAndUpdate(
        { user: userId, course: courseId },
        {
            $set: {
                certificateNumber,
                verificationCode,
                userName: user.name,
                userEmail: user.email,
                courseTitle: eligibility.course.title,
                completionPercent: eligibility.completionPercent,
                assessmentScore: eligibility.assessmentScore,
                pdfPath,
                pdfUrl: '',
                issuedAt: new Date(),
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    certificate.pdfUrl = `/api/course-certificates/public-download/${certificate.verificationCode}`;
    await certificate.save();

    return certificate;
};

export const DEMO_CERTIFICATE_FILENAME = 'DEMO-course-certificate-preview.pdf';

export const getDemoCertificatePath = () =>
    path.join(__dirname, '../../uploads/certificates', DEMO_CERTIFICATE_FILENAME);

export const invalidateDemoCertificatePdf = async () => {
    try {
        await fs.unlink(getDemoCertificatePath());
    } catch {
        /* not present */
    }
};

/** Sample PDF for admin preview (regenerated to reflect latest branding). */
export const ensureDemoCertificatePdf = async ({ forceRegenerate = false } = {}) => {
    const pdfPath = getDemoCertificatePath();
    if (!forceRegenerate) {
        try {
            await fs.access(pdfPath);
            return pdfPath;
        } catch {
            /* generate */
        }
    }
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });
    const { pdfPath: tempPath } = await generateCoursePdf({
        userName: 'Demo Learner',
        courseTitle: 'Verble English Mastery - Zero to Hero',
        certificateNumber: 'CCERT-DEMO-2026-VERBLE',
        verificationCode: 'DEMOVERIFY12345678',
        completionPercent: 100,
        assessmentScore: 85,
        issuedAt: new Date(),
    });
    await fs.rename(tempPath, pdfPath).catch(async () => {
        await fs.copyFile(tempPath, pdfPath);
        await fs.unlink(tempPath).catch(() => {});
    });
    return pdfPath;
};
