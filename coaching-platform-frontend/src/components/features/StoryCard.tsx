// src/components/features/StoryCard.tsx
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
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getUserStorySubmission, type UserStorySubmission } from '../../services/storySubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import {
    activityCardShell,
    getContentDisplayNumber,
    isContentScheduledToday,
    canShowNextNavigation,
    refreshAdjacentFlags,
    GOLD_ACCENT,
} from '../../utils/dailyActivityUi';

function normalizeStoryWords(metadata: Record<string, unknown> | undefined) {
    const raw = metadata?.important_words;
    if (!Array.isArray(raw)) return [];
    return raw
        .map((w) => {
            if (!w || typeof w !== 'object') return null;
            const o = w as { word?: string; meaning_en?: string; meaning_hi?: string };
            const word = String(o.word ?? '').trim();
            if (!word) return null;
            return {
                word,
                meaning_en: String(o.meaning_en ?? '').trim(),
                meaning_hi: String(o.meaning_hi ?? '').trim(),
            };
        })
        .filter((w): w is { word: string; meaning_en: string; meaning_hi: string } => w !== null);
}

interface StoryCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
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

const StoryCard: React.FC<StoryCardProps> = ({ data, onContentChange, onSubmissionSuccess }) => {
    const { user } = useAuth();
    const [sentences, setSentences] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isPlayingTitle, setIsPlayingTitle] = useState(false);
    const [isPlayingStory, setIsPlayingStory] = useState(false);
    const [isPlayingMoral, setIsPlayingMoral] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [showHindiTranslation, setShowHindiTranslation] = useState<{ [key: number]: boolean }>({});
    const [existingSubmission, setExistingSubmission] = useState<UserStorySubmission | null>(null);
    const titleAudioRef = useRef<HTMLAudioElement | null>(null);
    const storyAudioRef = useRef<HTMLAudioElement | null>(null);
    const moralAudioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const loadSubmission = useCallback(async (storyId: string) => {
        if (!user) {
            setExistingSubmission(null);
            return;
        }
        const sub = await getUserStorySubmission(storyId);
        setExistingSubmission(sub);
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        setCurrentContent(data);
        setSentences(['', '']);
        setExistingSubmission(null);
        setSubmitStatus(null);
        void checkAdjacent(data._id);
        void loadSubmission(data._id);
        return () => {
            [titleAudioRef, storyAudioRef, moralAudioRef].forEach(ref => {
                if (ref.current) {
                    ref.current.pause();
                    ref.current = null;
                }
            });
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [data, user, checkAdjacent, loadSubmission]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setSentences(['', '']);
                setSubmitStatus(null);
                setExistingSubmission(null);
                setShowHindiTranslation({});
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkAdjacent(adjacentContent._id);
                void loadSubmission(adjacentContent._id);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} story available.`
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} story.`
            });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSentenceChange = (index: number, value: string) => {
        const newSentences = [...sentences];
        newSentences[index] = value;
        setSentences(newSentences);
    };

    const addSentenceField = () => {
        if (sentences.length < 5) {
            setSentences([...sentences, '']);
        }
    };

    const removeSentenceField = (index: number) => {
        if (sentences.length > 2) {
            setSentences(sentences.filter((_, i) => i !== index));
        }
    };

    const playAudio = (
        text: string,
        audioUrl: string | undefined,
        setIsPlaying: (playing: boolean) => void,
        audioRef: React.MutableRefObject<HTMLAudioElement | null>,
        currentlyPlaying: boolean
    ) => {
        if (currentlyPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);


        setIsPlaying(true);

        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => playTTS(text, setIsPlaying);
                audio.play().catch(() => playTTS(text, setIsPlaying));
            } catch (error) {
                playTTS(text, setIsPlaying);
            }
        } else {
            playTTS(text, setIsPlaying);
        }
    };

    const playTTS = (text: string, setIsPlaying: (playing: boolean) => void) => {
        if (synthRef.current && text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            synthRef.current.speak(utterance);
        } else {
            setIsPlaying(false);
        }
    };

    const handlePlayTitle = () => {
        const title = currentContent.title || '';
        const audioUrl = currentContent.metadata?.audio;
        playAudio(title, audioUrl, setIsPlayingTitle, titleAudioRef, isPlayingTitle);
    };

    const handlePlayStory = () => {
        const storyText = currentContent.metadata?.text_content || '';
        const audioUrl = currentContent.metadata?.story_audio;
        playAudio(storyText, audioUrl, setIsPlayingStory, storyAudioRef, isPlayingStory);
    };

    const handlePlayMoral = () => {
        const moralText = currentContent.metadata?.moral_en || '';
        const audioUrl = currentContent.metadata?.moral_audio;
        playAudio(moralText, audioUrl, setIsPlayingMoral, moralAudioRef, isPlayingMoral);
    };

    const handleSubmitSummary = async (e: React.FormEvent) => {
        e.preventDefault();

        const validSentences = sentences.filter(s => s.trim());
        if (validSentences.length < 2) {
            setSubmitStatus({
                type: 'error',
                message: 'Please submit at least 2 sentences (maximum 5).',
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

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-story-summary', {
                storyId: currentContent._id,
                summary: validSentences
            });

            if (response.data?.status === 'success') {
                const participation =
                    response.data.data.participationPointsAwarded ?? 10;
                setSubmitStatus({
                    type: 'success',
                    message: `Great job! ${participation > 0 ? `+${participation} participation points toward the leaderboard. ` : ''}Your summary is pending review for evaluation score.`,
                });
                setSentences(['']);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                void getUserStorySubmission(currentContent._id).then(setExistingSubmission);
                onSubmissionSuccess?.();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit summary'
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit summary. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Parse story content into sentences
    const parseStorySentences = (text: string): string[] => {
        if (!text) return [];
        // Split by sentence-ending punctuation, but keep the punctuation
        return text.match(/[^.!?]+[.!?]+/g) || [text];
    };

    // Get sentence-by-sentence Hindi translation
    const getSentenceTranslations = () => {
        const storyText = currentContent.metadata?.text_content || '';
        const sentences = parseStorySentences(storyText);
        const translations = currentContent.metadata?.sentence_translations || [];

        return sentences.map((sentence, index) => ({
            en: sentence.trim(),
            hi: translations[index] || ''
        }));
    };

    const displayNumber = getContentDisplayNumber(currentContent.sequenceNumber);
    const storyTitle = currentContent.title || '';
    // const storyContent = currentContent.metadata?.text_content || '';
    const moralEn = currentContent.metadata?.moral_en || '';
    const moralHi = currentContent.metadata?.moral_hi || '';
    const keywords = currentContent.metadata?.keywords || [];
    const importantWords = normalizeStoryWords(
        (currentContent.metadata || {}) as Record<string, unknown>
    );
    const sentenceTranslations = getSentenceTranslations();
    const isToday = isContentScheduledToday(currentContent.date);
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);

    const getSummaryReviewState = (index: number): boolean | null => {
        if (!existingSubmission?.sentenceValidations?.length) return null;
        const found = existingSubmission.sentenceValidations.find((v) => v.sentenceIndex === index);
        return found ? found.isCorrect : null;
    };

    const AudioBtn: React.FC<{ playing: boolean; onClick: () => void; label: string }> = ({
        playing,
        onClick,
        label,
    }) => (
        <IconButton
            onClick={onClick}
            sx={{ color: GOLD_ACCENT, bgcolor: alpha(GOLD_ACCENT, 0.12) }}
            aria-label={label}
        >
            {playing ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
    );

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2 }}>
                            One Minute Read
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

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                flex: 1,
                                fontWeight: 900,
                                background: `linear-gradient(135deg, #e2e8f0, ${GOLD_ACCENT})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            {storyTitle}
                        </Typography>
                        <AudioBtn playing={isPlayingTitle} onClick={handlePlayTitle} label="Play title" />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', flex: 1 }}>
                            Story
                        </Typography>
                        <AudioBtn playing={isPlayingStory} onClick={handlePlayStory} label="Play story" />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        {sentenceTranslations.map((item, index) => (
                            <Box key={index} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Typography variant="body2" sx={{ flex: 1, color: alpha('#e2e8f0', 0.92), lineHeight: 1.7 }}>
                                        {item.en}
                                    </Typography>
                                    {item.hi && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() =>
                                                setShowHindiTranslation({
                                                    ...showHindiTranslation,
                                                    [index]: !showHindiTranslation[index],
                                                })
                                            }
                                            sx={{
                                                minWidth: 36,
                                                borderColor: alpha(GOLD_ACCENT, 0.5),
                                                color: GOLD_ACCENT,
                                            }}
                                        >
                                            {showHindiTranslation[index] ? 'EN' : 'HI'}
                                        </Button>
                                    )}
                                </Box>
                                {item.hi && showHindiTranslation[index] && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: alpha('#e2e8f0', 0.65),
                                            fontStyle: 'italic',
                                            pl: 2,
                                            mt: 0.5,
                                            borderLeft: `2px solid ${alpha(GOLD_ACCENT, 0.5)}`,
                                        }}
                                    >
                                        {item.hi}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>

                    {importantWords.length > 0 && (
                        <Box
                            sx={{
                                mb: 2,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha('#1a1f2e', 0.85),
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.25)}`,
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                                Important words
                            </Typography>
                            {importantWords.map((item, index) => (
                                <Box key={index} sx={{ mb: index < importantWords.length - 1 ? 1 : 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                                        {item.word}
                                    </Typography>
                                    {item.meaning_en && (
                                        <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.75), display: 'block' }}>
                                            {item.meaning_en}
                                        </Typography>
                                    )}
                                    {item.meaning_hi && (
                                        <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.65), display: 'block' }}>
                                            {item.meaning_hi}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {keywords.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: alpha('#e2e8f0', 0.8), mb: 0.75 }}>
                                Keywords
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {keywords.map((keyword: { word?: string; meaning_hi?: string }, index: number) => (
                                    <Chip
                                        key={index}
                                        label={`${keyword.word}${keyword.meaning_hi ? ` — ${keyword.meaning_hi}` : ''}`}
                                        size="small"
                                        sx={{ bgcolor: alpha(GOLD_ACCENT, 0.12), color: '#f1f5f9' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {(moralEn || moralHi) && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha('#1a1f2e', 0.6),
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.2)}`,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GOLD_ACCENT, flex: 1 }}>
                                    Moral
                                </Typography>
                                <AudioBtn playing={isPlayingMoral} onClick={handlePlayMoral} label="Play moral" />
                            </Box>
                            {moralEn && (
                                <Typography variant="body2" sx={{ color: '#f1f5f9', mb: moralHi ? 0.5 : 0 }}>
                                    {moralEn}
                                </Typography>
                            )}
                            {moralHi && (
                                <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.65), fontStyle: 'italic' }}>
                                    {moralHi}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => handleNavigation('prev')}
                            disabled={!hasPrevious || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85) }}
                        >
                            Previous Story
                        </Button>
                        <Button
                            variant="text"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleNavigation('next')}
                            disabled={!canGoNext || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85) }}
                        >
                            Next Story
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
                        Summarize in your own words
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Write 2–5 sentences. +10 participation on submit; up to 10 + 2 per correct sentence after review.
                    </Typography>
                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Past story — browse only. Submit summary on today&apos;s story.
                        </Alert>
                    )}
                    {existingSubmission && isToday && (
                        <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                You already submitted your summary for this story.
                            </Alert>
                            <EvaluationStatusBanner
                                isCorrect={existingSubmission.isCorrect}
                                evaluationPoints={existingSubmission.evaluationPoints}
                                pointsEarned={existingSubmission.pointsEarned}
                                feedback={existingSubmission.feedback}
                                reviewedAt={existingSubmission.reviewedAt}
                            />
                            <Box sx={{ mb: 2 }}>
                                {existingSubmission.summary.map((sentence, idx) => {
                                    const review = getSummaryReviewState(idx);
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
                                            <Typography variant="body2" sx={{ color: '#f1f5f9' }}>
                                                {idx + 1}. {sentence}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    )}
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}
                    {isToday && !existingSubmission && (
                        <Box component="form" onSubmit={handleSubmitSummary}>
                            {sentences.map((sentence, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder={`Sentence ${index + 1}…`}
                                        value={sentence}
                                        onChange={(e) => handleSentenceChange(index, e.target.value)}
                                        disabled={isSubmitting || !user}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: alpha('#1a1f2e', 0.9),
                                                color: '#f1f5f9',
                                                '& fieldset': { borderColor: alpha(GOLD_ACCENT, 0.45) },
                                            },
                                        }}
                                    />
                                    {sentences.length > 2 && (
                                        <Button
                                            type="button"
                                            color="error"
                                            variant="outlined"
                                            size="small"
                                            onClick={() => removeSentenceField(index)}
                                            disabled={isSubmitting}
                                            sx={{ mt: 0.5 }}
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
                                        sentences.filter((s) => s.trim()).length < 2 || isSubmitting || !user
                                    }
                                    sx={{ bgcolor: GOLD_ACCENT, color: '#0f172a', fontWeight: 800, minWidth: 160 }}
                                >
                                    {isSubmitting ? 'Submitting…' : 'Submit summary'}
                                </Button>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6) }}>
                                    {sentences.filter((s) => s.trim()).length} / 5
                                </Typography>
                            </Box>
                            {!user && (
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                    Please log in to submit.
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default StoryCard;
