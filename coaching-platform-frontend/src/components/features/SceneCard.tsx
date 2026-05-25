// src/components/features/SceneCard.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    alpha,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getUserSceneSubmission } from '../../services/sceneSubmissionService';
import { applyPreferredFemaleEnVoice } from '../../utils/ttsVoice';
import {
    activityCardShell,
    getContentDisplayNumber,
    isContentScheduledToday,
    refreshAdjacentFlags,
    canShowNextNavigation,
    GOLD_ACCENT,
} from '../../utils/dailyActivityUi';

interface SceneCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
    hasGoldAccess?: boolean;
}

const confettiFall = keyframes`
    from { transform: translateY(0) rotate(0deg); opacity: 1; }
    to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
`;

const ConfettiEffect: React.FC = () => (
    <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1400, overflow: 'hidden' }}>
        {Array.from({ length: 50 }).map((_, i) => (
            <Box
                key={i}
                sx={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    backgroundColor: ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'][i % 6],
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animation: `${confettiFall} ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
                }}
            />
        ))}
    </Box>
);

const isGoldLikeLevel = (level: string) => level === 'GOLD' || level === 'BONUS';

const SceneCard: React.FC<SceneCardProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    hasGoldAccess = false,
}) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState<{ description: string; pointsEarned?: number } | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const needsGold = isGoldLikeLevel(currentContent.level);
    const canAccessGoldContent = !needsGold || hasGoldAccess;

    const loadSubmission = useCallback(async (sceneId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        const sub = await getUserSceneSubmission(sceneId);
        setExistingSubmission(sub ? { description: sub.description, pointsEarned: sub.pointsEarned } : null);
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            audioRef.current?.pause();
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        setCurrentContent(data);
        setDescription('');
        setSubmitStatus(null);
        void loadSubmission(data._id);
        void checkAdjacent(data._id);
    }, [data, loadSubmission, checkAdjacent]);

    const stopAudio = () => {
        audioRef.current?.pause();
        synthRef.current?.cancel();
        setPlayingKey(null);
    };

    const playTTS = (text: string, onEnd: () => void) => {
        if (!synthRef.current || !text.trim()) {
            onEnd();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        applyPreferredFemaleEnVoice(utterance);
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
        synthRef.current.speak(utterance);
    };

    const playText = (text: string, key: string, audioUrl?: string) => {
        if (!text?.trim()) return;
        if (playingKey === key) {
            stopAudio();
            return;
        }
        stopAudio();
        setPlayingKey(key);
        const finish = () => setPlayingKey(null);
        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = finish;
                audio.onerror = () => playTTS(text, finish);
                audio.play().catch(() => playTTS(text, finish));
                return;
            } catch {
                /* fallback to TTS */
            }
        }
        playTTS(text, finish);
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        setSubmitStatus(null);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);
            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setDescription('');
                onContentChange?.(adjacentContent);
                await loadSubmission(adjacentContent._id);
                await checkAdjacent(adjacentContent._id);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} scene available.`,
                });
            }
        } catch {
            setSubmitStatus({ type: 'error', message: 'Failed to load scene.' });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSubmitDescription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({
                type: 'error',
                message: "You can only submit a description for today's scene.",
            });
            return;
        }
        if (!canAccessGoldContent) {
            setSubmitStatus({
                type: 'error',
                message: 'Gold membership is required to submit for this scene.',
            });
            return;
        }
        if (!description.trim()) {
            setSubmitStatus({ type: 'error', message: 'Please describe the scene before submitting.' });
            return;
        }
        if (existingSubmission) {
            setSubmitStatus({ type: 'error', message: 'You have already submitted for this scene.' });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const response = await apiClient.post('/submit-scene-description', {
                sceneId: currentContent._id,
                description: description.trim(),
            });
            if (response.data?.status === 'success') {
                const pts = response.data.data.submission.pointsEarned;
                setSubmitStatus({
                    type: 'success',
                    message: `Submitted! You earned ${pts} points. Up to 2 more points per correct sentence may be added after review.`,
                });
                setDescription('');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                await loadSubmission(currentContent._id);
                onSubmissionSuccess?.();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit description',
                });
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSubmitStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to submit description. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayNumber = getContentDisplayNumber(currentContent.sequenceNumber);
    const isToday = isContentScheduledToday(currentContent.date);
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);
    const sceneTitle = currentContent.title || '';
    const imageUrl = currentContent.metadata?.imageUrl || currentContent.metadata?.gifUrl || '';
    const explanation = currentContent.metadata?.explanation || '';
    const hindiSummary = currentContent.metadata?.hindiSummary || '';
    const keywords = (currentContent.metadata?.keywords || []) as Array<{
        word?: string;
        meaning_hi?: string;
        translation_hi?: string;
    }>;
    const narrationAudio = currentContent.metadata?.audio as string | undefined;

    const SpeakerButton: React.FC<{ text: string; playKey: string; audioUrl?: string }> = ({
        text,
        playKey,
        audioUrl,
    }) => (
        <IconButton
            size="small"
            onClick={() => playText(text, playKey, audioUrl)}
            sx={{ color: GOLD_ACCENT, bgcolor: alpha(GOLD_ACCENT, 0.12) }}
            aria-label="Play"
        >
            {playingKey === playKey ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
    );

    if (!canAccessGoldContent) {
        return (
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Alert severity="warning">
                    This scene is part of the Gold track. Upgrade to Gold to view and submit scene descriptions.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2 }}>
                            Explain the Scene
                        </Typography>
                        {displayNumber && (
                            <Chip
                                label={displayNumber}
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: alpha(GOLD_ACCENT, 0.6), color: GOLD_ACCENT }}
                            />
                        )}
                        <Chip label={currentContent.level} size="small" variant="outlined" sx={{ color: alpha('#e2e8f0', 0.8) }} />
                    </Box>

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            mb: 3,
                            background: `linear-gradient(135deg, #e2e8f0, ${GOLD_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {sceneTitle}
                    </Typography>

                    {imageUrl && (
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Box
                                component="img"
                                src={imageUrl}
                                alt={sceneTitle}
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: 400,
                                    borderRadius: 2,
                                    objectFit: 'contain',
                                    border: `1px solid ${alpha(GOLD_ACCENT, 0.3)}`,
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </Box>
                    )}

                    {explanation && (
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', flex: 1 }}>
                                    Scene Explanation
                                </Typography>
                                <SpeakerButton text={explanation} playKey="explanation" audioUrl={narrationAudio} />
                            </Box>
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.9), whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                {explanation}
                            </Typography>
                        </Box>
                    )}

                    {hindiSummary && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                                Hindi Summary
                            </Typography>
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.75), fontStyle: 'italic', lineHeight: 1.8 }}>
                                {hindiSummary}
                            </Typography>
                        </Box>
                    )}

                    {keywords.length > 0 && (
                        <Box
                            sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha('#1a1f2e', 0.8),
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.25)}`,
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5 }}>
                                Keywords
                            </Typography>
                            {keywords.map((keyword, index) => {
                                const word = keyword.word || '';
                                const meaning = keyword.meaning_hi || keyword.translation_hi || '';
                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                            mb: index < keywords.length - 1 ? 1.5 : 0,
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                                                    {word}
                                                </Typography>
                                                {word && <SpeakerButton text={word} playKey={`kw-${index}`} />}
                                            </Box>
                                            {meaning && (
                                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7), mt: 0.25 }}>
                                                    {meaning}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => handleNavigation('prev')}
                            disabled={!hasPrevious || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85) }}
                        >
                            Previous Scene
                        </Button>
                        <Button
                            variant="text"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleNavigation('next')}
                            disabled={!canGoNext || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85) }}
                        >
                            Next Scene
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}
                    >
                        Describe the scene in your own words
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        You earn 10 points when you submit. After review, you may earn 2 additional points for each
                        correct sentence.
                    </Typography>

                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Past scene — browse only. Submit on today&apos;s scene.
                        </Alert>
                    )}
                    {existingSubmission && isToday && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            You already submitted this scene
                            {existingSubmission.pointsEarned != null
                                ? ` (${existingSubmission.pointsEarned} points earned so far).`
                                : '.'}
                        </Alert>
                    )}
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmitDescription}>
                        {isToday && !existingSubmission && (
                            <>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    placeholder="Describe what you see in the scene..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting || !user}
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: alpha('#1a1f2e', 0.6),
                                            color: '#e2e8f0',
                                        },
                                    }}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    disabled={!description.trim() || isSubmitting || !user}
                                    sx={{ bgcolor: GOLD_ACCENT, color: '#0f172a', fontWeight: 800, minWidth: 180 }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Description'}
                                </Button>
                            </>
                        )}
                        {!user && (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                Please log in to submit a description.
                            </Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SceneCard;
