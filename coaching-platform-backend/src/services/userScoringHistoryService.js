import mongoose from 'mongoose';
import User from '../models/User.js';
import DailyContent from '../models/DailyContent.js';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import UserStorySubmission from '../models/UserStorySubmission.js';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import UserLyricsSubmission from '../models/UserLyricsSubmission.js';
import UserConversationSubmission from '../models/UserConversationSubmission.js';
import UserPuzzleSubmission from '../models/UserPuzzleSubmission.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import ModuleQuiz from '../models/ModuleQuiz.js';
import Module from '../models/Module.js';
import UserScoreLedger from '../models/UserScoreLedger.js';
import { ledgerDocToEvent } from './scoreLedgerService.js';

const PARTICIPATION_POINTS = 10;

const CONTENT_TYPE_LABELS = {
    WORD_OF_THE_DAY: 'Word of the Day',
    STORY: 'Story summary',
    VOCAB_SET: 'Vocabulary set',
    SCENE: 'Explain the Scene',
    SPEECH: 'Famous Speech',
    CONVERSATION: 'Practical Conversation',
    PUZZLE: 'Puzzle',
};

function eventKey(e) {
    const d = new Date(e.occurredAt).toISOString().slice(0, 10);
    return `${e.category}|${e.sourceType}|${e.sourceId}|${e.eventKind}|${d}`;
}

/** Keys used to suppress legacy synthesized rows when ledger already has the activity. */
function buildLedgerCoverage(ledgerEvents) {
    const participationContentIds = new Set();
    const evaluationSubmissionIds = new Set();
    const puzzleSubmissionIds = new Set();
    const puzzleContentIds = new Set();
    const quizSubmissionIds = new Set();

    for (const e of ledgerEvents) {
        if (e.category === 'participation' && e.sourceType === 'daily_content') {
            participationContentIds.add(e.sourceId);
            if (e.meta?.contentType === 'PUZZLE') {
                puzzleContentIds.add(e.sourceId);
            }
        }
        if (e.category === 'evaluation') {
            evaluationSubmissionIds.add(e.sourceId);
        }
        if (e.category === 'puzzle') {
            puzzleSubmissionIds.add(e.sourceId);
            const pid = e.meta?.puzzleId || e.meta?.contentId;
            if (pid) puzzleContentIds.add(String(pid));
            if (e.sourceType === 'daily_content') puzzleContentIds.add(e.sourceId);
        }
        if (e.category === 'module_quiz') {
            quizSubmissionIds.add(e.sourceId);
        }
    }

    return {
        participationContentIds,
        evaluationSubmissionIds,
        puzzleSubmissionIds,
        puzzleContentIds,
        quizSubmissionIds,
    };
}

function isSynthesizedEventCovered(e, coverage) {
    const contentId = e.meta?.contentId ? String(e.meta.contentId) : null;
    const puzzleId = e.meta?.puzzleId ? String(e.meta.puzzleId) : contentId;

    if (e.category === 'participation' && e.eventKind === 'participation') {
        if (contentId && coverage.participationContentIds.has(contentId)) return true;
    }

    if (e.category === 'evaluation') {
        if (coverage.evaluationSubmissionIds.has(e.sourceId)) return true;
    }

    if (e.category === 'puzzle') {
        if (coverage.puzzleSubmissionIds.has(e.sourceId)) return true;
        if (puzzleId && coverage.puzzleContentIds.has(puzzleId)) return true;
        if (puzzleId && coverage.participationContentIds.has(puzzleId)) return true;
    }

    if (e.category === 'module_quiz') {
        if (coverage.quizSubmissionIds.has(e.sourceId)) return true;
    }

    return false;
}

