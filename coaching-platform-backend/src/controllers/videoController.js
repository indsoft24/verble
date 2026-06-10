import crypto from "crypto";
import fs from "fs";
import Video from "../models/Video.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Course from '../models/Course.js';
import ExamCategory from '../models/ExamCategory.js';
import asyncHandler from 'express-async-handler';
import { checkSequentialVideoAccess, markVideoAsCompleted } from '../utils/videoAccessHelper.js';
import { buildVideoLockFlags, assertModuleUnlockedForUser } from '../services/moduleUnlockService.js';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cacheHelper.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';
import { getThumbnailPath, getMasterPlaylistPath } from '../config/videoStorageConfig.js';
import { assertUserCanPlayVideo } from '../utils/videoPlayAccess.js';
import { getActiveUserTierLevel, canAccessRequiredPlansByTier } from '../utils/subscriptionTierAccess.js';

/**
 * @desc    Get all published videos, with access rights for the current user
 * @route   GET /api/videos
 * @access  Private
 */
export const getAllPublishedVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search ? String(req.query.search).trim() : null;
    const userId = req.user?._id;

    // Generate cache key (include user ID for personalized results)
    const cacheKey = generateCacheKey('videos:list', { 
      page, 
      limit, 
      search: searchTerm || '', 
      userId: userId?.toString() || 'anonymous' 
    });

    // Try to get from cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const queryConditions = { isPublished: true };
    if (searchTerm) {
      const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      queryConditions.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    // Optimized query with lean and specific field selection
    const [videosFromDB, totalMatchingVideos] = await Promise.all([
      Video.find(queryConditions)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id title description durationSeconds tags requiredPlans videoStatus streamProvider localStorageId")
        .populate("requiredPlans", "_id name")
        .lean(),
      Video.countDocuments(queryConditions)
    ]);

    // Tier-based access: FREE < BRONZE < SILVER < GOLD < FULL_COURSE
    let userTierLevel = 0;
    if (userId) {
      const user = await User.findById(userId).select("subscriptions").lean();
      userTierLevel = getActiveUserTierLevel(user?.subscriptions);
    }

    const videosWithAccess = videosFromDB.map((video) => {
      const canAccess = canAccessRequiredPlansByTier({
        requiredPlans: video.requiredPlans,
        userTierLevel,
      });
      const thumb = getStreamProvider(video) === "local" && video.videoStatus === "AVAILABLE" && video.localStorageId
        ? `/api/videos/thumbnail/${video._id}`
        : null;
      return { ...video, thumbnailUrl: thumb, canAccess };
    });

    const response = {
      status: "success",
      results: videosWithAccess.length,
      totalResults: totalMatchingVideos,
      currentPage: page,
      totalPages: Math.ceil(totalMatchingVideos / limit),
      data: { videos: videosWithAccess },
    };

    // Cache the response (shorter TTL for user-specific data)
    await setCache(cacheKey, response, userId ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM);

    res.status(200).json(response);
  } catch (error) {
    // Error fetching videos (stack trace not logged for security)
    res.status(500).json({ status: "error", message: "Failed to fetch published videos." });
  }
};

/**
 * @desc    Get a single published video by its ID, with access rights for the current user
 * @route   GET /api/videos/:videoId
 * @access  Private
 */
