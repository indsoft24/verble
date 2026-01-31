// src/controllers/videoAdminController.js
import Video from "../models/Video.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Course from "../models/Course.js";
import { createNotificationsForNewVideo } from '../utils/notificationManager.js';
import Module from "../models/Module.js";
import mongoose from "mongoose";
import axios from "axios";
import crypto from "crypto";

const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;

if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
  console.error(
    "CRITICAL ERROR: Bunny Stream Library ID or API Key is missing in environment variables. Video functionalities will fail."
  );
}

/**
 * @desc    Securely initiates a direct video upload.
 * @route   POST /api/admin/videos/initiate-upload
 * @access  Private/Admin
 */
export const initiateUpload = async (req, res) => {
    const { title, description, courseIds, moduleIds, order, requiredPlans, isPublished, tags } = req.body;

    if (!title) {
        return res.status(400).json({ status: 'fail', message: 'Video title is required.' });
    }
    if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
        console.error("Bunny Stream credentials not configured on server.");
        return res.status(500).json({ status: 'error', message: 'Video service is not configured on the server.' });
    }

    try {
        const bunnyApiResponse = await axios.post(
            `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
            { title },
            { headers: { AccessKey: BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' } }
        );
        
        const videoId = bunnyApiResponse.data.guid;
        if (!videoId) {
            throw new Error('Failed to get Video ID from streaming provider.');
        }

        const newVideoData = {
            title, description,
            courses: courseIds || [],
            modules: moduleIds || [],
            order: order || 0,
            requiredPlans: requiredPlans || [],
            isPublished: isPublished || false,
            tags: tags || [],
            bunnyVideoLibraryId: BUNNY_STREAM_LIBRARY_ID,
            bunnyVideoId: videoId, 
            videoStatus: 'PENDING_UPLOAD',
            uploader: req.user._id,
        };
        const newVideoInDb = await Video.create(newVideoData);

        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
        const signature = crypto
            .createHash('sha256')
            .update(String(BUNNY_STREAM_LIBRARY_ID) + String(BUNNY_STREAM_API_KEY) + String(expirationTime) + String(videoId))
            .digest('hex');

        res.status(201).json({
            status: 'success',
            message: 'Video initialized. Ready for direct upload.',
            data: {
                video: newVideoInDb,
                uploadParameters: {
                    videoId: videoId,
                    libraryId: BUNNY_STREAM_LIBRARY_ID,
                    authorizationSignature: signature,
                    authorizationExpires: expirationTime,
                }
            },
        });

    } catch (error) {
        console.error("Error initiating video upload:", error.response?.data || error);
        res.status(500).json({ status: 'error', message: 'Failed to initiate video upload.' });
    }
};

/**
 * @desc    Admin finalizes video creation after file is uploaded to Bunny Stream by client.
 * Saves video metadata along with Bunny identifiers to the local DB.
 * @route   POST /api/admin/videos/finalize-bunny-upload
 * (Or you could reuse POST /api/admin/videos and change its logic)
 * @access  Private/Admin
 */
export const finalizeBunnyVideoAndSaveMetadata = async (req, res, next) => {
  const backendCallTraceId = `finalize-${Date.now()}`;
  console.log(
    `[VideoAdminCtrl - ${backendCallTraceId}] Received request to finalize video.`
  );

  const {
    title,
    description,
    courseIds,
    moduleIds,
    order,
    requiredPlans: requiredPlanIds,
    isPublished,
    tags,
    bunnyVideoId,
    bunnyVideoLibraryId,
  } = req.body;

  if (!title || !bunnyVideoId || !bunnyVideoLibraryId) {
    return res
      .status(400)
      .json({
        status: "fail",
        message:
          "Missing critical video information (title, bunnyVideoId, or libraryId).",
      });
  }
  let videoVerifiedOnBunny = false;
  try {
    try {
      console.log(
        `[VideoAdminCtrl - ${backendCallTraceId}] Verifying video ${bunnyVideoId} on Bunny Stream.`
      );
      const bunnyVideoDetails = await axios.get(
        `https://video.bunnycdn.com/library/${bunnyVideoLibraryId}/videos/${bunnyVideoId}`,
        { headers: { AccessKey: process.env.BUNNY_STREAM_API_KEY } } // Use API key from .env
      );
      if (
        bunnyVideoDetails.data &&
        bunnyVideoDetails.data.guid === bunnyVideoId
      ) {
        console.log(
          `[VideoAdminCtrl - ${backendCallTraceId}] Video ${bunnyVideoId} successfully verified on Bunny Stream. Title: ${bunnyVideoDetails.data.title}`
        );
        videoVerifiedOnBunny = true;
      } else {
        console.warn(
          `[VideoAdminCtrl - ${backendCallTraceId}] Verification with Bunny Stream returned unexpected data or ID mismatch for ${bunnyVideoId}.`
        );
      }
    } catch (verifyError) {
      console.error(
        `[VideoAdminCtrl - ${backendCallTraceId}] Error verifying video with Bunny Stream:`,
        verifyError.response?.data || verifyError.message
      );
    }

    const coursesToSave = Array.isArray(courseIds)
      ? courseIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];
    const modulesToSave = Array.isArray(moduleIds)
      ? moduleIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];
    const plansToSave = Array.isArray(requiredPlanIds)
      ? requiredPlanIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];

    const newVideoData = {
      title,
      description,
      durationSeconds: 0, 
      bunnyVideoLibraryId: BUNNY_STREAM_LIBRARY_ID,
      bunnyVideoId: bunnyVideoId,
      videoStatus: "UPLOADED", 
      bunnyProcessingProgress: 0,
      courses: coursesToSave,
      modules: modulesToSave,
      order: Number(order) || 0,
      requiredPlans: plansToSave,
      isPublished: isPublished || false,
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter((tag) => tag)
        : [],
      uploader: req.user._id,
    };
    Object.keys(newVideoData).forEach(
      (key) => newVideoData[key] === undefined && delete newVideoData[key]
    );

    const newVideoInDb = await Video.create(newVideoData);
    console.log(
      `[VideoAdminCtrl - ${backendCallTraceId}] DB save successful. Video ID: ${newVideoInDb._id}, BunnyVideoId: ${newVideoInDb.bunnyVideoId}`
    );

    const populatedVideo = await Video.findById(newVideoInDb._id)
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive");

    res.status(201).json({
      status: "success",
      message: "Video metadata successfully saved after file upload.",
      data: {
        video: populatedVideo,
      },
    });
  } catch (dbError) {
    console.error(
      `[VideoAdminCtrl - ${backendCallTraceId}] DB Save ERROR after Bunny upload:`,
      dbError.stack
    );
    if (
      dbError.code === 11000 &&
      dbError.keyPattern &&
      dbError.keyPattern.bunnyVideoId
    ) {
      return res
        .status(409)
        .json({
          status: "fail",
          message:
            "This Bunny Video ID has already been registered in our system.",
        });
    }
    if (dbError.name === "ValidationError") {
      const messages = Object.values(dbError.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ status: "fail", message: messages.join(". ") });
    }
    res
      .status(500)
      .json({
        status: "error",
        message: "Failed to save video metadata after successful file upload.",
      });
  }
};

