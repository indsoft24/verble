import mongoose from 'mongoose';

const certificateNumberingSettingsSchema = new mongoose.Schema(
    {
        scopeType: { type: String, enum: ['GLOBAL', 'COURSE', 'MODULE'], required: true },
        scopeId: { type: mongoose.Schema.Types.ObjectId, default: null },
        certificateType: { type: String, enum: ['MODULE', 'COURSE', 'LEGACY'], required: true },
        template: {
            type: String,
            default: '{PREFIX}-{YEAR}-{SEQUENCE}',
            validate: {
                validator: (value) => {
                    if (
                        typeof value !== 'string' ||
                        !value.includes('{SEQUENCE}') ||
                        !/^[A-Z0-9{}_./-]+$/i.test(value)
                    ) return false;
                    const tokens = value.match(/\{[A-Z]+\}/gi) || [];
                    return tokens.every((token) =>
                        ['{PREFIX}', '{YEAR}', '{COURSE}', '{MODULE}', '{SEQUENCE}'].includes(token.toUpperCase())
                    );
                },
                message: 'Template must contain {SEQUENCE} and only safe template characters.',
            },
        },
        prefix: { type: String, default: 'CERT', trim: true, maxlength: 30 },
        padding: { type: Number, default: 6, min: 2, max: 12 },
        reset: { type: String, enum: ['NEVER', 'YEARLY'], default: 'YEARLY' },
        active: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

certificateNumberingSettingsSchema.index(
    { scopeType: 1, scopeId: 1, certificateType: 1 },
    { unique: true }
);

export default mongoose.model('CertificateNumberingSettings', certificateNumberingSettingsSchema);
