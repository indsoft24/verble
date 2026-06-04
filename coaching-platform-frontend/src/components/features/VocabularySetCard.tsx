// src/components/features/VocabularySetCard.tsx
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
    Checkbox,
    FormControlLabel,
    Grid,
    alpha,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SendIcon from '@mui/icons-material/Send';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import ActivityContentHeader from './ActivityContentHeader';
import {
    activityAlertOnDarkSx,
    activityCardProps,
    activityContainedButtonSx,
    getContentDisplayNumber,
    isContentScheduledToday,
    refreshAdjacentFlags,
    canShowNextNavigation,
    GOLD_ACCENT,
} from '../../utils/dailyActivityUi';
import { getMinVocabWordsRequired } from '../../utils/vocabPracticeRules';
import {
    getUserVocabSubmission,
    type UserVocabSubmission,
} from '../../services/vocabSubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import ActivityTierNavFooter from './ActivityTierNavFooter';


interface VocabularySetCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
    onNavigateToStory?: () => void;
}

interface VocabItem {
    word: string;
    pronunciation_hi: string;
    meaning_hi: string;
    audio?: string;
}

interface SentenceData {
    sentence: string;
    vocabWordsUsed: string[];
}

// Confetti animation keyframes
const confettiFall = keyframes`
    from {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
    to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
`;

// Simple CSS-based Confetti Effect
const ConfettiEffect: React.FC = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
                overflow: 'hidden',
            }}
        >
            {Array.from({ length: 50 }).map((_, i) => {
                const duration = 2 + Math.random() * 2;
                const delay = Math.random() * 0.5;
                const left = Math.random() * 100;

                return (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            width: 10,
                            height: 10,
                            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                            left: `${left}%`,
                            top: '-10px',
                            animation: `${confettiFall} ${duration}s linear ${delay}s forwards`,
                        }}
                    />
                );
            })}
        </Box>
    );
};

