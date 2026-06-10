import React from 'react';
import { Box, Button, Chip, Stack, Typography, alpha } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { courseLearningTheme, courseChipOutlinedSx, courseChipSuccessSx, courseChipWarningSx } from './courseLearningTheme';
import type { VideoListItemForModulePage } from '../../services/courseUserService';

export interface CourseLessonRowProps {
    video: VideoListItemForModulePage;
    index: number;
    thumbUrl: string;
    splashUrl: string;
    formatDuration: (seconds: number) => string;
    onRowClick: (video: VideoListItemForModulePage) => void;
    onWatch: (videoId: string) => void;
}

const CourseLessonRow: React.FC<CourseLessonRowProps> = ({
    video,
    index,
    thumbUrl,
    splashUrl,
    formatDuration,
    onRowClick,
    onWatch,
}) => {
    const locked = Boolean(video.isLocked);
    const needsPlan = video.lockReason === 'subscription';
    const watchLimited = video.lockReason === 'watch_limit';
    const sequenceLocked = video.lockReason === 'sequence';
    const disabled = locked || needsPlan || watchLimited || sequenceLocked;
    const vid = video._id;

    return (
        <Box
            className="module-lesson-row"
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(video)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(video);
                }
            }}
            sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: `${courseLearningTheme.lessonThumbWidth.sm}px 1fr auto`,
                    md: `${courseLearningTheme.lessonThumbWidth.md}px 1fr auto`,
                },
                gridTemplateRows: { xs: 'auto auto auto', sm: '1fr' },
                columnGap: courseLearningTheme.space.gap,
                rowGap: courseLearningTheme.space.gap,
                minHeight: { sm: courseLearningTheme.space.lessonRowMinHeight },
                alignItems: { sm: 'center' },
                textAlign: 'left',
                cursor: 'pointer',
                bgcolor: courseLearningTheme.tileBg,
                transition: 'background-color 0.15s ease',
                outline: 'none',
                '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.1) },
                '&:focus-visible': { boxShadow: courseLearningTheme.focusRing },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    bgcolor: 'grey.900',
                    gridColumn: { xs: '1', sm: '1' },
                    gridRow: { xs: '1', sm: '1' },
                }}
            >
                <Box
                    component="img"
                    src={thumbUrl}
                    alt={video.title}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = splashUrl;
                    }}
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Chip
                    label={`${index + 1}`}
                    size="small"
                    aria-hidden
                    sx={{
                        display: { xs: 'none', sm: 'flex' },
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        minWidth: 28,
                        fontWeight: 800,
                        bgcolor: courseLearningTheme.accent,
                        color: '#fff',
                        border: 'none',
                        zIndex: 2,
                        '& .MuiChip-label': { px: 0.75 },
                    }}
                />
                {video.durationSeconds != null && video.durationSeconds > 0 && (
                    <Chip
                        label={formatDuration(video.durationSeconds)}
                        size="small"
                        icon={<AccessTimeIcon sx={{ color: `${courseLearningTheme.iconOnDark} !important`, fontSize: '14px !important' }} />}
                        sx={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            fontWeight: 600,
                            bgcolor: 'rgba(15, 23, 42, 0.88)',
                            color: courseLearningTheme.iconOnDark,
                            border: 'none',
                            zIndex: 2,
                            '& .MuiChip-icon': { ml: 0.5 },
                        }}
                    />
                )}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: disabled ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
                        zIndex: 1,
                    }}
                >
                    {disabled ? (
                        <LockOutlinedIcon sx={{ fontSize: 40, color: courseLearningTheme.iconOnDark }} />
                    ) : (
                        <PlayArrowIcon sx={{ fontSize: 48, color: courseLearningTheme.iconOnDark, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
                    )}
                </Box>
            </Box>

            <Stack
                sx={{
                    minWidth: 0,
                    p: courseLearningTheme.bandOuterP,
                    m: courseLearningTheme.space.gap,
                    gridColumn: { xs: '1', sm: '2' },
                    gridRow: { xs: '2', sm: '1' },
                    ...courseLearningTheme.learningColStackSx,
                }}
            >
                <Typography variant="overline" sx={{ color: courseLearningTheme.accent, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}>
                    Lesson {index + 1}
                </Typography>
                <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 800, lineHeight: 1.3, wordBreak: 'break-word', color: courseLearningTheme.textPrimary }}
                >
                    {video.title}
                </Typography>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: courseLearningTheme.space.gap, mt: courseLearningTheme.space.blockMt }}>
                    {sequenceLocked && (
                        <Chip
                            label={video.accessReason || 'Complete previous lesson'}
                            size="small"
                            variant="outlined"
                            icon={<LockOutlinedIcon sx={{ fontSize: 14, color: courseLearningTheme.iconMuted }} />}
                            sx={{ ...courseChipOutlinedSx, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                        />
                    )}
                    {watchLimited && (
                        <Chip label={video.accessReason || 'Watch limit reached'} size="small" variant="outlined" sx={courseChipWarningSx} />
                    )}
                    {!watchLimited &&
                        !sequenceLocked &&
                        !needsPlan &&
                        video.remainingWatches != null &&
                        (video.maxWatchesPerVideo ?? video.maxWatchesPerCycle) != null &&
                        video.remainingWatches <= 1 && (
                            <Chip
                                label={`${video.remainingWatches} watch${video.remainingWatches === 1 ? '' : 'es'} left`}
                                size="small"
                                variant="outlined"
                                sx={courseChipWarningSx}
                            />
                        )}
                    {needsPlan && (
                        <Chip label="Subscription required" size="small" variant="outlined" sx={courseChipWarningSx} />
                    )}
                    {!disabled && <Chip label="Ready" size="small" variant="outlined" sx={courseChipSuccessSx} />}
                </Stack>
            </Stack>

            <Box
                sx={{
                    p: courseLearningTheme.bandOuterP,
                    m: courseLearningTheme.space.gap,
                    gridColumn: { xs: '1', sm: '3' },
                    gridRow: { xs: '3', sm: '1' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'stretch', sm: 'flex-end' },
                }}
            >
                <Button
                    variant={disabled ? 'outlined' : 'contained'}
                    size="medium"
                    fullWidth={false}
                    disabled={false}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) {
                            onRowClick(video);
                            return;
                        }
                        if (vid) onWatch(vid);
                    }}
                    startIcon={disabled ? <LockOutlinedIcon /> : <PlayArrowIcon />}
                    sx={{
                        minWidth: { xs: '100%', sm: 120 },
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.5,
                        ...(disabled
                            ? {
                                  borderColor: alpha(courseLearningTheme.accent, 0.5),
                                  color: courseLearningTheme.textPrimary,
                                  bgcolor: alpha(courseLearningTheme.tileBg, 0.8),
                                  '&:hover': {
                                      borderColor: courseLearningTheme.accent,
                                      bgcolor: alpha(courseLearningTheme.accent, 0.1),
                                  },
                              }
                            : {
                                  bgcolor: courseLearningTheme.accent,
                                  color: '#fff',
                                  boxShadow: 'none',
                                  '&:hover': { bgcolor: courseLearningTheme.accentDark },
                              }),
                    }}
                >
                    {needsPlan ? 'View plans' : disabled ? 'Locked' : 'Watch'}
                </Button>
            </Box>
        </Box>
    );
};

export default CourseLessonRow;