/**
 * @desc    Admin (or system post-upload) updates the status of a video and potentially other details.
 * @route   PATCH /api/admin/videos/:videoId/status
 * @access  Private/Admin (or could be a trusted system call if secured differently post-upload)
 */
export const updateVideoStatusAdmin = async (req, res, next) => {
  const { videoId } = req.params;
  const {
    videoStatus,
    processingError,
    durationSeconds,
    bunnyStreamUrl,
    bunnyThumbnailUrl,
    width,
    height,
    bunnyProcessingProgress,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res
      .status(400)
      .json({ status: "fail", message: "Invalid Video ID format." });
  }
  const allowedStatuses = [
    "METADATA_CREATED",
    "PENDING_UPLOAD",
    "UPLOADING",
    "UPLOADED",
    "PROCESSING",
    "AVAILABLE",
    "FAILED",
  ];
  if (videoStatus && !allowedStatuses.includes(videoStatus)) {
    return res
      .status(400)
      .json({
        status: "fail",
        message: `Invalid video status: ${videoStatus}`,
      });
  }
  try {
    const fieldsToUpdate = {};
    if (videoStatus) fieldsToUpdate.videoStatus = videoStatus;
    if (durationSeconds !== undefined)
      fieldsToUpdate.durationSeconds = Number(durationSeconds);
    if (bunnyStreamUrl !== undefined)
      fieldsToUpdate.bunnyStreamUrl = bunnyStreamUrl;
    if (bunnyThumbnailUrl !== undefined)
      fieldsToUpdate.bunnyThumbnailUrl = bunnyThumbnailUrl;
    if (width !== undefined) fieldsToUpdate.width = Number(width);
    if (height !== undefined) fieldsToUpdate.height = Number(height);
    if (bunnyProcessingProgress !== undefined)
      fieldsToUpdate.bunnyProcessingProgress = Number(bunnyProcessingProgress);
    if (videoStatus === "FAILED" && processingError !== undefined)
      fieldsToUpdate.processingError = processingError;
    else if (videoStatus && videoStatus !== "FAILED")
      fieldsToUpdate.processingError = undefined;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res
        .status(400)
        .json({
          status: "fail",
          message: "No status or details provided for update.",
        });
    }

    console.log(
      `[videoAdminCtrl - updateStatus] Updating video ${videoId} with:`,
      fieldsToUpdate
    );
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    )
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive");
    if (!updatedVideo)
      return res
        .status(404)
        .json({
          status: "fail",
          message: "Video not found after update attempt.",
        });
    res
      .status(200)
      .json({
        status: "success",
        message: `Video details/status updated.`,
        data: { video: updatedVideo },
      });
  } catch (error) {
    console.error(
      `ADMIN UPDATE VIDEO STATUS/DETAILS ERROR for ${videoId}:`,
      error.stack
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ status: "fail", message: messages.join(". ") });
    }
    res.status(500).json({
      status: "error",
      message: "Failed to update video status/details.",
    });
  }
};

