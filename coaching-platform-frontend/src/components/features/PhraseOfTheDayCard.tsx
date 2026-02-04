// src/components/features/PhraseOfTheDayCard.tsx
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
    Chip
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


interface PhraseOfTheDayCardProps {
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

const PhraseOfTheDayCard: React.FC<PhraseOfTheDayCardProps> = ({ data, onContentChange, onSubmissionSuccess }) => {
    const { user } = useAuth();
    const [sentences, setSentences] = useState<string[]>(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        setCurrentContent(data);
        checkNavigationAvailability();
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            // const currentDate = parseISO(data.date);
            // const prevDate = subDays(currentDate, 1);
            // const nextDate = addDays(currentDate, 1);

            // Check if previous/next content exists
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'PHRASE', data.level, 'prev'),
                getAdjacentContent(data.date, 'PHRASE', data.level, 'next')
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
            const adjacentContent = await getAdjacentContent(
                currentContent.date,
                'PHRASE',
                currentContent.level,
                direction
            );

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setSentences(['']);
                setSubmitStatus(null);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} phrase available.`
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} phrase.`
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
            const newSentences = sentences.filter((_, i) => i !== index);
            setSentences(newSentences);
        }
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
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

        if (currentContent.metadata?.audio) {
            try {
                const audio = new Audio(currentContent.metadata.audio);
                audioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => playTTS();
                audio.play().catch(() => playTTS());
            } catch (error) {
                playTTS();
            }
        } else {
            playTTS();
        }
    };

    const playTTS = () => {
        if (synthRef.current && currentContent.metadata?.text) {
            const utterance = new SpeechSynthesisUtterance(currentContent.metadata.text);
            utterance.lang = 'en-US';
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            synthRef.current.speak(utterance);
        } else {
            setIsPlaying(false);
        }
    };

    const handleSubmitSentences = async (e: React.FormEvent) => {
        e.preventDefault();

        const validSentences = sentences.filter(s => s.trim());
        if (validSentences.length < 2) {
            setSubmitStatus({
                type: 'error',
                message: 'Please submit at least 2 sentences (minimum 2, maximum 5).'
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
            // Submit each sentence
            const submissionPromises = validSentences.map(sentence =>
                apiClient.post('/submit-sentence', {
                    wordId: currentContent._id,
                    word: currentContent.metadata?.text,
                    sentence: sentence.trim()
                })
            );

            await Promise.all(submissionPromises);

            setSubmitStatus({
                type: 'success',
                message: `Great job! Your ${validSentences.length} sentence(s) have been submitted.`
            });
            setSentences(['']);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            onSubmissionSuccess?.();
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit sentences. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get phrase number from sequenceNumber or metadata
    const phraseNumber = currentContent.sequenceNumber || currentContent.metadata?.phraseNumber || 0;
    const phraseText = currentContent.metadata?.text || '';
    const meaningEn = currentContent.metadata?.meaning_en || '';
    const meaningHi = currentContent.metadata?.meaning_hi || '';
    const example = currentContent.metadata?.examples?.[0] || null;

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 800,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Confetti Effect */}
            {showConfetti && <ConfettiEffect />}

            <CardContent sx={{ p: 4 }}>
                {/* Header with Phrase Number, Phrase, and Audio Button */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                Phrase #{phraseNumber}
                            </Typography>
                            <Chip label="FREE" size="small" color="default" />
                        </Box>
                        <Typography
                            variant="h2"
                            component="h1"
                            sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                mt: 0.5,
                                fontSize: { xs: '1.75rem', sm: '2.5rem' },
                                lineHeight: 1.2,
                            }}
                        >
                            {phraseText}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handlePlayAudio}
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            width: 64,
                            height: 64,
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        }}
                        aria-label="Play pronunciation"
                    >
                        {isPlaying ? (
                            <VolumeOffIcon sx={{ fontSize: 32 }} />
                        ) : (
                            <VolumeUpIcon sx={{ fontSize: 32 }} />
                        )}
                    </IconButton>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Meanings Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Meanings
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            English Meaning
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {meaningEn}
                        </Typography>
                    </Box>
                    {meaningHi && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Hindi Meaning
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {meaningHi}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Example Section */}
                {example && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Example
                        </Typography>
                        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {example.en}
                            </Typography>
                            {example.hi && (
                                <Typography variant="body2" color="text.secondary">
                                    {example.hi}
                                </Typography>
                            )}
                        </Box>
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
                        Previous Phrase
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Phrase
                    </Button>
                </Box>

                {/* Link to Word of the Day */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={() => {
                            // This will be handled by parent component
                            if (onContentChange) {
                                // Trigger word of the day fetch
                                // Parent should handle this navigation
                            }
                        }}
                        sx={{ textTransform: 'none' }}
                    >
                        View Word of the Day
                    </Button>
                </Box>

                {/* Interaction Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Make sentences with this phrase (2-5 sentences)
                    </Typography>
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmitSentences}>
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
                                {sentences.length > 2 && (
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
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                {sentences.filter(s => s.trim()).length} / 5 sentences
                            </Typography>
                        </Box>
                        {!user && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Please log in to submit sentences.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PhraseOfTheDayCard;
