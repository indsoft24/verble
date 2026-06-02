import mongoose from 'mongoose';

const userScoreLedgerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ['participation', 'evaluation', 'puzzle', 'module_quiz'],
            required: true,
        },
        points: { type: Number, default: 0 },
        delta: { type: Number, default: 0 },
        title: { type: String, required: true, trim: true },
        sourceType: { type: String, required: true, trim: true },
        sourceId: { type: String, required: true, trim: true },
        eventKind: { type: String, default: 'default', trim: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'info'],
            default: 'approved',
        },
        occurredAt: { type: Date, required: true, index: true },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

userScoreLedgerSchema.index(
    { user: 1, category: 1, sourceType: 1, sourceId: 1, eventKind: 1 },
    { unique: true }
);
userScoreLedgerSchema.index({ user: 1, occurredAt: -1 });

const UserScoreLedger = mongoose.model('UserScoreLedger', userScoreLedgerSchema);
export default UserScoreLedger;
