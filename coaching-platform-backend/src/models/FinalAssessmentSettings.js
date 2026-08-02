import mongoose from 'mongoose';

const finalAssessmentSettingsSchema = new mongoose.Schema(
    {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true, index: true },
        status: { type: String, enum: ['DRAFT', 'ACTIVE'], default: 'DRAFT', index: true },
        questionCount: { type: Number, default: 80, min: 80, max: 100 },
        passingScore: { type: Number, default: 70, min: 0, max: 100 },
        timeLimitMinutes: { type: Number, default: 120, min: 1, max: 480 },
        maxAttempts: { type: Number, default: 3, min: 1, max: 20 },
        cooldownMinutes: { type: Number, default: 0, min: 0, max: 43200 },
        shuffleQuestions: { type: Boolean, default: true },
        shuffleOptions: { type: Boolean, default: true },
        reviewPolicy: { type: String, enum: ['NONE', 'SCORE_ONLY', 'FULL_AFTER_SUBMIT'], default: 'SCORE_ONLY' },
        unlockAtCompletionPercent: { type: Number, default: 100, min: 0, max: 100 },
        bankVersion: { type: Number, default: 1, min: 1 },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('FinalAssessmentSettings', finalAssessmentSettingsSchema);
