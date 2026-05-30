import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { renderCourseCertificatePdf } from './certificatePdfRenderer.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import CertificateAssessmentSubmission from '../models/CertificateAssessmentSubmission.js';
import CourseCertificateRule from '../models/CourseCertificateRule.js';
import CourseCertificate from '../models/CourseCertificate.js';
import User from '../models/User.js';

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
    const [course, modules, rule, passedSubmission] = await Promise.all([
        Course.findById(courseId).select('title isPublished'),
        Module.find({ course: courseId }).select('_id'),
        getOrCreateCourseRule(courseId),
        CertificateAssessmentSubmission.findOne({ user: userId, passed: true }).sort({ submittedAt: -1 }),
    ]);

    if (!course) {
        throw new Error('Course not found.');
    }

    const moduleIds = modules.map((m) => m._id);
    const totalModules = moduleIds.length;
    const completedModules = totalModules > 0
        ? await ModuleCompletion.countDocuments({ user: userId, course: courseId, isCompleted: true, module: { $in: moduleIds } })
        : 0;

    const completionPercent = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);
    const meetsCompletion = completionPercent >= rule.minimumCompletionPercent;
    const meetsAssessment = !rule.requireAssessment || (passedSubmission && passedSubmission.score >= rule.passingScore);
    const isEligible = rule.isEnabled && !rule.readOnlyMode && meetsCompletion && meetsAssessment;

    return {
        course,
        rule,
        totalModules,
        completedModules,
        completionPercent,
        assessmentScore: passedSubmission?.score || null,
        isEligible,
        reasons: [
            !rule.isEnabled ? 'Certification is disabled for this course.' : null,
            rule.readOnlyMode ? 'Course certificate is in read-only mode.' : null,
            !meetsCompletion ? `Complete at least ${rule.minimumCompletionPercent}% of modules.` : null,
            !meetsAssessment && rule.requireAssessment ? `Pass final assessment with ${rule.passingScore}% score.` : null,
        ].filter(Boolean),
    };
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
