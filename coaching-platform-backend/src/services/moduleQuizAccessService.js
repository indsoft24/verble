import Module from '../models/Module.js';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import Video from '../models/Video.js';
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import {
    getModuleVideos,
    getModuleCompletionCycle,
} from '../utils/videoAccessHelper.js';

export const getActiveQuizForModule = async (moduleId) =>
    ModuleQuiz.findOne({ module: moduleId, isActive: true });

export const areAllModuleVideosComplete = async (userId, moduleId) => {
    const videos = await getModuleVideos(moduleId);
    if (videos.length === 0) return true;

    const cycle = await getModuleCompletionCycle(userId, moduleId);
    const progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: cycle,
    }).lean();

    const progressMap = new Map(progress.map((p) => [p.video.toString(), p]));
    return videos.every((v) => {
        const p = progressMap.get(v._id.toString());
        return p && p.isCompleted;
    });
};

export const countModuleVideoProgress = async (userId, moduleId) => {
    const videos = await getModuleVideos(moduleId);
    const totalVideos = videos.length;
    if (totalVideos === 0) {
        return { videosCompleted: 0, totalVideos: 0, allComplete: true };
    }

    const cycle = await getModuleCompletionCycle(userId, moduleId);
    const progress = await VideoWatchProgress.find({
        user: userId,
        module: moduleId,
        moduleCompletionCycle: cycle,
        isCompleted: true,
    }).lean();

    const completedIds = new Set(progress.map((p) => p.video.toString()));
    const videosCompleted = videos.filter((v) => completedIds.has(v._id.toString())).length;
    return {
        videosCompleted,
        totalVideos,
        allComplete: videosCompleted >= totalVideos,
    };
};

/**
 * Upsert ModuleCompletion from video progress. If no active quiz and videos done, mark module complete.
 */
export const syncModuleProgressFromVideos = async (userId, moduleId) => {
    const module = await Module.findById(moduleId).select('course order');
    if (!module) return null;

    const { videosCompleted, totalVideos, allComplete } = await countModuleVideoProgress(userId, moduleId);
    const activeQuiz = await getActiveQuizForModule(moduleId);

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        completion = new ModuleCompletion({
            user: userId,
            module: moduleId,
            course: module.course,
            videosCompleted: 0,
            totalVideos,
            quizPassed: false,
            quizScore: 0,
            isCompleted: false,
        });
    }

    completion.videosCompleted = videosCompleted;
    completion.totalVideos = totalVideos;

    if (!activeQuiz && allComplete) {
        completion.quizPassed = true;
        completion.isCompleted = true;
        completion.completedAt = completion.completedAt || new Date();
    } else if (activeQuiz && !completion.quizPassed) {
        completion.isCompleted = false;
        completion.completedAt = undefined;
    } else if (activeQuiz && completion.quizPassed && allComplete) {
        completion.isCompleted = true;
        completion.completedAt = completion.completedAt || new Date();
    }

    await completion.save();
    return completion;
};

/**
 * After a passing quiz attempt, finalize module completion when videos are also done.
 */
export const finalizeModuleCompletion = async (userId, moduleId, quizScore = 0) => {
    const module = await Module.findById(moduleId).select('course order');
    if (!module) return null;

    const { videosCompleted, totalVideos, allComplete } = await countModuleVideoProgress(userId, moduleId);
    if (!allComplete) {
        const err = new Error('Complete all module videos before the quiz can count toward completion.');
        err.statusCode = 403;
        throw err;
    }

    let completion = await ModuleCompletion.findOne({ user: userId, module: moduleId });
    if (!completion) {
        completion = new ModuleCompletion({
            user: userId,
            module: moduleId,
            course: module.course,
            videosCompleted,
            totalVideos,
        });
    }

    completion.videosCompleted = videosCompleted;
    completion.totalVideos = totalVideos;
    completion.quizPassed = true;
    completion.quizScore = Math.max(completion.quizScore || 0, quizScore);
    completion.isCompleted = true;
    completion.completedAt = completion.completedAt || new Date();
    await completion.save();

    await ensureNextModuleCompletionStub(userId, module.course, module.order);
    return completion;
};

const ensureNextModuleCompletionStub = async (userId, courseId, currentModuleOrder) => {
    const nextModule = await Module.findOne({ course: courseId, order: currentModuleOrder + 1 });
    if (!nextModule) return;

    const currentModule = await Module.findOne({ course: courseId, order: currentModuleOrder });
    if (!currentModule) return;

    const currentDone = await ModuleCompletion.findOne({
        user: userId,
        module: currentModule._id,
        isCompleted: true,
    });
    if (!currentDone) return;

    const existing = await ModuleCompletion.findOne({ user: userId, module: nextModule._id });
    if (existing) return;

    const totalVideos = await Video.countDocuments({ modules: nextModule._id, isPublished: true });
    await ModuleCompletion.create({
        user: userId,
        module: nextModule._id,
        course: courseId,
        videosCompleted: 0,
        totalVideos,
        quizPassed: false,
    });
};

export const assertVideosCompleteForQuiz = async (userId, moduleId) => {
    const complete = await areAllModuleVideosComplete(userId, moduleId);
    if (!complete) {
        const err = new Error('Watch all videos in this module before taking the quiz.');
        err.statusCode = 403;
        throw err;
    }
};
