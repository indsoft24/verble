import crypto from "crypto";
import axios from "axios";
import Video from "../models/Video.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Course from '../models/Course.js';
import ExamCategory from '../models/ExamCategory.js';
import asyncHandler from 'express-async-handler';
import { checkSequentialVideoAccess, markVideoAsCompleted } from '../utils/videoAccessHelper.js';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '../utils/cacheHelper.js';

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
        .select("_id title description bunnyThumbnailUrl durationSeconds tags requiredPlans videoStatus")
        .populate("requiredPlans", "_id name")
        .lean(),
      Video.countDocuments(queryConditions)
    ]);

    let userActivePlanIds = new Set();

    if (userId) {
      // Optimized user query - only fetch subscriptions
      const user = await User.findById(userId).select("subscriptions").lean();
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
      .select("+order +modules") // Include order and modules fields for sequential access check
      .lean();

    if (!video) {
      return res.status(404).json({ status: "fail", message: "Video not found or is not published." });
    }

    // Check subscription access first
    let hasSubscriptionAccess = false;
    let accessDeniedMessage = "Access Denied.";

    const normalizedVideoStatus = (video.videoStatus || "").toUpperCase();
    const isVideoAvailable = normalizedVideoStatus === "AVAILABLE";
    const hasStreamUrl = video.bunnyStreamUrl && video.bunnyStreamUrl.trim().length > 0;
    const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;

    // Debug logging (remove in production if needed)
    // Video access check initiated

    // Check if video is available and has stream URL
    if (!isVideoAvailable) {
      accessDeniedMessage = `This video is currently processing and not yet available. (Status: ${video.videoStatus})`;
      hasSubscriptionAccess = false;
    } else if (!hasStreamUrl) {
      accessDeniedMessage = "This video is currently processing and not yet available. (Stream URL missing)";
      hasSubscriptionAccess = false;
    } else if (isFreeVideo) {
      hasSubscriptionAccess = true; // Free video - always accessible
    } else {
      const user = await User.findById(userId).select("subscriptions").lean();
      if (user) {
        const now = new Date();
        const userActivePlanIds = new Set(
          user.subscriptions
            .filter((sub) => sub.status === "active" && new Date(sub.endDate) >= now)
            .map((sub) => sub.planId.toString())
        );
        if (video.requiredPlans.some((reqPlan) => userActivePlanIds.has(reqPlan._id.toString()))) {
          hasSubscriptionAccess = true;
        } else {
          accessDeniedMessage = "This video requires a different subscription plan.";
        }
      } else {
        accessDeniedMessage = "This video requires a subscription plan.";
      }
    }

    if (!hasSubscriptionAccess) {
      const { bunnyStreamUrl, ...partialVideoInfo } = video;
      return res.status(403).json({
        status: "fail",
        message: accessDeniedMessage,
        data: { video: { ...partialVideoInfo, bunnyStreamUrl: null, canAccess: false } },
      });
    }

    // Check sequential access if video belongs to a module
    // Skip security feature for free videos (no requiredPlans)
    let canAccess = hasSubscriptionAccess;
    let sequentialAccessInfo = null;
    
    if (userId && video.modules && video.modules.length > 0 && !isFreeVideo) {
      // Only apply security feature to paid videos
      // Get the first module (videos typically belong to one module)
      const moduleId = video.modules[0];
      // Ensure moduleId is a string (handle ObjectId)
      const moduleIdString = typeof moduleId === 'object' && moduleId?._id ? moduleId._id.toString() : moduleId?.toString() || moduleId;
      
      // Checking sequential access
      
      sequentialAccessInfo = await checkSequentialVideoAccess(userId, video, moduleIdString);
      canAccess = hasSubscriptionAccess && sequentialAccessInfo.canAccess;
      
      // Sequential access check completed
      
      if (!sequentialAccessInfo.canAccess) {
        accessDeniedMessage = sequentialAccessInfo.reason;
      }
    }

    if (!canAccess) {
      const { bunnyStreamUrl, ...partialVideoInfo } = video;
      return res.status(403).json({
        status: "fail",
        message: accessDeniedMessage,
        data: { 
          video: { 
            ...partialVideoInfo, 
            bunnyStreamUrl: null, 
            canAccess: false,
            watchCount: sequentialAccessInfo?.watchCount || 0,
            remainingWatches: sequentialAccessInfo?.remainingWatches || 0,
          } 
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: { 
        video: { 
          ...video, 
          canAccess: true,
          watchCount: sequentialAccessInfo?.watchCount || 0,
          remainingWatches: sequentialAccessInfo?.remainingWatches || 0,
        } 
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
      .select("+order +modules") // Include order and modules fields for sequential access check
      .lean();

    if (!video || !video.bunnyVideoId) {
      return res.status(404).json({ status: "error", message: "Video not found." });
    }

    const normalizedVideoStatus = (video.videoStatus || "").toUpperCase();
    const isVideoAvailable = normalizedVideoStatus === "AVAILABLE";
    const hasStreamUrl = video.bunnyStreamUrl && video.bunnyStreamUrl.trim().length > 0;
    const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;

    // Check subscription access
    if (!isVideoAvailable || !hasStreamUrl) {
      return res.status(403).json({ 
        status: "error", 
        message: "This video is currently processing and not yet available." 
      });
    }

    // Free videos don't need subscription check
    if (!isFreeVideo && video.requiredPlans && video.requiredPlans.length > 0) {
      const user = await User.findById(userId).select("subscriptions").lean();
      if (!user) {
        return res.status(403).json({ 
          status: "error", 
          message: "This video requires a subscription plan." 
        });
      }

      const now = new Date();
      const userActivePlanIds = new Set(
        user.subscriptions
          .filter((sub) => sub.status === "active" && new Date(sub.endDate) >= now)
          .map((sub) => sub.planId.toString())
      );

      const hasAccess = video.requiredPlans.some((reqPlan) => 
        userActivePlanIds.has(reqPlan._id.toString())
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          status: "error", 
          message: "This video requires a different subscription plan." 
        });
      }
    }

    // Check sequential access if video belongs to a module
    // Skip security feature for free videos (no requiredPlans)
    if (userId && video.modules && video.modules.length > 0 && !isFreeVideo) {
      // Only apply security feature to paid videos
      const moduleId = video.modules[0];
      // Ensure moduleId is a string (handle ObjectId)
      const moduleIdString = typeof moduleId === 'object' && moduleId?._id ? moduleId._id.toString() : moduleId?.toString() || moduleId;
      
      // Checking sequential access (details not logged)
      
      const sequentialAccess = await checkSequentialVideoAccess(userId, video, moduleIdString);
      
      // Sequential access check completed
      
      if (!sequentialAccess.canAccess) {
        return res.status(403).json({ 
          status: "error", 
          message: sequentialAccess.reason 
        });
      }
    }

    const tokenAuthKey = process.env.BUNNY_TOKEN_AUTH_KEY;
    if (!tokenAuthKey) {
      console.error("BUNNY_TOKEN_AUTH_KEY not set in .env");
      return res.status(500).json({ 
        status: "error", 
        message: "Player security is not configured." 
      });
    }

    // Reduced token expiration to 20 minutes (1200 seconds) for better security
    // Tokens expire quickly to prevent unauthorized access and downloads
    const tokenExpirationSeconds = parseInt(process.env.VIDEO_TOKEN_EXPIRATION_SECONDS || '1200', 10); // Default 20 minutes
    const expires = Math.floor(Date.now() / 1000) + tokenExpirationSeconds;
    
    // Bunny Stream token format: SHA256(tokenAuthKey + videoId + expires)
    // Note: Do NOT include userId in the hash - Bunny Stream only validates tokenAuthKey + videoId + expires
    const userIdString = userId ? userId.toString() : 'anonymous';
    const stringToHash = tokenAuthKey + video.bunnyVideoId + expires;
    const token = crypto.createHash("sha256").update(stringToHash).digest("hex");

    // Token generated (details not logged for security)

    res.status(200).json({
      status: "success",
      data: { token, expires },
    });
  } catch (error) {
    // Error generating play token (details not logged for security)
    res.status(500).json({ status: "error", message: "Failed to generate play token." });
  }
};

/**
 * @desc    Securely serves a video thumbnail image from Bunny.net
 * @route   GET /api/videos/thumbnail/:videoId
 */
export const serveVideoThumbnail = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.findById(videoId).select('bunnyThumbnailUrl').lean();

        if (!video || !video.bunnyThumbnailUrl) {
            return res.status(404).json({ message: 'Thumbnail not found.' });
        }
        
        const response = await axios({
            method: 'get',
            url: video.bunnyThumbnailUrl,
            responseType: 'stream',
        });

        res.setHeader('Content-Type', 'image/jpeg');
        response.data.pipe(res);

    } catch (error) {
        // Error serving thumbnail (details not logged for security)
        res.status(500).json({ message: 'Failed to serve thumbnail.' });
    }
};