/**
 * Creates a video placeholder on Bunny Stream and saves metadata to local DB.
 * Responds with info needed for client-side TUS upload.
 */
export const createVideo = async (req, res, next) => {
  const backendCallTraceId = `createVideo-${Date.now()}`;
  console.log(
    `[VideoAdminCtrl - ${backendCallTraceId}] ENTERED. Title: ${req.body.title}`
  );

  const {
    title,
    description,
    courseIds,
    moduleIds,
    order,
    requiredPlans: requiredPlanIds,
    isPublished,
    tags,
  } = req.body;

  if (!title) {
    return res
      .status(400)
      .json({ status: "fail", message: "Video title is required." });
  }
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    return res
      .status(500)
      .json({
        status: "error",
        message: "Video service (Bunny Stream) configuration error on server.",
      });
  }

  let bunnyVideoResponseData;
  try {
    console.log(
      `[VideoAdminCtrl - ${backendCallTraceId}] Calling Bunny API to create video placeholder. Title: "${title}"`
    );
    const bunnyApiResponse = await axios.post(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
      { title: title }, 
      {
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    bunnyVideoResponseData = bunnyApiResponse.data;
    if (!bunnyVideoResponseData || !bunnyVideoResponseData.guid) {
      console.error(
        `[VideoAdminCtrl - ${backendCallTraceId}] Failed to create video object in Bunny Stream. Response:`,
        bunnyVideoResponseData
      );
      throw new Error("Failed to create video object with streaming provider.");
    }
    console.log(
      `[VideoAdminCtrl - ${backendCallTraceId}] Bunny Stream video object created successfully. BunnyVideoId (GUID): ${bunnyVideoResponseData.guid}`
    );
  } catch (bunnyError) {
    console.error(
      `[VideoAdminCtrl - ${backendCallTraceId}] Error communicating with Bunny Stream API:`,
      bunnyError.response?.data || bunnyError.message,
      bunnyError.stack?.substring(0, 500)
    );
    return res.status(500).json({
      status: "error",
      message:
        "Video service provider error during video placeholder creation.",
      details: bunnyError.response?.data || bunnyError.message,
    });
  }

  try {
    const coursesToSave = Array.isArray(courseIds)
      ? courseIds
          .filter(mongoose.Types.ObjectId.isValid)
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];
    const modulesToSave = Array.isArray(moduleIds)
      ? moduleIds
          .filter(mongoose.Types.ObjectId.isValid)
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];
    const plansToSave = Array.isArray(requiredPlanIds)
      ? requiredPlanIds
          .filter(mongoose.Types.ObjectId.isValid)
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];

    const newVideoData = {
      title,
      description,
      durationSeconds: 0,
      bunnyVideoLibraryId: BUNNY_STREAM_LIBRARY_ID,
      bunnyVideoId: bunnyVideoResponseData.guid,
      videoStatus: "PENDING_UPLOAD",
      bunnyProcessingProgress: 0,
      courses: coursesToSave,
      modules: modulesToSave,
      order: Number(order) || 0,
      requiredPlans: plansToSave,
      isPublished: isPublished || false,
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter((tag) => tag)
        : [],
      uploader: req.user._id,
    };
    Object.keys(newVideoData).forEach(
      (key) => newVideoData[key] === undefined && delete newVideoData[key]
    );

    const newVideoInDb = await Video.create(newVideoData);
    console.log(
      `[VideoAdminCtrl - ${backendCallTraceId}] DB save successful. Video ID: ${newVideoInDb._id}, BunnyVideoId: ${newVideoInDb.bunnyVideoId}`
    );

    // Invalidate cache
    const { invalidateVideoCache, invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
    await invalidateVideoCache();
    if (modulesToSave.length > 0) {
        for (const moduleId of modulesToSave) {
            await invalidateModuleCache(moduleId.toString());
        }
    }

    const populatedVideo = await Video.findById(newVideoInDb._id)
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive");

    res.status(201).json({
      status: "success",
      message:
        "Video metadata created. Ready for file upload to streaming provider.",
      data: {
        video: populatedVideo,
        uploadInfo: {
          bunnyVideoId: bunnyVideoResponseData.guid,
          libraryId: BUNNY_STREAM_LIBRARY_ID,
          apiKey: BUNNY_STREAM_API_KEY,
        },
      },
    });
  } catch (dbError) {
    console.error(
      `[VideoAdminCtrl - ${backendCallTraceId}] DB Save ERROR:`,
      dbError.stack
    );
    if (bunnyVideoResponseData?.guid) {
      console.warn(
        `[VideoAdminCtrl - ${backendCallTraceId}] DB save failed for title "${title}". Bunny Video ID: ${bunnyVideoResponseData.guid}. Consider manual Bunny.net cleanup.`
      );

    }
    if (dbError.name === "ValidationError") {
      const messages = Object.values(dbError.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ status: "fail", message: messages.join(". ") });
    }
    res
      .status(500)
      .json({
        status: "error",
        message: "Failed to save video metadata after provider interaction.",
      });
  }
};

