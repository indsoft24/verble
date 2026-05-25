import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
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

const generateCoursePdf = async ({ userName, courseTitle, certificateNumber, verificationCode, completionPercent, assessmentScore }) => {
    const certificatesDir = path.join(__dirname, '../../uploads/certificates');
    await fs.mkdir(certificatesDir, { recursive: true });
    const fileName = `course-certificate-${Date.now()}-${uuidv4().slice(0, 6)}.pdf`;
    const pdfPath = path.join(certificatesDir, fileName);

    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const stream = createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.rect(50, 50, 740, 500).lineWidth(3).stroke('#0f172a');
    doc.fontSize(34).fillColor('#0f172a').text('COURSE COMPLETION CERTIFICATE', 0, 110, { align: 'center' });
    doc.fontSize(17).fillColor('#334155').text('Awarded to', 0, 180, { align: 'center' });
    doc.fontSize(30).fillColor('#1d4ed8').font('Helvetica-Bold').text(userName.toUpperCase(), 0, 215, { align: 'center' });
    doc.fontSize(15).fillColor('#334155').font('Helvetica').text('for successfully completing', 0, 275, { align: 'center' });
    doc.fontSize(22).fillColor('#0f172a').font('Helvetica-Bold').text(courseTitle, 0, 305, { align: 'center' });
    doc.fontSize(13).fillColor('#475569').font('Helvetica').text(`Course completion: ${completionPercent}%`, 0, 350, { align: 'center' });
    if (typeof assessmentScore === 'number') {
        doc.text(`Final assessment score: ${assessmentScore}%`, 0, 372, { align: 'center' });
    }
    doc.fontSize(11).fillColor('#64748b').text(`Certificate Number: ${certificateNumber}`, 0, 440, { align: 'center' });
    doc.text(`Verification Code: ${verificationCode}`, 0, 460, { align: 'center' });
    doc.end();

    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
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