export const getPublishedVideoById = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ status: "fail", message: "Invalid video ID format." });
    }

    const video = await Video.findOne({ _id: videoId, isPublished: true })
      .populate("requiredPlans", "_id name")
      // Ensure we select `videoStatus` (and related fields) because the frontend
      // gates playback on it and we interpolate it in access-denied messages.
      .select(
        "title description durationSeconds order modules courses streamProvider localStorageId videoStatus associatedMaterials"
      )
      .lean();

    if (!video) {
      return res.status(404).json({ status: "fail", message: "Video not found or is not published." });
    }

    // Check subscription access first
    let hasSubscriptionAccess = false;
    let accessDeniedMessage = "Access Denied.";

    const normalizedVideoStatus = (video.videoStatus || "").toUpperCase();
    const provider = getStreamProvider(video);

    // If DB status is stale, fall back to checking if the processed HLS master exists.
    let isVideoAvailable = normalizedVideoStatus === "AVAILABLE";
    if (provider === "local" && video.localStorageId) {
      const masterPath = getMasterPlaylistPath(video.localStorageId);
      try {
        await fs.promises.access(masterPath, fs.constants.R_OK);
        isVideoAvailable = true;
        // Keep frontend gating/thumb URLs consistent with server storage reality.
        if (normalizedVideoStatus !== "AVAILABLE") {
          await Video.findByIdAndUpdate(videoId, {
            $set: { videoStatus: "AVAILABLE", processingError: null, transcodeStep: "file_ready" },
          });
          video.videoStatus = "AVAILABLE";
        }
      } catch {
        // master.m3u8 not present yet; keep original DB status result
      }
    }
    const hasStreamUrl = !!video.localStorageId;
    const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;

    // Debug logging (remove in production if needed)
    // Video access check initiated

    // Check if video is available and has stream URL
    if (!isVideoAvailable) {
      accessDeniedMessage = `This video is currently processing and not yet available. (Status: ${video.videoStatus})`;
      hasSubscriptionAccess = false;
    } else if (!hasStreamUrl) {
      accessDeniedMessage = "This video is currently processing and not yet available.";
      hasSubscriptionAccess = false;
    } else if (isFreeVideo) {
      hasSubscriptionAccess = true; // Free video - always accessible
    } else {
      if (!userId) {
        accessDeniedMessage = "This video requires a subscription plan.";
      } else {
        const user = await User.findById(userId).select("subscriptions").lean();
        const userTierLevel = getActiveUserTierLevel(user?.subscriptions);
        const hasAccess = canAccessRequiredPlansByTier({
          requiredPlans: video.requiredPlans,
          userTierLevel,
        });

        if (hasAccess) {
          hasSubscriptionAccess = true;
        } else {
          accessDeniedMessage = "This video requires a different subscription plan.";
        }
      }
    }

    const thumbDenied =
      provider === "local" && video.localStorageId
        ? `/api/videos/thumbnail/${video._id}`
        : null;

    if (!hasSubscriptionAccess) {
      const lockFlags = buildVideoLockFlags(false, {
        canAccess: false,
        reason: accessDeniedMessage,
        watchCount: 0,
        remainingWatches: 0,
      });
      return res.status(403).json({
        status: "fail",
        message: accessDeniedMessage,
        data: {
          video: {
            ...video,
            thumbnailUrl: thumbDenied,
            ...lockFlags,
          },
        },
      });
    }

    // Check sequential access if video belongs to a module
    let canAccess = hasSubscriptionAccess;
    let sequentialAccessInfo = null;
    
    if (userId && video.modules && video.modules.length > 0) {
      const moduleId = video.modules[0];
      const moduleIdString = typeof moduleId === 'object' && moduleId?._id ? moduleId._id.toString() : moduleId?.toString() || moduleId;

      const moduleAccess = await assertModuleUnlockedForUser(userId, moduleIdString);
      if (!moduleAccess.ok) {
        const lockFlags = buildVideoLockFlags(false, {
          canAccess: false,
          reason: moduleAccess.message,
          watchCount: 0,
          remainingWatches: 0,
        });
        return res.status(403).json({
          status: "fail",
          message: moduleAccess.message,
          data: {
            video: {
              ...video,
              thumbnailUrl: thumbDenied,
              ...lockFlags,
            },
          },
        });
      }

      sequentialAccessInfo = await checkSequentialVideoAccess(userId, video, moduleIdString);
      canAccess = hasSubscriptionAccess && sequentialAccessInfo.canAccess;
      
      // Sequential access check completed
      
      if (!sequentialAccessInfo.canAccess) {
        accessDeniedMessage = sequentialAccessInfo.reason;
      }
    }

    if (!canAccess) {
      const lockFlags = buildVideoLockFlags(true, sequentialAccessInfo || {
        canAccess: false,
        reason: accessDeniedMessage,
        watchCount: 0,
        remainingWatches: 0,
      });
      return res.status(403).json({
        status: "fail",
        message: accessDeniedMessage,
        data: {
          video: {
            ...video,
            thumbnailUrl: thumbDenied,
            ...lockFlags,
            maxWatchesPerVideo: sequentialAccessInfo?.maxWatchesPerVideo,
            maxWatchesPerCycle: sequentialAccessInfo?.maxWatchesPerVideo,
          },
        },
      });
    }

    const thumbOut =
      provider === "local" && video.localStorageId
        ? `/api/videos/thumbnail/${video._id}`
        : null;

    const successLockFlags = buildVideoLockFlags(true, sequentialAccessInfo || {
      canAccess: true,
      reason: 'Access granted',
      watchCount: 0,
      remainingWatches: 0,
    });

    res.status(200).json({
      status: "success",
      data: {
        video: {
          ...video,
          thumbnailUrl: thumbOut,
          ...successLockFlags,
          maxWatchesPerVideo: sequentialAccessInfo?.maxWatchesPerVideo,
          maxWatchesPerCycle: sequentialAccessInfo?.maxWatchesPerVideo,
        },
      },
    });
  } catch (error) {
    // Error fetching video (stack trace not logged for security)
    res.status(500).json({ status: "error", message: "Failed to fetch video details." });
  }
};

