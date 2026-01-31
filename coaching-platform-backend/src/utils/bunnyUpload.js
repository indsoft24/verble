import sharp from 'sharp';
import axios from 'axios';

/**
 * A generic function to process an image buffer, resize it, convert it to WebP,
 * and upload it to a specified path in Bunny Storage.
 * @param {Buffer} fileBuffer - The image data from multer.
 * @param {object} options - Configuration for processing and uploading.
 * @returns {Promise<string>} The full public URL of the uploaded image.
 */
export const processAndUploadToBunny = async (fileBuffer, options) => {
    const { width, quality, pathPrefix, originalName } = options;

    try {
        const processedImageBuffer = await sharp(fileBuffer)
            .resize({ width: width, withoutEnlargement: true })
            .webp({ quality: quality })
            .toBuffer();

        const outputFilename = `${originalName.replace(/\.[^/.]+$/, "")}-${Date.now()}.webp`;
        const storagePath = `${pathPrefix}/${outputFilename}`;
        const uploadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

        await axios.put(uploadUrl, processedImageBuffer, {
            headers: {
                'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY,
                'Content-Type': 'image/webp',
            },
        });

        return `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;
    } catch (error) {
        console.error(`Error processing/uploading to Bunny at path ${pathPrefix}:`, error.response?.data || error.message);
        throw new Error(`Image upload failed for path: ${pathPrefix}.`);
    }
};

/**
 * A generic function to delete a file from Bunny Storage given its full URL.
 * @param {string} fileUrl - The full public URL of the file to delete.
 */
export const deleteFromBunny = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes(process.env.BUNNY_STORAGE_HOSTNAME)) {
            return; // Not a Bunny URL, skip deletion
        }

        const urlParts = fileUrl.split('/');
        const storagePath = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
        const deleteUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

        await axios.delete(deleteUrl, {
            headers: {
                'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY,
            },
        });
    } catch (error) {
        console.error('Error deleting file from Bunny:', error.response?.data || error.message);
        // Don't throw error for deletion failures as it shouldn't break the main operation
    }
};

/**
 * Securely serves an image from Bunny Storage.
 * @param {string} imageName - The image filename
 * @param {string} pathPrefix - The folder path in Bunny Storage
 * @param {object} res - Express response object
 */
export const serveImageFromBunny = async (imageName, pathPrefix, res) => {
    try {
        const storagePath = `${pathPrefix}/${imageName}`;
        const downloadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            headers: { AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY },
        });

        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.setHeader('Content-Type', 'image/webp');
        response.data.pipe(res);

    } catch (error) {
        if (error.response?.status === 404) return res.status(404).json({ message: 'Image not found.' });
        console.error(`BUNNY IMAGE SERVING ERROR for ${pathPrefix}:`, error.message);
        res.status(500).json({ message: 'Failed to serve image.' });
    }
};
