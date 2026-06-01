import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import {
    getGlobalLearningSettings,
    updateGlobalLearningSettings,
    upsertUserLearningOverride,
    resetUserModuleVideoProgress,
    resetUserCourseVideoProgress,
} from '../services/courseLearningConfigService.js';
import UserLearningOverride from '../models/UserLearningOverride.js';

export const getLearningSettings = asyncHandler(async (req, res) => {
    const settings = await getGlobalLearningSettings();
    res.status(200).json({ status: 'success', data: { settings } });
});

export const patchLearningSettings = asyncHandler(async (req, res) => {
    const settings = await updateGlobalLearningSettings(req.body, req.user._id);
    res.status(200).json({ status: 'success', data: { settings } });
});

export const getUserLearningOverride = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid user ID.');
    }
    const override = await UserLearningOverride.findOne({ user: userId }).lean();
    res.status(200).json({ status: 'success', data: { override: override || null } });
});

export const putUserLearningOverride = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid user ID.');
    }
    const override = await upsertUserLearningOverride(userId, req.body, req.user._id);
    res.status(200).json({ status: 'success', data: { override } });
});

export const postUserLearningReset = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { scope, moduleId, courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid user ID.');
    }

    if (scope === 'module') {
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            res.status(400);
            throw new Error('Valid moduleId is required for module scope reset.');
        }
        await resetUserModuleVideoProgress(userId, moduleId);
    } else if (scope === 'course') {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            res.status(400);
            throw new Error('Valid courseId is required for course scope reset.');
        }
        await resetUserCourseVideoProgress(userId, courseId);
    } else {
        res.status(400);
        throw new Error('scope must be "module" or "course".');
    }

    res.status(200).json({ status: 'success', message: 'Progress reset successfully.' });
});
