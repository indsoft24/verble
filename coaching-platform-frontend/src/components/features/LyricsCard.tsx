// src/components/features/LyricsCard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    alpha,
    Button,
    TextField,
    IconButton,
    CircularProgress,
    Alert,
    LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import { extractYouTubeVideoId } from '../../utils/mediaUrlUtils';
import {
    getUserLyricsSubmission,
    submitLyricsSentences,
    type UserLyricsSubmission,
} from '../../services/lyricsSubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import ActivitySourceCredit from './ActivitySourceCredit';
import YouTubeAudioPlayer from './YouTubeAudioPlayer';
import DirectAudioPlayer from './DirectAudioPlayer';
import {
    activityAlertOnDarkSx,
    activityCardProps,
    activityContainedButtonSx,
    activitySubmittedTextSx,
    activitySummaryTextFieldSx,
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

const LYRICS_ACCENT = '#e91e63';

interface LyricsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: (progress?: import('../../services/authService').UserProgressSnapshot) => void;
    onNavigateToSpeech?: () => void;
    onNavigateToFeed?: () => void;
}

const darkAccordionSx = {
    mb: 2,
    bgcolor: alpha('#1a1f2e', 0.4),
    color: '#f8fafc',
    '&:before': { display: 'none' },
};

const LyricsCard: React.FC<LyricsCardProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    onNavigateToFeed,
}) => {
    const { user } = useAuth();
    const [sentenceDrafts, setSentenceDrafts] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState<UserLyricsSubmission | null>(null);

    const loadSubmission = useCallback(async (lyricsId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        const sub = await getUserLyricsSubmission(lyricsId);
        setExistingSubmission(sub);
        if (sub) {
            const texts = getSubmissionSummaries(sub);
            if (texts.length > 0) setSentenceDrafts(texts);
        }
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        setCurrentContent(data);
        setSentenceDrafts(['', '']);
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
                setSentenceDrafts(['', '']);
                onContentChange?.(adjacentContent);
                await loadSubmission(adjacentContent._id);
                await checkAdjacent(adjacentContent._id);
            }
        } catch {
            /* ignore */
        } finally {
            setIsLoadingNav(false);
        }
    };

    const filledCount = countFilledSummaries(sentenceDrafts);
    const canSubmitSentences = isSummarySubmissionReady(sentenceDrafts);
    const isToday = isContentScheduledToday(currentContent.date);
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);

    const tierNavFooter = (
        <ActivityTierNavFooter
            accentColor={GOLD_ACCENT}
            left={{
                label: 'Previous Lyrics',
                onClick: () => handleNavigation('prev'),
                disabled: !hasPrevious,
                loading: isLoadingNav,
            }}
            center={{
                label: '→ Instagram Feeds',
                onClick: onNavigateToFeed,
            }}
            right={{
                label: 'Next Lyrics',
                onClick: () => handleNavigation('next'),
                disabled: !canGoNext,
                loading: isLoadingNav,
            }}
        />
    );

    const locked = !!existingSubmission;
    const displaySentences = locked ? getSubmissionSummaries(existingSubmission) : sentenceDrafts;

    const updateSentenceDraft = (index: number, value: string) => {
        setSentenceDrafts((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const addSentenceField = () => {
        if (sentenceDrafts.length >= SUMMARY_MAX) return;
        setSentenceDrafts((prev) => [...prev, '']);
    };

    const removeSentenceField = (index: number) => {
        if (sentenceDrafts.length <= SUMMARY_MIN) return;
        setSentenceDrafts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitSentences = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({ type: 'error', message: "You can only submit sentences for today's song." });
            return;
        }
        const summaries = sentenceDrafts.map((s) => s.trim()).filter(Boolean);
        if (!isSummarySubmissionReady(summaries)) {
            setSubmitStatus({
                type: 'error',
                message: `Please write at least ${SUMMARY_MIN} sentences (up to ${SUMMARY_MAX}).`,
            });
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const { participationPointsAwarded, progress } = await submitLyricsSentences(
                currentContent._id,
                summaries
            );
            const participation = participationPointsAwarded ?? 10;
            setSubmitStatus({
                type: 'success',
                message: `Submitted ${summaries.length} sentence${summaries.length === 1 ? '' : 's'}! ${participation > 0 ? `+${participation} participation points. ` : ''}After review: up to ${MAX_EVALUATION_SCORE} points (10 per correct sentence).`,
            });
            await loadSubmission(currentContent._id);
            onSubmissionSuccess?.(progress);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to submit sentences. Please try again.';
            setSubmitStatus({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSentenceReviewState = (index: number): boolean | null => {
        const v = existingSubmission?.sentenceValidations?.find((x) => x.sentenceIndex === index);
        if (v == null) return null;
        return v.isCorrect;
    };

    const reviewedScore =
        existingSubmission?.evaluationPoints ?? existingSubmission?.pointsEarned ?? 0;
    const hasReviewScore = reviewedScore > 0;

    const lyricsDisplayTag = getDisplayTag(currentContent.sequenceNumber);
    const songTitle = currentContent.title || '';
    const artist = String(currentContent.metadata?.artist || '');
    const lyrics = String(currentContent.metadata?.lyrics || '');
    const youtubeUrl = String(currentContent.metadata?.youtubeUrl || '');
    const audioUrl = String(currentContent.metadata?.audio || '');
    const credit = String(currentContent.metadata?.credit || '');
    const creditUrl = String(currentContent.metadata?.creditUrl || '');
    const words = (currentContent.metadata?.words as unknown[]) || [];
    const phrases = (currentContent.metadata?.phrases as unknown[]) || [];

    const hasYoutube = Boolean(extractYouTubeVideoId(youtubeUrl));

    const renderWordMeaning = (word: Record<string, string>) => {
        const en = (word.meaning_en || word.meaning || '').trim();
        const hi = (word.meaning_hi || '').trim();
        if (en && hi) return `${en} · ${hi}`;
        return en || hi || '';
    };

    const renderPhraseMeaning = (phrase: Record<string, string>) => {
        const en = (phrase.meaning_en || phrase.meaning || '').trim();
        const hi = (phrase.meaning_hi || '').trim();
        if (en && hi) return `${en} · ${hi}`;
        return en || hi || '';
    };

    return (
        <Box sx={{ maxWidth: { xs: '100%', sm: 800 }, mx: 'auto' }}>
            <Card {...activityCardProps(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="LYRICS"
                        accentColor={LYRICS_ACCENT}
                        displayNumber={lyricsDisplayTag}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            background: `linear-gradient(135deg, #e2e8f0, ${LYRICS_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {songTitle}
                    </Typography>
                    {artist && (
                        <Typography variant="body1" sx={{ color: alpha('#e2e8f0', 0.7), mt: 0.5 }}>
                            by {artist}
                        </Typography>
                    )}

                    <ActivitySourceCredit
                        creditLabel={credit}
                        creditUrl={creditUrl}
                        accentColor={LYRICS_ACCENT}
                    />

                    {hasYoutube ? (
                        <YouTubeAudioPlayer youtubeUrl={youtubeUrl} accentColor={LYRICS_ACCENT} />
                    ) : audioUrl ? (
                        <DirectAudioPlayer audioUrl={audioUrl} accentColor={LYRICS_ACCENT} />
                    ) : null}

                    {lyrics && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                                Lyrics
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    maxHeight: 500,
                                    overflowY: 'auto',
                                    bgcolor: alpha('#1a1f2e', 0.55),
                                    border: `1px solid ${alpha(LYRICS_ACCENT, 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.9,
                                        color: alpha('#e2e8f0', 0.92),
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {lyrics}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {words.length > 0 && (
                        <Accordion sx={darkAccordionSx}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: LYRICS_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>
                                    Important Words ({words.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {(words as Record<string, string>[]).map((word, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {word.word || word.text}
                                            </Typography>
                                            {renderWordMeaning(word) && (
                                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                    {renderWordMeaning(word)}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {phrases.length > 0 && (
                        <Accordion sx={darkAccordionSx}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: LYRICS_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>
                                    Important Phrases ({phrases.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {(phrases as Record<string, string>[]).map((phrase, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {phrase.phrase || phrase.text}
                                            </Typography>
                                            {renderPhraseMeaning(phrase) && (
                                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                    {renderPhraseMeaning(phrase)}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}
                    {tierNavFooter}
                </CardContent>
            </Card>

            <Card {...activityCardProps(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, color: LYRICS_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}
                    >
                        Your sentences
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Write {SUMMARY_MIN} to {SUMMARY_MAX} sentences in your own words about the song or lyrics. +10
                        participation when you submit. After review:{' '}
                        <strong>10 points per correct sentence</strong> (up to {MAX_EVALUATION_SCORE}).
                    </Typography>

                    {!isToday && (
                        <Alert severity="info" sx={activityAlertOnDarkSx('info')}>
                            Past song — browse only. Submit sentences on today&apos;s lyrics.
                        </Alert>
                    )}

                    {existingSubmission && (
                        <>
                            <Alert severity="success" sx={activityAlertOnDarkSx('success')}>
                                You submitted {getSubmissionSummaries(existingSubmission).length} sentence
                                {getSubmissionSummaries(existingSubmission).length === 1 ? '' : 's'}
                                {existingSubmission.createdAt
                                    ? ` on ${new Date(existingSubmission.createdAt).toLocaleDateString()}`
                                    : ''}
                                .
                            </Alert>
                            {hasReviewScore || existingSubmission.sentenceValidations?.length ? (
                                <Alert severity="success" sx={activityAlertOnDarkSx('success')}>
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
                                    variant="onDark"
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
                        <Alert
                            severity={submitStatus.type}
                            sx={activityAlertOnDarkSx(submitStatus.type === 'error' ? 'error' : 'success')}
                        >
                            {submitStatus.message}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmitSentences}>
                        {displaySentences.map((_, idx) => {
                            const review = getSentenceReviewState(idx);
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
                                                  : alpha(LYRICS_ACCENT, 0.2)
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
                                            Sentence {idx + 1}
                                            {review === true && (
                                                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#34d399' }}>
                                                    +10
                                                </Typography>
                                            )}
                                        </Typography>
                                        {!locked &&
                                            sentenceDrafts.length > SUMMARY_MIN &&
                                            idx >= SUMMARY_MIN && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeSentenceField(idx)}
                                                    aria-label="Remove sentence"
                                                    sx={{ color: alpha('#e2e8f0', 0.6) }}
                                                >
                                                    <RemoveCircleOutlineIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                    </Box>
                                    {locked ? (
                                        <Typography component="div" sx={activitySubmittedTextSx}>
                                            {displaySentences[idx]?.trim() || '—'}
                                        </Typography>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            placeholder="Write a sentence about the song in your own words…"
                                            value={sentenceDrafts[idx] || ''}
                                            onChange={(e) => updateSentenceDraft(idx, e.target.value)}
                                            disabled={!isToday || isSubmitting}
                                            sx={activitySummaryTextFieldSx(LYRICS_ACCENT)}
                                        />
                                    )}
                                </Box>
                            );
                        })}

                        {!locked && isToday && user && (
                            <>
                                {sentenceDrafts.length < SUMMARY_MAX && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={addSentenceField}
                                        sx={{
                                            mb: 2,
                                            borderColor: alpha(LYRICS_ACCENT, 0.5),
                                            color: LYRICS_ACCENT,
                                        }}
                                    >
                                        Add another sentence ({sentenceDrafts.length}/{SUMMARY_MAX})
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
                                        disabled={!canSubmitSentences || isSubmitting}
                                        sx={{
                                            ...activityContainedButtonSx(LYRICS_ACCENT),
                                            minWidth: 200,
                                        }}
                                    >
                                        {isSubmitting ? 'Submitting…' : 'Submit sentences'}
                                    </Button>
                                </Box>
                            </>
                        )}
                        {!user && (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                Please log in to submit your sentences.
                            </Typography>
                        )}
                    </Box>

                    {tierNavFooter}
                </CardContent>
            </Card>
        </Box>
    );
};

export default LyricsCard;
