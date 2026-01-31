import axios from 'axios';
import Video from '../models/Video.js'; 
import mongoose from 'mongoose'; 

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

    const storagePath = `materials/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const storageUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;
    const uploadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

    try {
        await axios.put(
            uploadUrl,
            file.buffer, 
            {
                headers: {
                    'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY,
                    'Content-Type': 'application/octet-stream',
                },
            }
        );

        const newMaterial = {
            label,
            fileName: file.originalname,
            storageUrl,
            storagePath,
            fileSize: file.size,
            fileType: file.mimetype, 
        };

        video.associatedMaterials.push(newMaterial);
        await video.save();

        const createdMaterial = video.associatedMaterials[video.associatedMaterials.length - 1];

        res.status(201).json({
            status: 'success',
            message: 'Material uploaded and linked successfully.',
            data: { material: createdMaterial },
        });

    } catch (error) {
        console.error('--- Bunny Storage Upload Error ---');
        console.error('Request URL:', uploadUrl);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
        console.error('---------------------------------');
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
    const deleteUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

    try {
        await axios.delete(
            deleteUrl,
            {
                headers: { 'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY },
            }
        );

        video.associatedMaterials.pull({ _id: materialId });
        await video.save();
        
        res.status(200).json({ status: 'success', message: 'Material deleted successfully.' });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn(`File not found on Bunny Storage ('${storagePath}'), but proceeding to remove from DB.`);
            video.associatedMaterials.pull({ _id: materialId });
            await video.save();
            return res.status(200).json({ status: 'success', message: 'Material deleted from database (was not found in storage).' });
        }
        
        console.error('--- Bunny Storage Delete Error ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
        console.error('----------------------------------');
        res.status(500).json({ message: 'Failed to delete material from storage.' });
    }
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

        const downloadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${material.storagePath}`;

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            headers: {
                AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,
            },
        });

        res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
        res.setHeader('Content-Type', material.fileType || 'application/octet-stream');

        response.data.pipe(res);

    } catch (error) {
        console.error('--- Bunny Storage Download Error ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
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
        videos.forEach(video => {
            materials = materials.concat(video.associatedMaterials.map(material => ({
                _id: material._id,
                label: material.label,
                fileName: material.fileName,
                fileSize: material.fileSize,
                fileType: material.fileType,
                videoId: video._id
            })));
        });
        res.status(200).json({ status: 'success', results: materials.length, data: { materials } });
    } catch (error) {
        console.error('--- Fetch All Materials Error ---', error);
        res.status(500).json({ message: 'Failed to fetch materials.' });
    }
};



/**
 * @desc    Fetch materials related to a specific video (info only, not download links)
 * @route   GET /api/materials/:videoId
 * @access  Public
 */
export const getMaterialsByVideo = async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ message: 'Invalid Video ID format.' });
    }

    try {
        const video = await Video.findById(videoId, 'associatedMaterials');
        if (!video) {
            return res.status(404).json({ message: 'Video not found.' });
        }

        const materials = video.associatedMaterials.map(material => ({
            _id: material._id,
            label: material.label,
            fileName: material.fileName,
            fileSize: material.fileSize,
            fileType: material.fileType,
        }));

        res.status(200).json({ status: 'success', results: materials.length, data: { materials } });
    } catch (error) {
        console.error('--- Fetch Materials By Video Error ---', error);
        res.status(500).json({ message: 'Failed to fetch materials.' });
    }
};