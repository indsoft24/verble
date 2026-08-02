import mongoose from 'mongoose';

const snapshotQuestionSchema = new mongoose.Schema(
    {
        sourceQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalAssessmentQuestion', required: true },
        prompt: { type: String, required: true },
        options: { type: [String], required: true },
        correctOption: { type: Number, required: true, select: false },
        explanation: { type: String, select: false },
        points: { type: Number, required: true },
    },
    { _id: true }
);

const finalAssessmentAttemptSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        settings: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalAssessmentSettings', required: true },
        attemptNumber: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED'], default: 'IN_PROGRESS', index: true },
        bankVersion: { type: Number, required: true },
        settingsSnapshot: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
        questions: { type: [snapshotQuestionSchema], required: true, immutable: true },
        answers: { type: [Number], default: [] },
        startedAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date, required: true, index: true },
        lastSavedAt: Date,
        submittedAt: Date,
        score: { type: Number, min: 0, max: 100 },
        passed: Boolean,
        correctCount: Number,
        totalPoints: Number,
        earnedPoints: Number,
    },
    { timestamps: true }
);

finalAssessmentAttemptSchema.index({ user: 1, course: 1, attemptNumber: 1 }, { unique: true });
finalAssessmentAttemptSchema.index({ user: 1, course: 1, status: 1 });

export default mongoose.model('FinalAssessmentAttempt', finalAssessmentAttemptSchema);
