// src/controllers/aiPromptController.js
import asyncHandler from 'express-async-handler';
import AIPrompt from '../models/AIPrompt.js';

const PAID_SUBSCRIPTION_STATUSES = new Set([
    'active',
    'pending_cancellation',
    'trial',
    'future_active',
]);

const normalizePromptDoc = (prompt) => ({
    _id: prompt._id,
    title: prompt.title,
    excerpt: prompt.excerpt || '',
    prompt: prompt.prompt,
    content: prompt.content || '',
    description: prompt.description,
    tags: prompt.tags || [],
    topic: prompt.topic || 'Uncategorized',
    category: prompt.category,
    level: prompt.level,
    usageCount: prompt.usageCount || 0,
    isActive: prompt.isActive,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
});

const userHasActivePlanByName = (user, fragment) => {
    const now = Date.now();
    return (user?.subscriptions || []).some((sub) => {
        if (!sub?.planName) return false;
        if (!PAID_SUBSCRIPTION_STATUSES.has(sub.status)) return false;
        const start = new Date(sub.startDate).getTime();
        const end = new Date(sub.endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) return false;
        if (start > now || end < now) return false;
        return sub.planName.toLowerCase().includes(fragment);
    });
};

const canAccessGoldPrompts = (user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const unlockedLevels = Array.isArray(user.unlockedLevels) ? user.unlockedLevels : [];
    if (unlockedLevels.includes('GOLD') || unlockedLevels.includes('FULL_COURSE')) return true;
    if (user.membershipLevel === 'GOLD' || user.membershipLevel === 'FULL_COURSE') return true;
    if (userHasActivePlanByName(user, 'gold')) return true;
    if (userHasActivePlanByName(user, 'full course') || userHasActivePlanByName(user, 'fullcourse')) return true;
    return false;
};

const ensureGoldAccess = (req) => {
    if (canAccessGoldPrompts(req.user)) return;
    const error = new Error('AI prompts are available only for GOLD or Full Course subscribers.');
    error.statusCode = 403;
    throw error;
};

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

/**
 * @desc    Get all AI prompts grouped by topic
 * @route   GET /api/ai-prompts
 * @access  Private (Logged-in users)
 */
export const getAllPrompts = asyncHandler(async (req, res) => {
    ensureGoldAccess(req);

    const {
        topic,
        tag,
        category,
        search,
        page = '1',
        limit = '20',
        sort = 'recent',
    } = req.query;

    const parsedPage = parsePositiveInt(page, 1);
    const parsedLimit = Math.min(parsePositiveInt(limit, 20), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {
        isActive: true,
        level: { $in: ['GOLD'] },
    };

    if (typeof topic === 'string' && topic.trim()) {
        query.topic = topic.trim();
    }
    if (typeof category === 'string' && category.trim()) {
        query.category = category.trim();
    }
    if (typeof tag === 'string' && tag.trim()) {
        query.tags = tag.trim();
    }
    if (typeof search === 'string' && search.trim()) {
        const term = search.trim();
        query.$or = [
            { title: { $regex: term, $options: 'i' } },
            { excerpt: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { content: { $regex: term, $options: 'i' } },
            { prompt: { $regex: term, $options: 'i' } },
            { tags: { $elemMatch: { $regex: term, $options: 'i' } } },
            { topic: { $regex: term, $options: 'i' } },
            { category: { $regex: term, $options: 'i' } },
        ];
    }

    const sortMap = {
        recent: { createdAt: -1, _id: -1 },
        oldest: { createdAt: 1, _id: 1 },
        title: { title: 1, _id: 1 },
        usage: { usageCount: -1, _id: -1 },
    };
    const sortQuery = sortMap[sort] || sortMap.recent;

    const [prompts, total] = await Promise.all([
        AIPrompt.find(query).sort(sortQuery).skip(skip).limit(parsedLimit),
        AIPrompt.countDocuments(query),
    ]);

    const normalizedPrompts = prompts.map(normalizePromptDoc);

    // Group prompts by topic
    const promptsByTopic = {};
    normalizedPrompts.forEach((prompt) => {
        const topicKey = prompt.topic || 'Uncategorized';
        if (!promptsByTopic[topicKey]) {
            promptsByTopic[topicKey] = [];
        }
        promptsByTopic[topicKey].push(prompt);
    });

    // Get all unique topics
    const topics = Object.keys(promptsByTopic).sort();
    const totalPages = Math.max(1, Math.ceil(total / parsedLimit));

    res.status(200).json({
        status: 'success',
        data: {
            topics,
            promptsByTopic,
            prompts: normalizedPrompts,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages,
            },
        },
    });
});

/**
 * @desc    Admin list all AI prompts with filters
 * @route   GET /api/ai-prompts/admin/list
 * @access  Private (Admin only)
 */
export const getAllPromptsAdmin = asyncHandler(async (req, res) => {
    const {
        topic,
        tag,
        category,
        search,
        page = '1',
        limit = '20',
        includeInactive = 'true',
    } = req.query;

    const parsedPage = parsePositiveInt(page, 1);
    const parsedLimit = Math.min(parsePositiveInt(limit, 20), 200);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (includeInactive !== 'true') {
        query.isActive = true;
    }
    if (typeof topic === 'string' && topic.trim()) query.topic = topic.trim();
    if (typeof category === 'string' && category.trim()) query.category = category.trim();
    if (typeof tag === 'string' && tag.trim()) query.tags = tag.trim();
    if (typeof search === 'string' && search.trim()) {
        const term = search.trim();
        query.$or = [
            { title: { $regex: term, $options: 'i' } },
            { excerpt: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { content: { $regex: term, $options: 'i' } },
            { prompt: { $regex: term, $options: 'i' } },
            { tags: { $elemMatch: { $regex: term, $options: 'i' } } },
        ];
    }

    const [prompts, total] = await Promise.all([
        AIPrompt.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(parsedLimit),
        AIPrompt.countDocuments(query),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            prompts: prompts.map(normalizePromptDoc),
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
            },
        },
    });
});