const VocabularySetCard: React.FC<VocabularySetCardProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    onNavigateToStory,
}) => {
    const { user } = useAuth();
    const [sentences, setSentences] = useState<SentenceData[]>([{ sentence: '', vocabWordsUsed: [] }]);
    const [selectedVocabWords, setSelectedVocabWords] = useState<{ [key: number]: Set<string> }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<{ [key: string]: boolean }>({});
    const [existingSubmission, setExistingSubmission] = useState<UserVocabSubmission | null>(null);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const loadSubmission = useCallback(async (vocabSetId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        setSubmissionLoading(true);
        const sub = await getUserVocabSubmission(vocabSetId);
        setExistingSubmission(sub);
        setSubmissionLoading(false);
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        setCurrentContent(data);
        setSentences([{ sentence: '', vocabWordsUsed: [] }]);
        setSelectedVocabWords({});
        setSubmitStatus(null);
        setExistingSubmission(null);
        void checkAdjacent(data._id);
        void loadSubmission(data._id);
        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                }
            });
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [data, checkAdjacent, loadSubmission]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setSentences([{ sentence: '', vocabWordsUsed: [] }]);
                setSelectedVocabWords({});
                setSubmitStatus(null);
                setExistingSubmission(null);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkAdjacent(adjacentContent._id);
                void loadSubmission(adjacentContent._id);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} vocabulary set available.`
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} vocabulary set.`
            });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSentenceChange = (index: number, value: string) => {
        const newSentences = [...sentences];
        newSentences[index] = {
            ...newSentences[index],
            sentence: value
        };
        setSentences(newSentences);
    };

    const handleVocabWordToggle = (sentenceIndex: number, vocabWord: string) => {
        const newSelected = { ...selectedVocabWords };
        if (!newSelected[sentenceIndex]) {
            newSelected[sentenceIndex] = new Set();
        }

        const wordSet = newSelected[sentenceIndex];
        if (wordSet.has(vocabWord)) {
            wordSet.delete(vocabWord);
        } else {
            wordSet.add(vocabWord);
        }

        newSelected[sentenceIndex] = new Set(wordSet);
        setSelectedVocabWords(newSelected);

        // Update the sentence's vocabWordsUsed array
        const newSentences = [...sentences];
        newSentences[sentenceIndex] = {
            ...newSentences[sentenceIndex],
            vocabWordsUsed: Array.from(wordSet)
        };
        setSentences(newSentences);
    };

    const addSentenceField = () => {
        if (sentences.length < 5) {
            setSentences([...sentences, { sentence: '', vocabWordsUsed: [] }]);
        }
    };

    const removeSentenceField = (index: number) => {
        if (sentences.length > 2) {
            const newSentences = sentences.filter((_, i) => i !== index);
            setSentences(newSentences);
            const newSelected = { ...selectedVocabWords };
            delete newSelected[index];
            // Reindex selected words
            const reindexed: { [key: number]: Set<string> } = {};
            newSentences.forEach((_, newIndex) => {
                const oldIndex = index < newIndex ? newIndex - 1 : newIndex;
                if (selectedVocabWords[oldIndex]) {
                    reindexed[newIndex] = selectedVocabWords[oldIndex];
                }
            });
            setSelectedVocabWords(reindexed);
        }
    };

    const playAudio = (word: string, audioUrl: string | undefined) => {
        const key = word.toLowerCase();
        const isCurrentlyPlaying = playingAudio[key];

        if (isCurrentlyPlaying) {
            if (audioRefs.current[key]) {
                audioRefs.current[key]?.pause();
                audioRefs.current[key] = null;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            setPlayingAudio({ ...playingAudio, [key]: false });
            return;
        }

        setPlayingAudio({ ...playingAudio, [key]: true });

        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRefs.current[key] = audio;
                audio.onended = () => setPlayingAudio({ ...playingAudio, [key]: false });
                audio.onerror = () => playTTS(word, key);
                audio.play().catch(() => playTTS(word, key));
            } catch (error) {
                playTTS(word, key);
            }
        } else {
            playTTS(word, key);
        }
    };

    const playTTS = (word: string, key: string) => {
        if (synthRef.current && word) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.onend = () => setPlayingAudio({ ...playingAudio, [key]: false });
            utterance.onerror = () => setPlayingAudio({ ...playingAudio, [key]: false });
            synthRef.current.speak(utterance);
        } else {
            setPlayingAudio({ ...playingAudio, [key]: false });
        }
    };

    const handleSubmitSentences = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isContentScheduledToday(currentContent.date)) {
            setSubmitStatus({
                type: 'error',
                message: "You can only submit sentences for today's vocabulary set.",
            });
            return;
        }

        const validSentences = sentences.filter(s => s.sentence.trim() && s.vocabWordsUsed.length > 0);

        if (validSentences.length < 2) {
            setSubmitStatus({
                type: 'error',
                message: 'Please submit at least 2 sentences using vocabulary words (maximum 5).'
            });
            return;
        }

        if (validSentences.length > 5) {
            setSubmitStatus({
                type: 'error',
                message: 'Maximum 5 sentences allowed.'
            });
            return;
        }

        // Check if at least 5 different vocab words are used across all sentences
        const allVocabWordsUsed = new Set<string>();
        validSentences.forEach(s => {
            s.vocabWordsUsed.forEach(word => allVocabWordsUsed.add(word.toLowerCase()));
        });

        const items = (currentContent.metadata?.vocabItems as VocabItem[]) || [];
        const minWordsRequired = getMinVocabWordsRequired(items.length);
        if (allVocabWordsUsed.size < minWordsRequired) {
            setSubmitStatus({
                type: 'error',
                message: `You must use at least ${minWordsRequired} different vocabulary word${minWordsRequired === 1 ? '' : 's'} across all sentences. Currently using ${allVocabWordsUsed.size}.`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-vocab-sentences', {
                vocabSetId: currentContent._id,
                sentences: validSentences
            });

            if (response.data?.status === 'success') {
                const participation =
                    response.data.data.participationPointsAwarded ?? 10;
                const vocabCount = response.data.data.submission.totalVocabWordsUsed;
                setSubmitStatus({
                    type: 'success',
                    message: `Great job! You used ${vocabCount} different vocabulary words. ${participation > 0 ? `+${participation} participation points toward the leaderboard. ` : ''}Pending review for evaluation score (10 per correct sentence).`,
                });
                setSentences([{ sentence: '', vocabWordsUsed: [] }]);
                setSelectedVocabWords({});
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                void loadSubmission(currentContent._id);
                onSubmissionSuccess?.();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit sentences'
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit sentences. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayNumber = getContentDisplayNumber(currentContent.sequenceNumber);
    const isToday = isContentScheduledToday(currentContent.date);
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);

    const tierNavFooter = (
        <ActivityTierNavFooter
            accentColor={GOLD_ACCENT}
            left={{
                label: 'Previous Set',
                onClick: () => handleNavigation('prev'),
                disabled: !hasPrevious,
                loading: isLoadingNav,
            }}
            center={{
                label: '← One Minute Read',
                onClick: onNavigateToStory,
            }}
            right={{
                label: 'Next Set',
                onClick: () => handleNavigation('next'),
                disabled: !canGoNext,
                loading: isLoadingNav,
            }}
        />
    );

    const theme = currentContent.metadata?.theme || currentContent.title;
    const vocabItems: VocabItem[] = currentContent.metadata?.vocabItems || [];
    const themeImageUrl =
        (currentContent.metadata?.themeImageUrl as string) ||
        (currentContent.metadata?.themeImage as string) ||
        '';
    const minWordsRequired = getMinVocabWordsRequired(vocabItems.length);

    const allVocabWordsUsed = new Set<string>();
    sentences.forEach(s => {
        s.vocabWordsUsed.forEach(word => allVocabWordsUsed.add(word.toLowerCase()));
    });

    const getSentenceReviewState = (index: number): boolean | null => {
        if (!existingSubmission?.sentenceValidations?.length) return null;
        const found = existingSubmission.sentenceValidations.find((v) => v.sentenceIndex === index);
        return found ? found.isCorrect : null;
    };

    const filledVocabItems = vocabItems.filter((v) => String(v.word || '').trim());
    const themeDescription = String(currentContent.metadata?.themeImageDescription || '').trim();

    const SpeakerButton: React.FC<{ word: string; audio?: string }> = ({ word, audio }) => (
        <IconButton
            size="small"
            onClick={() => playAudio(word, audio)}
            sx={{ color: GOLD_ACCENT, bgcolor: alpha(GOLD_ACCENT, 0.12) }}
            aria-label={`Play ${word}`}
        >
            {playingAudio[word.toLowerCase()] ? (
                <VolumeOffIcon fontSize="small" />
            ) : (
                <VolumeUpIcon fontSize="small" />
            )}
        </IconButton>
    );

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card {...activityCardProps(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="VOCAB_SET"
                        accentColor={GOLD_ACCENT}
                        displayNumber={displayNumber}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            mb: 2,
                            background: `linear-gradient(135deg, #e2e8f0, ${GOLD_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {theme}
                    </Typography>

                    {themeImageUrl ? (
                        <Box
                            component="img"
                            src={themeImageUrl}
                            alt={themeDescription || theme}
                            sx={{
                                width: '100%',
                                maxHeight: 240,
                                objectFit: 'cover',
                                borderRadius: 2,
                                mb: 2,
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.3)}`,
                            }}
                        />
                    ) : themeDescription ? (
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7), mb: 2, fontStyle: 'italic' }}>
                            {themeDescription}
                        </Typography>
                    ) : null}

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha('#1a1f2e', 0.85),
                            border: `1px solid ${alpha(GOLD_ACCENT, 0.25)}`,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5 }}>
                            Vocabulary ({filledVocabItems.length} words)
                        </Typography>
                        {filledVocabItems.map((item, index) => (
                            <Box
                                key={`${item.word}-${index}`}
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-start',
                                    py: 1.25,
                                    borderBottom:
                                        index < filledVocabItems.length - 1
                                            ? `1px solid ${alpha(GOLD_ACCENT, 0.15)}`
                                            : 'none',
                                }}
                            >
                                <Typography variant="caption" sx={{ color: alpha(GOLD_ACCENT, 0.9), fontWeight: 800, minWidth: 20 }}>
                                    {index + 1}
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                            {item.word}
                                        </Typography>
                                        <SpeakerButton word={item.word} audio={item.audio} />
                                    </Box>
                                    {item.pronunciation_hi && (
                                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), fontStyle: 'italic' }}>
                                            {item.pronunciation_hi}
                                        </Typography>
                                    )}
                                    {item.meaning_hi && (
                                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>
                                            {item.meaning_hi}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {tierNavFooter}
                </CardContent>
            </Card>

            <Card {...activityCardProps(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}
                    >
                        Practice — Make Sentences
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Write 2–5 sentences using this week&apos;s words. Use at least {minWordsRequired} different word
                        {minWordsRequired === 1 ? '' : 's'}. +10 participation on submit; 10 points per correct sentence after review.
                    </Typography>
                    {!isToday && (
                        <Alert severity="info" sx={activityAlertOnDarkSx('info')}>
                            Past vocabulary set — browse only. Submit on today&apos;s set.
                        </Alert>
                    )}
                    {submissionLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={28} sx={{ color: GOLD_ACCENT }} />
                        </Box>
                    )}
                    {existingSubmission && isToday && (
                        <>
                            <Alert severity="success" sx={activityAlertOnDarkSx('success')}>
                                You already submitted sentences for this vocabulary set.
                            </Alert>
                            <EvaluationStatusBanner
                                variant="onDark"
                                isCorrect={existingSubmission.isCorrect}
                                evaluationPoints={existingSubmission.evaluationPoints}
                                pointsEarned={existingSubmission.pointsEarned}
                                feedback={existingSubmission.feedback}
                                reviewedAt={existingSubmission.reviewedAt}
                            />
                            <Box sx={{ mb: 2 }}>
                                {existingSubmission.sentences.map((entry, idx) => {
                                    const review = getSentenceReviewState(idx);
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                p: 1.5,
                                                mb: 1,
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor:
                                                    review === true
                                                        ? alpha('#22c55e', 0.7)
                                                        : review === false
                                                          ? alpha('#ef4444', 0.7)
                                                          : alpha(GOLD_ACCENT, 0.25),
                                                bgcolor:
                                                    review === true
                                                        ? alpha('#22c55e', 0.12)
                                                        : review === false
                                                          ? alpha('#ef4444', 0.12)
                                                          : alpha('#1a1f2e', 0.6),
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
                                                {idx + 1}. {entry.sentence}
                                            </Typography>
                                            {entry.vocabWordsUsed?.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                                                    {entry.vocabWordsUsed.map((w) => (
                                                        <Chip
                                                            key={w}
                                                            label={w}
                                                            size="small"
                                                            sx={{
                                                                height: 22,
                                                                bgcolor: alpha(GOLD_ACCENT, 0.15),
                                                                color: GOLD_ACCENT,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    )}
                    {isToday && !existingSubmission && !submissionLoading && (
                        <Typography variant="body2" sx={{ color: GOLD_ACCENT, mb: 2, fontWeight: 700 }}>
                            Words used in draft: {allVocabWordsUsed.size} / {minWordsRequired} minimum
                        </Typography>
                    )}
                    {submitStatus && (
                        <Alert
                            severity={submitStatus.type}
                            sx={activityAlertOnDarkSx(submitStatus.type === 'error' ? 'error' : 'success')}
                        >
                            {submitStatus.message}
                        </Alert>
                    )}
                    {isToday && !existingSubmission && !submissionLoading && (
                        <Box component="form" onSubmit={handleSubmitSentences}>
                            {sentences.map((sentenceData, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha('#1a1f2e', 0.7),
                                        border: `1px solid ${alpha(GOLD_ACCENT, 0.25)}`,
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: GOLD_ACCENT }}>
                                        Sentence {index + 1}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Write a sentence using words from the list above…"
                                        value={sentenceData.sentence}
                                        onChange={(e) => handleSentenceChange(index, e.target.value)}
                                        disabled={isSubmitting || !user}
                                        sx={{
                                            mb: 1.5,
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: alpha('#0f172a', 0.8),
                                                color: '#f1f5f9',
                                                '& fieldset': { borderColor: alpha(GOLD_ACCENT, 0.45) },
                                            },
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.65), display: 'block', mb: 0.75 }}>
                                        Words used in this sentence:
                                    </Typography>
                                    <Grid container spacing={0.5}>
                                        {filledVocabItems.map((item) => {
                                            const key = item.word.toLowerCase();
                                            const isSelected = selectedVocabWords[index]?.has(key) || false;
                                            return (
                                                <Grid size={{ xs: 6, sm: 4 }} key={item.word}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onChange={() => handleVocabWordToggle(index, key)}
                                                                size="small"
                                                                sx={{ color: alpha(GOLD_ACCENT, 0.7), '&.Mui-checked': { color: GOLD_ACCENT } }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                                                {item.word}
                                                            </Typography>
                                                        }
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                    {sentences.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            onClick={() => removeSentenceField(index)}
                                            disabled={isSubmitting}
                                            sx={{ mt: 1 }}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                {sentences.length < 5 && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        onClick={addSentenceField}
                                        disabled={isSubmitting || !user}
                                        sx={{ borderColor: alpha(GOLD_ACCENT, 0.6), color: GOLD_ACCENT }}
                                    >
                                        + Add sentence
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    disabled={
                                        sentences.filter((s) => s.sentence.trim() && s.vocabWordsUsed.length > 0).length < 2 ||
                                        allVocabWordsUsed.size < minWordsRequired ||
                                        isSubmitting ||
                                        !user
                                    }
                                    sx={{ ...activityContainedButtonSx(GOLD_ACCENT), minWidth: 160 }}
                                >
                                    {isSubmitting ? 'Submitting…' : 'Submit'}
                                </Button>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6) }}>
                                    {sentences.filter((s) => s.sentence.trim() && s.vocabWordsUsed.length > 0).length} / 5
                                </Typography>
                            </Box>
                            {!user && (
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                    Please log in to submit.
                                </Typography>
                            )}
                        </Box>
                    )}
                    {tierNavFooter}
                </CardContent>
            </Card>
        </Box>
    );
};

export default VocabularySetCard;
