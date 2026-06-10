import mongoose from 'mongoose';

const appLearningSettingsSchema = new mongoose.Schema(
    {
        maxModuleCompletionCycles: {
            type: Number,
            default: 1,
            min: 1,
            max: 10,
        },
        maxWatchesPerVideoPerCycle: {
            type: Number,
            default: 4,
            min: 1,
            max: 20,
        },
        maxWatchesPerVideo: {
            type: Number,
            default: 4,
            min: 1,
            max: 20,
        },
        maxQuizAttempts: {
            type: Number,
            default: 3,
            min: 1,
            max: 20,
        },
        requireQuizToUnlockNextModule: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const AppLearningSettings = mongoose.model('AppLearningSettings', appLearningSettingsSchema);

export default AppLearningSettings;
