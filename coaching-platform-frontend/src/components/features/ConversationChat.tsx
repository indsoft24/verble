// WhatsApp-style practical conversation — chronological thread, two fixed participants
import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tooltip,
    CircularProgress,
    IconButton,
    alpha,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import TranslateIcon from '@mui/icons-material/Translate';
import { keyframes } from '@emotion/react';
import { isParticipant2Speaker, type DialogueLine } from '../../utils/conversationDialogueUtils';

const SILVER_ACCENT = '#3b82f6';
const WA_HEADER = '#075e54';
const WA_BG = '#e5ddd5';
const BUBBLE_USER = '#dcf8c6';
const BUBBLE_OTHER = '#ffffff';

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
`;

interface ConversationChatProps {
    dialogue: DialogueLine[];
    participant1: string;
    participant2: string;
    scenarioTitle?: string;
    scenarioTitleHi?: string;
}

const ConversationChat: React.FC<ConversationChatProps> = ({
    dialogue,
    participant1,
    participant2,
    scenarioTitle,
    scenarioTitleHi,
}) => {
    const [showHindi, setShowHindi] = useState<Record<number, boolean>>({});
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [audioLoading, setAudioLoading] = useState<Record<number, boolean>>({});
    const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            Object.values(audioRefs.current).forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dialogue, showHindi]);

    const toggleHindi = (index: number) => {
        setShowHindi((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const playTTS = (index: number, text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onend = () => {
            setPlayingAudio(null);
            setAudioLoading((prev) => ({ ...prev, [index]: false }));
        };
        utterance.onerror = () => {
            setPlayingAudio(null);
            setAudioLoading((prev) => ({ ...prev, [index]: false }));
        };
        synthRef.current.speak(utterance);
    };

    const handlePlayAudio = async (index: number, text: string, audioUrl?: string) => {
        if (playingAudio === index) {
            audioRefs.current[index]?.pause();
            synthRef.current?.cancel();
            setPlayingAudio(null);
            return;
        }

        Object.values(audioRefs.current).forEach((a) => a?.pause());
        synthRef.current?.cancel();

        setPlayingAudio(index);
        setAudioLoading((prev) => ({ ...prev, [index]: true }));

        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRefs.current[index] = audio;
                audio.onended = () => {
                    setPlayingAudio(null);
                    setAudioLoading((prev) => ({ ...prev, [index]: false }));
                };
                audio.onerror = () => playTTS(index, text);
                await audio.play().catch(() => playTTS(index, text));
            } catch {
                playTTS(index, text);
            }
        } else {
            playTTS(index, text);
        }
    };

    const headerTitle = scenarioTitle?.trim() || 'Practical Conversation';

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: { xs: 520, md: 560 },
                maxWidth: 520,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${SILVER_ACCENT}`,
                boxShadow: `0 0 24px ${alpha(SILVER_ACCENT, 0.25)}`,
            }}
        >
            <Box sx={{ bgcolor: WA_HEADER, color: '#fff', px: 2, py: 1.75 }}>
                <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.2 }}>
                    Silver · Practical conversation
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                    {headerTitle}
                </Typography>
                {scenarioTitleHi && (
                    <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
                        {scenarioTitleHi}
                    </Typography>
                )}
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.75 }}>
                    {participant1} · {participant2}
                </Typography>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    bgcolor: WA_BG,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {dialogue.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        No dialogue available for this scenario yet.
                    </Typography>
                )}

                {dialogue.map((item, index) => {
                    const isUser = isParticipant2Speaker(item.speaker, participant1, participant2);
                    const isPlaying = playingAudio === index;
                    const hindiVisible = showHindi[index];

                    return (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                animation: isPlaying ? `${pulse} 1.2s infinite` : 'none',
                            }}
                        >
                            <Box sx={{ maxWidth: '88%', minWidth: 0 }}>
                                {!isUser && (
                                    <Typography
                                        variant="caption"
                                        sx={{ ml: 0.5, mb: 0.25, display: 'block', color: WA_HEADER, fontWeight: 700 }}
                                    >
                                        {item.speaker || participant1}
                                    </Typography>
                                )}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                        bgcolor: isUser ? BUBBLE_USER : BUBBLE_OTHER,
                                        boxShadow: '0 1px 1px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: '#111', whiteSpace: 'pre-wrap' }}>
                                        {item.text_en}
                                    </Typography>
                                    {hindiVisible && item.text_hi && (
                                        <Typography variant="body2" sx={{ color: '#334155', mt: 0.75 }}>
                                            {item.text_hi}
                                        </Typography>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, mt: 0.5 }}>
                                        {item.text_hi && (
                                            <Tooltip title={hindiVisible ? 'Hide Hindi' : 'Show Hindi'}>
                                                <IconButton size="small" onClick={() => toggleHindi(index)}>
                                                    <TranslateIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Play English">
                                            <IconButton
                                                size="small"
                                                onClick={() => handlePlayAudio(index, item.text_en, item.audio)}
                                            >
                                                {audioLoading[index] ? (
                                                    <CircularProgress size={14} />
                                                ) : (
                                                    <VolumeUpIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        {isUser && (
                                            <Tooltip title="Practice speaking">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handlePlayAudio(index, item.text_en, item.audio)}
                                                    sx={{ bgcolor: alpha(WA_HEADER, 0.12) }}
                                                >
                                                    <MicIcon sx={{ fontSize: 18, color: WA_HEADER }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>
        </Paper>
    );
};

export default ConversationChat;
