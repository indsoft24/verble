import CertificateNumberCounter from '../models/CertificateNumberCounter.js';
import CertificateNumberingSettings from '../models/CertificateNumberingSettings.js';
import LearningCertificate from '../models/LearningCertificate.js';
import Certificate from '../models/Certificate.js';
import CourseCertificate from '../models/CourseCertificate.js';

export const safeNumberToken = (value, fallback = 'NA') => {
    const token = String(value || '')
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase();
    return token.slice(0, 30) || fallback;
};

export const formatCertificateNumber = ({ settings, sequence, date = new Date(), course, module }) => {
    const year = String(date.getUTCFullYear());
    const padded = String(sequence).padStart(settings.padding ?? 6, '0');
    return settings.template
        .replaceAll('{PREFIX}', safeNumberToken(settings.prefix, 'CERT'))
        .replaceAll('{YEAR}', year)
        .replaceAll('{COURSE}', safeNumberToken(course?.title || course?._id || course, 'COURSE'))
        .replaceAll('{MODULE}', safeNumberToken(module?.title || module?._id || module, 'MODULE'))
        .replaceAll('{SEQUENCE}', padded);
};

const defaultSettings = (certificateType) => ({
    scopeType: 'GLOBAL',
    scopeId: null,
    certificateType,
    template: '{PREFIX}-{YEAR}-{SEQUENCE}',
    prefix: certificateType === 'MODULE' ? 'MCERT' : certificateType === 'COURSE' ? 'CCERT' : 'CERT',
    padding: 6,
    reset: 'YEARLY',
});

export const resolveNumberingSettings = async ({ certificateType, courseId, moduleId }) => {
    const candidates = [];
    if (moduleId) candidates.push({ scopeType: 'MODULE', scopeId: moduleId, certificateType, active: true });
    if (courseId) candidates.push({ scopeType: 'COURSE', scopeId: courseId, certificateType, active: true });
    candidates.push({ scopeType: 'GLOBAL', scopeId: null, certificateType, active: true });
    for (const query of candidates) {
        const settings = await CertificateNumberingSettings.findOne(query).lean();
        if (settings) return settings;
    }
    return defaultSettings(certificateType);
};

export const allocateCertificateNumber = async ({ certificateType, course, module, date = new Date() }) => {
    const settings = await resolveNumberingSettings({
        certificateType,
        courseId: course?._id || course,
        moduleId: module?._id || module,
    });
    const period = settings.reset === 'YEARLY' ? date.getUTCFullYear() : 'ALL';
    const scopeId = settings.scopeId?.toString() || 'GLOBAL';
    const counterKey = `${certificateType}:${settings.scopeType}:${scopeId}:${period}`;

    for (let collisionAttempt = 0; collisionAttempt < 20; collisionAttempt += 1) {
        let counter;
        try {
            counter = await CertificateNumberCounter.findOneAndUpdate(
                { key: counterKey },
                { $inc: { sequence: 1 } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        } catch (error) {
            if (error?.code === 11000) continue;
            throw error;
        }
        const certificateNumber = formatCertificateNumber({
            settings,
            sequence: counter.sequence,
            date,
            course,
            module,
        });
        const collision = await Promise.all([
            LearningCertificate.exists({ certificateNumber }),
            Certificate.exists({ certificateNumber }),
            CourseCertificate.exists({ certificateNumber }),
        ]);
        if (!collision.some(Boolean)) return certificateNumber;
    }
    throw new Error('Unable to allocate a collision-free certificate number.');
};