// @desc    Get all video metadata entries (Admin) with advanced filtering
// @route   GET /api/admin/videos
// @access  Private/Admin
// @query   page, limit, courseIds, moduleIds, planIds, isPublished, videoStatus, search, sortBy, sortOrder
export const getAllVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query conditions
    const queryConditions = {};

    // Filter by courses (array of course IDs)
    if (req.query.courseIds) {
      const courseIds = Array.isArray(req.query.courseIds) 
        ? req.query.courseIds 
        : req.query.courseIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id.trim()));
      if (courseIds.length > 0) {
        queryConditions.courses = { $in: courseIds.map(id => new mongoose.Types.ObjectId(id.trim())) };
      }
    }

    // Filter by modules (array of module IDs)
    if (req.query.moduleIds) {
      const moduleIds = Array.isArray(req.query.moduleIds) 
        ? req.query.moduleIds 
        : req.query.moduleIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id.trim()));
      if (moduleIds.length > 0) {
        queryConditions.modules = { $in: moduleIds.map(id => new mongoose.Types.ObjectId(id.trim())) };
      }
    }

    // Filter by subscription plans (array of plan IDs)
    if (req.query.planIds) {
      const planIds = Array.isArray(req.query.planIds) 
        ? req.query.planIds 
        : req.query.planIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id.trim()));
      if (planIds.length > 0) {
        queryConditions.requiredPlans = { $in: planIds.map(id => new mongoose.Types.ObjectId(id.trim())) };
      }
    }

    // Filter by published status
    if (req.query.isPublished !== undefined) {
      queryConditions.isPublished = req.query.isPublished === 'true' || req.query.isPublished === true;
    }

    // Filter by video status
    if (req.query.videoStatus) {
      const validStatuses = [
        'METADATA_CREATED', 'PENDING_UPLOAD', 'UPLOADING', 
        'UPLOADED', 'PROCESSING', 'AVAILABLE', 'FAILED'
      ];
      if (validStatuses.includes(req.query.videoStatus)) {
        queryConditions.videoStatus = req.query.videoStatus;
      }
    }

    // Search filter (title, description, tags)
    if (req.query.search) {
      const searchTerm = String(req.query.search).trim();
      if (searchTerm) {
        const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
        queryConditions.$or = [
          { title: regex },
          { description: regex },
          { tags: { $in: [regex] } }
        ];
      }
    }

    // Sorting
    const sortBy = req.query.sortBy || 'order';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    let sortOptions = {};
    
    switch (sortBy) {
      case 'title':
        sortOptions = { title: sortOrder };
        break;
      case 'createdAt':
        sortOptions = { createdAt: sortOrder };
        break;
      case 'order':
        sortOptions = { order: sortOrder, createdAt: -1 };
        break;
      default:
        sortOptions = { order: 1, createdAt: -1 };
    }

    // Execute query with pagination
    const videos = await Video.find(queryConditions)
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalVideos = await Video.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalVideos / limit);

    res
      .status(200)
      .json({ 
        status: "success", 
        results: videos.length, 
        total: totalVideos,
        page: page,
        totalPages: totalPages,
        data: { videos } 
      });
  } catch (error) {
    console.error("ADMIN GET ALL VIDEOS ERROR:", error.stack);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch videos." });
  }
};

