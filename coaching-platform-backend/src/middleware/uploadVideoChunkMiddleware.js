import multer from 'multer';
import Video from '../models/Video.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';

const CHUNK_MAX_BYTES = parseInt(
  process.env.VIDEO_CHUNK_MAX_BYTES || String(6 * 1024 * 1024),
  10
);

export async function loadLocalVideoForChunkUpload(req, res, next) {
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

export const uploadVideoChunkMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CHUNK_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname || '';
    const ok =
      file.mimetype === 'application/octet-stream' ||
      /^video\//.test(file.mimetype) ||
      /\.(mp4|mov|mkv|webm|avi|m4v|mpeg|mpg|wmv)$/i.test(name);
    if (!ok) {
      return cb(new Error('Invalid chunk payload.'));
    }
    cb(null, true);
  },
});
