import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import UserStorySubmission from '../models/UserStorySubmission.js';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import UserLyricsSubmission from '../models/UserLyricsSubmission.js';
import UserConversationSubmission from '../models/UserConversationSubmission.js';
import UserPuzzleSubmission from '../models/UserPuzzleSubmission.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import GamificationService from './GamificationService.js';

function effectiveReviewedPoints(doc) {
    if (doc.evaluationPoints != null && doc.evaluationPoints > 0) {
        return doc.evaluationPoints;
    }
    if (doc.isCorrect != null && doc.pointsEarned != null) {
        return doc.pointsEarned;
    }
    return 0;
}

/** Sum admin-reviewed daily submission evaluation points. */
export async function sumAdminReviewedPoints(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const reviewed = { isCorrect: { $ne: null } };
    const [sentences, stories, vocabs, scenes, speeches, lyrics, conversations] = await Promise.all([
        UserSentenceSubmission.find({ userId: uid, ...reviewed }).lean(),
        UserStorySubmission.find({ userId: uid, ...reviewed }).lean(),
        UserVocabSubmission.find({ userId: uid, ...reviewed }).lean(),
        UserSceneSubmission.find({ userId: uid, ...reviewed }).lean(),
        UserSpeechSubmission.find({ userId: uid, ...reviewed }).lean(),
        UserLyricsSubmission.find({ userId: uid, ...reviewed }).lean(),
        UserConversationSubmission.find({ userId: uid, ...reviewed }).lean(),
    ]);
    const all = [...sentences, ...stories, ...vocabs, ...scenes, ...speeches, ...lyrics, ...conversations];
    return all.reduce((sum, doc) => sum + effectiveReviewedPoints(doc), 0);
}

/** One submission per puzzle; sum pointsEarned (0–50). */
export async function sumPuzzleEvalPoints(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const puzzles = await UserPuzzleSubmission.find({ userId: uid }).select('pointsEarned').lean();
    return puzzles.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
}

/** Max quiz percentage score (0–100) per quiz, summed across quizzes. */
export async function sumQuizBestScores(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const rows = await ModuleQuizSubmission.aggregate([
        { $match: { user: uid } },
        {
            $group: {
                _id: '$quiz',
                bestScore: { $max: '$score' },
            },
        },
    ]);
    return rows.reduce((sum, r) => sum + (r.bestScore ?? 0), 0);
}

/** Full evaluation score: reviewed submissions + auto-evaluated puzzles + best quiz scores. */
export async function computeEvaluationScore(userId) {
    const [reviewed, puzzles, quizzes] = await Promise.all([
        sumAdminReviewedPoints(userId),
        sumPuzzleEvalPoints(userId),
        sumQuizBestScores(userId),
    ]);
    return reviewed + puzzles + quizzes;
}

export async function recomputeAndSaveEvaluationScore(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    const total = await computeEvaluationScore(userId);
    await User.updateOne({ _id: userId }, { $set: { evaluationScore: total } });
    return total;
}

/**
 * Apply puzzle points to evaluation score on first (only) submission.
 * Puzzles are multiple-choice and auto-graded at submit time.
 */
export async function applyPuzzleEvaluationOnSubmit(userId, submission, puzzleTitle) {
    const points = submission.pointsEarned ?? 0;
    if (points <= 0) return { delta: 0, evaluationScore: null };

    const title = puzzleTitle || 'Puzzle';
    const result = await GamificationService.applyEvaluationDelta(userId, points, {
        title: `Puzzle: ${title} (${submission.correctCount ?? 0}/5 correct)`,
        sourceType: 'puzzle_submission',
        sourceId: submission._id.toString(),
        points,
        occurredAt: submission.submittedAt || submission.createdAt || new Date(),
        meta: {
            autoEvaluated: true,
            puzzleId: submission.puzzleId?.toString(),
            correctCount: submission.correctCount,
            puzzleType: submission.puzzleType,
        },
    });

    return result;
}

/**
 * Apply quiz score improvement to evaluation score.
 * Only the best score per quiz counts; retakes with lower scores do not reduce total.
 */
export async function applyQuizEvaluationOnSubmit(userId, submission, quizTitle, moduleTitle) {
    const newScore = submission.score ?? 0;
    const quizId = submission.quiz?.toString();
    if (!quizId || newScore <= 0) return { delta: 0, evaluationScore: null };

    const uid = new mongoose.Types.ObjectId(userId);
    const priorRows = await ModuleQuizSubmission.find({
        user: uid,
        quiz: submission.quiz,
        _id: { $ne: submission._id },
    })
        .select('score')
        .lean();

    const previousBest = priorRows.length ? Math.max(...priorRows.map((r) => r.score ?? 0)) : 0;
    const delta = Math.max(0, newScore - previousBest);
    if (delta <= 0) return { delta: 0, evaluationScore: null };

    const label = moduleTitle ? `${quizTitle || 'Module quiz'} — ${moduleTitle}` : quizTitle || 'Module quiz';
    const result = await GamificationService.applyEvaluationDelta(userId, delta, {
        title: `Quiz: ${label}`,
        sourceType: 'module_quiz_submission',
        sourceId: submission._id.toString(),
        points: newScore,
        occurredAt: submission.submittedAt || submission.createdAt || new Date(),
        meta: {
            autoEvaluated: true,
            quizId,
            moduleId: submission.module?.toString(),
            score: newScore,
            previousBest,
            passed: submission.passed,
        },
    });

    return result;
}
