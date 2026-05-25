import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Video from '../models/Video.js';
import { getIncomingDir } from '../config/videoStorageConfig.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';

const MAX_BYTES = parseInt(process.env.VIDEO_UPLOAD_MAX_BYTES || String(4 * 1024 * 1024 * 1024), 10);

export async function loadLocalVideoForUpload(req, res, next) {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ status: 'fail', message: 'Video not found.' });
    }
    if (getStreamProvider(video) !== 'local') {
      return res.status(400).json({ status: 'fail', message: 'This video is not configured for server-side upload.' });
    }
    const allowed = ['PENDING_UPLOAD', 'UPLOADING', 'FAILED'];
    if (!allowed.includes(video.videoStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'This video is not awaiting a new file upload.',
      });
    }
    req._localUpload = {
      videoDocId: video._id.toString(),
      localStorageId: video.localStorageId,
    };
    next();
  } catch (e) {
    next(e);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = getIncomingDir(req._localUpload.localStorageId);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      return cb(err);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.mp4';
    req._localUploadExt = ext.toLowerCase();
    cb(null, `source${req._localUploadExt}`);
  },
});

export const uploadLocalVideoFile = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const name = file.originalname || '';
    const ok =
      /^video\//.test(file.mimetype) ||
      file.mimetype === 'application/octet-stream' ||
      /\.(mp4|mov|mkv|webm|avi|m4v|mpeg|mpg|wmv)$/i.test(name);
    if (!ok) {
      return cb(new Error('Only video files are allowed.'));
    }
    cb(null, true);
  },
});