/**
 * @desc    Generate a secure, time-limited token for playing a video.
 * @route   GET /api/videos/:videoId/get-play-token
 * @access  Private
 */
export const getPlayToken = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId)
      .populate("requiredPlans", "_id name")
      .select("+order +modules streamProvider localStorageId videoStatus")
      .lean();

    if (!video) {
      return res.status(404).json({ status: "error", message: "Video not found." });
    }

    const access = await assertUserCanPlayVideo(videoId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ status: "error", message: access.message });
    }

    const provider = getStreamProvider(video);
    if (provider !== "local") {
      return res.status(400).json({
        status: "error",
        message: "Only server-hosted (local) videos are supported.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        playbackProvider: "local",
        playlistPath: `/videos/hls/${videoId}/master.m3u8`,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to generate play token." });
  }
};

/**
 * @desc    Get module-scoped navigation list for a video (cyclic UI support)
 * @route   GET /api/videos/:videoId/navigation
 * @access  Private
 */
export const getVideoNavigationContext = async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ status: "fail", message: "Invalid video ID format." });
    }

    const video = await Video.findOne({ _id: videoId, isPublished: true })
      .select("courses modules")
      .lean();
    if (!video) {
      return res.status(404).json({ status: "fail", message: "Video not found or is not published." });
    }

    const moduleIdRaw = Array.isArray(video.modules) && video.modules.length > 0 ? video.modules[0] : null;
    const moduleId = moduleIdRaw ? moduleIdRaw.toString() : null;
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(200).json({
        status: "success",
        data: { moduleId: null, moduleTitle: null, courseId: null, courseTitle: null, items: [] },
      });
    }

    const Module = (await import("../models/Module.js")).default;
    const moduleDoc = await Module.findById(moduleId).populate("course", "title").select("title course").lean();
    const moduleTitle = moduleDoc?.title || "Module";
    const courseId =
      moduleDoc?.course && typeof moduleDoc.course === "object" && moduleDoc.course._id
        ? moduleDoc.course._id.toString()
        : Array.isArray(video.courses) && video.courses.length > 0
          ? video.courses[0].toString()
          : null;
    const courseTitle =
      moduleDoc?.course && typeof moduleDoc.course === "object" && moduleDoc.course.title
        ? String(moduleDoc.course.title)
        : null;

    const moduleVideos = await Video.find({ modules: moduleId, isPublished: true })
      .sort({ order: 1, createdAt: 1 })
      .select("_id title durationSeconds order streamProvider localStorageId videoStatus")
      .lean();

    const items = moduleVideos.map((v) => ({
      _id: v._id.toString(),
      title: v.title,
      moduleId,
      moduleTitle,
      durationSeconds: v.durationSeconds || 0,
      thumbnailUrl:
        getStreamProvider(v) === "local" && v.videoStatus === "AVAILABLE" && v.localStorageId
          ? `/api/videos/thumbnail/${v._id}`
          : null,
    }));

    return res.status(200).json({
      status: "success",
      data: {
        moduleId,
        moduleTitle,
        courseId,
        courseTitle,
        items,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to build video navigation." });
  }
};

/**
 * @desc    Serves a video thumbnail (local transcodes only)
 * @route   GET /api/videos/thumbnail/:videoId
 */
export const serveVideoThumbnail = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.findById(videoId)
            .select("streamProvider localStorageId videoStatus")
            .lean();

        if (!video) {
            return res.status(404).json({ message: "Thumbnail not found." });
        }

        if (getStreamProvider(video) === "local" && video.localStorageId && video.videoStatus === "AVAILABLE") {
            const thumbPath = getThumbnailPath(video.localStorageId);
            try {
                await fs.promises.access(thumbPath, fs.constants.R_OK);
            } catch {
                return res.status(404).json({ message: "Thumbnail not found." });
            }
            res.setHeader("Content-Type", "image/jpeg");
            return fs.createReadStream(thumbPath).pipe(res);
        }

        return res.status(404).json({ message: "Thumbnail not found." });
    } catch (error) {
        res.status(500).json({ message: "Failed to serve thumbnail." });
    }
};