// @desc    Get single video metadata entry by ID (Admin)
// @route   GET /api/admin/videos/:id
// @access  Private/Admin
export const getVideoById = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid video ID." });
    }
    const video = await Video.findById(videoId)
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive");
    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found." });
    }
    res.status(200).json({ status: "success", data: { video } });
  } catch (error) {
    console.error(
      `ADMIN GET VIDEO BY ID (${req.params.id}) ERROR:`,
      error.stack
    );
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch video." });
  }
};

// @desc    Update video metadata entry by ID (Admin)
// @route   PATCH /api/admin/videos/:id
// @access  Private/Admin
export const updateVideo = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const { courseIds, moduleIds, ...updateData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ status: "fail", message: "Invalid video ID format." });
    }

    const videoToUpdate = await Video.findById(videoId);
    if (!videoToUpdate) {
      return res.status(404).json({ status: "fail", message: "Video not found." });
    }
    const wasPublished = videoToUpdate.isPublished;

    if (courseIds) {
        updateData.courses = courseIds;
    }
    if (moduleIds) {
        updateData.modules = moduleIds;
    }

    if (updateData.title && updateData.title !== videoToUpdate.title) {
        try {
            await axios.post(
                `https://video.bunnycdn.com/library/${videoToUpdate.bunnyVideoLibraryId}/videos/${videoToUpdate.bunnyVideoId}`,
                { title: updateData.title },
                { headers: { 'AccessKey': BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' } }
            );
        } catch (bunnyUpdateError) {
            console.error("Failed to update title on Bunny Stream:", bunnyUpdateError.response?.data || bunnyUpdateError.message);
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("courses requiredPlans"); 

    if (!updatedVideo) {
      return res.status(404).json({ status: "fail", message: "Video not found after update." });
    }

    if (!wasPublished && updatedVideo.isPublished) {
        console.log(`Video ${updatedVideo._id} was just published. Triggering notifications.`);
        await createNotificationsForNewVideo(updatedVideo);
    }

    // Invalidate cache
    const { invalidateVideoCache, invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
    await invalidateVideoCache(videoId);
    if (updatedVideo.modules && updatedVideo.modules.length > 0) {
        for (const moduleId of updatedVideo.modules) {
            await invalidateModuleCache(moduleId.toString());
        }
    }

    res.status(200).json({
      status: "success",
      message: "Video metadata updated successfully.",
      data: { video: updatedVideo },
    });

  } catch (error) {
    console.error("ADMIN UPDATE VIDEO ERROR:", error.stack);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ status: "fail", message: messages.join(". ") });
    }
    res.status(500).json({ status: "error", message: "Failed to update video metadata." });
  }
};

