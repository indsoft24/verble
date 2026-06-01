// src/components/features/WordOfTheDayCard.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Popover,
    Tooltip,
    alpha,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, getWordDisplayNumber } from '../../services/dailyContentService';
import { getUserWordSubmissions, type UserWordSubmission } from '../../services/sentenceSubmissionService';
import { applyPreferredFemaleEnVoice } from '../../utils/ttsVoice';
import ActivityContentHeader from './ActivityContentHeader';

interface DailyContent {
    _id: string;
    type: string;
    date: string;
    level: string;
    title: string;
    sequenceNumber?: number;
    metadata: {
        text: string;
        meaning_en: string;
        meaning_hi: string;
        audio?: string;
        pronunciation_ipa?: string;
        pronunciation_devanagari?: string;
        partOfSpeech?: string;
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
    onSubmissionSuccess?: () => void;
    onNavigateToPhrase?: () => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const MAX_SENTENCES = 5;
const GREEN_ACCENT = '#14b8a6';
const GOLD_ACCENT = '#ca8a04';

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`word-tabpanel-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

const toLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const isScheduledToday = (dateStr: string) => {
    const contentDate = new Date(dateStr);
    return toLocalDateKey(contentDate) === toLocalDateKey(new Date());
};

const WordOfTheDayCard: React.FC<WordOfTheDayCardProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    onNavigateToPhrase,
}) => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [sentences, setSentences] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentData, setCurrentData] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [submissions, setSubmissions] = useState<UserWordSubmission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [historyAnchor, setHistoryAnchor] = useState<HTMLElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const isToday = isScheduledToday(currentData.date);
    const submittedCount = submissions.length;
    const remainingSlots = Math.max(0, MAX_SENTENCES - submittedCount);
    const canAddField = sentences.length < remainingSlots && sentences.length < MAX_SENTENCES;

    const loadSubmissions = useCallback(async (wordId: string) => {
        if (!user) {
            setSubmissions([]);
            return;
        }
        setSubmissionsLoading(true);
        try {
            const list = await getUserWordSubmissions(wordId);
            setSubmissions(list);
        } catch {
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
        }
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const [prevContent, nextContent] = await Promise.all([
            getAdjacentContent(contentId, 'prev'),
            getAdjacentContent(contentId, 'next'),
        ]);
        setHasPrevious(!!prevContent);
        setHasNext(!!nextContent);
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        setCurrentData(data);
        setSentences(['', '']);
        setSubmitStatus(null);
        setTabValue(0);
        void loadSubmissions(data._id);
        void checkAdjacent(data._id);
    }, [data, loadSubmissions, checkAdjacent]);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        synthRef.current?.cancel();
        setPlayingKey(null);
    };

    const playText = (text: string, key: string, audioUrl?: string) => {
        if (!text?.trim()) return;
        if (playingKey === key) {
            stopAudio();
            return;
        }
        stopAudio();
        setPlayingKey(key);

        const finish = () => setPlayingKey(null);

        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.onended = finish;
                audio.onerror = () => playTTS(text, finish);
                audio.play().catch(() => playTTS(text, finish));
                return;
            } catch {
                /* TTS fallback */
            }
        }
        playTTS(text, finish);
    };

    const playTTS = (text: string, onEnd: () => void) => {
        if (!synthRef.current) {
            onEnd();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        applyPreferredFemaleEnVoice(utterance);
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
        synthRef.current.speak(utterance);
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        setSubmitStatus(null);
        try {
            const adjacentContent = await getAdjacentContent(currentData._id, direction);
            if (adjacentContent) {
                setCurrentData(adjacentContent);
                setSentences(['', '']);
                onContentChange?.(adjacentContent);
                await loadSubmissions(adjacentContent._id);
                await checkAdjacent(adjacentContent._id);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} word available.`,
                });
            }
        } catch {
            setSubmitStatus({
                type: 'error',
                message: `Failed to load ${direction === 'prev' ? 'previous' : 'next'} word.`,
            });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSubmitSentence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({
                type: 'error',
                message: 'You can only submit sentences for today\'s word.',
            });
            return;
        }

        const validSentences = sentences.map((s) => s.trim()).filter(Boolean);
        if (validSentences.length < 2) return;
        if (validSentences.length > remainingSlots) {
            setSubmitStatus({
                type: 'error',
                message: `You can submit at most ${remainingSlots} more sentence(s) (5 total per word).`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiClient.post('/submit-sentence', {
                wordId: currentData._id,
                word: currentData.metadata.text,
                sentences: validSentences,
            });

            if (response.data?.status === 'success') {
                const participation =
                    response.data.data.participationPointsAwarded ?? 10;
                setSubmitStatus({
                    type: 'success',
                    message: `Great job! ${participation > 0 ? `+${participation} participation points toward the leaderboard. ` : ''}Your sentences are pending review for evaluation score.`,
                });
                setSentences(['', '']);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                await loadSubmissions(currentData._id);
                onSubmissionSuccess?.();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit sentences',
                });
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSubmitStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to submit sentences. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateSentence = (index: number, value: string) => {
        const next = [...sentences];
        next[index] = value;
        setSentences(next);
    };

    const addSentenceField = () => {
        if (canAddField) {
            setSentences([...sentences, '']);
        }
    };

    const removeSentenceField = (index: number) => {
        if (sentences.length > 2) {
            setSentences(sentences.filter((_, i) => i !== index));
        }
    };

    const validDraftCount = sentences.map((s) => s.trim()).filter(Boolean).length;
    const displayNumber = getWordDisplayNumber(currentData.sequenceNumber);

    const cardShell = (borderColor: string) => ({
        maxWidth: 800,
        margin: '0 auto',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative' as const,
        border: `2px solid ${borderColor}`,
        bgcolor: '#0f172a',
        boxShadow: `0 0 24px ${alpha(borderColor, 0.35)}`,
        mb: 2.5,
    });

    const SpeakerButton: React.FC<{ text: string; playKey: string; audioUrl?: string; size?: 'small' | 'medium' }> = ({
        text,
        playKey,
        audioUrl,
        size = 'small',
    }) => (
        <IconButton
            size={size}
            onClick={() => playText(text, playKey, audioUrl)}
            sx={{
                color: GREEN_ACCENT,
                bgcolor: alpha(GREEN_ACCENT, 0.12),
                '&:hover': { bgcolor: alpha(GREEN_ACCENT, 0.22) },
            }}
            aria-label="Play audio"
        >
            {playingKey === playKey ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
    );

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            {/* Card 1 — Word & meanings */}
            <Card elevation={0} sx={cardShell(GREEN_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ActivityContentHeader
                                contentType="WORD"
                                accentColor={GREEN_ACCENT}
                                displayNumber={displayNumber}
                                secondaryChip={currentData.metadata.partOfSpeech}
                            />
                            <Typography
                                variant="h3"
                                component="h1"
                                sx={{
                                    fontWeight: 900,
                                    background: `linear-gradient(135deg, #e2e8f0 0%, ${GREEN_ACCENT} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                    fontSize: { xs: '2rem', sm: '2.75rem' },
                                }}
                            >
                                {currentData.metadata.text}
                            </Typography>
                            {(currentData.metadata.pronunciation_ipa ||
                                currentData.metadata.pronunciation_devanagari) && (
                                <Box sx={{ mt: 1 }}>
                                    {currentData.metadata.pronunciation_ipa && (
                                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                            {currentData.metadata.pronunciation_ipa}
                                        </Typography>
                                    )}
                                    {currentData.metadata.pronunciation_devanagari && (
                                        <Typography variant="body1" sx={{ color: alpha('#e2e8f0', 0.75), mt: 0.5 }}>
                                            {currentData.metadata.pronunciation_devanagari}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                        <IconButton
                            onClick={() => playText(currentData.metadata.text, 'word-main', currentData.metadata.audio)}
                            sx={{
                                bgcolor: GREEN_ACCENT,
                                color: '#0f172a',
                                width: 56,
                                height: 56,
                                flexShrink: 0,
                                '&:hover': { bgcolor: alpha(GREEN_ACCENT, 0.85) },
                            }}
                            aria-label="Play word pronunciation"
                        >
                            {playingKey === 'word-main' ? (
                                <StopIcon sx={{ fontSize: 28 }} />
                            ) : (
                                <PlayArrowIcon sx={{ fontSize: 32, ml: 0.25 }} />
                            )}
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha('#1a1f2e', 0.8),
                            border: `1px solid ${alpha(GREEN_ACCENT, 0.25)}`,
                        }}
                    >
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                    English Meaning
                                </Typography>
                                <SpeakerButton
                                    text={currentData.metadata.meaning_en}
                                    playKey="meaning-en"
                                />
                            </Box>
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>
                                {currentData.metadata.meaning_en}
                            </Typography>
                        </Box>
                        {currentData.metadata.meaning_hi && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                                    Hindi Meaning
                                </Typography>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>
                                    {currentData.metadata.meaning_hi}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ borderBottom: 1, borderColor: alpha(GREEN_ACCENT, 0.3) }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_e, v) => setTabValue(v)}
                            textColor="inherit"
                            TabIndicatorProps={{ sx: { bgcolor: GREEN_ACCENT, height: 3 } }}
                            sx={{
                                '& .MuiTab-root': {
                                    color: alpha('#e2e8f0', 0.6),
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    letterSpacing: 1,
                                },
                                '& .Mui-selected': { color: GREEN_ACCENT },
                            }}
                        >
                            <Tab label="Meaning" />
                            <Tab label="Examples" />
                            <Tab label="Synonyms" />
                            <Tab label="Antonyms" />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha('#1a1f2e', 0.6),
                                border: `1px solid ${alpha(GREEN_ACCENT, 0.2)}`,
                            }}
                        >
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                        English Meaning
                                    </Typography>
                                    <SpeakerButton
                                        text={currentData.metadata.meaning_en}
                                        playKey="meaning-en-tab"
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>
                                    {currentData.metadata.meaning_en || 'No English meaning available.'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                                    Hindi Meaning
                                </Typography>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>
                                    {currentData.metadata.meaning_hi || 'No Hindi meaning available.'}
                                </Typography>
                            </Box>
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        {currentData.metadata.examples && currentData.metadata.examples.length > 0 ? (
                            <List disablePadding>
                                {currentData.metadata.examples.map((example, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            py: 1.5,
                                            px: 0,
                                            borderBottom:
                                                index < currentData.metadata.examples!.length - 1
                                                    ? `1px solid ${alpha('#e2e8f0', 0.1)}`
                                                    : 'none',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                                            <SpeakerButton
                                                text={example.en}
                                                playKey={`example-${index}`}
                                                audioUrl={example.audio}
                                            />
                                            <Typography variant="body1" sx={{ color: '#f1f5f9', fontWeight: 500, flex: 1 }}>
                                                {example.en}
                                            </Typography>
                                        </Box>
                                        {example.hi && (
                                            <Typography
                                                variant="body2"
                                                sx={{ color: alpha('#e2e8f0', 0.65), mt: 0.5, pl: 5 }}
                                            >
                                                {example.hi}
                                            </Typography>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.5) }}>
                                No examples available.
                            </Typography>
                        )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        {currentData.metadata.synonyms?.some((s) => String(s ?? '').trim()) ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {currentData.metadata.synonyms
                                    .filter((s) => String(s ?? '').trim())
                                    .map((synonym, index) => (
                                        <Chip
                                            key={index}
                                            label={synonym}
                                            variant="outlined"
                                            sx={{ borderColor: alpha(GREEN_ACCENT, 0.5), color: GREEN_ACCENT }}
                                        />
                                    ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.5) }}>
                                No synonyms available.
                            </Typography>
                        )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={3}>
                        {currentData.metadata.antonyms?.some((s) => String(s ?? '').trim()) ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {currentData.metadata.antonyms
                                    .filter((s) => String(s ?? '').trim())
                                    .map((antonym, index) => (
                                        <Chip
                                            key={index}
                                            label={antonym}
                                            variant="outlined"
                                            sx={{ borderColor: alpha('#94a3b8', 0.5), color: '#94a3b8' }}
                                        />
                                    ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.5) }}>
                                No antonyms available.
                            </Typography>
                        )}
                    </TabPanel>
                </CardContent>
            </Card>

            {/* Card 2 — Practice & interact */}
            <Card elevation={0} sx={cardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography
                        variant="overline"
                        sx={{ fontWeight: 800, letterSpacing: 1.2, color: GOLD_ACCENT, display: 'block', mb: 1 }}
                    >
                        Practice and Interact — Make Sentences
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.8) }}>
                            Sentences submitted:
                        </Typography>
                        {user ? (
                            <Button
                                variant="text"
                                onClick={(e) => setHistoryAnchor(e.currentTarget)}
                                disabled={submissionsLoading || submittedCount === 0}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    color: GOLD_ACCENT,
                                    textDecoration: submittedCount > 0 ? 'underline' : 'none',
                                }}
                            >
                                {submissionsLoading ? '…' : submittedCount}
                            </Button>
                        ) : (
                            <Typography component="span" sx={{ fontWeight: 800, color: GOLD_ACCENT }}>
                                0
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Make 2–5 sentences with this word
                        {remainingSlots < MAX_SENTENCES && isToday
                            ? ` (${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left today)`
                            : ''}
                    </Typography>

                    <Popover
                        open={Boolean(historyAnchor)}
                        anchorEl={historyAnchor}
                        onClose={() => setHistoryAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{
                            sx: {
                                bgcolor: '#1a1f2e',
                                border: `1px solid ${alpha(GOLD_ACCENT, 0.4)}`,
                                maxWidth: 360,
                                p: 1.5,
                            },
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GOLD_ACCENT, mb: 1 }}>
                            Your submitted sentences
                        </Typography>
                        {submissions.length === 0 ? (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6) }}>
                                No sentences yet.
                            </Typography>
                        ) : (
                            <List dense disablePadding>
                                {submissions.map((sub) => (
                                    <SubmissionHistoryItem key={sub._id} submission={sub} />
                                ))}
                            </List>
                        )}
                    </Popover>

                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            This is a past word — browse only. Submit sentences on today&apos;s word.
                        </Alert>
                    )}

                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}

                    {remainingSlots > 0 && isToday ? (
                        <Box component="form" onSubmit={handleSubmitSentence}>
                            {sentences.map((sentence, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder={`Sentence ${index + 1}...`}
                                        value={sentence}
                                        onChange={(e) => updateSentence(index, e.target.value)}
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
                                            variant="outlined"
                                            color="error"
                                            onClick={() => removeSentenceField(index)}
                                            disabled={isSubmitting}
                                            sx={{ flexShrink: 0, mt: 0.5 }}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Box>
                            ))}

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: 2,
                                    mt: 1,
                                }}
                            >
                                {canAddField && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        onClick={addSentenceField}
                                        disabled={isSubmitting || !user}
                                        sx={{
                                            borderColor: alpha(GOLD_ACCENT, 0.6),
                                            color: GOLD_ACCENT,
                                            fontWeight: 700,
                                        }}
                                    >
                                        + Add Sentence
                                    </Button>
                                )}
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
                                    disabled={
                                        validDraftCount < 2 ||
                                        validDraftCount > remainingSlots ||
                                        isSubmitting ||
                                        !user ||
                                        !isToday
                                    }
                                    sx={{
                                        bgcolor: GOLD_ACCENT,
                                        color: '#0f172a',
                                        fontWeight: 800,
                                        minWidth: 140,
                                        '&:hover': { bgcolor: alpha(GOLD_ACCENT, 0.9) },
                                        '&.Mui-disabled': {
                                            bgcolor: alpha(GOLD_ACCENT, 0.35),
                                            color: alpha('#0f172a', 0.5),
                                        },
                                    }}
                                >
                                    {isSubmitting ? 'Submitting…' : 'Submit'}
                                </Button>
                            </Box>
                            {!user && (
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), mt: 1 }}>
                                    Please log in to submit sentences.
                                </Typography>
                            )}
                        </Box>
                    ) : isToday ? (
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                            You have submitted the maximum of 5 sentences for this word.
                        </Typography>
                    ) : null}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1,
                            mt: 3,
                            pt: 2,
                            borderTop: `1px solid ${alpha(GOLD_ACCENT, 0.25)}`,
                        }}
                    >
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => handleNavigation('prev')}
                            disabled={!hasPrevious || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85), fontWeight: 600 }}
                        >
                            {isLoadingNav ? 'Loading…' : 'Previous Word'}
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onNavigateToPhrase?.()}
                            disabled={!onNavigateToPhrase}
                            sx={{
                                borderColor: GOLD_ACCENT,
                                color: GOLD_ACCENT,
                                fontWeight: 700,
                                px: 2,
                                '&:hover': {
                                    borderColor: GOLD_ACCENT,
                                    bgcolor: alpha(GOLD_ACCENT, 0.12),
                                },
                                '&.Mui-disabled': {
                                    borderColor: alpha('#e2e8f0', 0.2),
                                    color: alpha('#e2e8f0', 0.35),
                                },
                            }}
                        >
                            → Phrase of the Day
                        </Button>

                        <Button
                            variant="text"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleNavigation('next')}
                            disabled={!hasNext || isLoadingNav}
                            sx={{ color: alpha('#e2e8f0', 0.85), fontWeight: 600 }}
                        >
                            {isLoadingNav ? 'Loading…' : 'Next Word'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

const SubmissionHistoryItem: React.FC<{ submission: UserWordSubmission }> = ({ submission }) => {
    const isCorrect = submission.isCorrect === true;
    const isWrong = submission.isCorrect === false;
    const color = isCorrect ? '#22c55e' : isWrong ? '#ef4444' : alpha('#e2e8f0', 0.85);
    const correction = submission.feedback?.trim();

    const row = (
        <ListItem sx={{ py: 0.75, px: 0, display: 'block' }}>
            <Typography
                variant="body2"
                sx={{
                    color,
                    fontWeight: isWrong || isCorrect ? 600 : 400,
                    lineHeight: 1.45,
                }}
            >
                {submission.sentence}
            </Typography>
            {isCorrect && (submission.evaluationPoints ?? 0) > 0 && (
                <Typography variant="caption" sx={{ display: 'block', color: '#86efac', mt: 0.5 }}>
                    Evaluation: {submission.evaluationPoints} pts
                </Typography>
            )}
            {isWrong && correction && (
                <Typography variant="caption" sx={{ display: 'block', color: '#fca5a5', mt: 0.5 }}>
                    {correction}
                </Typography>
            )}
        </ListItem>
    );

    if (isWrong && correction) {
        return (
            <Tooltip title={correction} placement="top" enterTouchDelay={0}>
                {row}
            </Tooltip>
        );
    }

    return row;
};

const confettiFall = keyframes`
    from { transform: translateY(0) rotate(0deg); opacity: 1; }
    to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
`;

const ConfettiEffect: React.FC = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1400,
                overflow: 'hidden',
            }}
        >
            {Array.from({ length: 50 }).map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        width: 10,
                        height: 10,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        left: `${Math.random() * 100}%`,
                        top: '-10px',
                        animation: `${confettiFall} ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
                    }}
                />
            ))}
        </Box>
    );
};

export default WordOfTheDayCard;
