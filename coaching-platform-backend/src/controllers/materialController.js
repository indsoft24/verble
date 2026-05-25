import fsPromises from 'fs/promises';
import { createReadStream, constants as fsConstants } from 'fs';
import path from 'path';
import Video from '../models/Video.js';
import mongoose from 'mongoose';
import { getUploadsRoot } from '../config/videoStorageConfig.js';

function getPublicOrigin() {
    const raw = process.env.API_PUBLIC_ORIGIN || process.env.BASE_URL || 'http://localhost:5000';
    return String(raw).replace(/\/$/, '');
}

function localFilePath(storagePath) {
    return path.join(getUploadsRoot(), storagePath);
}

/**
 * @desc    Upload a material file for a specific video
 * @route   POST /api/admin/materials/:videoId
 * @access  Private (Admin/Instructor)
 */
export const uploadMaterial = async (req, res) => {
    const { videoId } = req.params;
    const { label } = req.body;
    const file = req.file;

    if (!label) {
        return res.status(400).json({ message: 'A label for the material is required.' });
    }
    if (!file) {
        return res.status(400).json({ message: 'A file is required for upload.' });
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ message: 'Invalid Video ID format.' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }

    const safeName = file.originalname.replace(/\s+/g, '-');
    const storagePath = path.posix.join('materials', `${Date.now()}-${safeName}`);
    const fullPath = localFilePath(storagePath);

    try {
        await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
        await fsPromises.writeFile(fullPath, file.buffer);

        const newMaterial = {
            label,
            fileName: file.originalname,
            storageUrl: '',
            storagePath,
            fileSize: file.size,
            fileType: file.mimetype,
        };

        video.associatedMaterials.push(newMaterial);
        await video.save();

        const createdMaterial = video.associatedMaterials[video.associatedMaterials.length - 1];
        createdMaterial.storageUrl = `${getPublicOrigin()}/api/materials/${videoId}/${createdMaterial._id}/download`;
        await video.save();

        const out = video.associatedMaterials.id(createdMaterial._id);

        res.status(201).json({
            status: 'success',
            message: 'Material uploaded and linked successfully.',
            data: { material: out },
        });
    } catch (error) {
        console.error('Material upload error:', error.message);
        res.status(500).json({ message: 'Failed to upload material to storage.' });
    }
};

/**
 * @desc    Delete a material file from a specific video
 * @route   DELETE /api/admin/materials/:videoId/:materialId
 * @access  Private (Admin/Instructor)
 */
export const deleteMaterial = async (req, res) => {
    const { videoId, materialId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId) || !mongoose.Types.ObjectId.isValid(materialId)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ message: 'Video not found.' });
    }

    const material = video.associatedMaterials.id(materialId);
    if (!material) {
        return res.status(404).json({ message: 'Material not found.' });
    }

    const storagePath = material.storagePath;
    try {
        if (storagePath && !String(storagePath).startsWith('http')) {
            await fsPromises.unlink(localFilePath(storagePath)).catch(() => {});
        }
    } catch (e) {
        console.warn('Could not delete material file from disk:', e.message);
    }

    video.associatedMaterials.pull({ _id: materialId });
    await video.save();

    res.status(200).json({ status: 'success', message: 'Material deleted successfully.' });
};

/**
 * @desc    Download a material file
 * @route   GET /api/admin/materials/:videoId/:materialId/download
 * @access  Private (Admin/Instructor)
 */
export const downloadMaterial = async (req, res) => {
    const { videoId, materialId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(videoId) || !mongoose.Types.ObjectId.isValid(materialId)) {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }

        const material = video.associatedMaterials.id(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        const sp = material.storagePath;
        if (!sp || String(sp).startsWith('http')) {
            return res.status(410).json({
                message: 'This file is stored externally. Re-upload the material to use server storage.',
            });
        }

        const fullPath = localFilePath(sp);
        try {
            await fsPromises.access(fullPath, fsConstants.R_OK);
        } catch {
            return res.status(404).json({ message: 'File not found on server.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
        res.setHeader('Content-Type', material.fileType || 'application/octet-stream');
        createReadStream(fullPath).pipe(res);
    } catch (error) {
        console.error('Material download error:', error.message);
        res.status(500).json({ message: 'Failed to download material.' });
    }
};

/**
 * @desc    Fetch all materials (info only, not download links)
 * @route   GET /api/materials
 * @access  Public
 */
export const getAllMaterials = async (req, res) => {
    try {
        const videos = await Video.find({}, 'associatedMaterials');
        let materials = [];
        videos.forEach((video) => {
            materials = materials.concat(
                video.associatedMaterials.map((material) => ({
                    ...material.toObject(),
                    videoId: video._id,
                }))
            );
        });
        res.status(200).json({ status: 'success', results: materials.length, data: { materials } });
    } catch (error) {
        console.error('GET ALL MATERIALS ERROR:', error);
        res.status(500).json({ message: 'Failed to fetch materials.' });
    }
};

/**
 * @desc    Fetch materials for a specific video
 * @route   GET /api/materials/:videoId
 * @access  Public
 */
export const getMaterialsByVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ message: 'Invalid Video ID format.' });
        }
        const video = await Video.findById(videoId).select('associatedMaterials');
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }
        res.status(200).json({
            status: 'success',
            results: video.associatedMaterials.length,
            data: { materials: video.associatedMaterials },
        });
    } catch (error) {
        console.error('GET MATERIALS BY VIDEO ERROR:', error);
        res.status(500).json({ message: 'Failed to fetch materials for this video.' });
    }
};
