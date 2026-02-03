// src/components/features/SpeechCard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { keyframes } from '@emotion/react';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';


interface SpeechCardProps {
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

// Helper function to extract YouTube video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

const SpeechCard: React.FC<SpeechCardProps> = ({ data, onContentChange }) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    useEffect(() => {
        setCurrentContent(data);
        checkNavigationAvailability();
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'SPEECH', data.level, 'prev'),
                getAdjacentContent(data.date, 'SPEECH', data.level, 'next')
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
                'SPEECH',
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
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} speech available.`
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} speech.`
            });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSubmitDescription = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            setSubmitStatus({
                type: 'error',
                message: 'Please describe the speech before submitting.'
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-speech-description', {
                speechId: currentContent._id,
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

    const speechNumber = currentContent.sequenceNumber || currentContent.metadata?.speechNumber || 0;

    const speechTitle = currentContent.title || '';
    const speakerName = currentContent.metadata?.speaker || '';
    const youtubeUrl = currentContent.metadata?.youtubeUrl || '';
    const transcript = currentContent.metadata?.transcript || '';
    const keywords = currentContent.metadata?.keywords || [];
    const phrases = currentContent.metadata?.phrases || [];

    // Extract YouTube video ID
    const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
    const embedUrl = youtubeVideoId
        ? `https://www.youtube.com/embed/${youtubeVideoId}`
        : null;

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
                {/* Header with Speech Number */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Speech #{speechNumber}
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
                        {speechTitle}
                    </Typography>
                    {speakerName && (
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            by {speakerName}
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* YouTube Embed */}
                {embedUrl && (
                    <Box sx={{ mb: 4 }}>
                        <Box
                            sx={{
                                position: 'relative',
                                paddingTop: '56.25%', // 16:9 Aspect Ratio
                                backgroundColor: '#000',
                                borderRadius: 2,
                                overflow: 'hidden',
                                width: '100%',
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
                    </Box>
                )}

                {/* Transcript Section */}
                {transcript && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Transcript
                        </Typography>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: 'grey.50',
                                borderRadius: 2,
                                maxHeight: '400px',
                                overflowY: 'auto',
                            }}
                        >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                {transcript}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Keywords Section */}
                {keywords.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Keywords ({keywords.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {keywords.map((keyword: any, index: number) => (
                                        <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {keyword.word || keyword.phrase}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {keyword.meaning || keyword.meaning_en}
                                            </Typography>
                                            {keyword.meaning_hi && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {keyword.meaning_hi}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                )}

                {/* Key Phrases Section */}
                {phrases.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Key Phrases ({phrases.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {phrases.map((phrase: any, index: number) => (
                                        <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {phrase.phrase || phrase.text}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {phrase.meaning || phrase.meaning_en}
                                            </Typography>
                                            {phrase.meaning_hi && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {phrase.meaning_hi}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
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
                        Previous Speech
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Speech
                    </Button>
                </Box>

                {/* Description Submission Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        Type the speech in your own words
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
                            placeholder="Describe the speech in your own words..."
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

export default SpeechCard;
