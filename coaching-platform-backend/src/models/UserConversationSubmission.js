import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema(
    {
        participant1Line: { type: String, required: true, trim: true },
        participant2Line: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const userConversationSubmissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DailyContent',
            required: true,
            index: true,
        },
        participant1: { type: String, required: true, trim: true },
        participant2: { type: String, required: true, trim: true },
        exchanges: {
            type: [exchangeSchema],
            required: true,
            validate: {
                validator(v) {
                    return v.length >= 2 && v.length <= 5;
                },
                message: 'Must submit between 2 and 5 exchanges.',
            },
        },
        exchangesCorrect: {
            type: Number,
            default: 0,
        },
        pointsEarned: {
            type: Number,
            default: 0,
        },
        evaluationPoints: {
            type: Number,
            default: 0,
        },
        isCorrect: {
            type: Boolean,
            default: null,
        },
        feedback: {
            type: String,
            trim: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
        exchangeValidations: [
            {
                exchangeIndex: { type: Number, required: true },
                isCorrect: { type: Boolean, required: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

userConversationSubmissionSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

const UserConversationSubmission = mongoose.model(
    'UserConversationSubmission',
    userConversationSubmissionSchema
);

export default UserConversationSubmission;
