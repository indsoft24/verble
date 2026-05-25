import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import Video from '../models/Video.js';
import {
  getIncomingSourcePath,
  getProcessedDir,
  getThumbnailPath,
  getMasterPlaylistPath,
  getIncomingDir,
} from '../config/videoStorageConfig.js';
import { getStreamProvider } from '../utils/videoStreamProvider.js';

const VARIANTS = [
  { key: '360p', folder: '360p', height: 360, vBitrate: '800k', maxrate: '900k', bufsize: '1200k', aBitrate: '96k', bandwidth: 896000, width: 640 },
  { key: '480p', folder: '480p', height: 480, vBitrate: '1400k', maxrate: '1600k', bufsize: '2000k', aBitrate: '128k', bandwidth: 1528000, width: 854 },
  { key: '720p', folder: '720p', height: 720, vBitrate: '2800k', maxrate: '3200k', bufsize: '4000k', aBitrate: '128k', bandwidth: 2928000, width: 1280 },
  { key: '1080p', folder: '1080p', height: 1080, vBitrate: '5000k', maxrate: '5500k', bufsize: '7000k', aBitrate: '192k', bandwidth: 5192000, width: 1920 },
];

function ffprobeAsync(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function parseTimeSeconds(stderrLine) {
  const m = stderrLine.match(/time=(\d+):(\d+):(\d+\.\d+)/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseFloat(m[3]);
  return h * 3600 + min * 60 + sec;
}

function runFfmpeg(args, onProgress) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      const s = chunk.toString();
      stderr += s;
      if (onProgress) {
        const t = parseTimeSeconds(s);
        if (t != null) onProgress(t);
      }
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

async function updateVideoDoc(videoId, patch) {
  await Video.findByIdAndUpdate(videoId, { $set: patch }, { new: false });
}

function buildVariantArgs(inputPath, variant, hasAudio, outDir) {
  const segPath = path.join(outDir, 'seg_%03d.ts');
  const playlistPath = path.join(outDir, 'playlist.m3u8');
  const vf = `scale=-2:${variant.height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`;

  const args = [
    '-i',
    inputPath,
    '-preset',
    'fast',
    '-g',
    '48',
    '-sc_threshold',
    '0',
    '-map',
    '0:v:0',
  ];

  if (hasAudio) {
    args.push('-map', '0:a:0?', '-c:a', 'aac', '-b:a', variant.aBitrate);
  } else {
    args.push('-an');
  }

  args.push(
    '-c:v',
    'libx264',
    '-b:v',
    variant.vBitrate,
    '-maxrate',
    variant.maxrate,
    '-bufsize',
    variant.bufsize,
    '-vf',
    vf,
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    segPath,
    playlistPath
  );

  return { args };
}

async function writeMasterPlaylist(processedDir, variantsUsed) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];
  for (const v of variantsUsed) {
    const codecs = v.hasAudio ? 'avc1.64001f,mp4a.40.2' : 'avc1.64001f';
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.width}x${v.height},CODECS="${codecs}"`
    );
    lines.push(`${v.folder}/playlist.m3u8`);
  }
  await fs.writeFile(path.join(processedDir, 'master.m3u8'), lines.join('\n') + '\n', 'utf8');
}

let throttleTimers = new Map();
function throttledUpdate(videoId, fn) {
  const existing = throttleTimers.get(videoId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    throttleTimers.delete(videoId);
    fn().catch(() => {});
  }, 800);
  throttleTimers.set(videoId, t);
}

/**
 * Background transcode: incoming/source.* → processed/{id}/ HLS ladder + thumbnail.
 */
export async function runVideoTranscodeJob(videoMongoId) {
  const video = await Video.findById(videoMongoId);
  if (!video || getStreamProvider(video) !== 'local') return;

  const localId = video.localStorageId;
  if (!localId) return;

  const ext = video.sourceFileExt || '.mp4';
  const inputPath = getIncomingSourcePath(localId, ext);
  const processedDir = getProcessedDir(localId);

  try {
    await fs.access(inputPath);
  } catch {
    await updateVideoDoc(videoMongoId, {
      videoStatus: 'FAILED',
      processingError: 'Source upload file missing on disk.',
      transcodeStep: 'failed',
    });
    return;
  }

  await fs.mkdir(processedDir, { recursive: true });

  let probe;
  try {
    probe = await ffprobeAsync(inputPath);
  } catch (e) {
    await updateVideoDoc(videoMongoId, {
      videoStatus: 'FAILED',
      processingError: `Probe failed: ${e.message}`,
      transcodeStep: 'probe_failed',
    });
    return;
  }

  const vStream = probe.streams.find((s) => s.codec_type === 'video');
  const hasAudio = probe.streams.some((s) => s.codec_type === 'audio');
  const durationSec = vStream && probe.format?.duration ? parseFloat(probe.format.duration) : 0;
  const width = vStream?.width || 0;
  const height = vStream?.height || 0;

  const initialVariants = {};
  VARIANTS.forEach((v) => {
    initialVariants[v.key] = { progress: 0, done: false };
  });

  await updateVideoDoc(videoMongoId, {
    videoStatus: 'PROCESSING',
    transcodeStep: 'probing_complete',
    processingProgress: 5,
    durationSeconds: Math.round(durationSec) || 0,
    width,
    height,
    transcodeVariants: initialVariants,
    processingError: null,
  });

  // Thumbnail (~1s)
  try {
    await runFfmpeg([
      '-ss',
      '1',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-vf',
      'scale=1280:-2:force_original_aspect_ratio=decrease',
      getThumbnailPath(localId),
    ]);
  } catch {
    // non-fatal
  }

  const variantsUsed = [];
  const n = VARIANTS.length;
  let completed = 0;

  for (let i = 0; i < VARIANTS.length; i++) {
    const variant = VARIANTS[i];
    const outDir = path.join(processedDir, variant.folder);
    await fs.mkdir(outDir, { recursive: true });

    await updateVideoDoc(videoMongoId, {
      transcodeStep: `encoding_${variant.key}`,
      processingProgress: Math.min(99, Math.round(5 + (completed / n) * 85)),
    });

    const { args } = buildVariantArgs(inputPath, variant, hasAudio, outDir);

    const variantKey = variant.key;
    await runFfmpeg(args, (timeSec) => {
      if (!durationSec || durationSec <= 0) return;
      const pct = Math.min(100, Math.round((timeSec / durationSec) * 100));
      throttledUpdate(videoMongoId, async () => {
        const fresh = await Video.findById(videoMongoId).lean();
        if (!fresh) return;
        const tv = { ...(fresh.transcodeVariants?.toObject?.() || fresh.transcodeVariants || {}) };
        tv[variantKey] = { progress: pct, done: false };
        const overall =
          5 +
          ((completed + pct / 100) / n) * 85;
        await updateVideoDoc(videoMongoId, {
          transcodeVariants: tv,
          processingProgress: Math.min(99, Math.round(overall)),
        });
      });
    });

    completed++;
    const tvDone = await Video.findById(videoMongoId).select('transcodeVariants').lean();
    const tv2 = { ...(tvDone?.transcodeVariants || {}) };
    tv2[variantKey] = { progress: 100, done: true };
    await updateVideoDoc(videoMongoId, {
      transcodeVariants: tv2,
      processingProgress: Math.min(99, Math.round(5 + (completed / n) * 85)),
    });

    variantsUsed.push({ ...variant, hasAudio });
  }

  await writeMasterPlaylist(processedDir, variantsUsed);

  const keepSource = process.env.KEEP_UPLOADED_SOURCE_VIDEO === 'true';
  if (!keepSource) {
    try {
      await fs.rm(getIncomingDir(localId), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const { invalidateVideoCache, invalidateModuleCache } = await import('../utils/cacheInvalidation.js');
  await invalidateVideoCache(videoMongoId);
  const v2 = await Video.findById(videoMongoId).select('modules').lean();
  if (v2?.modules?.length) {
    for (const mid of v2.modules) {
      await invalidateModuleCache(mid.toString());
    }
  }

  await updateVideoDoc(videoMongoId, {
    videoStatus: 'AVAILABLE',
    transcodeStep: 'complete',
    processingProgress: 100,
  });
}