/**
 * @desc    Get all unique topics/categories
 * @route   GET /api/ai-prompts/topics
 * @access  Private (Logged-in users)
 */
export const getTopics = asyncHandler(async (req, res) => {
    ensureGoldAccess(req);
    const baseMatch = {
        isActive: true,
        level: { $in: ['GOLD'] },
    };
    const [topicsAgg, tagsAgg, categories] = await Promise.all([
        AIPrompt.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: '$topic',
                    count: { $sum: 1 },
                },
            },
            { $match: { _id: { $type: 'string', $ne: '' } } },
            { $sort: { _id: 1 } },
        ]),
        AIPrompt.aggregate([
            { $match: baseMatch },
            { $unwind: '$tags' },
            { $match: { tags: { $type: 'string', $ne: '' } } },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        AIPrompt.distinct('category', baseMatch),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            topics: topicsAgg.map((item) => ({ value: item._id, count: item.count })),
            tags: tagsAgg.map((item) => ({ value: item._id, count: item.count })),
            categories: categories.filter((c) => c).sort(),
        },
    });
});

/**
 * @desc    Get a single AI prompt by ID
 * @route   GET /api/ai-prompts/:id
 * @access  Private (GOLD / FULL_COURSE / Admin)
 */
export const getPromptById = asyncHandler(async (req, res) => {
    ensureGoldAccess(req);
    const prompt = await AIPrompt.findOne({ _id: req.params.id, isActive: true, level: 'GOLD' });
    if (!prompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }
    res.status(200).json({
        status: 'success',
        data: {
            prompt: normalizePromptDoc(prompt),
        },
    });
});

/**
 * @desc    Increment usage count when a prompt is copied
 * @route   POST /api/ai-prompts/:id/increment-usage
 * @access  Private (Logged-in users)
 */
export const incrementUsage = asyncHandler(async (req, res) => {
    ensureGoldAccess(req);
    const { id } = req.params;

    const prompt = await AIPrompt.findOne({ _id: id, isActive: true, level: 'GOLD' });
    if (!prompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    prompt.usageCount = (prompt.usageCount || 0) + 1;
    await prompt.save();

    res.status(200).json({
        status: 'success',
        data: {
            usageCount: prompt.usageCount,
        },
    });
});

/**
 * @desc    Create a new AI prompt (Admin only)
 * @route   POST /api/ai-prompts
 * @access  Private (Admin only)
 */
export const createPrompt = asyncHandler(async (req, res) => {
    const { topic, category, title, prompt, description, excerpt, content, tags, level } = req.body;

    if (!topic || !title || !prompt) {
        res.status(400);
        throw new Error('Topic, title, and prompt are required');
    }

    const newPrompt = await AIPrompt.create({
        topic,
        category,
        title,
        prompt,
        description,
        excerpt,
        content,
        tags: tags || [],
        level: level || 'GOLD',
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            prompt: newPrompt,
        },
    });
});

/**
 * @desc    Update an AI prompt (Admin only)
 * @route   PUT /api/ai-prompts/:id
 * @access  Private (Admin only)
 */
export const updatePrompt = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { topic, category, title, prompt, description, excerpt, content, tags, level, isActive } = req.body;

    const existingPrompt = await AIPrompt.findById(id);
    if (!existingPrompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    if (topic) existingPrompt.topic = topic;
    if (category !== undefined) existingPrompt.category = category;
    if (title) existingPrompt.title = title;
    if (prompt) existingPrompt.prompt = prompt;
    if (description !== undefined) existingPrompt.description = description;
    if (excerpt !== undefined) existingPrompt.excerpt = excerpt;
    if (content !== undefined) existingPrompt.content = content;
    if (tags) existingPrompt.tags = tags;
    if (level) existingPrompt.level = level;
    if (isActive !== undefined) existingPrompt.isActive = isActive;

    await existingPrompt.save();

    res.status(200).json({
        status: 'success',
        data: {
            prompt: existingPrompt,
        },
    });
});

/**
 * @desc    Delete an AI prompt (Admin only)
 * @route   DELETE /api/ai-prompts/:id
 * @access  Private (Admin only)
 */
export const deletePrompt = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prompt = await AIPrompt.findById(id);
    if (!prompt) {
        res.status(404);
        throw new Error('Prompt not found');
    }

    await prompt.deleteOne();

    res.status(200).json({
        status: 'success',
        message: 'Prompt deleted successfully',
    });
});
