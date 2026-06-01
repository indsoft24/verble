import React, { useCallback, useRef, useState } from 'react';
import { Box, IconButton, LinearProgress, Typography, alpha } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReactPlayer from 'react-player/youtube';
import type { OnProgressProps } from 'react-player/base';
import {
    extractYouTubeVideoId,
    getYouTubeThumbnailUrl,
    normalizeHttpUrl,
} from '../../utils/mediaUrlUtils';

export interface YouTubeAudioPlayerProps {
    youtubeUrl: string;
    accentColor?: string;
}

const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
    youtubeUrl,
    accentColor = '#e91e63',
}) => {
    const playerRef = useRef<ReactPlayer | null>(null);
    const [playing, setPlaying] = useState(false);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [duration, setDuration] = useState(0);
    const [ready, setReady] = useState(false);

    const url = normalizeHttpUrl(youtubeUrl);
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    const thumbnail = getYouTubeThumbnailUrl(videoId);
    const progress = duration > 0 ? (playedSeconds / duration) * 100 : 0;

    const formatTime = (seconds: number): string => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgress = useCallback((state: OnProgressProps) => {
        setPlayedSeconds(state.playedSeconds);
    }, []);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = parseFloat(e.target.value);
        setPlayedSeconds(next);
        playerRef.current?.seekTo(next, 'seconds');
    };

    return (
        <Box sx={{ mb: 3, position: 'relative' }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#1a1f2e', 0.55),
                    border: `1px solid ${alpha(accentColor, 0.35)}`,
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: 88,
                        height: 88,
                        flexShrink: 0,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        bgcolor: '#000',
                    }}
                >
                    <Box
                        component="img"
                        src={thumbnail}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                        onClick={() => setPlaying((p) => !p)}
                        disabled={!ready && !playing}
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            m: 'auto',
                            width: 48,
                            height: 48,
                            bgcolor: alpha(accentColor, 0.92),
                            color: '#0f172a',
                            '&:hover': { bgcolor: accentColor },
                        }}
                        aria-label={playing ? 'Pause' : 'Play'}
                    >
                        {playing ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.55), mb: 1 }}>
                        YouTube audio
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.7), minWidth: 40 }}>
                            {formatTime(playedSeconds)}
                        </Typography>
                        <Box sx={{ flex: 1, position: 'relative' }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: alpha('#fff', 0.12),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor: accentColor,
                                    },
                                }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                value={playedSeconds}
                                onChange={handleSeek}
                                step={0.1}
                                disabled={!ready}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: ready ? 'pointer' : 'default',
                                }}
                            />
                        </Box>
                        <Typography variant="caption" sx={{ color: alpha('#e2e8f0', 0.7), minWidth: 40 }}>
                            {formatTime(duration)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    left: -9999,
                    top: 0,
                    width: 320,
                    height: 180,
                    pointerEvents: 'none',
                }}
                aria-hidden
            >
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={playing}
                    width={320}
                    height={180}
                    onReady={() => setReady(true)}
                    onDuration={(d) => setDuration(d)}
                    onProgress={handleProgress}
                    onEnded={() => {
                        setPlaying(false);
                        setPlayedSeconds(0);
                    }}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                    config={
                        {
                            playerVars: {
                                modestbranding: 1,
                                rel: 0,
                            },
                        } as Record<string, unknown>
                    }
                />
            </Box>
        </Box>
    );
};

export default YouTubeAudioPlayer;
