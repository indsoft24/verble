import fs from 'fs/promises';
import path from 'path';
import Video from '../models/Video.js';
import {
  getVideoStorageRoot,
  getIncomingDir,
  getProcessedDir,
  getUploadsRoot,
} from '../config/videoStorageConfig.js';

function materialDiskPath(storagePath) {
  if (!storagePath || String(storagePath).startsWith('http')) return null;
  return path.join(getUploadsRoot(), storagePath);
}

/**
 * Remove on-disk assets for a video: HLS folders, incoming source, and material files.
 */
export async function deleteVideoStorageAssets(video) {
  if (!video) return;

  for (const material of video.associatedMaterials || []) {
    const diskPath = materialDiskPath(material.storagePath);
    if (!diskPath) continue;
    try {
      await fs.unlink(diskPath);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`[Storage] Could not delete material file ${diskPath}:`, e.message);
      }
    }
  }

  const localId = video.localStorageId;
  if (!localId) return;

  for (const dir of [getIncomingDir(localId), getProcessedDir(localId)]) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`[Storage] Could not remove ${dir}:`, e.message);
      }
    }
  }
}

/**
 * Remove storage folders that are not referenced by any video in the database.
 */
export async function cleanupOrphanVideoStorage() {
  const root = getVideoStorageRoot();
  const knownIds = new Set(
    (await Video.find({ localStorageId: { $exists: true, $ne: '' } }).select('localStorageId').lean()).map(
      (v) => v.localStorageId
    )
  );

  const removed = { incoming: [], processed: [] };

  for (const sub of ['incoming', 'processed']) {
    const parent = path.join(root, sub);
    let entries = [];
    try {
      entries = await fs.readdir(parent, { withFileTypes: true });
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      continue;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (knownIds.has(ent.name)) continue;
      const full = path.join(parent, ent.name);
      await fs.rm(full, { recursive: true, force: true });
      removed[sub].push(ent.name);
    }
  }

  return removed;
}
