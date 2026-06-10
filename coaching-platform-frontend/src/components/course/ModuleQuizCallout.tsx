import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, LinearProgress, Stack, Typography, alpha } from '@mui/material';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { ModuleQuizAvailability } from '../../services/moduleQuizService';
import { courseLearningTheme } from './courseLearningTheme';

export interface ModuleQuizCalloutProps {
    moduleId: string;
    gate: ModuleQuizAvailability;
}

const ModuleQuizCallout: React.FC<ModuleQuizCalloutProps> = ({ moduleId, gate }) => {
    if (!gate.hasQuiz) return null;

    const quizPath = `/modules/${moduleId}/quiz`;
    const videosDone = gate.videosCompleted ?? 0;
    const videosTotal = gate.totalVideos ?? 0;
    const progressPct =
        videosTotal > 0 ? Math.min(100, Math.round((videosDone / videosTotal) * 100)) : 0;

    const shellSx = {
        mt: courseLearningTheme.space.sectionMt,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(courseLearningTheme.accent, 0.35)}`,
        bgcolor: courseLearningTheme.tileBg,
    };

    if (gate.quizState === 'exhausted' || gate.needsAdminReset) {
        return (
            <Box sx={{ ...shellSx, borderColor: alpha(courseLearningTheme.highlight, 0.5) }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <WarningAmberOutlinedIcon sx={{ color: courseLearningTheme.highlight, mt: 0.25 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, mb: 0.5 }}>
                            Quiz attempts used
                        </Typography>
                        <Typography variant="body2" sx={{ color: courseLearningTheme.textBody, lineHeight: 1.55, mb: 1.5 }}>
                            {gate.message}
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            to="/help"
                            sx={{
                                borderColor: alpha(courseLearningTheme.highlight, 0.6),
                                color: courseLearningTheme.textPrimary,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Contact support
                        </Button>
                    </Box>
                </Stack>
            </Box>
        );
    }

    if (gate.quizState === 'passed') {
        return (
            <Box sx={{ ...shellSx, borderColor: alpha(courseLearningTheme.accent, 0.55) }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckCircleOutlineIcon sx={{ color: courseLearningTheme.accent, mt: 0.25 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, mb: 0.5 }}>
                            Module quiz passed
                        </Typography>
                        <Typography variant="body2" sx={{ color: courseLearningTheme.textBody, lineHeight: 1.55, mb: 1.5 }}>
                            {gate.message}
                        </Typography>
                        {gate.canTakeQuiz && (
                            <Button
                                size="small"
                                variant="outlined"
                                component={RouterLink}
                                to={quizPath}
                                sx={{
                                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                                    color: courseLearningTheme.textPrimary,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Review quiz
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Box>
        );
    }

    if (gate.quizState === 'ready' && gate.canTakeQuiz) {
        return (
            <Box
                sx={{
                    ...shellSx,
                    borderColor: alpha(courseLearningTheme.highlight, 0.55),
                    boxShadow: `0 4px 24px ${alpha(courseLearningTheme.highlight, 0.12)}`,
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <QuizOutlinedIcon sx={{ fontSize: 40, color: courseLearningTheme.highlight, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, mb: 0.5 }}>
                            Module quiz ready
                        </Typography>
                        <Typography variant="body2" sx={{ color: courseLearningTheme.textBody, lineHeight: 1.55 }}>
                            {gate.message}
                        </Typography>
                        {gate.quizFailedAttempts > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: courseLearningTheme.textMuted }}>
                                Attempt {gate.quizFailedAttempts + 1} of {gate.maxQuizAttempts}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        component={RouterLink}
                        to={quizPath}
                        sx={{
                            flexShrink: 0,
                            bgcolor: courseLearningTheme.accent,
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            '&:hover': { bgcolor: courseLearningTheme.accentDark },
                        }}
                    >
                        Take module quiz
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={shellSx}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <LockOutlinedIcon sx={{ color: courseLearningTheme.textMuted, mt: 0.25 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, mb: 0.5 }}>
                        Module quiz locked
                    </Typography>
                    <Typography variant="body2" sx={{ color: courseLearningTheme.textBody, lineHeight: 1.55, mb: 1.25 }}>
                        {gate.message}
                    </Typography>
                    {videosTotal > 0 && (
                        <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted, display: 'block', mb: 1 }}>
                            Lessons completed: {videosDone}/{videosTotal}
                        </Typography>
                    )}
                    {videosTotal > 0 && (
                        <LinearProgress
                            variant="determinate"
                            value={progressPct}
                            sx={{
                                height: 6,
                                borderRadius: 6,
                                bgcolor: alpha(courseLearningTheme.accent, 0.2),
                                '& .MuiLinearProgress-bar': { bgcolor: courseLearningTheme.accent },
                            }}
                        />
                    )}
                </Box>
            </Stack>
        </Box>
    );
};

export default ModuleQuizCallout;
