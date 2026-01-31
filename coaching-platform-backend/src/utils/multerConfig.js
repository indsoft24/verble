import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __dirname is directly available in CommonJS modules within the same file
const UPLOAD_TEMP_DIR = path.join(__dirname, '..', '..', 'temp_uploads', 'videos');

// Ensure the temporary directory exists
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_TEMP_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `video-${uniqueSuffix}${extension}`);
    }
});

const videoFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Not a video file! Please upload only videos.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5024 // 5GB limit
    }
});

export default upload;