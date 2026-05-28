import asyncHandler from 'express-async-handler';
import DailyContent from '../models/DailyContent.js';
import { processAndUploadImage } from '../utils/localImageStorage.js';
import {
    deriveLevelFromType,
    assertGoldMediaLevel,
    buildAutoTitle,
    getDisplayTag,
} from '../utils/dailyContentLevels.js';
import {
    getNextSequenceNumber,
    assignSequenceNumberIfMissing,
} from '../utils/contentSequenceUtils.js';

const PUZZLE_TYPES = ['SPOT_CORRECT_SENTENCE', 'GRAMMAR_FILL_BLANK'];

const validatePuzzleMetadata = (metadata = {}) => {
    const puzzleType = metadata.puzzleType || 'SPOT_CORRECT_SENTENCE';
    if (!PUZZLE_TYPES.includes(puzzleType)) {
        throw new Error(`puzzleType must be one of: ${PUZZLE_TYPES.join(', ')}`);
    }
    const questions = metadata.questions || [];
    if (questions.length !== 5) {
        throw new Error('Puzzle must have exactly 5 questions in metadata.questions.');
    }
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Question ${i + 1} must have at least 2 options.`);
        }
        if (typeof q.correct_idx !== 'number' || q.correct_idx < 0 || q.correct_idx >= q.options.length) {
            throw new Error(`Question ${i + 1} must have a valid correct_idx.`);
        }
    }
    return { ...metadata, puzzleType, questions };
};

const validateMetadataForType = (type, metadata = {}) => {
    if (type === 'PUZZLE') {
        return validatePuzzleMetadata(metadata);
    }
    if (type === 'WORD' || type === 'PHRASE') {
        if (!String(metadata.text ?? '').trim()) {
            throw new Error(`${type} requires metadata.text.`);
        }
        if (!String(metadata.meaning_en ?? '').trim() || !String(metadata.meaning_hi ?? '').trim()) {
            throw new Error(`${type} requires English and Hindi meanings.`);
        }
    }
    if (type === 'STORY') {
        if (!String(metadata.text_content ?? '').trim()) {
            throw new Error('STORY requires metadata.text_content.');
        }
    }
    if (type === 'SCENE') {
        if (!String(metadata.explanation ?? '').trim()) {
            throw new Error('SCENE requires metadata.explanation.');
        }
    }
    return metadata;
};

const prepareBody = async (body, isUpdate = false) => {
    const payload = { ...body };
    delete payload.adminKey;
    const type = payload.type;
    if (!type) throw new Error('type is required.');

    payload.metadata = validateMetadataForType(type, payload.metadata || {});

    if (!payload.level) {
        payload.level = deriveLevelFromType(type, payload.metadata);
    }
    assertGoldMediaLevel(type, payload.level);

    if (!isUpdate || payload.sequenceNumber === undefined) {
        if (!payload.sequenceNumber) {
            payload.sequenceNumber = await getNextSequenceNumber(type, payload.level);
        }
    }

    if (!payload.title || payload.title.trim() === '') {
        payload.title = buildAutoTitle(type, payload.sequenceNumber, payload.metadata);
    }

    return payload;
};

const startOfLocalDay = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
        throw new Error('Invalid date.');
    }
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    return start;
};

const endOfLocalDayExclusive = (dateStr) => {
    const start = startOfLocalDay(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return end;
};

/** One slot per calendar day (type + level + puzzle variant for PUZZLE). */
const findExistingForDaySlot = async (payload) => {
    const dateValue = payload.date;
    if (!dateValue) return null;

    const query = {
        date: {
            $gte: startOfLocalDay(dateValue),
            $lt: endOfLocalDayExclusive(dateValue),
        },
        type: payload.type,
        level: payload.level,
    };

    if (payload.type === 'PUZZLE') {
        const puzzleType = payload.metadata?.puzzleType || 'SPOT_CORRECT_SENTENCE';
        query['metadata.puzzleType'] = puzzleType;
    }

    return DailyContent.findOne(query).sort({ createdAt: -1 });
};

/**
 * @route GET /api/admin/daily-content/sequence-preview?type=&level=&puzzleType=
 * Next display number for a new item (per type + level stream).
 */
export const getSequencePreviewAdmin = asyncHandler(async (req, res) => {
    const { type, level, puzzleType } = req.query;
    if (!type || typeof type !== 'string') {
        return res.status(400).json({ status: 'fail', message: 'Query parameter type is required.' });
    }

    const metadata = puzzleType ? { puzzleType: String(puzzleType) } : {};
    const resolvedLevel = level && String(level).trim()
        ? String(level).trim()
        : deriveLevelFromType(type, metadata);

    const sequenceNumber = await getNextSequenceNumber(type, resolvedLevel);
    const displayTag = getDisplayTag(sequenceNumber);
    const displayTitle = buildAutoTitle(type, sequenceNumber, metadata);

    res.status(200).json({
        status: 'success',
        data: {
            sequenceNumber,
            displayTag,
            displayTitle,
            level: resolvedLevel,
        },
    });
});

export const getAllDailyContentAdmin = asyncHandler(async (req, res) => {
    const {
        date,
        startDate,
        endDate,
        level,
        type,
        search,
        isActive,
        page: pageRaw,
        limit: limitRaw,
        sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = startOfLocalDay(startDate);
        }
        if (endDate) {
            query.date.$lt = endOfLocalDayExclusive(endDate);
        }
        if (Object.keys(query.date).length === 0) {
            delete query.date;
        }
    } else if (date) {
        query.date = {
            $gte: startOfLocalDay(date),
            $lt: endOfLocalDayExclusive(date),
        };
    }

    if (level) {
        query.level = level;
    }
    if (type) {
        query.type = type;
    }
    if (isActive === 'true') {
        query.isActive = true;
    } else if (isActive === 'false') {
        query.isActive = false;
    }
    if (search && String(search).trim()) {
        query.title = { $regex: String(search).trim(), $options: 'i' };
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort = { date: sortDir, level: 1, type: 1, sequenceNumber: 1 };

    const page = parseInt(pageRaw, 10);
    const limit = parseInt(limitRaw, 10);
    const usePagination = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0;
    const safeLimit = usePagination ? Math.min(100, Math.max(1, limit)) : 0;
    const safePage = usePagination ? page : 1;

    if (usePagination) {
        const total = await DailyContent.countDocuments(query);
        const items = await DailyContent.find(query)
            .sort(sort)
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit);
        return res.status(200).json({
            status: 'success',
            data: {
                content: items,
                pagination: {
                    total,
                    page: safePage,
                    limit: safeLimit,
                    totalPages: Math.max(1, Math.ceil(total / safeLimit) || 1),
                },
            },
        });
    }

    const items = await DailyContent.find(query).sort(sort);
    res.status(200).json({ status: 'success', data: { content: items } });
});

export const createDailyContentAdmin = asyncHandler(async (req, res) => {
    const payload = await prepareBody(req.body);
    const existing = await findExistingForDaySlot(payload);
    if (existing) {
        return res.status(409).json({
            status: 'fail',
            message: 'Content for this type is already scheduled on this date. Edit the existing entry instead.',
            data: { content: existing, duplicate: true },
        });
    }
    const doc = await DailyContent.create({ ...payload, createdBy: req.user._id });
    await assignSequenceNumberIfMissing(doc);
    res.status(201).json({ status: 'success', data: { content: doc } });
});

export const bulkCreateDailyContentAdmin = asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ status: 'fail', message: 'items array is required.' });
    }

    const created = [];
    const failures = [];

    for (let index = 0; index < items.length; index++) {
        try {
            const payload = await prepareBody(items[index]);
            const existing = await findExistingForDaySlot(payload);
            if (existing) {
                failures.push({
                    index,
                    message: 'Content for this type is already scheduled on this date.',
                });
                continue;
            }
            const doc = await DailyContent.create({ ...payload, createdBy: req.user._id });
            await assignSequenceNumberIfMissing(doc);
            created.push(doc);
        } catch (err) {
            failures.push({
                index,
                message: err.message || 'Failed to create item.',
            });
        }
    }

    res.status(201).json({
        status: 'success',
        data: {
            createdCount: created.length,
            failedCount: failures.length,
            failures,
            content: created,
        },
    });
});

export const updateDailyContentAdmin = asyncHandler(async (req, res) => {
    const existing = await DailyContent.findById(req.params.id);
    if (!existing) {
        return res.status(404).json({ status: 'fail', message: 'Daily content not found.' });
    }

    const merged = {
        type: req.body.type ?? existing.type,
        level: req.body.level ?? existing.level,
        metadata: req.body.metadata ?? existing.metadata,
        date: req.body.date ?? existing.date,
        sequenceNumber: req.body.sequenceNumber ?? existing.sequenceNumber,
        title: req.body.title,
        isActive: req.body.isActive ?? existing.isActive,
    };

    const payload = await prepareBody(merged, true);
    const doc = await DailyContent.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ status: 'success', data: { content: doc } });
});

export const deleteDailyContentAdmin = asyncHandler(async (req, res) => {
    const doc = await DailyContent.findByIdAndDelete(req.params.id);
    if (!doc) {
        return res.status(404).json({ status: 'fail', message: 'Daily content not found.' });
    }
    res.status(200).json({ status: 'success', message: 'Deleted.' });
});

/** POST /api/admin/daily-content/upload-image */
export const uploadDailyContentImageAdmin = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided.');
    }

    const imageUrl = await processAndUploadImage(req.file.buffer, {
        width: 1200,
        quality: 80,
        pathPrefix: 'daily_content_images',
        originalName: req.file.originalname,
    });

    res.status(201).json({ status: 'success', data: { imageUrl } });
});
