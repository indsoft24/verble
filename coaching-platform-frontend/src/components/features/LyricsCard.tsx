// src/components/features/LyricsCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    IconButton,
    Divider,
    Chip,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';


interface LyricsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
}

const LyricsCard: React.FC<LyricsCardProps> = ({ data, onContentChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setCurrentContent(data);
        checkNavigationAvailability();

        // Set up audio event listeners
        const audio = audioRef.current;
        if (audio) {
            const updateTime = () => setCurrentTime(audio.currentTime);
            const updateDuration = () => setDuration(audio.duration);
            const handleEnded = () => setIsPlaying(false);

            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', handleEnded);
            };
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'LYRICS', data.level, 'prev'),
                getAdjacentContent(data.date, 'LYRICS', data.level, 'next')
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
                'LYRICS',
                currentContent.level,
                direction
            );

            if (adjacentContent) {
                // Stop current audio if playing
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                setIsPlaying(false);
                setCurrentTime(0);
                setDuration(0);

                setCurrentContent(adjacentContent);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
            }
        } catch (error: any) {
            console.error('Failed to load adjacent content:', error);
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handlePlayPause = () => {
        if (!audioRef.current) {
            // Initialize audio element
            const audioUrl = currentContent.metadata?.audio;
            if (!audioUrl) {
                return;
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onloadedmetadata = () => {
                setDuration(audio.duration);
            };

            audio.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            audio.onerror = () => {
                setIsPlaying(false);
                console.error('Failed to load audio');
            };
        }

        const audio = audioRef.current;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play()
                .then(() => {
                    setIsPlaying(true);
                    setDuration(audio.duration);
                })
                .catch((error) => {
                    console.error('Failed to play audio:', error);
                    setIsPlaying(false);
                });
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const lyricsNumber = currentContent.sequenceNumber || currentContent.metadata?.lyricsNumber || 0;

    const songTitle = currentContent.title || '';
    const artist = currentContent.metadata?.artist || '';
    const lyrics = currentContent.metadata?.lyrics || '';
    const audioUrl = currentContent.metadata?.audio || '';
    const words = currentContent.metadata?.words || [];
    const phrases = currentContent.metadata?.phrases || [];

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 900,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                {/* Header with Lyrics Number */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Lyrics #{lyricsNumber}
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
                        {songTitle}
                    </Typography>
                    {artist && (
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            by {artist}
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Audio Player */}
                {audioUrl && (
                    <Box sx={{ mb: 4 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                backgroundColor: 'grey.50',
                                borderRadius: 2,
                            }}
                        >
                            <IconButton
                                onClick={handlePlayPause}
                                sx={{
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    width: 56,
                                    height: 56,
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                }}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? (
                                    <PauseIcon sx={{ fontSize: 32 }} />
                                ) : (
                                    <PlayArrowIcon sx={{ fontSize: 32 }} />
                                )}
                            </IconButton>

                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                                        {formatTime(currentTime)}
                                    </Typography>
                                    <Box sx={{ flex: 1, position: 'relative' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                backgroundColor: 'grey.300',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                },
                                            }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            step="0.1"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                                        {formatTime(duration)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Lyrics Display */}
                {lyrics && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Lyrics
                        </Typography>
                        <Box
                            sx={{
                                p: 3,
                                backgroundColor: 'grey.50',
                                borderRadius: 2,
                                maxHeight: '500px',
                                overflowY: 'auto',
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: 'pre-line',
                                    lineHeight: 2,
                                    fontFamily: 'monospace',
                                }}
                            >
                                {lyrics}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Important Words Section */}
                {words.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Important Words ({words.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {words.map((word: any, index: number) => (
                                        <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', pb: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {word.word || word.text}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {word.meaning || word.meaning_en}
                                            </Typography>
                                            {word.meaning_hi && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {word.meaning_hi}
                                                </Typography>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                )}

                {/* Important Phrases Section */}
                {phrases.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Important Phrases ({phrases.length})
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => handleNavigation('prev')}
                        disabled={!hasPrevious || isLoadingNav}
                    >
                        Previous Lyrics
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Lyrics
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default LyricsCard;
