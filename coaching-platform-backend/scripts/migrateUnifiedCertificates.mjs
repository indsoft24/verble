import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import crypto from 'crypto';
import connectDB from '../src/config/db.js';
import LearningCertificate from '../src/models/LearningCertificate.js';
import Certificate from '../src/models/Certificate.js';
import CourseCertificate from '../src/models/CourseCertificate.js';
import ModuleCompletion from '../src/models/ModuleCompletion.js';
import User from '../src/models/User.js';
import Module from '../src/models/Module.js';
import Course from '../src/models/Course.js';
import {
    issueModuleCertificate,
    moduleIssuanceKey,
} from '../src/services/learningCertificateService.js';

dotenv.config();
const dryRun = process.argv.includes('--dry-run');
const batchArg = process.argv.find((arg) => arg.startsWith('--batch-size='));
const batchSize = Math.min(1000, Math.max(10, Number(batchArg?.split('=')[1] || 200)));
const stats = {
    dryRun,
    scanned: 0,
    inserted: 0,
    existing: 0,
    duplicates: 0,
    orphans: 0,
    collisions: 0,
    pdfReady: 0,
    pdfMissing: 0,
    errors: 0,
};

const fileMetadata = async (pdfPath, fallbackUrl) => {
    if (!pdfPath) return { status: 'FAILED', url: fallbackUrl, error: 'Legacy PDF path is empty.' };
    try {
        const bytes = await fs.readFile(pdfPath);
        stats.pdfReady += 1;
        return {
            status: 'READY',
            path: pdfPath,
            url: fallbackUrl,
            checksum: crypto.createHash('sha256').update(bytes).digest('hex'),
        };
    } catch {
        stats.pdfMissing += 1;
        return { status: 'FAILED', path: pdfPath, url: fallbackUrl, error: 'Legacy PDF file is missing.' };
    }
};

const canInsertNumberAndCode = async (certificateNumber, verificationCode, issuanceKey) => {
    const conflict = await LearningCertificate.findOne({
        $or: [{ certificateNumber }, { verificationCode }],
        issuanceKey: { $ne: issuanceKey },
    }).lean();
    if (conflict) {
        stats.collisions += 1;
        console.warn('[collision]', issuanceKey, 'conflicts with', conflict.issuanceKey);
        return false;
    }
    return true;
};

const migrateLegacyCertificates = async (Model, source, type) => {
    let lastId = null;
    while (true) {
        const query = lastId ? { _id: { $gt: lastId } } : {};
        const docs = await Model.find(query).sort({ _id: 1 }).limit(batchSize).lean();
        if (!docs.length) break;
        for (const legacy of docs) {
            stats.scanned += 1;
            lastId = legacy._id;
            const issuanceKey = `${source}:${legacy._id}`;
            if (await LearningCertificate.exists({ issuanceKey })) {
                stats.existing += 1;
                continue;
            }
            const [user, course] = await Promise.all([
                User.findById(legacy.user).select('name email').lean(),
                legacy.course ? Course.findById(legacy.course).select('title').lean() : null,
            ]);
            if (!user || (type === 'COURSE' && !course)) {
                stats.orphans += 1;
                console.warn('[orphan]', issuanceKey);
                continue;
            }
            if (!(await canInsertNumberAndCode(legacy.certificateNumber, legacy.verificationCode, issuanceKey))) continue;
            const pdf = await fileMetadata(legacy.pdfPath, legacy.pdfUrl);
            const payload = {
                type,
                issuanceKey,
                user: legacy.user,
                course: legacy.course,
                source,
                sourceId: legacy._id,
                certificateNumber: legacy.certificateNumber,
                verificationCode: legacy.verificationCode,
                recipientSnapshot: {
                    name: legacy.userName || user.name || 'Learner',
                    email: legacy.userEmail || user.email,
                },
                subjectSnapshot: { courseTitle: legacy.courseTitle || course?.title },
                eligibilitySnapshot: {
                    completionPercent: legacy.completionPercent,
                    score: legacy.score ?? legacy.assessmentScore,
                    legacy: true,
                },
                ruleSnapshot: { legacy: true },
                examSnapshot: { score: legacy.score ?? legacy.assessmentScore },
                issuedAt: legacy.issuedAt || legacy.issuedDate || legacy.createdAt,
                pdf,
                audit: [{ action: 'BACKFILLED', reason: source }],
            };
            if (dryRun) {
                stats.inserted += 1;
                continue;
            }
            try {
                const result = await LearningCertificate.updateOne(
                    { issuanceKey },
                    { $setOnInsert: payload },
                    { upsert: true }
                );
                if (result.upsertedCount) stats.inserted += 1;
                else stats.existing += 1;
            } catch (error) {
                if (error?.code === 11000) stats.duplicates += 1;
                else {
                    stats.errors += 1;
                    console.error('[legacy-error]', issuanceKey, error.message);
                }
            }
        }
    }
};

