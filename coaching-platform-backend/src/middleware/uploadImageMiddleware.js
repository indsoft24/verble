import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directories
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'images');
const COURSE_IMAGES_DIR = path.join(UPLOAD_DIR, 'courses');
const MODULE_IMAGES_DIR = path.join(UPLOAD_DIR, 'modules');
const SUBSCRIPTION_IMAGES_DIR = path.join(UPLOAD_DIR, 'subscription-plans');

// Ensure directories exist
[UPLOAD_DIR, COURSE_IMAGES_DIR, MODULE_IMAGES_DIR, SUBSCRIPTION_IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error(`Error: File upload only supports the following filetypes - ${allowedTypes}`), false);
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine destination based on the route
        let destination;
        
        if (req.route && req.route.path.includes('courses')) {
            destination = COURSE_IMAGES_DIR;
        } else if (req.route && req.route.path.includes('modules')) {
            destination = MODULE_IMAGES_DIR;
        } else if (req.route && req.route.path.includes('subscription-plans')) {
            destination = SUBSCRIPTION_IMAGES_DIR;
        } else {
            destination = UPLOAD_DIR;
        }
        
        cb(null, destination);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        
        let prefix = 'image';
        if (req.route && req.route.path.includes('courses')) {
            prefix = 'course';
        } else if (req.route && req.route.path.includes('modules')) {
            prefix = 'module';
        } else if (req.route && req.route.path.includes('subscription-plans')) {
            prefix = 'subscription';
        }
        
        cb(null, `${prefix}-${uniqueSuffix}${extension}`);
    }
});

// Multer configuration
const uploadImage = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware to process uploaded image with Sharp
export const processUploadedImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const inputPath = req.file.path;
        const outputPath = inputPath.replace(path.extname(inputPath), '.webp');
        
        // Process image with Sharp
        await sharp(inputPath)
            .resize(800, 600, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        // Delete original file
        fs.unlinkSync(inputPath);
        
        // Update file path to the processed image
        req.file.path = outputPath;
        req.file.filename = path.basename(outputPath);
        
        // Generate URL for the image
        let imageUrl;
        if (req.route && req.route.path.includes('courses')) {
            imageUrl = `/images/courses/${req.file.filename}`;
        } else if (req.route && req.route.path.includes('modules')) {
            imageUrl = `/images/modules/${req.file.filename}`;
        } else if (req.route && req.route.path.includes('subscription-plans')) {
            imageUrl = `/images/subscription-plans/${req.file.filename}`;
        } else {
            imageUrl = `/images/${req.file.filename}`;
        }
        
        req.body.image = imageUrl;
        
        next();
    } catch (error) {
        console.error('Image processing error:', error);
        // Clean up uploaded file if processing fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to process uploaded image'
        });
    }
};

export default uploadImage;
