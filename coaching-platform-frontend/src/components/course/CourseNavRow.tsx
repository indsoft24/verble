import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { alpha } from '@mui/material/styles';
import { courseLearningTheme, courseNavRowGridSx } from './courseLearningTheme';
import { getSplashImageUrl, resolveBackendMediaUrl } from '../../utils/imageUtils';

export interface CourseNavItem {
    _id: string;
    title: string;
    moduleId: string;
    moduleTitle: string;
    durationSeconds?: number;
    thumbnailUrl?: string;
    isLocked?: boolean;
    canAccess?: boolean;
}

function formatDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${h}:${String(mm).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
}

export function navThumbUrl(item: CourseNavItem): string {
    if (item.thumbnailUrl) {
        return resolveBackendMediaUrl(item.thumbnailUrl);
    }
    return getSplashImageUrl();
}

export interface CourseNavRowProps {
    item: CourseNavItem;
    currentId: string | undefined;
}

const CourseNavRow: React.FC<CourseNavRowProps> = ({ item, currentId }) => {
    const isCurrent = currentId === item._id;
    const thumb = navThumbUrl(item);

    return (
        <Box
            component={RouterLink}
            to={`/videos/${item._id}`}
            sx={{
                ...courseNavRowGridSx,
                py: { xs: 1.25, sm: 1.75 },
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 2.25,
                px: { xs: 1.5, sm: 2 },
                border: '1px solid',
                borderColor: isCurrent ? alpha(courseLearningTheme.accent, 0.65) : alpha(courseLearningTheme.accent, 0.2),
                bgcolor: isCurrent ? alpha(courseLearningTheme.accent, 0.14) : courseLearningTheme.tileBg,
                pointerEvents: isCurrent ? 'none' : 'auto',
                transition: 'all 0.16s ease',
                boxShadow: isCurrent ? courseLearningTheme.focusRing : 'none',
                '&:hover': {
                    bgcolor: alpha(courseLearningTheme.accent, 0.15),
                    borderColor: alpha(courseLearningTheme.accent, 0.55),
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <Box
                aria-hidden
                sx={{
                    width: { xs: 88, sm: 104 },
                    height: { xs: 56, sm: 64 },
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    bgcolor: 'grey.900',
                    backgroundImage: `url("${thumb}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <Box sx={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0.75, py: 0.25 }}>
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                        lineHeight: 1.25,
                        color: courseLearningTheme.textPrimary,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                    }}
                >
                    {item.title}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: courseLearningTheme.textBody, fontSize: '0.79rem' }}>
                    {item.moduleTitle}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {item.durationSeconds != null && item.durationSeconds > 0 && (
                        <Typography variant="caption" sx={{ color: courseLearningTheme.textBody, fontSize: '0.78rem' }}>
                            {formatDuration(item.durationSeconds)}
                        </Typography>
                    )}
                    {item.isLocked && (
                        <Chip
                            size="small"
                            icon={<LockOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            label="Locked"
                            variant="outlined"
                            sx={{ height: 22, borderColor: alpha(courseLearningTheme.accent, 0.4), color: courseLearningTheme.accent }}
                        />
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

export default CourseNavRow;
