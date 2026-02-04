// src/components/features/VocabularySetCard.tsx
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
    Checkbox,
    FormControlLabel,
    Grid
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


interface VocabularySetCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: () => void;
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

const VocabularySetCard: React.FC<VocabularySetCardProps> = ({ data, onContentChange, onSubmissionSuccess }) => {
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
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        setCurrentContent(data);
        checkNavigationAvailability();
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
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'VOCAB_SET', data.level, 'prev'),
                getAdjacentContent(data.date, 'VOCAB_SET', data.level, 'next')
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
                'VOCAB_SET',
                currentContent.level,
                direction
            );

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                setSentences([{ sentence: '', vocabWordsUsed: [] }]);
                setSelectedVocabWords({});
                setSubmitStatus(null);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
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

        if (allVocabWordsUsed.size < 5) {
            setSubmitStatus({
                type: 'error',
                message: `You must use at least 5 different vocabulary words across all sentences. Currently using ${allVocabWordsUsed.size}.`
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
                setSubmitStatus({
                    type: 'success',
                    message: `Great job! Your sentences have been submitted. You used ${response.data.data.submission.totalVocabWordsUsed} different vocabulary words. Points will be awarded after review (10 points per correct sentence).`
                });
                setSentences([{ sentence: '', vocabWordsUsed: [] }]);
                setSelectedVocabWords({});
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
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

    const vocabSetNumber = currentContent.sequenceNumber || currentContent.metadata?.vocabSetNumber || 0;

    const theme = currentContent.metadata?.theme || currentContent.title;
    const vocabItems: VocabItem[] = currentContent.metadata?.vocabItems || [];

    // Count total unique vocab words used across all sentences
    const allVocabWordsUsed = new Set<string>();
    sentences.forEach(s => {
        s.vocabWordsUsed.forEach(word => allVocabWordsUsed.add(word.toLowerCase()));
    });

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
                {/* Header with Vocab Set Number and Theme */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Vocabulary Set #{vocabSetNumber}
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
                        {theme}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Vocabulary Items */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Vocabulary ({vocabItems.length} words)
                    </Typography>
                    <List>
                        {vocabItems.map((item: VocabItem, index: number) => (
                            <ListItem
                                key={index}
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    pb: 2,
                                    borderBottom: index < vocabItems.length - 1 ? '1px solid' : 'none',
                                    borderColor: 'divider'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 0.5 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                                        {item.word}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => playAudio(item.word, item.audio)}
                                        sx={{
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                        }}
                                        aria-label={`Play pronunciation for ${item.word}`}
                                    >
                                        {playingAudio[item.word.toLowerCase()] ? (
                                            <VolumeOffIcon fontSize="small" />
                                        ) : (
                                            <VolumeUpIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                                    {item.pronunciation_hi}
                                </Typography>
                                <Typography variant="body1">
                                    {item.meaning_hi}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => handleNavigation('prev')}
                        disabled={!hasPrevious || isLoadingNav}
                    >
                        Previous Set
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Set
                    </Button>
                </Box>

                {/* Sentence Submission Section */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        Create sentences using vocabulary words (2-5 sentences)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Use at least 5 different vocabulary words across all sentences. You will earn 10 points per correct sentence.
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ mb: 2, fontWeight: 'medium' }}>
                        Vocabulary words used: {allVocabWordsUsed.size} / 5 minimum
                    </Typography>
                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmitSentences}>
                        {sentences.map((sentenceData, index) => (
                            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Sentence {index + 1}
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder={`Write a sentence using vocabulary words from the list above...`}
                                    value={sentenceData.sentence}
                                    onChange={(e) => handleSentenceChange(index, e.target.value)}
                                    disabled={isSubmitting || !user}
                                    sx={{ mb: 2 }}
                                />

                                {/* Vocabulary word selection for this sentence */}
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Select vocabulary words used in this sentence:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {vocabItems.map((item: VocabItem) => {
                                            const isSelected = selectedVocabWords[index]?.has(item.word.toLowerCase()) || false;
                                            return (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.word}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onChange={() => handleVocabWordToggle(index, item.word.toLowerCase())}
                                                                size="small"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2">
                                                                {item.word}
                                                            </Typography>
                                                        }
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                    {selectedVocabWords[index] && selectedVocabWords[index].size > 0 && (
                                        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                                            {selectedVocabWords[index].size} word(s) selected for this sentence
                                        </Typography>
                                    )}
                                </Box>

                                {sentences.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={() => removeSentenceField(index)}
                                        disabled={isSubmitting}
                                        sx={{ mt: 1 }}
                                    >
                                        Remove Sentence
                                    </Button>
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

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                disabled={
                                    sentences.filter(s => s.sentence.trim() && s.vocabWordsUsed.length > 0).length < 2 ||
                                    allVocabWordsUsed.size < 5 ||
                                    isSubmitting ||
                                    !user
                                }
                                sx={{ minWidth: 150 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Sentences'}
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                {sentences.filter(s => s.sentence.trim() && s.vocabWordsUsed.length > 0).length} / 5 sentences
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

export default VocabularySetCard;
