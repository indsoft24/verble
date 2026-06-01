// src/components/features/SpeechCard.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import {
    getUserSpeechSubmission,
    submitSpeechSummaries,
    type UserSpeechSubmission,
} from '../../services/speechSubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import ActivitySourceCredit from './ActivitySourceCredit';
import {
    activityCardShell,
    GOLD_ACCENT,
    isContentScheduledToday,
    refreshAdjacentFlags,
    canShowNextNavigation,
} from '../../utils/dailyActivityUi';
import {
    SUMMARY_MIN,
    SUMMARY_MAX,
    MAX_EVALUATION_SCORE,
    countFilledSummaries,
    getSubmissionSummaries,
    isSummarySubmissionReady,
} from '../../utils/goldSummaryActivityUtils';

interface SpeechCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
    onNavigateToLyrics?: () => void;
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

const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
};

const SpeechCard: React.FC<SpeechCardProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    onNavigateToLyrics,
}) => {
    const { user } = useAuth();
    const [summaryDrafts, setSummaryDrafts] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState<UserSpeechSubmission | null>(null);

    const loadSubmission = useCallback(async (speechId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        const sub = await getUserSpeechSubmission(speechId);
        setExistingSubmission(sub);
        if (sub) {
            const texts = getSubmissionSummaries(sub);
            if (texts.length > 0) setSummaryDrafts(texts);
        }
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        setCurrentContent(data);
        setSummaryDrafts(['', '']);
        setSubmitStatus(null);
        void loadSubmission(data._id);
        void checkAdjacent(data._id);
    }, [data, loadSubmission, checkAdjacent]);

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
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} speech available.`,
                });
            }
        } catch {
            setSubmitStatus({ type: 'error', message: 'Failed to load speech.' });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const filledCount = countFilledSummaries(summaryDrafts);
    const canSubmitSummaries = isSummarySubmissionReady(summaryDrafts);
    const isToday = isContentScheduledToday(currentContent.date);
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);
    const locked = !!existingSubmission;
    const displaySummaries = locked ? getSubmissionSummaries(existingSubmission) : summaryDrafts;

    const updateSummaryDraft = (index: number, value: string) => {
        setSummaryDrafts((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const addSummaryField = () => {
        if (summaryDrafts.length >= SUMMARY_MAX) return;
        setSummaryDrafts((prev) => [...prev, '']);
    };

    const removeSummaryField = (index: number) => {
        if (summaryDrafts.length <= SUMMARY_MIN) return;
        setSummaryDrafts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitSummaries = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({ type: 'error', message: "You can only submit summaries for today's speech." });
            return;
        }
        const summaries = summaryDrafts.map((s) => s.trim()).filter(Boolean);
        if (!isSummarySubmissionReady(summaries)) {
            setSubmitStatus({
                type: 'error',
                message: `Please write at least ${SUMMARY_MIN} summaries (up to ${SUMMARY_MAX}).`,
            });
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const { participationPointsAwarded } = await submitSpeechSummaries(currentContent._id, summaries);
            const participation = participationPointsAwarded ?? 10;
            setSubmitStatus({
                type: 'success',
                message: `Submitted ${summaries.length} summar${summaries.length === 1 ? 'y' : 'ies'}! ${participation > 0 ? `+${participation} participation points on the leaderboard. ` : ''}After review: up to ${MAX_EVALUATION_SCORE} points (10 per correct summary).`,
            });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            await loadSubmission(currentContent._id);
            onSubmissionSuccess?.();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to submit summaries. Please try again.';
            setSubmitStatus({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const speechDisplayTag = getDisplayTag(currentContent.sequenceNumber);
    const speechTitle = currentContent.title || '';
    const speakerName = currentContent.metadata?.speaker || '';
    const credit = String(currentContent.metadata?.credit || '');
    const creditUrl = String(currentContent.metadata?.creditUrl || '');
    const youtubeUrl = currentContent.metadata?.youtubeUrl || '';
    const transcript = currentContent.metadata?.transcript || '';
    const keywords = currentContent.metadata?.keywords || [];
    const phrases = currentContent.metadata?.phrases || [];
    const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
    const embedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null;

    const reviewedScore = existingSubmission?.evaluationPoints ?? existingSubmission?.pointsEarned ?? 0;
    const hasReviewScore =
        !!existingSubmission?.reviewedAt &&
        typeof reviewedScore === 'number' &&
        reviewedScore > 0;

    const getSummaryReviewState = (index: number): boolean | null => {
        if (!existingSubmission?.sentenceValidations?.length) return null;
        const found = existingSubmission.sentenceValidations.find((v) => v.sentenceIndex === index);
        return found ? found.isCorrect : null;
    };

    return (
        <Box sx={{ maxWidth: { xs: '100%', sm: 800 }, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="SPEECH"
                        accentColor={GOLD_ACCENT}
                        displayNumber={speechDisplayTag}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            mb: 0.5,
                            background: `linear-gradient(135deg, #e2e8f0, ${GOLD_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {speechTitle}
                    </Typography>
                    {speakerName && (
                        <Typography variant="body1" sx={{ color: alpha('#e2e8f0', 0.7), mb: 1 }}>
                            by {speakerName}
                        </Typography>
                    )}

                    <ActivitySourceCredit
                        creditLabel={credit}
                        creditUrl={creditUrl}
                        accentColor={GOLD_ACCENT}
                    />

                    {embedUrl && (
                        <Box
                            sx={{
                                position: 'relative',
                                paddingTop: '56.25%',
                                bgcolor: '#000',
                                borderRadius: 2,
                                overflow: 'hidden',
                                mb: 3,
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.3)}`,
                            }}
                        >
                            <iframe
                                src={embedUrl}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={speechTitle}
                            />
                        </Box>
                    )}

                    {transcript && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                                Transcript
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    maxHeight: 400,
                                    overflowY: 'auto',
                                    bgcolor: alpha('#1a1f2e', 0.55),
                                    border: `1px solid ${alpha(GOLD_ACCENT, 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: alpha('#e2e8f0', 0.9) }}
                                >
                                    {transcript}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {keywords.length > 0 && (
                        <Accordion
                            sx={{
                                mb: 2,
                                bgcolor: alpha('#1a1f2e', 0.4),
                                color: '#f8fafc',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: GOLD_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>Keywords ({keywords.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {keywords.map((keyword: Record<string, string>, index: number) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {keyword.word || keyword.phrase}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                {keyword.meaning || keyword.meaning_en}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {phrases.length > 0 && (
                        <Accordion
                            sx={{
                                mb: 2,
                                bgcolor: alpha('#1a1f2e', 0.4),
                                color: '#f8fafc',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: GOLD_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>Key Phrases ({phrases.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {phrases.map((phrase: Record<string, string>, index: number) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {phrase.phrase || phrase.text}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                {phrase.meaning || phrase.meaning_en}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}
                    >
                        Your speech summaries
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Write {SUMMARY_MIN} to {SUMMARY_MAX} short summaries in your own words about what you took
                        from the speech. +10 participation when you submit. After review:{' '}
                        <strong>10 points per correct summary</strong> (up to {MAX_EVALUATION_SCORE}).
                    </Typography>

                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Past speech — browse only. Submit summaries on today&apos;s speech.
                        </Alert>
                    )}

                    {existingSubmission && (
                        <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                You submitted {getSubmissionSummaries(existingSubmission).length} summar
                                {getSubmissionSummaries(existingSubmission).length === 1 ? 'y' : 'ies'}
                                {existingSubmission.createdAt
                                    ? ` on ${new Date(existingSubmission.createdAt).toLocaleDateString()}`
                                    : ''}
                                .
                            </Alert>
                            {hasReviewScore || existingSubmission.sentenceValidations?.length ? (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Evaluation score: {reviewedScore} / {MAX_EVALUATION_SCORE}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(100, (reviewedScore / MAX_EVALUATION_SCORE) * 100)}
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
                        {displaySummaries.map((_, idx) => {
                            const review = getSummaryReviewState(idx);
                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha('#1a1f2e', 0.55),
                                        border: `1px solid ${
                                            review === true
                                                ? alpha('#34d399', 0.6)
                                                : review === false
                                                  ? alpha('#f87171', 0.5)
                                                  : alpha(GOLD_ACCENT, 0.2)
                                        }`,
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
                                            {review === true && (
                                                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#34d399' }}>
                                                    +10
                                                </Typography>
                                            )}
                                        </Typography>
                                        {!locked &&
                                            summaryDrafts.length > SUMMARY_MIN &&
                                            idx >= SUMMARY_MIN && (
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
                                        placeholder="Summarize part of the speech in your own words…"
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
                            );
                        })}

                        {!locked && isToday && user && (
                            <>
                                {summaryDrafts.length < SUMMARY_MAX && (
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
                                        Add another summary ({summaryDrafts.length}/{SUMMARY_MAX})
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
                                        {filledCount} of {SUMMARY_MAX} filled · minimum {SUMMARY_MIN} to submit
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
                            label: 'Previous Speech',
                            onClick: () => handleNavigation('prev'),
                            disabled: !hasPrevious,
                            loading: isLoadingNav,
                        }}
                        center={{
                            label: '→ Song Lyrics',
                            onClick: onNavigateToLyrics,
                        }}
                        right={{
                            label: 'Next Speech',
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

export default SpeechCard;
