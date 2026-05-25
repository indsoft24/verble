// src/components/features/ConversationChat.tsx — two fixed participants, no roleplay toggle
import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Tooltip, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { keyframes } from '@emotion/react';

interface DialogueItem {
    speaker: string;
    text_en: string;
    text_hi: string;
    audio?: string;
}

interface ConversationChatProps {
    dialogue: DialogueItem[];
    participant1: string;
    participant2: string;
}

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const ConversationChat: React.FC<ConversationChatProps> = ({
    dialogue,
    participant1,
    participant2,
}) => {
    const [showHindi, setShowHindi] = useState<Record<number, boolean>>({});
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [audioLoading, setAudioLoading] = useState<Record<number, boolean>>({});
    const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isParticipant1 = (speaker: string) =>
        speaker.trim().toLowerCase() === participant1.trim().toLowerCase();

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
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onend = () => {
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

    const p1Lines = dialogue.filter((d) => isParticipant1(d.speaker));
    const p2Lines = dialogue.filter((d) => !isParticipant1(d.speaker));

    const renderColumn = (title: string, lines: DialogueItem[], alignRight: boolean) => (
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography
                variant="subtitle2"
                sx={{
                    fontWeight: 800,
                    textAlign: 'center',
                    py: 1,
                    bgcolor: alignRight ? '#dcf8c6' : '#fff',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {title}
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {lines.map((item, idx) => {
                    const globalIndex = dialogue.indexOf(item);
                    const isPlaying = playingAudio === globalIndex;
                    return (
                        <Paper
                            key={`${title}-${idx}`}
                            elevation={0}
                            onClick={() => {
                                toggleHindi(globalIndex);
                                handlePlayAudio(globalIndex, item.text_en, item.audio);
                            }}
                            sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                bgcolor: alignRight ? '#dcf8c6' : '#fff',
                                borderRadius: 2,
                                animation: isPlaying ? `${pulse} 1s infinite` : 'none',
                            }}
                        >
                            <Typography variant="body2">{item.text_en}</Typography>
                            {showHindi[globalIndex] && item.text_hi && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {item.text_hi}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                {audioLoading[globalIndex] ? (
                                    <CircularProgress size={14} />
                                ) : (
                                    <Tooltip title="Play / translate">
                                        <VolumeUpIcon fontSize="small" color="action" />
                                    </Tooltip>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 480,
                bgcolor: '#e5ddd5',
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <Box sx={{ bgcolor: '#075e54', color: 'white', p: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    Practical Conversation
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {participant1} · {participant2}
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    p: 2,
                    overflow: 'hidden',
                }}
            >
                {renderColumn(participant1, p1Lines, false)}
                {renderColumn(participant2, p2Lines, true)}
            </Box>
            <div ref={messagesEndRef} />
        </Box>
    );
};

export default ConversationChat;