const migrateCompletedModules = async () => {
    let lastId = null;
    while (true) {
        const query = { isCompleted: true, ...(lastId ? { _id: { $gt: lastId } } : {}) };
        const completions = await ModuleCompletion.find(query).sort({ _id: 1 }).limit(batchSize);
        if (!completions.length) break;
        for (const completion of completions) {
            stats.scanned += 1;
            lastId = completion._id;
            const issuanceKey = moduleIssuanceKey(completion.user, completion.module);
            if (await LearningCertificate.exists({ issuanceKey })) {
                stats.existing += 1;
                continue;
            }
            const [user, module] = await Promise.all([
                User.exists({ _id: completion.user }),
                Module.exists({ _id: completion.module, course: completion.course }),
            ]);
            if (!user || !module) {
                stats.orphans += 1;
                console.warn('[orphan]', issuanceKey);
                continue;
            }
            if (!completion.completedAt) {
                completion.completedAt = completion.updatedAt || completion.createdAt || new Date();
                if (!dryRun) await completion.save();
            }
            if (dryRun) {
                stats.inserted += 1;
                continue;
            }
            try {
                await issueModuleCertificate({
                    userId: completion.user,
                    moduleId: completion.module,
                    completion,
                    source: 'BACKFILL',
                });
                stats.inserted += 1;
            } catch (error) {
                if (error?.code === 11000) stats.duplicates += 1;
                else {
                    stats.errors += 1;
                    console.error('[module-error]', issuanceKey, error.message);
                }
            }
        }
    }
};

const reconcileUnifiedPdfs = async () => {
    let lastId = null;
    while (true) {
        const query = lastId ? { _id: { $gt: lastId } } : {};
        const certificates = await LearningCertificate.find(query).sort({ _id: 1 }).limit(batchSize);
        if (!certificates.length) break;
        for (const certificate of certificates) {
            lastId = certificate._id;
            if (!certificate.pdf?.path) {
                if (!dryRun && certificate.pdf.status === 'READY') {
                    certificate.pdf.status = 'FAILED';
                    certificate.pdf.error = 'PDF path is missing.';
                    await certificate.save();
                }
                stats.pdfMissing += 1;
                continue;
            }
            try {
                const bytes = await fs.readFile(certificate.pdf.path);
                const checksum = crypto.createHash('sha256').update(bytes).digest('hex');
                stats.pdfReady += 1;
                if (
                    !dryRun &&
                    (certificate.pdf.status !== 'READY' || certificate.pdf.checksum !== checksum)
                ) {
                    certificate.pdf.status = 'READY';
                    certificate.pdf.checksum = checksum;
                    certificate.pdf.error = undefined;
                    await certificate.save();
                }
            } catch {
                stats.pdfMissing += 1;
                if (!dryRun) {
                    certificate.pdf.status = 'FAILED';
                    certificate.pdf.error = 'PDF file is missing during reconciliation.';
                    await certificate.save();
                }
            }
        }
    }
};

try {
    await connectDB();
    await migrateLegacyCertificates(Certificate, 'LEGACY_CERTIFICATE', 'LEGACY');
    await migrateLegacyCertificates(CourseCertificate, 'LEGACY_COURSE_CERTIFICATE', 'COURSE');
    await migrateCompletedModules();
    await reconcileUnifiedPdfs();
    console.log(JSON.stringify(stats, null, 2));
} finally {
    await mongoose.disconnect();
}
