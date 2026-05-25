import Video from '../models/Video.js';
import User from '../models/User.js';
import { checkSequentialVideoAccess } from './videoAccessHelper.js';
import { getStreamProvider } from './videoStreamProvider.js';
import { getActiveUserTierLevel, canAccessRequiredPlansByTier } from './subscriptionTierAccess.js';

/**
 * Same subscription / sequential rules as get-play-token.
 * @returns {{ ok: true, video: object } | { ok: false, status: number, message: string }}
 */
export async function assertUserCanPlayVideo(videoId, userId) {
  const video = await Video.findById(videoId)
    .populate('requiredPlans', '_id name')
    .select('+order +modules videoStatus streamProvider localStorageId')
    .lean();

  if (!video) {
    return { ok: false, status: 404, message: 'Video not found.' };
  }

  const normalizedVideoStatus = (video.videoStatus || '').toUpperCase();
  const isVideoAvailable = normalizedVideoStatus === 'AVAILABLE';
  const provider = getStreamProvider(video);

  const hasStreamUrl = !!video.localStorageId;

  const isFreeVideo = !video.requiredPlans || video.requiredPlans.length === 0;

  if (!isVideoAvailable || !hasStreamUrl) {
    return {
      ok: false,
      status: 403,
      message: 'This video is currently processing and not yet available.',
    };
  }

  if (!isFreeVideo && video.requiredPlans?.length) {
    if (!userId) {
      return { ok: false, status: 403, message: 'This video requires a subscription plan.' };
    }

    const user = await User.findById(userId).select('subscriptions').lean();
    if (!user) {
      return { ok: false, status: 403, message: 'This video requires a subscription plan.' };
    }

    const userTierLevel = getActiveUserTierLevel(user?.subscriptions);
    const hasAccess = canAccessRequiredPlansByTier({
      requiredPlans: video.requiredPlans,
      userTierLevel,
    });

    if (!hasAccess) {
      return { ok: false, status: 403, message: 'This video requires a different subscription plan.' };
    }
  }

  if (userId && video.modules?.length > 0 && !isFreeVideo) {
    const moduleId = video.modules[0];
    const moduleIdString =
      typeof moduleId === 'object' && moduleId?._id ? moduleId._id.toString() : moduleId?.toString() || moduleId;
    const sequentialAccess = await checkSequentialVideoAccess(userId, video, moduleIdString);
    if (!sequentialAccess.canAccess) {
      return { ok: false, status: 403, message: sequentialAccess.reason };
    }
  }

  return { ok: true, video };
}
