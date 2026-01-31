// src/components/features/WordOfTheDayCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    Tabs,
    Tab,
    IconButton,
    CircularProgress,
    Alert,
    List,
    ListItem,
    Chip,
    Divider
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
import { getContentTypeConfig, type ContentType } from '../../utils/contentTypeConfig';

interface DailyContent {
    _id: string;
    type: string;
    date: string;
    level: string;
    title: string;
    metadata: {
        text: string;
        meaning_en: string;
        meaning_hi: string;
        audio?: string;
        examples?: Array<{
            en: string;
            hi: string;
            audio?: string;
        }>;
        synonyms?: string[];
        antonyms?: string[];
    };
}

interface WordOfTheDayCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`word-tabpanel-${index}`}
            aria-labelledby={`word-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const WordOfTheDayCard: React.FC<WordOfTheDayCardProps> = ({ data, onContentChange }) => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [sentence, setSentence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentData, setCurrentData] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Update currentData when data prop changes
    useEffect(() => {
        setCurrentData(data);
        setSentence(''); // Clear sentence input when content changes
        setSubmitStatus(null); // Clear submit status
        setTabValue(0); // Reset to first tab
    }, [data]);

    // Check for adjacent content
    useEffect(() => {
        const checkAdjacentContent = async () => {
            if (!currentData.date || !currentData.level) return;

            try {
                const [prevContent, nextContent] = await Promise.all([
                    getAdjacentContent(currentData.date, 'WORD', currentData.level, 'prev'),
                    getAdjacentContent(currentData.date, 'WORD', currentData.level, 'next')
                ]);

                setHasPrevious(!!prevContent);
                setHasNext(!!nextContent);
            } catch (error) {
                setHasPrevious(false);
                setHasNext(false);
            }
        };

        checkAdjacentContent();
    }, [currentData.date, currentData.level]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        if (!currentData.date || !currentData.level) return;

        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(
                currentData.date,
                'WORD',
                currentData.level,
                direction
            );

            if (adjacentContent) {
                setCurrentData(adjacentContent);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} word available.`
                });
            }
        } catch (error) {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} word.`
            });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handlePlayAudio = () => {
        if (isPlaying) {
            // Stop audio
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

        // Try to play audio file if available
        if (currentData.metadata.audio) {
            try {
                const audio = new Audio(data.metadata.audio);
                audioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => {
                    // Fallback to TTS if audio file fails
                    playTTS();
                };
                audio.play().catch(() => {
                    // Fallback to TTS if play fails
                    playTTS();
                });
            } catch (error) {
                playTTS();
            }
        } else {
            playTTS();
        }
    };

    const playTTS = () => {
        if (synthRef.current && currentData.metadata.text) {
            const utterance = new SpeechSynthesisUtterance(currentData.metadata.text);
            utterance.lang = 'en-US';
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            synthRef.current.speak(utterance);
        } else {
            setIsPlaying(false);
        }
    };

    const handleSubmitSentence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sentence.trim()) return;

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-sentence', {
                wordId: currentData._id,
                word: currentData.metadata.text,
                sentence: sentence.trim()
            });

            if (response.data?.status === 'success') {
                setSubmitStatus({ type: 'success', message: 'Great job! Your sentence has been submitted.' });
                setSentence('');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            } else {
                setSubmitStatus({ type: 'error', message: response.data?.message || 'Failed to submit sentence' });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit sentence. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const contentType = (currentData.type === 'WORD' || currentData.type === 'PHRASE') 
        ? (currentData.type as ContentType) 
        : 'WORD';
    const config = getContentTypeConfig(contentType);

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 800,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                border: `2px solid ${config.borderColor}`,
                backgroundColor: config.backgroundColor,
            }}
        >
            {/* Confetti Effect */}
            {showConfetti && <ConfettiEffect />}

            <CardContent sx={{ p: 4 }}>
                {/* Header with Word and Audio Button */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box
                                component={config.icon}
                                sx={{
                                    fontSize: 20,
                                    color: config.color,
                                    mr: 0.5
                                }}
                            />
                            <Typography variant="overline" sx={{ fontSize: '0.75rem', color: config.color, fontWeight: 'bold' }}>
                                {config.label}
                            </Typography>
                            {currentData.sequenceNumber && (
                                <Chip
                                    label={`Word #${currentData.sequenceNumber}`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            )}
                            {currentData.metadata.partOfSpeech && (
                                <Chip
                                    label={currentData.metadata.partOfSpeech}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        <Typography
                            variant="h2"
                            component="h1"
                            sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                mt: 0.5,
                                fontSize: { xs: '2rem', sm: '3rem' },
                            }}
                        >
                            {currentData.metadata.text}
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

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="word information tabs">
                        <Tab label="Meaning" id="word-tab-0" aria-controls="word-tabpanel-0" />
                        <Tab label="Examples" id="word-tab-1" aria-controls="word-tabpanel-1" />
                        <Tab label="Synonyms" id="word-tab-2" aria-controls="word-tabpanel-2" />
                    </Tabs>
                </Box>

                {/* Meaning Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            English Meaning
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                            {currentData.metadata.meaning_en}
                        </Typography>
                        {currentData.metadata.meaning_hi && (
                            <>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Hindi Meaning
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    {currentData.metadata.meaning_hi}
                                </Typography>
                            </>
                        )}
                    </Box>
                </TabPanel>

                {/* Examples Tab */}
                <TabPanel value={tabValue} index={1}>
                    {currentData.metadata.examples && currentData.metadata.examples.length > 0 ? (
                        <List>
                            {currentData.metadata.examples.map((example, index) => (
                                <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 2 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {example.en}
                                    </Typography>
                                    {example.hi && (
                                        <Typography variant="body2" color="text.secondary">
                                            {example.hi}
                                        </Typography>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No examples available.
                        </Typography>
                    )}
                </TabPanel>

                {/* Synonyms Tab */}
                <TabPanel value={tabValue} index={2}>
                    {currentData.metadata.synonyms && currentData.metadata.synonyms.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {currentData.metadata.synonyms.map((synonym, index) => (
                                <Chip key={index} label={synonym} variant="outlined" color="primary" />
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No synonyms available.
                        </Typography>
                    )}
                    {currentData.metadata.antonyms && currentData.metadata.antonyms.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Antonyms
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {currentData.metadata.antonyms.map((antonym, index) => (
                                    <Chip key={index} label={antonym} variant="outlined" color="secondary" />
                                ))}
                            </Box>
                        </Box>
                    )}
                </TabPanel>

                <Divider sx={{ my: 4 }} />

                {/* Interaction Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Make a sentence with this word
                    </Typography>
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmitSentence}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Type your sentence here..."
                            value={sentence}
                            onChange={(e) => setSentence(e.target.value)}
                            disabled={isSubmitting || !user}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            disabled={!sentence.trim() || isSubmitting || !user}
                            sx={{ minWidth: 150 }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                        {!user && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Please log in to submit a sentence.
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => handleNavigation('prev')}
                        disabled={!hasPrevious || isLoadingNav}
                        sx={{ minWidth: 150 }}
                    >
                        {isLoadingNav ? 'Loading...' : 'Previous Word'}
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                        sx={{ minWidth: 150 }}
                    >
                        {isLoadingNav ? 'Loading...' : 'Next Word'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

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

export default WordOfTheDayCard;
