import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import DailyContent from '../models/DailyContent.js';
import { getLocalTodayBounds, isDailyContentScheduledForLocalToday } from '../utils/dailyContentLocalDay.js';
import { attachSequenceNumbers } from '../utils/contentSequenceUtils.js';

const getUnlockedLevelsForUser = (user) => {
    if (!user) return ['FREE'];
    const levels = user.unlockedLevels;
    return Array.isArray(levels) && levels.length > 0 ? levels : ['FREE'];
};

const filterByUnlocked = (items, unlockedLevels) =>
    items.filter((item) => unlockedLevels.includes(item.level));

export const getDailyContent = asyncHandler(async (req, res) => {
    const { date, type, level } = req.query;
    const unlockedLevels = getUnlockedLevelsForUser(req.user);

    let start;
    let end;

    if (date) {
        const d = new Date(date);
        start = new Date(d);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
    } else {
        ({ start, end } = getLocalTodayBounds());
    }

    const query = {
        date: { $gte: start, $lt: end },
        isActive: true,
        level: { $in: unlockedLevels },
    };

    if (type) query.type = type;
    if (level) {
        if (!unlockedLevels.includes(level)) {
            return res.status(200).json({ status: 'success', data: { content: [] } });
        }
        query.level = level;
    }

    const items = await DailyContent.find(query).sort({ level: 1, type: 1 });
    const content = await attachSequenceNumbers(items);

    res.status(200).json({ status: 'success', data: { content } });
});

export const getTodaysDailyContent = asyncHandler(async (req, res) => {
    const { start, end } = getLocalTodayBounds();
    const unlockedLevels = getUnlockedLevelsForUser(req.user);

    const items = await DailyContent.find({
        date: { $gte: start, $lt: end },
        isActive: true,
        level: { $in: unlockedLevels },
    }).sort({ level: 1, type: 1 });

    const content = await attachSequenceNumbers(items);
    res.status(200).json({ status: 'success', data: { content } });
});

/**
 * @route GET /api/daily-content/adjacent?id=&direction=prev|next
 */
export const getAdjacentContentBySequence = asyncHandler(async (req, res) => {
    const { id, direction } = req.query;
    const unlockedLevels = getUnlockedLevelsForUser(req.user);

    if (!id || !direction || !['prev', 'next'].includes(direction)) {
        res.status(400);
        throw new Error('Content id and direction (prev|next) are required.');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid content id.');
    }

    const current = await DailyContent.findById(id);
    if (!current || !current.isActive) {
        res.status(404);
        throw new Error('Content not found.');
    }

    if (!unlockedLevels.includes(current.level)) {
        res.status(403);
        throw new Error('You do not have access to this content level.');
    }

    let seq = current.sequenceNumber;
    if (!seq) {
        const all = await DailyContent.find({
            type: current.type,
            level: current.level,
            isActive: true,
        })
            .sort({ date: 1, _id: 1 })
            .lean();
        const idx = all.findIndex((d) => String(d._id) === String(current._id));
        seq = idx >= 0 ? idx + 1 : 1;
    }

    const neighborQuery = {
        type: current.type,
        level: current.level,
        isActive: true,
    };

    let neighbor;
    if (direction === 'prev') {
        neighbor = await DailyContent.findOne({
            ...neighborQuery,
            $or: [
                { sequenceNumber: { $lt: seq } },
                { sequenceNumber: seq, date: { $lt: current.date } },
            ],
        })
            .sort({ sequenceNumber: -1, date: -1 })
            .lean();
        if (!neighbor) {
            neighbor = await DailyContent.findOne({
                type: current.type,
                level: current.level,
                isActive: true,
                date: { $lt: current.date },
            })
                .sort({ date: -1 })
                .lean();
        }
    } else {
        neighbor = await DailyContent.findOne({
            ...neighborQuery,
            $or: [
                { sequenceNumber: { $gt: seq } },
                { sequenceNumber: seq, date: { $gt: current.date } },
            ],
        })
            .sort({ sequenceNumber: 1, date: 1 })
            .lean();
        if (!neighbor) {
            neighbor = await DailyContent.findOne({
                type: current.type,
                level: current.level,
                isActive: true,
                date: { $gt: current.date },
            })
                .sort({ date: 1 })
                .lean();
        }
    }

    if (!neighbor) {
        return res.status(200).json({ status: 'success', data: { content: null } });
    }

    // Do not expose future scheduled sets via "next" (browse only through today and earlier).
    if (direction === 'next') {
        const { end: startOfTomorrow } = getLocalTodayBounds();
        if (new Date(neighbor.date).getTime() >= startOfTomorrow.getTime()) {
            return res.status(200).json({ status: 'success', data: { content: null } });
        }
        // On today's set, "next" stays hidden — user may only go to previous sets.
        if (isDailyContentScheduledForLocalToday(current.date)) {
            return res.status(200).json({ status: 'success', data: { content: null } });
        }
    }

    const [withSeq] = await attachSequenceNumbers([neighbor]);
    res.status(200).json({ status: 'success', data: { content: withSeq } });
});

/**
 * @route GET /api/daily-content/professional-library
 * Curriculum GOLD conversations (not tied to calendar day).
 */
export const getProfessionalLibrary = asyncHandler(async (req, res) => {
    const { tag } = req.query;
    const unlockedLevels = getUnlockedLevelsForUser(req.user);

    if (!unlockedLevels.includes('GOLD')) {
        return res.status(200).json({ status: 'success', data: { content: [] } });
    }

    const query = {
        type: 'CONVERSATION',
        level: 'GOLD',
        isActive: true,
        'metadata.isProfessionalLibrary': true,
    };

    if (tag) {
        if (tag === 'General') {
            query.$or = [
                { 'metadata.tags': { $exists: false } },
                { 'metadata.tags': { $size: 0 } },
                { 'metadata.tags': null },
            ];
        } else {
            query['metadata.tags'] = tag;
        }
    }

    const items = await DailyContent.find(query)
        .sort({ sequenceNumber: 1, title: 1, _id: 1 })
        .lean();

    const content = await attachSequenceNumbers(items);
    res.status(200).json({ status: 'success', data: { content } });
});
