import Course from '../models/Course.js';
import Video from '../models/Video.js';
import ExamCategory from '../models/ExamCategory.js';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

const LAW_SLUG = 'law-entrance';

/**
 * @desc    Get a list of featured LAW courses for the homepage
 * @route   GET /api/kn/featured-courses
 * @access  Public
 */
export const getFeaturedLawCourses = asyncHandler(async (req, res) => {
    const lawCategory = await ExamCategory.findOne({ slug: LAW_SLUG });
    if (!lawCategory) {
        return res.status(200).json({ status: 'success', data: { courses: [] } });
    }

    const courses = await Course.find({ isPublished: true, examCategory: lawCategory._id })
        .limit(6)
        .populate('examCategory', 'name slug')
        .select('_id title description examCategory')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: courses.length,
        data: { courses },
    });
});


/**
 * @desc    Get all published LAW courses (paginated) for Knowledge Nation
 * @route   GET /api/kn/courses
 * @access  Public
 */
export const getLawCourses = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search ? String(req.query.search).trim() : null;

    const lawCategory = await ExamCategory.findOne({ slug: LAW_SLUG });
    if (!lawCategory) {
        return res.status(200).json({ status: 'success', data: { courses: [] } });
    }

    const queryConditions = { isPublished: true, examCategory: lawCategory._id };

    if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        queryConditions.$or = [{ title: regex }, { description: regex }];
    }

    const totalCourses = await Course.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalCourses / limit);

    const courses = await Course.find(queryConditions)
        .populate('examCategory', 'name slug')
        .select('_id title description createdAt updatedAt examCategory')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        status: 'success',
        results: courses.length,
        totalResults: totalCourses,
        currentPage: page,
        totalPages: totalPages,
        data: { courses },
    });
});

/**
 * @desc    Get all published LAW videos (paginated) for Knowledge Nation
 * @route   GET /api/kn/videos
 * @access  Public
 */
export const getLawVideos = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search ? String(req.query.search).trim() : null;

    const lawCategory = await ExamCategory.findOne({ slug: LAW_SLUG });
    if (!lawCategory) {
        return res.status(200).json({ status: 'success', data: { videos: [] } });
    }

    const coursesInCategory = await Course.find({ examCategory: lawCategory._id }).select('_id');
    const courseIds = coursesInCategory.map(c => c._id);
    const queryConditions = { isPublished: true, courses: { $in: courseIds } };
    
    if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        queryConditions.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    const totalVideos = await Video.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalVideos / limit);

    const videosFromDB = await Video.find(queryConditions)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requiredPlans", "_id name")
        .lean();

    // Optional: Check user access if authenticated
    let userActivePlanIds = new Set();
    if (req.user?._id) {
        const user = await User.findById(req.user._id).select("subscriptions").lean();
        if (user?.subscriptions) {
            const now = new Date();
            user.subscriptions.forEach((sub) => {
                if (sub.status === "active" && new Date(sub.endDate) >= now) {
                    userActivePlanIds.add(sub.planId.toString());
                }
            });
        }
    }

    const videosWithAccess = videosFromDB.map((video) => {
        const isFree = !video.requiredPlans || video.requiredPlans.length === 0;
        const userHasRequiredPlan = video.requiredPlans?.some(
            (reqPlan) => reqPlan?._id && userActivePlanIds.has(reqPlan._id.toString())
        ) || false;
        const canAccess = isFree || userHasRequiredPlan;
        return { ...video, canAccess };
    });

    res.status(200).json({
        status: 'success',
        results: videosWithAccess.length,
        totalResults: totalVideos,
        currentPage: page,
        totalPages: totalPages,
        data: { videos: videosWithAccess },
    });
});