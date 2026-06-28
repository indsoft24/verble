import React from 'react';
import { IconButton, alpha } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';

export interface ActivitySpeakerButtonProps {
    text: string;
    playKey: string;
    accentColor: string;
    playingKey: string | null;
    onPlay: (text: string, key: string, audioUrl?: string) => void;
    audioUrl?: string;
    size?: 'small' | 'medium';
    ariaLabel?: string;
}

const ActivitySpeakerButton: React.FC<ActivitySpeakerButtonProps> = ({
    text,
    playKey,
    accentColor,
    playingKey,
    onPlay,
    audioUrl,
    size = 'small',
    ariaLabel = 'Play pronunciation',
}) => {
    if (!text?.trim()) return null;
    const isPlaying = playingKey === playKey;

    return (
        <IconButton
            size={size}
            onClick={() => onPlay(text, playKey, audioUrl)}
            aria-label={isPlaying ? 'Stop audio' : ariaLabel}
            sx={{
                flexShrink: 0,
                color: accentColor,
                bgcolor: alpha(accentColor, 0.12),
                '&:hover': { bgcolor: alpha(accentColor, 0.22) },
            }}
        >
            {isPlaying ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
    );
};

export default ActivitySpeakerButton;
