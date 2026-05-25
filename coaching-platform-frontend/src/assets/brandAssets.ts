/**
 * Central brand imagery (Vite-resolved URLs). Filenames in `src/assets/images/` match each asset’s role.
 */
import primaryLogo from './images/primary-logo.png';
import websiteHeroBackground from './images/website-hero-background.png';
import appStoreIcon from './images/app-store-icon.png';
import captivatingLoadingIcon from './images/captivating-loading-icon.png';
import mobileAppLaunchSplash from './images/mobile-app-launch-splash.png';

/** Public App Store listing; override via env when the store URL is available. */
export const appStoreListingUrl =
    (import.meta.env.VITE_APP_STORE_URL as string | undefined)?.trim() || 'https://verble.in';

export const brandAssets = {
    primaryLogo,
    websiteHeroBackground,
    appStoreIcon,
    captivatingLoadingIcon,
    mobileAppLaunchSplash,
} as const;
