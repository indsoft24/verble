import { alpha } from '@mui/material/styles';

/**
 * Learner-facing brand palette inspired by the Verble logo banner.
 * Keeps surfaces readable while introducing a consistent teal identity.
 */
export const learnerBrandTheme = {
    pageBg: '#eaf7f8',
    pageBgGradient:
        'radial-gradient(circle at 12% 8%, rgba(34, 166, 153, 0.18) 0%, transparent 36%), radial-gradient(circle at 88% 12%, rgba(14, 116, 144, 0.16) 0%, transparent 32%), linear-gradient(180deg, #edf9fa 0%, #e4f3f5 100%)',
    surface: '#f7fcfd',
    surfaceMuted: '#eef7f8',
    border: '#b8d8dc',
    accent: '#0f766e',
    accentStrong: '#0a5f59',
    icon: '#0f766e',
    textPrimary: '#134e4a',
    textSecondary: '#2c6b67',
    textMuted: '#4e7f7c',
    sidebarBg: '#f1f9fa',
    sidebarActiveBg: alpha('#22a699', 0.16),
    sidebarHoverBg: alpha('#22a699', 0.1),
    sidebarActiveBorder: '#0f766e',
} as const;

