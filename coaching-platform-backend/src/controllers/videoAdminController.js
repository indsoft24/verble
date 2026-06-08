// src/controllers/videoAdminController.js
import Video from "../models/Video.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Course from "../models/Course.js";
import { createNotificationsForNewVideo } from '../utils/notificationManager.js';
import Module from "../models/Module.js";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { ensureVideoStorageDirs, getIncomingDir } from "../config/videoStorageConfig.js";
import { queueVideoTranscodeJob } from "../services/videoTranscodeService.js";
import { deleteVideoStorageAssets, cleanupOrphanVideoStorage } from "../utils/videoStorageCleanup.js";
import { getStreamProvider } from "../utils/videoStreamProvider.js";

const normalizeConfiguredId = (value) => (typeof value === "string" && value.trim() ? value.trim() : "");
const STRICT_VIDEO_DEFAULTS = String(process.env.VIDEO_DEFAULTS_STRICT || "true").toLowerCase() !== "false";
const DEFAULT_VIDEO_COURSE_ID = normalizeConfiguredId(process.env.DEFAULT_VIDEO_COURSE_ID);
const DEFAULT_VIDEO_REQUIRED_PLAN_ID = normalizeConfiguredId(process.env.DEFAULT_VIDEO_REQUIRED_PLAN_ID);

const enforceDefaultVideoIds = (courseIds = [], requiredPlanIds = []) => {
    if (!STRICT_VIDEO_DEFAULTS) {
        return { courseIds, requiredPlanIds };
    }
    return {
        courseIds: DEFAULT_VIDEO_COURSE_ID ? [DEFAULT_VIDEO_COURSE_ID] : courseIds,
        requiredPlanIds: DEFAULT_VIDEO_REQUIRED_PLAN_ID ? [DEFAULT_VIDEO_REQUIRED_PLAN_ID] : requiredPlanIds,
    };
};

async function getNextVideoOrderForModules(moduleIds = []) {
    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
        return 0;
    }
    const objectIds = moduleIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    if (objectIds.length === 0) {
        return 0;
    }
    const maxOrderVideo = await Video.findOne({ modules: { $in: objectIds } })
        .sort({ order: -1 })
        .select('order')
        .lean();
    return (maxOrderVideo?.order ?? -1) + 1;
}

async function assertUniqueVideoOrderForModules(moduleIds, order, excludeVideoId = null) {
    if (!Array.isArray(moduleIds) || moduleIds.length === 0 || order === undefined || order === null) {
        return;
    }
    const objectIds = moduleIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    if (objectIds.length === 0) {
        return;
    }
    const filter = { modules: { $in: objectIds }, order };
    if (excludeVideoId && mongoose.Types.ObjectId.isValid(excludeVideoId)) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeVideoId) };
    }
    const duplicate = await Video.findOne(filter).select('_id title').lean();
    if (duplicate) {
        const err = new Error(
            `Another video in this module already uses order ${order}. Choose a different order value.`
        );
        err.statusCode = 400;
        throw err;
    }
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

    try {
        await ensureVideoStorageDirs();
        const localStorageId = randomUUID();

        const normalizedIds = enforceDefaultVideoIds(
            Array.isArray(courseIds) ? courseIds : [],
            Array.isArray(requiredPlans) ? requiredPlans : []
        );
        const coursesToSave = Array.isArray(normalizedIds.courseIds)
            ? normalizedIds.courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
            : [];
        const modulesToSave = Array.isArray(moduleIds)
            ? moduleIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
            : [];
        const plansToSave = Array.isArray(normalizedIds.requiredPlanIds)
            ? normalizedIds.requiredPlanIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
            : [];

        const resolvedOrder =
            order !== undefined && order !== null && order !== ''
                ? Number(order)
                : await getNextVideoOrderForModules(modulesToSave);
        await assertUniqueVideoOrderForModules(modulesToSave, resolvedOrder);

        const newVideoData = {
            title,
            description,
            courses: coursesToSave,
            modules: modulesToSave,
            order: resolvedOrder,
            requiredPlans: plansToSave,
            isPublished: isPublished || false,
            tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
            streamProvider: 'local',
            localStorageId,
            videoStatus: 'PENDING_UPLOAD',
            transcodeStep: 'awaiting_upload',
            processingProgress: 0,
            transcodeVariants: {},
            uploader: req.user._id,
        };

        const newVideoInDb = await Video.create(newVideoData);

        const populatedVideo = await Video.findById(newVideoInDb._id)
            .populate("courses", "title _id")
            .populate("modules", "title _id course")
            .populate("requiredPlans", "_id name isActive");

        res.status(201).json({
            status: 'success',
            message: 'Video record created. Upload the file to the server.',
            data: {
                video: populatedVideo,
                upload: {
                    method: 'POST',
                    fieldName: 'video',
                    path: `/api/admin/videos/${newVideoInDb._id}/upload-file`,
                },
            },
        });
    } catch (error) {
        console.error("Error initiating video upload:", error);
        const status = error.statusCode || 500;
        res.status(status).json({
            status: status >= 500 ? 'error' : 'fail',
            message: error?.message || 'Failed to initiate video upload.',
        });
    }
};

