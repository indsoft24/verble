// src/components/features/StoryCard.tsx
import React, { useState, useRef, useEffect } from 'react';
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
    Divider,
    Chip,
    List,
    ListItem,

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
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import { getUserStorySubmission, type UserStorySubmission } from '../../services/storySubmissionService';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import { isContentScheduledToday, canShowNextNavigation } from '../../utils/dailyActivityUi';

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
    const [sentences, setSentences] = useState<string[]>(['']);
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

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        setCurrentContent(data);
        setExistingSubmission(null);
        checkNavigationAvailability();
        if (user) {
            void getUserStorySubmission(data._id).then(setExistingSubmission);
        }
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
    }, [data, user]);

    const checkNavigationAvailability = async () => {
        try {
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data._id, 'prev'),
                getAdjacentContent(data._id, 'next')
            ]);

            setHasPrevious(!!prevContent);
            setHasNext(!!nextContent);
        } catch (error) {
            setHasPrevious(false);
            setHasNext(false);
        }
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setSentences(['']);
                setSubmitStatus(null);
                setShowHindiTranslation({});
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
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
        if (sentences.length > 1) {
            const newSentences = sentences.filter((_, i) => i !== index);
            setSentences(newSentences);
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

    const storyDisplayTag = getDisplayTag(currentContent.sequenceNumber);
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

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 900,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Confetti Effect */}
            {showConfetti && <ConfettiEffect />}

            <CardContent sx={{ p: 4 }}>
                {/* Header with Story Number */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {storyDisplayTag ? `One Minute Read ${storyDisplayTag}` : 'One Minute Read'}
                        </Typography>
                        <Chip label={currentContent.level} size="small" color="primary" />
                    </Box>

                    {/* Title with Audio */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                flex: 1,
                            }}
                        >
                            {storyTitle}
                        </Typography>
                        <IconButton
                            onClick={handlePlayTitle}
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                },
                            }}
                            aria-label="Play title"
                        >
                            {isPlayingTitle ? (
                                <VolumeOffIcon />
                            ) : (
                                <VolumeUpIcon />
                            )}
                        </IconButton>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Story Content with Audio */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                            Story Content
                        </Typography>
                        <IconButton
                            onClick={handlePlayStory}
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                },
                            }}
                            aria-label="Play story"
                        >
                            {isPlayingStory ? (
                                <VolumeOffIcon />
                            ) : (
                                <VolumeUpIcon />
                            )}
                        </IconButton>
                    </Box>

                    {/* Sentence-by-sentence display with Hindi translation toggle */}
                    <Box>
                        {sentenceTranslations.map((item, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Typography variant="body1" sx={{ flex: 1, mb: 1 }}>
                                        {item.en}
                                    </Typography>
                                    {item.hi && (
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowHindiTranslation({
                                                ...showHindiTranslation,
                                                [index]: !showHindiTranslation[index]
                                            })}
                                            sx={{ mt: -0.5 }}
                                        >
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                {showHindiTranslation[index] ? 'HI' : 'EN'}
                                            </Typography>
                                        </IconButton>
                                    )}
                                </Box>
                                {item.hi && showHindiTranslation[index] && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.secondary',
                                            fontStyle: 'italic',
                                            pl: 2,
                                            borderLeft: '2px solid',
                                            borderColor: 'primary.light',
                                        }}
                                    >
                                        {item.hi}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {importantWords.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Important words
                        </Typography>
                        <List>
                            {importantWords.map((item, index) => (
                                <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {item.word}
                                    </Typography>
                                    {item.meaning_en && (
                                        <Typography variant="body2" color="text.secondary">
                                            {item.meaning_en}
                                        </Typography>
                                    )}
                                    {item.meaning_hi && (
                                        <Typography variant="body2" color="text.secondary">
                                            {item.meaning_hi}
                                        </Typography>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Keywords Section */}
                {keywords.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Keywords
                        </Typography>
                        <List>
                            {keywords.map((keyword: any, index: number) => (
                                <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {keyword.word}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {keyword.meaning_hi}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Moral Section */}
                {(moralEn || moralHi) && (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                                Moral of the Story
                            </Typography>
                            <IconButton
                                onClick={handlePlayMoral}
                                sx={{
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                }}
                                aria-label="Play moral"
                            >
                                {isPlayingMoral ? (
                                    <VolumeOffIcon />
                                ) : (
                                    <VolumeUpIcon />
                                )}
                            </IconButton>
                        </Box>
                        {moralEn && (
                            <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                                {moralEn}
                            </Typography>
                        )}
                        {moralHi && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                {moralHi}
                            </Typography>
                        )}
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => handleNavigation('prev')}
                        disabled={!hasPrevious || isLoadingNav}
                    >
                        Previous Story
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!canGoNext || isLoadingNav}
                    >
                        Next Story
                    </Button>
                </Box>

                {/* Summary Submission Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Summarize the story in your own words (2–5 sentences)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        +10 participation points when you submit (leaderboard). After review, evaluation score: up to
                        10 + 2 per correct sentence.
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
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor:
                                                    review === true
                                                        ? 'success.main'
                                                        : review === false
                                                          ? 'error.main'
                                                          : 'divider',
                                                bgcolor:
                                                    review === true
                                                        ? 'success.50'
                                                        : review === false
                                                          ? 'error.50'
                                                          : 'grey.50',
                                            }}
                                        >
                                            <Typography variant="body2">
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
                            <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder={`Sentence ${index + 1}...`}
                                    value={sentence}
                                    onChange={(e) => handleSentenceChange(index, e.target.value)}
                                    disabled={isSubmitting || !user}
                                    label={`Sentence ${index + 1}`}
                                />
                                {sentences.length > 1 && (
                                    <IconButton
                                        onClick={() => removeSentenceField(index)}
                                        disabled={isSubmitting}
                                        color="error"
                                        sx={{ mt: 1 }}
                                    >
                                        ×
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        {sentences.length < 5 && (
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={addSentenceField}
                                disabled={isSubmitting || !user}
                                sx={{ mb: 2 }}
                            >
                                + Add Another Sentence
                            </Button>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                disabled={
                                    sentences.filter(s => s.trim()).length < 2 ||
                                    isSubmitting ||
                                    !user
                                }
                                sx={{ minWidth: 150 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Summary'}
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                {sentences.filter(s => s.trim()).length} / 5 sentences
                            </Typography>
                        </Box>
                        {!user && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Please log in to submit a summary.
                            </Typography>
                        )}
                    </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default StoryCard;