async function normalizeLedgerEvents(ledgerEvents, userId) {
    const dailyContentLedgerIds = ledgerEvents
        .filter((e) => e.category === 'participation' && e.sourceType === 'daily_content')
        .map((e) => e.sourceId);

    if (dailyContentLedgerIds.length === 0) return ledgerEvents;

    const contentMap = await loadContentTitles(dailyContentLedgerIds);
    const puzzleContentIds = dailyContentLedgerIds.filter(
        (id) => contentMap.get(id)?.contentType === 'PUZZLE'
    );

    const uid = new mongoose.Types.ObjectId(userId);
    const puzzleSubs =
        puzzleContentIds.length > 0
            ? await UserPuzzleSubmission.find({
                  userId: uid,
                  puzzleId: { $in: puzzleContentIds },
              })
                  .select('puzzleId correctCount puzzleType pointsEarned')
                  .lean()
            : [];
    const subByPuzzleId = new Map(puzzleSubs.map((s) => [s.puzzleId?.toString(), s]));

    return ledgerEvents.map((e) => {
        if (e.category !== 'participation' || e.sourceType !== 'daily_content') {
            return e;
        }

        const cid = e.sourceId;
        const info = contentMap.get(cid);
        if (info?.contentType !== 'PUZZLE') {
            return e;
        }

        const sub = subByPuzzleId.get(cid);
        const title = sub
            ? `Puzzle: ${info.title} (${sub.correctCount ?? 0}/5 correct)`
            : e.title.replace(/^Participation:\s*/i, 'Puzzle: ');

        return {
            ...e,
            category: 'puzzle',
            title,
            eventKind: 'puzzle',
            meta: {
                ...e.meta,
                contentType: 'PUZZLE',
                contentId: cid,
                correctCount: sub?.correctCount,
                puzzleType: sub?.puzzleType,
                puzzleId: cid,
            },
        };
    });
}

function makeEvent({
    id,
    category,
    title,
    points,
    delta,
    status,
    occurredAt,
    sourceType,
    sourceId,
    eventKind = 'default',
    meta = {},
}) {
    return {
        id,
        category,
        title,
        points: points ?? 0,
        delta: delta ?? 0,
        status,
        occurredAt: occurredAt instanceof Date ? occurredAt : new Date(occurredAt),
        sourceType,
        sourceId: String(sourceId),
        eventKind,
        meta,
        fromLedger: false,
    };
}

