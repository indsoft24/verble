import fs from 'fs';
import path from 'path';
import { assertUserCanPlayVideo } from '../utils/videoPlayAccess.js';
import { getProcessedDir } from '../config/videoStorageConfig.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';
import Video from '../models/Video.js';

function contentTypeForFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (lower.endsWith('.ts')) return 'video/mp2t';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/**
 * GET /api/videos/hls/:videoId/master.m3u8
 * (Path avoids "stream" substring so validateVideoToken middleware does not apply.)
 */
export const serveHlsMaster = async (req, res) => {
  await serveLocalHlsFile(req, res, 'master.m3u8');
};

/**
 * GET /api/videos/hls/:videoId/:quality/:filename
 */
export const serveHlsSegment = async (req, res) => {
  const { quality, filename } = req.params;
  if (!filename || filename.includes('..') || filename.includes('/') || quality.includes('..')) {
    return res.status(400).json({ message: 'Invalid path.' });
  }
  const rel = path.join(quality, filename);
  await serveLocalHlsFile(req, res, rel);
};

async function serveLocalHlsFile(req, res, relativePath) {
  try {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const videoMeta = await Video.findById(videoId).select('streamProvider localStorageId').lean();
    if (!videoMeta || getStreamProvider(videoMeta) !== 'local' || !videoMeta.localStorageId) {
      return res.status(404).json({ message: 'Stream not found.' });
    }

    const access = await assertUserCanPlayVideo(videoId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const base = getProcessedDir(videoMeta.localStorageId);
    const resolved = path.resolve(base, relativePath);
    if (!resolved.startsWith(path.resolve(base))) {
      return res.status(400).json({ message: 'Invalid path.' });
    }

    await fs.promises.access(resolved, fs.constants.R_OK);
    res.setHeader('Content-Type', contentTypeForFile(resolved));
    res.setHeader('Cache-Control', 'private, max-age=60');
    fs.createReadStream(resolved).pipe(res);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found.' });
    }
    res.status(500).json({ message: 'Failed to serve stream.' });
  }
}
