// Chat-style practical conversation — chronological thread, two fixed participants
import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tooltip,
    CircularProgress,
    IconButton,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import { keyframes } from '@emotion/react';
import { isParticipant2Speaker, type DialogueLine } from '../../utils/conversationDialogueUtils';
import ActivityContentHeader from './ActivityContentHeader';
import { practicalConversationTheme as theme } from './practicalConversationTheme';

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
`;

export interface ConversationChatProps {
    dialogue: DialogueLine[];
    participant1: string;
    participant2: string;
    scenarioTitle?: string;
    scenarioTitleHi?: string;
    displayNumber?: string | null;
}

const ConversationChat: React.FC<ConversationChatProps> = ({
    dialogue,
    participant1,
    participant2,
    scenarioTitle,
    scenarioTitleHi,
    displayNumber,
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
                width: theme.frameWidth,
                maxWidth: theme.frameMaxWidth,
                minWidth: { xs: 0, sm: 360 },
                minHeight: { xs: 420, md: 480 },
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${theme.silverRing}`,
                boxShadow: theme.cardShadow,
            }}
        >
            <Box sx={{ bgcolor: theme.headerBg, color: theme.headerText, px: 2, py: 1.75 }}>
                <ActivityContentHeader
                    contentType="CONVERSATION"
                    accentColor={theme.headerAccentLabel}
                    displayNumber={displayNumber}
                    sx={{ mb: 0.75 }}
                />
                <Typography variant="h6" fontWeight={800}>
                    {headerTitle}
                </Typography>
                {scenarioTitleHi && (
                    <Typography variant="body2" sx={{ color: theme.headerMuted, mt: 0.25 }}>
                        {scenarioTitleHi}
                    </Typography>
                )}
                <Typography variant="caption" sx={{ color: theme.headerMuted, display: 'block', mt: 0.75 }}>
                    {participant1} · {participant2}
                </Typography>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    bgcolor: theme.chatBg,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {dialogue.length === 0 && (
                    <Typography variant="body2" sx={{ color: theme.headerMuted, textAlign: 'center', py: 4 }}>
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
                                        sx={{
                                            ml: 0.5,
                                            mb: 0.25,
                                            display: 'block',
                                            color: theme.bubbleLabel,
                                            fontWeight: 700,
                                        }}
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
                                        bgcolor: isUser ? theme.bubbleUser : theme.bubbleOther,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ color: theme.bubbleOtherText, whiteSpace: 'pre-wrap' }}
                                    >
                                        {item.text_en}
                                    </Typography>
                                    {hindiVisible && item.text_hi && (
                                        <Typography variant="body2" sx={{ color: theme.bubbleHindi, mt: 0.75 }}>
                                            {item.text_hi}
                                        </Typography>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, mt: 0.5 }}>
                                        {item.text_hi && (
                                            <Tooltip title={hindiVisible ? 'Hide Hindi' : 'Show Hindi'}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleHindi(index)}
                                                    sx={{ color: theme.iconColor }}
                                                >
                                                    <TranslateIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Play English">
                                            <IconButton
                                                size="small"
                                                onClick={() => handlePlayAudio(index, item.text_en, item.audio)}
                                                sx={{ color: theme.iconColor }}
                                            >
                                                {audioLoading[index] ? (
                                                    <CircularProgress size={14} sx={{ color: theme.iconColor }} />
                                                ) : (
                                                    <VolumeUpIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </IconButton>
                                        </Tooltip>
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