async function startTranscodeAfterUpload(videoId, ext) {
    await Video.findByIdAndUpdate(videoId, {
        $set: {
            sourceFileExt: ext,
            videoStatus: "PROCESSING",
            transcodeStep: "queued",
            processingProgress: 0,
            processingError: null,
        },
    });

    queueVideoTranscodeJob(videoId);

    const populatedVideo = await Video.findById(videoId)
        .populate("courses", "title _id")
        .populate("modules", "title _id course")
        .populate("requiredPlans", "_id name isActive");

    const { invalidateVideoCache, invalidateModuleCache } = await import("../utils/cacheInvalidation.js");
    await invalidateVideoCache(videoId);
    if (populatedVideo?.modules?.length) {
        for (const m of populatedVideo.modules) {
            await invalidateModuleCache(typeof m === "object" && m._id ? m._id.toString() : String(m));
        }
    }

    return populatedVideo;
}

/**
 * @route POST /api/admin/videos/:id/upload-file
 */
export const uploadLocalVideoAndTranscode = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No video file received (field name: video).' });
        }
        const ext = req._localUploadExt || path.extname(req.file.originalname || "") || ".mp4";
        const videoId = req._localUpload.videoDocId;
        const populatedVideo = await startTranscodeAfterUpload(videoId, ext);

        res.status(200).json({
            status: "success",
            message: "Upload received. FFmpeg transcoding started.",
            data: { video: populatedVideo },
        });
    } catch (error) {
        console.error("uploadLocalVideoAndTranscode:", error);
        res.status(500).json({ status: "error", message: "Failed to process upload." });
    }
};

/**
 * @route POST /api/admin/videos/:id/upload-chunk
 * Reliable chunked upload for slow/mobile connections and large class recordings.
 */
