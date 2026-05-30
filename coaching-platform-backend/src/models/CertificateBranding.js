import mongoose from 'mongoose';

const certificateBrandingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'default',
            unique: true,
            immutable: true,
        },
        signatoryName: {
            type: String,
            default: 'Narendra Singh',
            trim: true,
        },
        signatoryTitle: {
            type: String,
            default: 'Lead English Coach, Verble',
            trim: true,
        },
        issuerTagline: {
            type: String,
            default: 'Speak with confidence.',
            trim: true,
        },
        signatureImagePath: {
            type: String,
            trim: true,
        },
        logoImagePath: {
            type: String,
            trim: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const CertificateBranding = mongoose.model('CertificateBranding', certificateBrandingSchema);

export default CertificateBranding;
