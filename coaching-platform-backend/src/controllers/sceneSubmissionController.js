// src/controllers/sceneSubmissionController.js

import asyncHandler from 'express-async-handler';

import UserSceneSubmission from '../models/UserSceneSubmission.js';

import DailyContent from '../models/DailyContent.js';

import GamificationService from '../services/GamificationService.js';

import mongoose from 'mongoose';

import { isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';



const SCENE_MIN_SUMMARIES = 2;

const SCENE_MAX_SUMMARIES = 5;



function normalizeSummaries(raw) {

    if (!Array.isArray(raw)) return [];

    const list = raw.map((s) => String(s ?? '').trim()).filter(Boolean);

    return list.slice(0, SCENE_MAX_SUMMARIES);

}



/**

 * @desc    Submit scene summaries (2–5 short descriptions)

 * @route   POST /api/submit-scene-description

 * @access  Private

 */

export const submitSceneDescription = asyncHandler(async (req, res) => {

    const { sceneId, summaries, sentences, description } = req.body;



    if (!sceneId) {

        res.status(400);

        throw new Error('Scene ID is required.');

    }



    if (!mongoose.Types.ObjectId.isValid(sceneId)) {

        res.status(400);

        throw new Error('Invalid scene ID format.');

    }



    const sceneContent = await DailyContent.findById(sceneId);

    if (!sceneContent) {

        res.status(404);

        throw new Error('Scene not found.');

    }



    if (sceneContent.type !== 'SCENE') {

        res.status(400);

        throw new Error('Content is not a scene.');

    }



    if (!isDailyContentScheduledForLocalToday(sceneContent.date)) {

        res.status(400);

        throw new Error("Only today's scene can be submitted.");

    }



    const existingSubmission = await UserSceneSubmission.findOne({

        userId: req.user._id,

        sceneId,

    });



    if (existingSubmission) {

        res.status(400);

        throw new Error('You have already submitted for this scene.');

    }



    let validated = normalizeSummaries(summaries);

    if (validated.length === 0) {

        validated = normalizeSummaries(sentences);

    }

    if (validated.length === 0 && description?.trim()) {

        validated = [description.trim()];

    }



    if (validated.length < SCENE_MIN_SUMMARIES) {

        res.status(400);

        throw new Error(`Please provide at least ${SCENE_MIN_SUMMARIES} summaries about the scene.`);

    }



    if (validated.length > SCENE_MAX_SUMMARIES) {

        res.status(400);

        throw new Error(`You can submit at most ${SCENE_MAX_SUMMARIES} summaries.`);

    }



    const PARTICIPATION_POINTS = 10;



    const submission = await UserSceneSubmission.create({

        userId: req.user._id,

        sceneId,

        summaries: validated,

        sentences: validated,

        evaluationPoints: 0,

        pointsEarned: 0,

    });



    const { participationPointsAwarded, progress, levelUp: levelUpResult } =
        await GamificationService.runParticipationGamification(
            req.user._id.toString(),
            sceneId,
            PARTICIPATION_POINTS
        );

    res.status(201).json({
        status: 'success',
        message: 'Scene summaries submitted successfully!',
        data: {
            submission: {
                _id: submission._id,
                summaries: submission.summaries,
                evaluationPoints: 0,
                submittedAt: submission.createdAt,
                isCorrect: submission.isCorrect,
            },
            participationPointsAwarded,
            evaluationPoints: 0,
            progress,
            levelUp: levelUpResult,
        },
    });

});



/**

 * @desc    Get user's scene submission

 * @route   GET /api/submit-scene-description/:sceneId

 * @access  Private

 */

export const getUserSceneSubmission = asyncHandler(async (req, res) => {

    const { sceneId } = req.params;



    if (!mongoose.Types.ObjectId.isValid(sceneId)) {

        res.status(400);

        throw new Error('Invalid scene ID format.');

    }



    const submission = await UserSceneSubmission.findOne({

        userId: req.user._id,

        sceneId,

    });



    if (!submission) {

        res.status(404);

        throw new Error('No submission found for this scene.');

    }



    res.status(200).json({

        status: 'success',

        data: {

            submission,

        },

    });

});