export const uploadVideoChunk = async (req, res) => {
    try {
        if (!req.file?.buffer) {
            console.warn("[uploadVideoChunk] Missing file buffer", {
                videoId: req._localUpload?.videoDocId,
                contentType: req.headers["content-type"],
                bodyKeys: req.body ? Object.keys(req.body) : [],
            });
            return res.status(400).json({ status: "fail", message: 'No chunk received (field name: chunk).' });
        }

        const chunkIndex = parseInt(req.body.chunkIndex, 10);
        const totalChunks = parseInt(req.body.totalChunks, 10);
        const originalName = String(req.body.originalName || req.file.originalname || "video.mp4");

        if (!Number.isFinite(chunkIndex) || !Number.isFinite(totalChunks) || totalChunks < 1) {
            return res.status(400).json({ status: "fail", message: "chunkIndex and totalChunks are required." });
        }
        if (chunkIndex < 0 || chunkIndex >= totalChunks) {
            return res.status(400).json({ status: "fail", message: "Invalid chunkIndex for totalChunks." });
        }

        const videoId = req._localUpload.videoDocId;
        const localId = req._localUpload.localStorageId;
        const ext = (path.extname(originalName) || ".mp4").toLowerCase();
        const dir = getIncomingDir(localId);
        const chunkPath = path.join(dir, `chunk_${String(chunkIndex).padStart(6, "0")}`);

        if (chunkIndex === 0) {
            await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
            await fs.mkdir(dir, { recursive: true });
            await Video.findByIdAndUpdate(videoId, {
                $set: { videoStatus: "UPLOADING", processingError: null },
            });
        }

        await fs.writeFile(chunkPath, req.file.buffer);

        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

        if (chunkIndex < totalChunks - 1) {
            return res.status(200).json({
                status: "success",
                message: `Chunk ${chunkIndex + 1} of ${totalChunks} saved.`,
                data: { progress, complete: false },
            });
        }

        const sourcePath = path.join(dir, `source${ext}`);
        const handle = await fs.open(sourcePath, "w");
        try {
            for (let i = 0; i < totalChunks; i += 1) {
                const partPath = path.join(dir, `chunk_${String(i).padStart(6, "0")}`);
                const part = await fs.readFile(partPath);
                await handle.write(part);
                await fs.unlink(partPath).catch(() => {});
            }
        } finally {
            await handle.close();
        }

        const populatedVideo = await startTranscodeAfterUpload(videoId, ext);

        res.status(200).json({
            status: "success",
            message: "All chunks received. FFmpeg transcoding started.",
            data: { video: populatedVideo, progress: 100, complete: true },
        });
    } catch (error) {
        console.error("uploadVideoChunk:", error);
        res.status(500).json({ status: "error", message: "Failed to save upload chunk." });
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
    streamUrl,
    thumbnailUrl,
    width,
    height,
    processingProgress,
    transcodeStep,
    transcodeVariants,
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
    if (streamUrl !== undefined)
      fieldsToUpdate.streamUrl = streamUrl;
    if (thumbnailUrl !== undefined)
      fieldsToUpdate.thumbnailUrl = thumbnailUrl;
    if (width !== undefined) fieldsToUpdate.width = Number(width);
    if (height !== undefined) fieldsToUpdate.height = Number(height);
    if (processingProgress !== undefined)
      fieldsToUpdate.processingProgress = Number(processingProgress);
    if (transcodeStep !== undefined) fieldsToUpdate.transcodeStep = String(transcodeStep);
    if (transcodeVariants !== undefined) fieldsToUpdate.transcodeVariants = transcodeVariants;
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
    const { courseIds, moduleIds, requiredPlans, ...updateData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ status: "fail", message: "Invalid video ID format." });
    }

    const videoToUpdate = await Video.findById(videoId);
    if (!videoToUpdate) {
      return res.status(404).json({ status: "fail", message: "Video not found." });
    }
    const wasPublished = videoToUpdate.isPublished;

    const normalizedIds = enforceDefaultVideoIds(
        Array.isArray(courseIds) ? courseIds : [],
        Array.isArray(requiredPlans) ? requiredPlans : []
    );

    if (courseIds || (STRICT_VIDEO_DEFAULTS && DEFAULT_VIDEO_COURSE_ID)) {
        updateData.courses = normalizedIds.courseIds;
    }
    if (moduleIds) {
        updateData.modules = moduleIds;
    }
    if (requiredPlans || (STRICT_VIDEO_DEFAULTS && DEFAULT_VIDEO_REQUIRED_PLAN_ID)) {
        updateData.requiredPlans = normalizedIds.requiredPlanIds;
    }

    const targetModules =
        updateData.modules ??
        (videoToUpdate.modules?.length ? videoToUpdate.modules.map((m) => m.toString()) : []);
    if (updateData.order !== undefined && updateData.order !== null) {
        await assertUniqueVideoOrderForModules(targetModules, Number(updateData.order), videoId);
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({ status: "fail", message: error.message });
    }
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

    await deleteVideoStorageAssets(video);

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

    res.status(204).send();
  } catch (error) {
    console.error("ADMIN DELETE VIDEO ERROR:", error.stack);
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete video metadata." });
  }
};

/**
 * @desc    Remove orphan incoming/processed folders not tied to any video record
 * @route   POST /api/admin/videos/cleanup-orphan-storage
 */
export const cleanupOrphanVideoStorageAdmin = async (req, res) => {
  try {
    const removed = await cleanupOrphanVideoStorage();
    res.status(200).json({
      status: "success",
      message: "Orphan video storage cleanup completed.",
      data: { removed },
    });
  } catch (error) {
    console.error("cleanupOrphanVideoStorageAdmin:", error);
    res.status(500).json({ status: "error", message: "Failed to clean orphan video storage." });
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
