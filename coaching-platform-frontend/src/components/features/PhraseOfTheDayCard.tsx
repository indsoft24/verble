// src/components/features/PhraseOfTheDayCard.tsx
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
    Popover,
    List,
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
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getUserWordSubmissions } from '../../services/sentenceSubmissionService';
import type { UserWordSubmission } from '../../services/sentenceSubmissionService';
import { applyPreferredFemaleEnVoice } from '../../utils/ttsVoice';
import {
    activityCardShell,
    getContentDisplayNumber,
    isContentScheduledToday,
    refreshAdjacentFlags,
    GREEN_ACCENT,
    GOLD_ACCENT,
    MAX_ACTIVITY_SENTENCES,
} from '../../utils/dailyActivityUi';
import { SubmissionHistoryItem } from './ActivitySubmissionHistory';
import ActivityContentHeader from './ActivityContentHeader';

interface PhraseOfTheDayCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onNavigateToWord?: () => void;
    onSubmissionSuccess?: () => void;
}

const confettiFall = keyframes`
    from { transform: translateY(0) rotate(0deg); opacity: 1; }
    to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
`;

const ConfettiEffect: React.FC = () => (
    <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1400, overflow: 'hidden' }}>
        {Array.from({ length: 50 }).map((_, i) => (
            <Box
                key={i}
                sx={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    backgroundColor: ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'][i % 6],
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animation: `${confettiFall} ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
                }}
            />
        ))}
    </Box>
);

const PhraseOfTheDayCard: React.FC<PhraseOfTheDayCardProps> = ({
    data,
    onContentChange,
    onNavigateToWord,
    onSubmissionSuccess,
}) => {
    const { user } = useAuth();
    const [sentences, setSentences] = useState<string[]>(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [submissions, setSubmissions] = useState<UserWordSubmission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [historyAnchor, setHistoryAnchor] = useState<HTMLElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const isToday = isContentScheduledToday(currentContent.date);
    const submittedCount = submissions.length;
    const remainingSlots = Math.max(0, MAX_ACTIVITY_SENTENCES - submittedCount);
    const canAddField = sentences.length < remainingSlots && sentences.length < MAX_ACTIVITY_SENTENCES;

    const loadSubmissions = useCallback(async (contentId: string) => {
        if (!user) {
            setSubmissions([]);
            return;
        }
        setSubmissionsLoading(true);
        try {
            setSubmissions(await getUserWordSubmissions(contentId));
        } catch {
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
        }
    }, [user]);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            audioRef.current?.pause();
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        setCurrentContent(data);
        setSentences(['', '']);
        setSubmitStatus(null);
        void loadSubmissions(data._id);
        void checkAdjacent(data._id);
    }, [data, loadSubmissions, checkAdjacent]);

    const stopAudio = () => {
        audioRef.current?.pause();
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
                /* fallback */
            }
        }
        playTTS(text, finish);
    };

    const playTTS = (text: string, onEnd: () => void) => {
        if (!synthRef.current) {
            onEnd();
            return;
        }
        const u = new SpeechSynthesisUtterance(text);
        applyPreferredFemaleEnVoice(u);
        u.onend = onEnd;
        u.onerror = onEnd;
        synthRef.current.speak(u);
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        setSubmitStatus(null);
        try {
            const adjacent = await getAdjacentContent(currentContent._id, direction);
            if (adjacent) {
                setCurrentContent(adjacent);
                setSentences(['', '']);
                onContentChange?.(adjacent);
                await loadSubmissions(adjacent._id);
                await checkAdjacent(adjacent._id);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: `No ${direction === 'prev' ? 'previous' : 'next'} phrase available.`,
                });
            }
        } catch {
            setSubmitStatus({ type: 'error', message: 'Failed to load phrase.' });
        } finally {
            setIsLoadingNav(false);
        }
    };

    const handleSubmitSentences = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isToday) {
            setSubmitStatus({
                type: 'error',
                message: "You can only submit sentences for today's phrase.",
            });
            return;
        }
        const valid = sentences.map((s) => s.trim()).filter(Boolean);
        if (valid.length < 2) return;
        if (valid.length > remainingSlots) {
            setSubmitStatus({
                type: 'error',
                message: `You can submit at most ${remainingSlots} more sentence(s) (5 total).`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const phraseText = String(currentContent.metadata?.text ?? '').trim();
            const response = await apiClient.post('/submit-sentence', {
                wordId: currentContent._id,
                word: phraseText,
                sentences: valid,
            });
            if (response.data?.status === 'success') {
                setSubmitStatus({ type: 'success', message: 'Your sentences have been submitted.' });
                setSentences(['', '']);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                await loadSubmissions(currentContent._id);
                onSubmissionSuccess?.();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit sentences.',
                });
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setSubmitStatus({
                type: 'error',
                message: e.response?.data?.message || 'Failed to submit sentences. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const meta = currentContent.metadata || {};
    const phraseText = meta.text || '';
    const meaningEn = meta.meaning_en || '';
    const meaningHi = meta.meaning_hi || '';
    const example = meta.examples?.[0] || null;
    const displayNumber = getContentDisplayNumber(currentContent.sequenceNumber);
    const validDraftCount = sentences.map((s) => s.trim()).filter(Boolean).length;

    const SpeakerButton: React.FC<{ text: string; playKey: string; audioUrl?: string }> = ({
        text,
        playKey,
        audioUrl,
    }) => (
        <IconButton
            size="small"
            onClick={() => playText(text, playKey, audioUrl)}
            sx={{ color: GREEN_ACCENT, bgcolor: alpha(GREEN_ACCENT, 0.12) }}
            aria-label="Play"
        >
            {playingKey === playKey ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
    );

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {showConfetti && <ConfettiEffect />}

            <Card elevation={0} sx={activityCardShell(GREEN_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ActivityContentHeader
                                contentType="PHRASE"
                                accentColor={GREEN_ACCENT}
                                displayNumber={displayNumber}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem' },
                                    background: `linear-gradient(135deg, #e2e8f0, ${GREEN_ACCENT})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                }}
                            >
                                {phraseText}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={() => playText(phraseText, 'phrase-main', meta.audio)}
                            sx={{ bgcolor: GREEN_ACCENT, color: '#0f172a', width: 56, height: 56, flexShrink: 0 }}
                        >
                            {playingKey === 'phrase-main' ? <StopIcon /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha('#1a1f2e', 0.8),
                            border: `1px solid ${alpha(GREEN_ACCENT, 0.25)}`,
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                    English Meaning
                                </Typography>
                                <SpeakerButton text={meaningEn} playKey="meaning-en" />
                            </Box>
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>{meaningEn}</Typography>
                        </Box>
                        {meaningHi && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                                    Hindi Meaning
                                </Typography>
                                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.85) }}>{meaningHi}</Typography>
                            </Box>
                        )}
                    </Box>

                    {example && (
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#1a1f2e', 0.6), border: `1px solid ${alpha(GREEN_ACCENT, 0.2)}` }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GREEN_ACCENT, mb: 1 }}>
                                Example
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <SpeakerButton text={example.en} playKey="example-en" audioUrl={example.audio} />
                                <Box>
                                    <Typography variant="body1" sx={{ color: '#f1f5f9', fontWeight: 500 }}>{example.en}</Typography>
                                    {example.hi && (
                                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mt: 0.5 }}>{example.hi}</Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: GOLD_ACCENT, letterSpacing: 1.2, display: 'block', mb: 1 }}>
                        Practice and Interact — Make Sentences
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.8) }}>Sentences submitted:</Typography>
                        {user ? (
                            <Button
                                variant="text"
                                onClick={(e) => setHistoryAnchor(e.currentTarget)}
                                disabled={submissionsLoading || submittedCount === 0}
                                sx={{ minWidth: 0, p: 0, fontWeight: 800, fontSize: '1.1rem', color: GOLD_ACCENT, textDecoration: submittedCount > 0 ? 'underline' : 'none' }}
                            >
                                {submissionsLoading ? '…' : submittedCount}
                            </Button>
                        ) : (
                            <Typography sx={{ fontWeight: 800, color: GOLD_ACCENT }}>0</Typography>
                        )}
                    </Box>
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65), mb: 2 }}>
                        Make 2–5 sentences with this phrase
                        {remainingSlots < MAX_ACTIVITY_SENTENCES && isToday ? ` (${remainingSlots} left)` : ''}
                    </Typography>

                    <Popover
                        open={Boolean(historyAnchor)}
                        anchorEl={historyAnchor}
                        onClose={() => setHistoryAnchor(null)}
                        PaperProps={{ sx: { bgcolor: '#1a1f2e', border: `1px solid ${alpha(GOLD_ACCENT, 0.4)}`, maxWidth: 360, p: 1.5 } }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: GOLD_ACCENT, mb: 1 }}>Your submitted sentences</Typography>
                        {submissions.length === 0 ? (
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6) }}>No sentences yet.</Typography>
                        ) : (
                            <List dense disablePadding>
                                {submissions.map((s) => (
                                    <SubmissionHistoryItem key={s._id} submission={s} />
                                ))}
                            </List>
                        )}
                    </Popover>

                    {!isToday && (
                        <Alert severity="info" sx={{ mb: 2 }}>Past phrase — browse only. Submit on today&apos;s phrase.</Alert>
                    )}
                    {submitStatus && <Alert severity={submitStatus.type} sx={{ mb: 2 }}>{submitStatus.message}</Alert>}

                    {remainingSlots > 0 && isToday ? (
                        <Box component="form" onSubmit={handleSubmitSentences}>
                            {sentences.map((sentence, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder={`Sentence ${index + 1}...`}
                                        value={sentence}
                                        onChange={(e) => {
                                            const next = [...sentences];
                                            next[index] = e.target.value;
                                            setSentences(next);
                                        }}
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
                                        <Button type="button" color="error" variant="outlined" onClick={() => setSentences(sentences.filter((_, i) => i !== index))}>
                                            Remove
                                        </Button>
                                    )}
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                {canAddField && (
                                    <Button type="button" variant="outlined" onClick={() => setSentences([...sentences, ''])} sx={{ borderColor: alpha(GOLD_ACCENT, 0.6), color: GOLD_ACCENT }}>
                                        + Add Sentence
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={validDraftCount < 2 || validDraftCount > remainingSlots || isSubmitting || !user}
                                    endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    sx={{ bgcolor: GOLD_ACCENT, color: '#0f172a', fontWeight: 800, minWidth: 140 }}
                                >
                                    Submit
                                </Button>
                            </Box>
                        </Box>
                    ) : isToday ? (
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>Maximum of 5 sentences submitted for this phrase.</Typography>
                    ) : null}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 3, pt: 2, borderTop: `1px solid ${alpha(GOLD_ACCENT, 0.25)}` }}>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => handleNavigation('prev')} disabled={!hasPrevious || isLoadingNav} sx={{ color: alpha('#e2e8f0', 0.85) }}>
                            Previous Phrase
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onNavigateToWord?.()}
                            disabled={!onNavigateToWord}
                            sx={{
                                borderColor: '#14b8a6',
                                color: '#14b8a6',
                                fontWeight: 700,
                                px: 2,
                                '&:hover': {
                                    borderColor: '#14b8a6',
                                    bgcolor: 'rgba(20, 184, 166, 0.12)',
                                },
                                '&.Mui-disabled': {
                                    borderColor: 'rgba(226, 232, 240, 0.2)',
                                    color: 'rgba(226, 232, 240, 0.35)',
                                },
                            }}
                        >
                            ← Word of the Day
                        </Button>
                        <Button endIcon={<ArrowForwardIcon />} onClick={() => handleNavigation('next')} disabled={!hasNext || isLoadingNav} sx={{ color: alpha('#e2e8f0', 0.85) }}>
                            Next Phrase
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PhraseOfTheDayCard;