// @desc    Delete video metadata entry by ID (Admin)
// @route   DELETE /api/admin/videos/:id
// @access  Private/Admin
export const deleteVideo = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid video ID format." });
    }
    const video = await Video.findById(videoId);
    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found." });
    }

    if (
      video.bunnyVideoId &&
      video.bunnyVideoLibraryId &&
      BUNNY_STREAM_API_KEY
    ) {
      try {
        console.log(
          `Deleting video ${video.bunnyVideoId} from Bunny Stream library ${video.bunnyVideoLibraryId}`
        );
        await axios.delete(
          `https://video.bunnycdn.com/library/${video.bunnyVideoLibraryId}/videos/${video.bunnyVideoId}`,
          { headers: { AccessKey: BUNNY_STREAM_API_KEY } }
        );
        console.log(
          `Video ${video.bunnyVideoId} successfully deleted from Bunny Stream.`
        );
      } catch (bunnyError) {
        console.error(
          "Failed to delete video from Bunny Stream:",
          bunnyError.response?.data || bunnyError.message
        );
      }
    } else {
      console.warn(
        `Video ${videoId} missing Bunny Stream info; cannot delete from provider. Local DB delete will proceed.`
      );
    }

    // Store module IDs before deletion for cache invalidation
    const moduleIds = video.modules || [];
    
    await Video.findByIdAndDelete(videoId);
    console.log(`Video metadata for ID: ${videoId} deleted from local DB.`);

    // Invalidate cache
    const { invalidateVideoCache, invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
    await invalidateVideoCache(videoId);
    for (const moduleId of moduleIds) {
        await invalidateModuleCache(moduleId.toString());
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    console.error("ADMIN DELETE VIDEO ERROR:", error.stack);
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete video metadata." });
  }
};

/**
 * @desc    Bulk update videos - link multiple videos to courses, modules, and/or subscription plans
 * @route   POST /api/admin/videos/bulk-link
 * @access  Private/Admin
 */
export const bulkLinkVideos = async (req, res, next) => {
  try {
    const { videoIds, courseIds, moduleIds, planIds } = req.body;

    // Validate videoIds
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'An array of videoIds is required.',
      });
    }

    // Validate that at least one linking target is provided
    if (
      (!courseIds || courseIds.length === 0) &&
      (!moduleIds || moduleIds.length === 0) &&
      (!planIds || planIds.length === 0)
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one of courseIds, moduleIds, or planIds must be provided.',
      });
    }

    // Validate all IDs
    const validVideoIds = videoIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validVideoIds.length !== videoIds.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'One or more provided video IDs are invalid.',
      });
    }

    const validCourseIds = courseIds
      ? courseIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      : [];
    if (courseIds && validCourseIds.length !== courseIds.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'One or more provided course IDs are invalid.',
      });
    }

    const validModuleIds = moduleIds
      ? moduleIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      : [];
    if (moduleIds && validModuleIds.length !== moduleIds.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'One or more provided module IDs are invalid.',
      });
    }

    const validPlanIds = planIds
      ? planIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      : [];
    if (planIds && validPlanIds.length !== planIds.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'One or more provided subscription plan IDs are invalid.',
      });
    }

    // Verify that courses, modules, and plans exist
    if (validCourseIds.length > 0) {
      const coursesExist = await Course.countDocuments({ _id: { $in: validCourseIds } });
      if (coursesExist !== validCourseIds.length) {
        return res.status(404).json({
          status: 'fail',
          message: 'One or more courses not found.',
        });
      }
    }

    if (validModuleIds.length > 0) {
      const modulesExist = await Module.countDocuments({ _id: { $in: validModuleIds } });
      if (modulesExist !== validModuleIds.length) {
        return res.status(404).json({
          status: 'fail',
          message: 'One or more modules not found.',
        });
      }
    }

    if (validPlanIds.length > 0) {
      const plansExist = await SubscriptionPlan.countDocuments({ _id: { $in: validPlanIds } });
      if (plansExist !== validPlanIds.length) {
        return res.status(404).json({
          status: 'fail',
          message: 'One or more subscription plans not found.',
        });
      }
    }

    // Build update object
    const updateFields = {};
    if (validCourseIds.length > 0) {
      updateFields.$addToSet = updateFields.$addToSet || {};
      updateFields.$addToSet.courses = { $each: validCourseIds };
    }
    if (validModuleIds.length > 0) {
      updateFields.$addToSet = updateFields.$addToSet || {};
      updateFields.$addToSet.modules = { $each: validModuleIds };
    }
    if (validPlanIds.length > 0) {
      updateFields.$addToSet = updateFields.$addToSet || {};
      updateFields.$addToSet.requiredPlans = { $each: validPlanIds };
    }

    // Update all videos
    const updateResult = await Video.updateMany(
      { _id: { $in: validVideoIds } },
      updateFields
    );

    const linkedCount = updateResult.modifiedCount;
    const notFoundCount = validVideoIds.length - updateResult.matchedCount;

    res.status(200).json({
      status: 'success',
      message: `Successfully linked ${linkedCount} video(s). ${notFoundCount > 0 ? `${notFoundCount} video(s) not found.` : ''}`,
      data: {
        linkedCount,
        notFoundCount,
        totalVideos: validVideoIds.length,
      },
    });
  } catch (error) {
    console.error('BULK LINK VIDEOS ERROR:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to bulk link videos.',
    });
  }
};

