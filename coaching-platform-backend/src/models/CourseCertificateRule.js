import mongoose from 'mongoose';

const courseCertificateRuleSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            unique: true,
            index: true,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        requireAssessment: {
            type: Boolean,
            default: false,
        },
        passingScore: {
            type: Number,
            default: 70,
            min: 0,
            max: 100,
        },
        minimumCompletionPercent: {
            type: Number,
            default: 100,
            min: 1,
            max: 100,
        },
        readOnlyMode: {
            type: Boolean,
            default: false,
        },
        requireModuleQuizzes: {
            type: Boolean,
            default: false,
        },
        minimumModuleQuizScore: {
            type: Number,
            default: 70,
            min: 0,
            max: 100,
        },
        requireDailySubmissions: {
            type: Boolean,
            default: false,
        },
        minimumDailySubmissionPercent: {
            type: Number,
            default: 70,
            min: 0,
            max: 100,
        },
        dailySubmissionLookbackDays: {
            type: Number,
            default: 90,
            min: 1,
            max: 365,
        },
        minimumOverallSubmissionPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const CourseCertificateRule = mongoose.model('CourseCertificateRule', courseCertificateRuleSchema);

export default CourseCertificateRule;
