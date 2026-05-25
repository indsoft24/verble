import mongoose from 'mongoose';

const courseCertificateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        certificateNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        verificationCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
        },
        courseTitle: {
            type: String,
            required: true,
            trim: true,
        },
        completionPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        assessmentScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },
        pdfPath: {
            type: String,
            trim: true,
        },
        pdfUrl: {
            type: String,
            trim: true,
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

courseCertificateSchema.index({ user: 1, course: 1 }, { unique: true });

const CourseCertificate = mongoose.model('CourseCertificate', courseCertificateSchema);

export default CourseCertificate;