/**
 * @route   GET /api/videos/player/:videoId
 * @deprecated External iframe playback removed; use local HLS + get-play-token.
 */
export const serveVideoStream = async (req, res) => {
    return res.status(410).json({
        message: "Embedded player URL is no longer used. Play videos via local HLS.",
    });
};

/**
 * @desc    Fetch public videos and their materials for guest users
 * @route   GET /api/public/content
 * @access  Public
 * @query   examCategory (string) - Filters videos by the slug of the exam category.
 */
export const getPublicContentForGuests = asyncHandler(async (req, res) => {
    const { examCategory } = req.query;

    let videoQuery = { isPublished: true };

    if (examCategory) {
        const category = await ExamCategory.findOne({ slug: examCategory }).lean();

        if (!category) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: { videos: [] },
            });
        }

        const courses = await Course.find({ examCategory: category._id }).select('_id').lean();
        const courseIds = courses.map(c => c._id);

        videoQuery.courses = { $in: courseIds };
    }

    const videos = await Video.find(videoQuery)
        .select("title description durationSeconds associatedMaterials streamProvider localStorageId videoStatus")
        .sort({ order: 1, createdAt: -1 })
        .lean();

    const publicVideos = videos.map((video) => {
        const publicMaterials = video.associatedMaterials.map((material) => ({
            _id: material._id,
            label: material.label,
            fileName: material.fileName,
            fileSize: material.fileSize,
            fileType: material.fileType,
        }));

        const thumb = getStreamProvider(video) === "local" && video.videoStatus === "AVAILABLE" && video.localStorageId
          ? `/api/videos/thumbnail/${video._id}`
          : null;

        return {
            _id: video._id,
            title: video.title,
            description: video.description,
            thumbnailUrl: thumb,
            duration: video.durationSeconds,
            materials: publicMaterials,
        };
    });

    res.status(200).json({
        status: 'success',
        results: publicVideos.length,
        data: {
            videos: publicVideos,
        },
    });
});

/**
 * @desc    Mark a video as completed and update watch progress
 * @route   POST /api/videos/:videoId/complete
 * @access  Private
 */
export const markVideoCompleted = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ 
                status: "fail", 
                message: "Invalid video ID format." 
            });
        }

        const video = await Video.findById(videoId)
            .populate("requiredPlans", "_id name")
            .select("modules requiredPlans order")
            .lean();

        if (!video) {
            return res.status(404).json({ 
                status: "fail", 
                message: "Video not found." 
            });
        }

        // Check if video belongs to a module
        if (!video.modules || video.modules.length === 0) {
            return res.status(400).json({ 
                status: "fail", 
                message: "Video does not belong to any module." 
            });
        }

        const moduleId = video.modules[0];

        const moduleAccess = await assertModuleUnlockedForUser(userId, moduleId.toString());
        if (!moduleAccess.ok) {
            return res.status(403).json({
                status: "fail",
                message: moduleAccess.message,
            });
        }

        const sequentialAccess = await checkSequentialVideoAccess(userId, video, moduleId);
        if (!sequentialAccess.canAccess) {
            return res.status(403).json({
                status: "fail",
                message: sequentialAccess.reason,
                data: {
                    watchCount: sequentialAccess.watchCount,
                    remainingWatches: sequentialAccess.remainingWatches,
                },
            });
        }

        // Mark video as completed
        const result = await markVideoAsCompleted(userId, videoId, moduleId);

        res.status(200).json({
            status: "success",
            data: {
                message: "Video marked as completed",
                watchCount: result.watchCount,
                remainingWatches: result.remainingWatches,
                setComplete: result.setComplete,
                moduleComplete: result.moduleComplete,
            },
        });
    } catch (error) {
        // Error marking video completed (stack trace not logged for security)
        res.status(500).json({ 
            status: "error", 
            message: "Failed to mark video as completed." 
        });
    }
});

