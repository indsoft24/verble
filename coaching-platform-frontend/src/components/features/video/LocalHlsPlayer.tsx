import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Box, Typography, IconButton, Menu, MenuItem, Chip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

const buildAbsolutePlaylistUrl = (playlistPath: string): string => {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const p = playlistPath.startsWith('/') ? playlistPath : `/${playlistPath}`;
    if (p.startsWith('/api')) {
        const origin = base.replace(/\/api$/, '');
        return `${origin}${p}`;
    }
    return `${base}${p}`;
};

interface LocalHlsPlayerProps {
    playlistPath: string;
    mongoVideoId: string;
    onVideoComplete?: () => void;
    durationSeconds?: number;
}

const LocalHlsPlayer: React.FC<LocalHlsPlayerProps> = ({
    playlistPath,
    mongoVideoId,
    onVideoComplete,
    durationSeconds,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hasCalledCompleteRef = useRef(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);
    const containerId = `local-hls-player-${mongoVideoId}`;
    const [levels, setLevels] = useState<Array<{ index: number; label: string }>>([]);
    const [qualityMenuAnchor, setQualityMenuAnchor] = useState<null | HTMLElement>(null);
    const [currentLevel, setCurrentLevel] = useState<number | 'auto'>('auto');

    useEffect(() => {
        hasCalledCompleteRef.current = false;
        setPlaybackError(null);
        const video = videoRef.current;
        if (!video) return;

        const url = buildAbsolutePlaylistUrl(playlistPath);
        const token = localStorage.getItem('authToken');

        if (Hls.isSupported()) {
            const hls = new Hls({
                xhrSetup: (xhr) => {
                    if (token) {
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                },
            });
            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const parsedLevels = hls.levels.map((lvl, idx) => {
                    const height = (lvl as any).height as number | undefined;
                    const bitrate = (lvl as any).bitrate as number | undefined;
                    const label = height
                        ? `${height}p`
                        : bitrate
                        ? `${Math.round(bitrate / 1000)} kbps`
                        : `Level ${idx + 1}`;
                    return { index: idx, label };
                });
                setLevels(parsedLevels);
                setCurrentLevel('auto');
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                if (typeof data.level === 'number' && data.level >= 0) {
                    setCurrentLevel(data.level);
                }
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    setPlaybackError(data.type === 'networkError' ? 'Network error loading video.' : 'Playback error.');
                }
            });
            return () => {
                hls.destroy();
                hlsRef.current = null;
            };
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            return () => {
                video.removeAttribute('src');
                video.load();
            };
        }

        setPlaybackError('HLS is not supported in this browser.');
        return undefined;
    }, [playlistPath, mongoVideoId]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !onVideoComplete) return;

        const threshold = 0.98;
        const onTimeUpdate = () => {
            if (hasCalledCompleteRef.current || !video.duration) return;
            const expectedDuration = Math.max(video.duration || 0, durationSeconds || 0);
            if (!expectedDuration) return;
            if (video.currentTime / expectedDuration >= threshold) {
                hasCalledCompleteRef.current = true;
                onVideoComplete();
            }
        };
        const onEnded = () => {
            if (!hasCalledCompleteRef.current) {
                hasCalledCompleteRef.current = true;
                onVideoComplete();
            }
        };
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);
        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
        };
    }, [onVideoComplete, durationSeconds, playlistPath]);

    const handleOpenQualityMenu = (event: React.MouseEvent<HTMLElement>) => {
        setQualityMenuAnchor(event.currentTarget);
    };

    const handleCloseQualityMenu = () => {
        setQualityMenuAnchor(null);
    };

    const handleSelectQuality = (level: number | 'auto') => {
        const hls = hlsRef.current;
        if (!hls) {
            setCurrentLevel(level);
            setQualityMenuAnchor(null);
            return;
        }
        if (level === 'auto') {
            hls.currentLevel = -1; // Hls.js auto mode
        } else {
            hls.currentLevel = level;
        }
        setCurrentLevel(level);
        setQualityMenuAnchor(null);
    };

    return (
        <Box
            id={containerId}
            sx={{
                position: 'relative',
                paddingTop: '56.25%',
                backgroundColor: '#000',
                borderRadius: 1,
                overflow: 'hidden',
                width: '100%',
                userSelect: 'none',
            }}
        >
                {playbackError && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                        }}
                    >
                        <Typography color="error">{playbackError}</Typography>
                    </Box>
                )}
                <video
                    ref={videoRef}
                    controls
                    playsInline
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />

                {/* Simple quality selector overlay (Auto / 360p / 480p / etc.) */}
                {levels.length > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            right: 12,
                            top: 12,
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: 'rgba(15, 23, 42, 0.55)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 2,
                            py: 0.5,
                            pl: 1,
                            pr: 0.5,
                        }}
                    >
                        <Chip
                            size="small"
                            label={`Quality: ${
                                currentLevel === 'auto'
                                    ? 'Auto'
                                    : levels.find((lvl) => lvl.index === currentLevel)?.label || 'Auto'
                            }`}
                            sx={{
                                height: 22,
                                color: 'common.white',
                                borderColor: 'rgba(255,255,255,0.22)',
                                bgcolor: 'transparent',
                                '& .MuiChip-label': { px: 0.75, fontSize: 11, fontWeight: 700 },
                            }}
                            variant="outlined"
                        />
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={handleOpenQualityMenu}
                            sx={{
                                color: 'common.white',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                            }}
                        >
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                        <Menu
                            anchorEl={qualityMenuAnchor}
                            open={Boolean(qualityMenuAnchor)}
                            onClose={handleCloseQualityMenu}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    borderRadius: 2,
                                    minWidth: 140,
                                },
                            }}
                        >
                            <MenuItem
                                selected={currentLevel === 'auto'}
                                onClick={() => handleSelectQuality('auto')}
                            >
                                Auto
                            </MenuItem>
                            {levels.map((lvl) => (
                                <MenuItem
                                    key={lvl.index}
                                    selected={currentLevel === lvl.index}
                                    onClick={() => handleSelectQuality(lvl.index)}
                                >
                                    {lvl.label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                )}
        </Box>
    );
};

export default LocalHlsPlayer;
