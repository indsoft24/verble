import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import { courseLearningTheme } from '../course/courseLearningTheme';

export const conversationPageBg = courseLearningTheme.pageBg;

/** Breadcrumbs on dark conversation pages */
export const conversationBreadcrumbSx: SxProps<Theme> = {
    mb: 2,
    '& .MuiBreadcrumbs-separator': { color: alpha('#e2e8f0', 0.45) },
    '& a': { color: alpha('#e2e8f0', 0.75), '&:hover': { color: courseLearningTheme.accent } },
    '& .MuiTypography-root': { color: alpha('#e2e8f0', 0.92) },
    '& button': { color: alpha('#e2e8f0', 0.75), '&:hover': { color: courseLearningTheme.accent } },
};

export const conversationBackButtonSx: SxProps<Theme> = {
    color: courseLearningTheme.accent,
    mb: 2,
    fontWeight: 600,
    '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.1) },
};

/** Meta panel above conversation chat (tags, description) */
export const conversationMetaPanelSx: SxProps<Theme> = {
    p: '10px',
    mb: 1.5,
    borderRadius: 2,
};

/** Tag / chip row inside meta panel */
export const conversationMetaTagsRowSx: SxProps<Theme> = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
};
