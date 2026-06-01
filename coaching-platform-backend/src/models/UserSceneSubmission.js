// src/models/UserSceneSubmission.js

import mongoose from 'mongoose';



/** Legacy MCQ (optional). */

const sceneAnswerSchema = new mongoose.Schema(

    {

        questionIndex: { type: Number, required: true, min: 0, max: 4 },

        selectedOptionIndex: { type: Number, required: true, min: 0, max: 4 },

    },

    { _id: false }

);



/** Legacy per-question scores (optional). */

const sceneQuestionScoreSchema = new mongoose.Schema(

    {

        questionIndex: { type: Number, required: true, min: 0, max: 4 },

        score: { type: Number, required: true, min: 0, max: 50 },

    },

    { _id: false }

);



const userSceneSubmissionSchema = new mongoose.Schema(

    {

        userId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: 'User',

            required: true,

            index: true,

        },

        sceneId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: 'DailyContent',

            required: true,

            index: true,

        },

        /** Learner summary texts (2–5 per scene). */

        summaries: {

            type: [String],

            default: [],

        },

        /** Mirror of summaries for older clients. */

        sentences: {

            type: [String],

            default: [],

        },

        /** Legacy single description. */

        description: {

            type: String,

            trim: true,

        },

        answers: {

            type: [sceneAnswerSchema],

            default: [],

        },

        questionScores: {

            type: [sceneQuestionScoreSchema],

            default: [],

        },

        pointsEarned: {

            type: Number,

            default: 0,

        },

        evaluationPoints: {

            type: Number,

            default: 0,

        },

        sentencesCorrect: {

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

        sentenceValidations: [
            {
                sentenceIndex: { type: Number, required: true },
                isCorrect: { type: Boolean, required: true },
            },
        ],

    },

    {

        timestamps: true,

    }

);



userSceneSubmissionSchema.index({ userId: 1, sceneId: 1 }, { unique: true });



const UserSceneSubmission = mongoose.model('UserSceneSubmission', userSceneSubmissionSchema);



export default UserSceneSubmission;

