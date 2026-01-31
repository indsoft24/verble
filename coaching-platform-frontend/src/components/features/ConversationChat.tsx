// src/components/features/ConversationChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Tooltip,
    CircularProgress
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import { keyframes } from '@emotion/react';

interface DialogueItem {
    speaker: string;
    text_en: string;
    text_hi: string;
    audio?: string;
}

interface ConversationChatProps {
    dialogue: DialogueItem[];
    userSpeaker?: string; // The speaker name that represents the user (for roleplay mode)
}

// Pulse animation for playing audio
const pulse = keyframes`
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
`;

const ConversationChat: React.FC<ConversationChatProps> = ({ 
    dialogue, 
    userSpeaker 
}) => {
    const [roleplayMode, setRoleplayMode] = useState(false);
    const [showHindi, setShowHindi] = useState<{ [key: number]: boolean }>({});
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [audioLoading, setAudioLoading] = useState<{ [key: number]: boolean }>({});
    const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Determine which speaker is the user (first speaker by default, or specified userSpeaker)
    const firstSpeaker = dialogue.length > 0 ? dialogue[0].speaker : '';
    const isUserSpeaker = userSpeaker || firstSpeaker;

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            // Cleanup all audio
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom when dialogue changes
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dialogue, showHindi, roleplayMode]);

    const toggleHindi = (index: number) => {
        setShowHindi(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handlePlayAudio = async (index: number, text: string, audioUrl?: string) => {
        // Stop any currently playing audio
        if (playingAudio !== null && playingAudio !== index) {
            const currentAudio = audioRefs.current[playingAudio];
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        }

        // If same audio is playing, stop it
        if (playingAudio === index) {
            const audio = audioRefs.current[index];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            setPlayingAudio(null);
            return;
        }

        setPlayingAudio(index);
        setAudioLoading(prev => ({ ...prev, [index]: true }));

        // Try to play audio file if available
        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audioRefs.current[index] = audio;
                audio.onended = () => {
                    setPlayingAudio(null);
                    setAudioLoading(prev => ({ ...prev, [index]: false }));
                };
                audio.onerror = () => {
                    // Fallback to TTS
                    playTTS(index, text);
                };
                audio.oncanplay = () => {
                    setAudioLoading(prev => ({ ...prev, [index]: false }));
                };
                await audio.play().catch(() => {
                    // Fallback to TTS if play fails
                    playTTS(index, text);
                });
            } catch (error) {
                playTTS(index, text);
            }
        } else {
            playTTS(index, text);
        }
    };

    const playTTS = (index: number, text: string) => {
        if (synthRef.current) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.onend = () => {
                setPlayingAudio(null);
                setAudioLoading(prev => ({ ...prev, [index]: false }));
            };
            utterance.onerror = () => {
                setPlayingAudio(null);
                setAudioLoading(prev => ({ ...prev, [index]: false }));
            };
            synthRef.current.speak(utterance);
        } else {
            setPlayingAudio(null);
            setAudioLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleBubbleClick = (index: number, text: string, audioUrl?: string) => {
        // Toggle Hindi translation
        toggleHindi(index);
        // Play audio
        handlePlayAudio(index, text, audioUrl);
    };

    const isUserMessage = (speaker: string) => {
        return speaker === isUserSpeaker;
    };

    const shouldHideMessage = (speaker: string) => {
        return roleplayMode && isUserMessage(speaker);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: '#e5ddd5',
                backgroundImage: 'radial-gradient(circle, #f0f0f0 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                position: 'relative',
            }}
        >
            {/* Header with Roleplay Toggle */}
            <Box
                sx={{
                    backgroundColor: '#075e54',
                    color: 'white',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Conversation Practice
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={roleplayMode}
                            onChange={(e) => setRoleplayMode(e.target.checked)}
                            color="default"
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            Roleplay Mode
                        </Typography>
                    }
                />
            </Box>

            {/* Messages Container */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                }}
            >
                {dialogue.map((item, index) => {
                    const isUser = isUserMessage(item.speaker);
                    const isHidden = shouldHideMessage(item.speaker);
                    const showHindiTranslation = showHindi[index];
                    const isPlaying = playingAudio === index;

                    return (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                alignItems: 'flex-end',
                                gap: 1,
                            }}
                        >
                            {/* Speaker Avatar (only for non-user messages) */}
                            {!isUser && (
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: '#34b7f1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.speaker.charAt(0).toUpperCase()}
                                </Box>
                            )}

                            {/* Message Bubble */}
                            <Paper
                                elevation={0}
                                onClick={() => !isHidden && handleBubbleClick(index, item.text_en, item.audio)}
                                sx={{
                                    maxWidth: '75%',
                                    minWidth: '120px',
                                    p: 1.5,
                                    backgroundColor: isUser ? '#dcf8c6' : 'white',
                                    borderRadius: isUser
                                        ? '7.5px 7.5px 0 7.5px'
                                        : '7.5px 7.5px 7.5px 0',
                                    cursor: isHidden ? 'default' : 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow: isHidden ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
                                    },
                                    opacity: isHidden ? 0.3 : 1,
                                }}
                            >
                                {/* Speaker Name (for non-user messages) */}
                                {!isUser && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#34b7f1',
                                            display: 'block',
                                            mb: 0.5,
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {item.speaker}
                                    </Typography>
                                )}

                                {/* English Text */}
                                {!isHidden && (
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#303030',
                                            wordBreak: 'break-word',
                                            mb: showHindiTranslation ? 1 : 0,
                                        }}
                                    >
                                        {item.text_en}
                                    </Typography>
                                )}

                                {/* Hindi Translation */}
                                {!isHidden && showHindiTranslation && item.text_hi && (
                                    <Box
                                        sx={{
                                            mt: 1,
                                            pt: 1,
                                            borderTop: '1px solid rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#666',
                                                fontStyle: 'italic',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {item.text_hi}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Hidden Message Placeholder */}
                                {isHidden && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '40px',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#999',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            [Your turn to speak]
                                        </Typography>
                                    </Box>
                                )}

                                {/* Audio Indicator */}
                                {!isHidden && (isPlaying || audioLoading[index]) && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {audioLoading[index] ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <VolumeUpIcon
                                                sx={{
                                                    fontSize: 16,
                                                    color: '#34b7f1',
                                                    animation: `${pulse} 1s ease-in-out infinite`,
                                                }}
                                            />
                                        )}
                                    </Box>
                                )}

                                {/* Translation Icon */}
                                {!isHidden && !showHindiTranslation && item.text_hi && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                        }}
                                    >
                                        <Tooltip title="Tap to see Hindi translation">
                                            <TranslateIcon
                                                sx={{
                                                    fontSize: 14,
                                                    color: '#999',
                                                    opacity: 0.6,
                                                }}
                                            />
                                        </Tooltip>
                                    </Box>
                                )}
                            </Paper>

                            {/* User Avatar (only for user messages) */}
                            {isUser && (
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: '#dcf8c6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#075e54',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        flexShrink: 0,
                                        border: '2px solid #dcf8c6',
                                    }}
                                >
                                    {item.speaker.charAt(0).toUpperCase()}
                                </Box>
                            )}
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Footer Hint */}
            {roleplayMode && (
                <Box
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        p: 1.5,
                        textAlign: 'center',
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        💡 Tap on messages to hear pronunciation and see Hindi translation
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ConversationChat;
