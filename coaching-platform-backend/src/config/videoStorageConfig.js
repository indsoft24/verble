import path from 'path';
import fs from 'fs/promises';

const DEFAULT_RELATIVE_ROOT = path.join('uploads', 'videos');

/**
 * Absolute root for all video assets (bind-mount this path on the host in Docker).
 * @see docker-compose.vps.yml
 */
export function getVideoStorageRoot() {
  const fromEnv = process.env.VIDEO_STORAGE_ROOT;
  if (fromEnv && fromEnv.trim()) {
    return path.resolve(fromEnv.trim());
  }
  return path.resolve(process.cwd(), DEFAULT_RELATIVE_ROOT);
}

/** Parent of `videos/` — e.g. `/usr/src/app/uploads` when videos live in `uploads/videos`. */
export function getUploadsRoot() {
  return path.dirname(getVideoStorageRoot());
}

export async function ensureVideoStorageDirs() {
  const root = getVideoStorageRoot();
  await fs.mkdir(path.join(root, 'incoming'), { recursive: true });
  await fs.mkdir(path.join(root, 'processed'), { recursive: true });
  return root;
}

export function getIncomingDir(localStorageId) {
  return path.join(getVideoStorageRoot(), 'incoming', localStorageId);
}

export function getProcessedDir(localStorageId) {
  return path.join(getVideoStorageRoot(), 'processed', localStorageId);
}

export function getIncomingSourcePath(localStorageId, extWithDot) {
  return path.join(getIncomingDir(localStorageId), `source${extWithDot}`);
}

export function getThumbnailPath(localStorageId) {
  return path.join(getProcessedDir(localStorageId), 'thumbnail.jpg');
}

export function getMasterPlaylistPath(localStorageId) {
  return path.join(getProcessedDir(localStorageId), 'master.m3u8');
}
