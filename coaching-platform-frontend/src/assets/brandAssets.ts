/**
 * Central brand imagery (Vite-resolved URLs). WebP variants for smaller bundles and faster loads.
 */
import primaryLogo from './images/primary-logo.webp';
import websiteHeroBackground from './images/website-hero-background.webp';
import appStoreIcon from './images/app-store-icon.webp';
import captivatingLoadingIcon from './images/captivating-loading-icon.webp';
import mobileAppLaunchSplash from './images/mobile-app-launch-splash.webp';
import indianCoach from './images/indian-coach.jpg';

/** Public App Store listing; override via env when the store URL is available. */
export const appStoreListingUrl =
    (import.meta.env.VITE_APP_STORE_URL as string | undefined)?.trim() || 'https://verble.in';

export const brandAssets = {
    primaryLogo,
    websiteHeroBackground,
    indianCoach,
    appStoreIcon,
    captivatingLoadingIcon,
    mobileAppLaunchSplash,
} as const;
