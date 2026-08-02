import mongoose from 'mongoose';

const auditEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true, trim: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
        at: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { _id: false }
);

const learningCertificateSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['MODULE', 'COURSE', 'LEGACY'], required: true, index: true },
        issuanceKey: { type: String, required: true, unique: true, index: true, immutable: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
        module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
        source: {
            type: String,
            enum: ['AUTOMATIC', 'MANUAL', 'LEGACY_CERTIFICATE', 'LEGACY_COURSE_CERTIFICATE', 'BACKFILL'],
            required: true,
            default: 'AUTOMATIC',
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId },
        certificateNumber: { type: String, required: true, unique: true, index: true, immutable: true },
        verificationCode: { type: String, required: true, unique: true, index: true, immutable: true },
        recipientSnapshot: {
            name: { type: String, required: true },
            email: { type: String, required: true },
        },
        subjectSnapshot: {
            courseTitle: String,
            moduleTitle: String,
        },
        eligibilitySnapshot: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
        ruleSnapshot: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
        examSnapshot: { type: mongoose.Schema.Types.Mixed, immutable: true },
        issuedAt: { type: Date, default: Date.now, required: true, immutable: true, index: true },
        pdf: {
            status: {
                type: String,
                enum: ['PENDING', 'GENERATING', 'READY', 'FAILED'],
                default: 'PENDING',
                index: true,
            },
            path: String,
            url: String,
            checksum: String,
            attempts: { type: Number, default: 0 },
            lastAttemptAt: Date,
            error: String,
        },
        manualReason: String,
        revokedAt: Date,
        revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        revocationReason: String,
        audit: { type: [auditEntrySchema], default: [] },
    },
    { timestamps: true }
);

learningCertificateSchema.index({ user: 1, type: 1, issuedAt: -1 });
learningCertificateSchema.index({ course: 1, type: 1, issuedAt: -1 });
learningCertificateSchema.index({ module: 1, type: 1, issuedAt: -1 });
learningCertificateSchema.index({
    certificateNumber: 'text',
    verificationCode: 'text',
    'recipientSnapshot.name': 'text',
    'recipientSnapshot.email': 'text',
});

export default mongoose.model('LearningCertificate', learningCertificateSchema);