// @desc    Video Admin Controller
const videoAdminController = {
  createVideo: async (req, res) => {
    /*  */
  },
  getAllVideos: async (req, res) => {
    /*  */
  },
  getVideoById: async (req, res) => {
    /*  */
  },
  updateVideo: async (req, res) => {
    /*  */
  },
  deleteVideo: async (req, res) => {
    /*  */
  },
};

export default videoAdminController;

/**
 * @desc    Get all videos associated with a specific module (Admin)
 * @route   GET /api/admin/modules/:moduleId/videos
 * @access  Private/Admin
 */
export const getVideosForModuleAdmin = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid Module ID format." });
    }

    const module = await Module.findById(moduleId).populate("course", "title"); 
    if (!module) {
      return res
        .status(404)
        .json({ status: "fail", message: "Module not found." });
    }

    const videos = await Video.find({ modules: moduleId }) 
      .populate("courses", "title")
      .populate("requiredPlans", "name")
      .sort({ order: 1, createdAt: -1 }); 

    res.status(200).json({
      status: "success",
      results: videos.length,
      data: {
        module: module,
        videos: videos,
      },
    });
  } catch (error) {
    console.error("ADMIN GET VIDEOS FOR MODULE ERROR:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch videos for the module.",
    });
  }
};

/**
 * @desc    Admin removes a video from a specific module's association
 * (by removing the moduleId from the video's 'modules' array)
 * @route   PATCH /api/admin/videos/:videoId/modules/remove
 * @access  Private/Admin
 */
export const removeVideoFromModuleAdmin = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { moduleId } = req.body; 
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid Video ID format." });
    }
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        status: "fail",
        message: "Valid Module ID is required in the request body.",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found." });
    }

    const initialModuleCount = video.modules.length;
    const moduleObjectId = new mongoose.Types.ObjectId(moduleId);

    const updateResult = await Video.updateOne(
      { _id: videoId },
      { $pull: { modules: moduleObjectId } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        status: "fail",
        message:
          "Module not found in this video's associations or no change made.",
      });
    }

    const updatedVideo = await Video.findById(videoId)
      .populate("courses", "title _id")
      .populate("modules", "title _id course")
      .populate("requiredPlans", "_id name isActive");

    res.status(200).json({
      status: "success",
      message: "Video successfully unlinked from the module.",
      data: { video: updatedVideo },
    });
  } catch (error) {
    console.error("ADMIN REMOVE VIDEO FROM MODULE ERROR:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Failed to remove video from module.",
    });
  }
};
