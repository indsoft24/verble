// src/models/Certificate.js
import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        unique: true, // One certificate per user
    },
    assessmentSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CertificateAssessmentSubmission',
        required: true,
        index: true,
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    issuedDate: {
        type: Date,
        default: Date.now,
    },
    score: {
        type: Number,
        required: true,
    },
    pdfUrl: {
        type: String,
        trim: true,
    },
    pdfPath: {
        type: String,
        trim: true,
    },
    verificationCode: {
        type: String,
        required: true,
        unique: true,
        index: true, // Index is created here, no need for separate index() call
    },
}, {
    timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
