import mongoose from 'mongoose';

const userLearningOverrideSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        maxModuleCompletionCycles: { type: Number, min: 1, max: 10 },
        maxWatchesPerVideoPerCycle: { type: Number, min: 1, max: 20 },
        maxWatchesPerVideo: { type: Number, min: 1, max: 20 },
        maxQuizAttempts: { type: Number, min: 1, max: 20 },
        resetProgressAt: { type: Date },
        notes: { type: String, trim: true },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const UserLearningOverride = mongoose.model('UserLearningOverride', userLearningOverrideSchema);

export default UserLearningOverride;
