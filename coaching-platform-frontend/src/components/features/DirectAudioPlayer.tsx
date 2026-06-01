import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, LinearProgress, Typography, alpha } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { resolveBackendMediaUrl } from '../../utils/imageUtils';

export interface DirectAudioPlayerProps {
    audioUrl: string;
    accentColor?: string;
}

const DirectAudioPlayer: React.FC<DirectAudioPlayerProps> = ({
    audioUrl,
    accentColor = '#e91e63',
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const src = resolveBackendMediaUrl(audioUrl);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audioRef.current = null;
        };
    }, [src]);

    const formatTime = (seconds: number): string => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = next;
            setCurrentTime(next);
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha('#1a1f2e', 0.55),
                border: `1px solid ${alpha(accentColor, 0.35)}`,
            }}
        >
            <IconButton
                onClick={handlePlayPause}
                sx={{
                    bgcolor: accentColor,
                    color: '#0f172a',
                    width: 56,
                    height: 56,
                    '&:hover': { bgcolor: alpha(accentColor, 0.85) },
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
            </IconButton>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.55), display: 'block', mb: 0.5 }}>
                    Audio
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.7), minWidth: 40 }}>
                        {formatTime(currentTime)}
                    </Typography>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha('#fff', 0.12),
                                '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: accentColor },
                            }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            step={0.1}
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
                    <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.7), minWidth: 40 }}>
                        {formatTime(duration)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default DirectAudioPlayer;
