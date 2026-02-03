// src/components/features/SceneCard.tsx
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
    ListItem
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


interface SceneCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
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

const SceneCard: React.FC<SceneCardProps> = ({ data, onContentChange }) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
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
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'SCENE', data.level, 'prev'),
                getAdjacentContent(data.date, 'SCENE', data.level, 'next')
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
                'SCENE',
                currentContent.level,
                direction
            );

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setDescription('');
                setSubmitStatus(null);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} scene available.`
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} scene.`
            });
        } finally {
            setIsLoadingNav(false);
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

        const explanationText = currentContent.metadata?.explanation || '';
        const audioUrl = currentContent.metadata?.audio;

        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => playTTS(explanationText);
                audio.play().catch(() => playTTS(explanationText));
            } catch (error) {
                playTTS(explanationText);
            }
        } else {
            playTTS(explanationText);
        }
    };

    const playTTS = (text: string) => {
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

    const handleSubmitDescription = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            setSubmitStatus({
                type: 'error',
                message: 'Please describe the scene before submitting.'
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-scene-description', {
                sceneId: currentContent._id,
                description: description.trim()
            });

            if (response.data?.status === 'success') {
                setSubmitStatus({
                    type: 'success',
                    message: `Great job! Your description has been submitted. You earned ${response.data.data.submission.pointsEarned} points! Additional points (2 per correct sentence) will be awarded after review.`
                });
                setDescription('');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit description'
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit description. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sceneNumber = currentContent.sequenceNumber || currentContent.metadata?.sceneNumber || 0;

    const sceneTitle = currentContent.title || '';
    const imageUrl = currentContent.metadata?.imageUrl || currentContent.metadata?.gifUrl || '';
    const explanation = currentContent.metadata?.explanation || '';
    const hindiSummary = currentContent.metadata?.hindiSummary || '';
    const keywords = currentContent.metadata?.keywords || [];

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
                {/* Header with Scene Number */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Scene #{sceneNumber}
                        </Typography>
                        <Chip label={currentContent.level} size="small" color="primary" />
                    </Box>

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                        }}
                    >
                        {sceneTitle}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Image/GIF Display */}
                {imageUrl && (
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Box
                            component="img"
                            src={imageUrl}
                            alt={sceneTitle}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                borderRadius: 2,
                                boxShadow: 3,
                                objectFit: 'contain',
                            }}
                            onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </Box>
                )}

                {/* Scene Explanation */}
                {explanation && (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                                Scene Explanation
                            </Typography>
                            <IconButton
                                onClick={handlePlayAudio}
                                sx={{
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                }}
                                aria-label="Play explanation"
                            >
                                {isPlaying ? (
                                    <VolumeOffIcon />
                                ) : (
                                    <VolumeUpIcon />
                                )}
                            </IconButton>
                        </Box>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                            {explanation}
                        </Typography>
                    </Box>
                )}

                {/* Hindi Summary */}
                {hindiSummary && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Hindi Summary
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                            {hindiSummary}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

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
                                        {keyword.meaning_hi || keyword.translation_hi}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
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
                        Previous Scene
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Scene
                    </Button>
                </Box>

                {/* Description Submission Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        Describe the scene in your own words
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You will earn 10 points for submission, plus 2 points for each correct sentence.
                    </Typography>
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmitDescription}>
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            placeholder="Describe what you see in the scene..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting || !user}
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                disabled={!description.trim() || isSubmitting || !user}
                                sx={{ minWidth: 150 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Description'}
                            </Button>
                        </Box>
                        {!user && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Please log in to submit a description.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SceneCard;