async function loadContentTitles(contentIds) {
    const ids = [...new Set(contentIds.filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    if (ids.length === 0) return new Map();
    const docs = await DailyContent.find({ _id: { $in: ids } }).select('title type').lean();
    const map = new Map();
    docs.forEach((d) => {
        map.set(d._id.toString(), {
            title: d.title || CONTENT_TYPE_LABELS[d.type] || 'Daily activity',
            contentType: d.type,
        });
    });
    return map;
}

async function countPendingReviews(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const pending = { $or: [{ isCorrect: null }, { isCorrect: { $exists: false } }] };
    const [s, st, v, sc, sp, ly, c] = await Promise.all([
        UserSentenceSubmission.countDocuments({ userId: uid, ...pending }),
        UserStorySubmission.countDocuments({ userId: uid, ...pending }),
        UserVocabSubmission.countDocuments({ userId: uid, ...pending }),
        UserSceneSubmission.countDocuments({ userId: uid, ...pending }),
        UserSpeechSubmission.countDocuments({ userId: uid, ...pending }),
        UserLyricsSubmission.countDocuments({ userId: uid, ...pending }),
        UserConversationSubmission.countDocuments({ userId: uid, ...pending }),
    ]);
    return s + st + v + sc + sp + ly + c;
}

async function synthesizeHistoryEvents(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const events = [];

    const [
        sentences,
        stories,
        vocabs,
        scenes,
        speeches,
        lyricsSubs,
        conversations,
        puzzles,
        quizSubs,
    ] = await Promise.all([
        UserSentenceSubmission.find({ userId: uid }).lean(),
        UserStorySubmission.find({ userId: uid }).lean(),
        UserVocabSubmission.find({ userId: uid }).lean(),
        UserSceneSubmission.find({ userId: uid }).lean(),
        UserSpeechSubmission.find({ userId: uid }).lean(),
        UserLyricsSubmission.find({ userId: uid }).lean(),
        UserConversationSubmission.find({ userId: uid }).lean(),
        UserPuzzleSubmission.find({ userId: uid }).lean(),
        ModuleQuizSubmission.find({ user: uid }).sort({ submittedAt: -1 }).lean(),
    ]);

    const contentIds = [
        ...sentences.map((s) => s.wordId),
        ...stories.map((s) => s.storyId),
        ...vocabs.map((s) => s.vocabSetId),
        ...scenes.map((s) => s.sceneId),
        ...speeches.map((s) => s.speechId),
        ...lyricsSubs.map((s) => s.lyricsId),
        ...conversations.map((s) => s.conversationId),
        ...puzzles.map((s) => s.puzzleId),
    ];
    const contentMap = await loadContentTitles(contentIds);

    const quizIds = [...new Set(quizSubs.map((q) => q.quiz?.toString()).filter(Boolean))];
    const quizzes = quizIds.length
        ? await ModuleQuiz.find({ _id: { $in: quizIds } }).select('title module').lean()
        : [];
    const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q]));
    const moduleIds = quizzes.map((q) => q.module).filter(Boolean);
    const modules = moduleIds.length
        ? await Module.find({ _id: { $in: moduleIds } }).select('title').lean()
        : [];
    const moduleMap = new Map(modules.map((m) => [m._id.toString(), m.title]));

    for (const s of sentences) {
        const cid = s.wordId?.toString();
        const info = contentMap.get(cid) || { title: s.word || 'Word of the Day' };
        const at = s.createdAt || s.updatedAt;
        if (at) {
            events.push(
                makeEvent({
                    id: `syn-sent-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: at,
                    sourceType: 'sentence_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-sent-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: s.isCorrect ? 'approved' : 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'sentence_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of stories) {
        const cid = s.storyId?.toString();
        const info = contentMap.get(cid) || { title: 'Story summary' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-story-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'story_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-story-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'story_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of vocabs) {
        const cid = s.vocabSetId?.toString();
        const info = contentMap.get(cid) || { title: 'Vocabulary set' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-vocab-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'vocab_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-vocab-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'vocab_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of scenes) {
        const cid = s.sceneId?.toString();
        const info = contentMap.get(cid) || { title: 'Explain the Scene' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-scene-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'scene_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-scene-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'scene_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of speeches) {
        const cid = s.speechId?.toString();
        const info = contentMap.get(cid) || { title: 'Famous Speech' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-speech-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'speech_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-speech-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'speech_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of lyricsSubs) {
        const cid = s.lyricsId?.toString();
        const info = contentMap.get(cid) || { title: 'Song Lyrics' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-lyrics-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'lyrics_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-lyrics-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'lyrics_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of conversations) {
        const cid = s.conversationId?.toString();
        const info = contentMap.get(cid) || { title: 'Practical Conversation' };
        if (s.createdAt) {
            events.push(
                makeEvent({
                    id: `syn-conv-part-${s._id}`,
                    category: 'participation',
                    title: `Participation: ${info.title}`,
                    points: PARTICIPATION_POINTS,
                    delta: PARTICIPATION_POINTS,
                    status: 'approved',
                    occurredAt: s.createdAt,
                    sourceType: 'conversation_submission',
                    sourceId: s._id,
                    eventKind: 'participation',
                    meta: { contentId: cid },
                })
            );
        }
        if (s.reviewedAt != null) {
            const pts = s.evaluationPoints ?? s.pointsEarned ?? 0;
            events.push(
                makeEvent({
                    id: `syn-conv-eval-${s._id}`,
                    category: 'evaluation',
                    title: `Review: ${info.title}`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.reviewedAt,
                    sourceType: 'conversation_submission',
                    sourceId: s._id,
                    eventKind: 'evaluation',
                    meta: { isCorrect: s.isCorrect },
                })
            );
        }
    }

    for (const s of puzzles) {
        const cid = s.puzzleId?.toString();
        const info = contentMap.get(cid) || { title: 'Puzzle' };
        const pts = s.pointsEarned ?? 0;
        if (s.createdAt || s.submittedAt) {
            events.push(
                makeEvent({
                    id: `syn-puzzle-${s._id}`,
                    category: 'puzzle',
                    title: `Puzzle: ${info.title} (${s.correctCount ?? 0}/5 correct)`,
                    points: pts,
                    delta: pts,
                    status: 'approved',
                    occurredAt: s.submittedAt || s.createdAt,
                    sourceType: 'puzzle_submission',
                    sourceId: s._id,
                    eventKind: 'puzzle',
                    meta: {
                        contentId: cid,
                        puzzleId: cid,
                        correctCount: s.correctCount,
                        puzzleType: s.puzzleType,
                    },
                })
            );
        }
    }

    for (const sub of quizSubs) {
        const quiz = quizMap.get(sub.quiz?.toString());
        const modTitle = quiz?.module ? moduleMap.get(quiz.module.toString()) : null;
        const title = quiz?.title || 'Module quiz';
        const label = modTitle ? `${title} — ${modTitle}` : title;
        events.push(
            makeEvent({
                id: `syn-quiz-${sub._id}`,
                category: 'module_quiz',
                title: `Quiz: ${label}`,
                points: sub.score ?? 0,
                delta: 0,
                status: sub.passed ? 'approved' : 'info',
                occurredAt: sub.submittedAt || sub.createdAt,
                sourceType: 'module_quiz_submission',
                sourceId: sub._id,
                eventKind: 'attempt',
                meta: { passed: sub.passed, score: sub.score },
            })
        );
    }

    return events;
}

async function mergeHistoryEvents(userId, categoryFilter) {
    const [ledgerRows, synthesized] = await Promise.all([
        UserScoreLedger.find({ user: userId }).sort({ occurredAt: -1 }).lean(),
        synthesizeHistoryEvents(userId),
    ]);

    let ledgerEvents = await normalizeLedgerEvents(ledgerRows.map(ledgerDocToEvent), userId);
    const ledgerKeys = new Set(ledgerEvents.map(eventKey));
    const coverage = buildLedgerCoverage(ledgerEvents);

    const merged = [...ledgerEvents];
    for (const e of synthesized) {
        if (ledgerKeys.has(eventKey(e))) continue;
        if (isSynthesizedEventCovered(e, coverage)) continue;
        merged.push(e);
    }

    merged.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

    if (categoryFilter && categoryFilter !== 'all') {
        return merged.filter((e) => e.category === categoryFilter);
    }
    return merged;
}

export async function getScoringSummary(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    const user = await User.findById(userId).select('points evaluationScore coins name email').lean();
    if (!user) {
        throw new Error('User not found');
    }

    const [pendingReviewCount, allEvents] = await Promise.all([
        countPendingReviews(userId),
        mergeHistoryEvents(userId, null),
    ]);

    const lastActivityAt =
        allEvents.length > 0 ? allEvents[0].occurredAt : user.updatedAt || user.createdAt || null;

    return {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        leaderboardPoints: user.points ?? 0,
        evaluationScore: user.evaluationScore ?? 0,
        coins: user.coins ?? 0,
        pendingReviewCount,
        lastActivityAt,
    };
}

export async function listScoringHistory(userId, { page = 1, limit = 25, category = 'all' } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

    const merged = await mergeHistoryEvents(userId, category === 'all' ? null : category);
    const total = merged.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;
    const events = merged.slice(start, start + safeLimit).map((e) => ({
        ...e,
        occurredAt: e.occurredAt,
    }));

    return {
        events,
        pagination: { page: safePage, limit: safeLimit, total, totalPages },
    };
}

export async function listAdminScoringUsers({ search, page = 1, limit = 25 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const query = { role: 'user' };
    if (search?.trim()) {
        const term = search.trim();
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: regex }, { email: regex }, { phoneNumber: regex }, { mobile: regex }];
    }

    const [total, users] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
            .select('name email phoneNumber mobile points evaluationScore coins createdAt updatedAt')
            .sort({ points: -1, evaluationScore: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
    ]);

    const rows = await Promise.all(
        users.map(async (u) => {
            const pendingReviewCount = await countPendingReviews(u._id);
            const lastLedger = await UserScoreLedger.findOne({ user: u._id })
                .sort({ occurredAt: -1 })
                .select('occurredAt')
                .lean();
            return {
                _id: u._id.toString(),
                name: u.name,
                email: u.email,
                phoneNumber: u.phoneNumber || u.mobile,
                leaderboardPoints: u.points ?? 0,
                evaluationScore: u.evaluationScore ?? 0,
                coins: u.coins ?? 0,
                pendingReviewCount,
                lastActivityAt: lastLedger?.occurredAt || u.updatedAt || u.createdAt,
            };
        })
    );

    return {
        users: rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
    };
}