/**
 * @desc    Securely serves the video player iframe content
 * @route   GET /api/videos/player/:videoId
 */
export const serveVideoStream = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { token, expires } = req.query; 

        const video = await Video.findById(videoId).select('bunnyVideoLibraryId bunnyVideoId').lean();

        if (!video || !video.bunnyVideoLibraryId || !video.bunnyVideoId) {
            return res.status(404).json({ message: 'Video player configuration not found.' });
        }

        const secureUrl = `https://iframe.mediadelivery.net/embed/${video.bunnyVideoLibraryId}/${video.bunnyVideoId}?token=${token}&expires=${expires}`;
        
        const response = await axios.get(secureUrl);
        
        res.send(response.data);

    } catch (error) {
        // Error serving video stream (details not logged for security)
        res.status(500).json({ message: 'Failed to serve video stream.' });
    }
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
        .select('title description bunnyThumbnailUrl durationSeconds associatedMaterials')
        .sort({ order: 1, createdAt: -1 })
        .lean();

    const publicVideos = videos.map(video => {
        const publicMaterials = video.associatedMaterials.map(material => ({
            _id: material._id,
            label: material.label,
            fileName: material.fileName,
            fileSize: material.fileSize,
            fileType: material.fileType,
        }));

        return {
            _id: video._id,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.bunnyThumbnailUrl,
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

        // Skip security feature for free videos (no requiredPlans)
        const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;
        
        if (!isFreeVideo) {
            // Only apply security feature to paid videos
            // Get the first module (videos typically belong to one module)
            const moduleId = video.modules[0];

            // Check access before marking as complete
            // Note: We allow marking as complete even if already watched, as long as total < 2
            const sequentialAccess = await checkSequentialVideoAccess(userId, video, moduleId);
            if (!sequentialAccess.canAccess) {
                // If access denied due to watch limit, return specific error
                if (sequentialAccess.reason && sequentialAccess.reason.includes('Maximum watch limit')) {
                    return res.status(403).json({ 
                        status: "fail", 
                        message: sequentialAccess.reason,
                        data: {
                            watchCount: sequentialAccess.watchCount,
                            remainingWatches: sequentialAccess.remainingWatches
                        }
                    });
                }
                // For other access issues (like sequential locking), still allow completion
                // This ensures watch count can increment even if video is locked for sequential access
                // Access check failed but allowing completion
            }
        }

        // Mark video as completed
        // For free videos, we still track completion but don't enforce limits
        const moduleId = video.modules[0];
        const result = await markVideoAsCompleted(userId, videoId, moduleId);

        res.status(200).json({
            status: "success",
            data: {
                message: "Video marked as completed",
                watchCount: result.watchCount,
                remainingWatches: result.remainingWatches,
                setComplete: result.setComplete,
                moduleComplete: result.moduleComplete,
                nextCycleStarted: result.nextCycleStarted,
                newCompletionCycle: result.newCompletionCycle,
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

