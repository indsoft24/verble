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
    alpha,
    LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { keyframes } from '@emotion/react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import {
    getUserSceneSubmission,
    submitSceneSummaries,
    type UserSceneSubmission,
} from '../../services/sceneSubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import {
    countFilledSummaries,
    getSceneSubmissionSummaries,
    isSceneSubmissionReady,
    SCENE_MAX_EVALUATION_SCORE,
    SCENE_MAX_SUMMARIES,
    SCENE_MIN_SUMMARIES,
} from '../../utils/sceneActivityUtils';
import { applyPreferredFemaleEnVoice } from '../../utils/ttsVoice';
import { Link as RouterLink } from 'react-router-dom';
import { canAccessGoldTierContent } from '../../utils/userAccessState';
import {
    activityCardShell,
    getContentDisplayNumber,
    isContentScheduledToday,
    refreshAdjacentFlags,
    canShowNextNavigation,
    GOLD_ACCENT,
} from '../../utils/dailyActivityUi';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';

interface SceneCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
    /** Optional override; otherwise derived from the logged-in user's subscription. */
    hasGoldAccess?: boolean;
    onNavigateToProfessional?: () => void;
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
    hasGoldAccess: hasGoldAccessProp,
    onNavigateToProfessional,
}) => {
    const { user } = useAuth();
    const [summaryDrafts, setSummaryDrafts] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState<UserSceneSubmission | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const needsGold = isGoldLikeLevel(currentContent.level);
    const hasGoldAccess =
        hasGoldAccessProp ?? (user ? canAccessGoldTierContent(user) : false);
    const canAccessGoldContent = !needsGold || hasGoldAccess;

    const loadSubmission = useCallback(async (sceneId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        const sub = await getUserSceneSubmission(sceneId);
        setExistingSubmission(sub);
        if (sub) {
            const texts = getSceneSubmissionSummaries(sub);
            if (texts.length > 0) {
                setSummaryDrafts(texts);
            }
        }
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
        setSummaryDrafts(['', '']);
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
                setSummaryDrafts(['', '']);
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

    const submissionPrompt =
        String(currentContent.metadata?.submissionPrompt || '').trim() ||
        `Write ${SCENE_MIN_SUMMARIES} to ${SCENE_MAX_SUMMARIES} short summaries in your own words about what you understood from the scene. You do not need to fill every box—only submit summaries you are happy with.`;

    const filledCount = countFilledSummaries(summaryDrafts);
    const canSubmitSummaries = isSceneSubmissionReady(summaryDrafts);

    const updateSummaryDraft = (index: number, value: string) => {
        setSummaryDrafts((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const addSummaryField = () => {
        if (summaryDrafts.length >= SCENE_MAX_SUMMARIES) return;
        setSummaryDrafts((prev) => [...prev, '']);
    };

    const removeSummaryField = (index: number) => {
        if (summaryDrafts.length <= SCENE_MIN_SUMMARIES) return;
        setSummaryDrafts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitSummaries = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({
                type: 'error',
                message: "You can only submit summaries for today's scene.",
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
        if (existingSubmission) {
            setSubmitStatus({ type: 'error', message: 'You have already submitted for this scene.' });
            return;
        }

        const summaries = summaryDrafts.map((s) => s.trim()).filter(Boolean);
        if (!isSceneSubmissionReady(summaries)) {
            setSubmitStatus({
                type: 'error',
                message: `Please write at least ${SCENE_MIN_SUMMARIES} summaries (up to ${SCENE_MAX_SUMMARIES}).`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const { participationPointsAwarded } = await submitSceneSummaries(
                currentContent._id,
                summaries
            );
            const participation = participationPointsAwarded ?? 10;
            setSubmitStatus({
                type: 'success',
                message: `Submitted ${summaries.length} summar${summaries.length === 1 ? 'y' : 'ies'}! ${participation > 0 ? `+${participation} participation points on the leaderboard. ` : ''}An instructor will review your work and award up to ${SCENE_MAX_EVALUATION_SCORE} evaluation points.`,
            });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            await loadSubmission(currentContent._id);
            onSubmissionSuccess?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSubmitStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to submit summaries. Please try again.',
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
    const reviewedScore =
        existingSubmission?.evaluationPoints ?? existingSubmission?.pointsEarned ?? 0;
    const hasReviewScore = Boolean(existingSubmission?.reviewedAt);
    const locked = Boolean(existingSubmission);
    const displaySummaries = locked
        ? getSceneSubmissionSummaries(existingSubmission!)
        : summaryDrafts;

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
                <Alert
                    severity="warning"
                    sx={{ alignItems: 'center' }}
                    action={
                        user ? (
                            <Button
                                color="inherit"
                                size="small"
                                component={RouterLink}
                                to="/subscription-plans"
                                sx={{ fontWeight: 700 }}
                            >
                                View plans
                            </Button>
                        ) : (
                            <Button
                                color="inherit"
                                size="small"
                                component={RouterLink}
                                to="/login"
                                sx={{ fontWeight: 700 }}
                            >
                                Log in
                            </Button>
                        )
                    }
                >
                    {user
                        ? 'Explain the Scene is included with a Gold or Full Course subscription. Upgrade to unlock today\'s scene and submit your description.'
                        : 'Log in with a Gold or Full Course account to view and submit scene descriptions.'}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="SCENE"
                        accentColor={GOLD_ACCENT}
                        displayNumber={displayNumber}
                        sx={{ mb: 2 }}
                    />

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

                </CardContent>
            </Card>

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}
                    >
                        Your scene summaries
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        {submissionPrompt} +10 participation points when you submit. After review, earn up to{' '}
                        {SCENE_MAX_EVALUATION_SCORE} evaluation points for your overall submission.
                    </Typography>

                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Past scene — browse only. Submit summaries on today&apos;s scene.
                        </Alert>
                    )}

                    {existingSubmission && (
                        <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                You submitted {getSceneSubmissionSummaries(existingSubmission).length} summar
                                {getSceneSubmissionSummaries(existingSubmission).length === 1 ? 'y' : 'ies'}
                                {existingSubmission.createdAt
                                    ? ` on ${new Date(existingSubmission.createdAt).toLocaleDateString()}`
                                    : ''}
                                .
                            </Alert>
                            {hasReviewScore ? (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Evaluation score: {reviewedScore} / {SCENE_MAX_EVALUATION_SCORE}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(
                                            100,
                                            (reviewedScore / SCENE_MAX_EVALUATION_SCORE) * 100
                                        )}
                                        sx={{ mt: 1, height: 8, borderRadius: 1, bgcolor: alpha('#fff', 0.1) }}
                                    />
                                    {existingSubmission.feedback && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Feedback: {existingSubmission.feedback}
                                        </Typography>
                                    )}
                                </Alert>
                            ) : (
                                <EvaluationStatusBanner
                                    isCorrect={existingSubmission.isCorrect}
                                    evaluationPoints={existingSubmission.evaluationPoints}
                                    pointsEarned={existingSubmission.pointsEarned}
                                    feedback={existingSubmission.feedback}
                                    reviewedAt={existingSubmission.reviewedAt}
                                />
                            )}
                        </>
                    )}

                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmitSummaries}>
                        {displaySummaries.map((_, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha('#1a1f2e', 0.55),
                                    border: `1px solid ${alpha(GOLD_ACCENT, 0.2)}`,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1,
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                        Summary {idx + 1}
                                    </Typography>
                                    {!locked &&
                                        summaryDrafts.length > SCENE_MIN_SUMMARIES &&
                                        idx >= SCENE_MIN_SUMMARIES && (
                                            <IconButton
                                                size="small"
                                                onClick={() => removeSummaryField(idx)}
                                                aria-label="Remove summary"
                                                sx={{ color: alpha('#e2e8f0', 0.6) }}
                                            >
                                                <RemoveCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    placeholder="Describe part of the scene in your own words…"
                                    value={locked ? displaySummaries[idx] || '' : summaryDrafts[idx] || ''}
                                    onChange={(e) => updateSummaryDraft(idx, e.target.value)}
                                    disabled={locked || !isToday || isSubmitting}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: alpha('#0f172a', 0.4),
                                            color: '#e2e8f0',
                                        },
                                    }}
                                />
                            </Box>
                        ))}

                        {!locked && isToday && user && (
                            <>
                                {summaryDrafts.length < SCENE_MAX_SUMMARIES && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={addSummaryField}
                                        sx={{
                                            mb: 2,
                                            borderColor: alpha(GOLD_ACCENT, 0.5),
                                            color: GOLD_ACCENT,
                                        }}
                                    >
                                        Add another summary ({summaryDrafts.length}/{SCENE_MAX_SUMMARIES})
                                    </Button>
                                )}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        pt: 1,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.55) }}>
                                        {filledCount} of {SCENE_MAX_SUMMARIES} filled · minimum {SCENE_MIN_SUMMARIES}{' '}
                                        to submit
                                    </Typography>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        endIcon={
                                            isSubmitting ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                <SendIcon />
                                            )
                                        }
                                        disabled={!canSubmitSummaries || isSubmitting}
                                        sx={{
                                            bgcolor: GOLD_ACCENT,
                                            color: '#0f172a',
                                            fontWeight: 800,
                                            minWidth: 200,
                                        }}
                                    >
                                        {isSubmitting ? 'Submitting…' : 'Submit summaries'}
                                    </Button>
                                </Box>
                            </>
                        )}
                        {!user && (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                Please log in to submit your summaries.
                            </Typography>
                        )}
                    </Box>
                    <ActivityTierNavFooter
                        accentColor={GOLD_ACCENT}
                        left={{
                            label: 'Previous Scene',
                            onClick: () => handleNavigation('prev'),
                            disabled: !hasPrevious,
                            loading: isLoadingNav,
                        }}
                        center={{
                            label: '→ Professional Conversations',
                            onClick: onNavigateToProfessional,
                        }}
                        right={{
                            label: 'Next Scene',
                            onClick: () => handleNavigation('next'),
                            disabled: !canGoNext,
                            loading: isLoadingNav,
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default SceneCard;
