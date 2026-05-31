import React from 'react';
import {
    Alert,
    Avatar,
    Box,
    Chip,
    CircularProgress,
    Paper,
    Typography,
    alpha,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { LeaderboardEntry } from '../../services/leaderboardService';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;

export interface LeaderboardPanelProps {
    title: string;
    subtitle?: string;
    entries: LeaderboardEntry[];
    isLoading?: boolean;
    accentColor?: string;
    myRank?: { rank: number; points: number } | null;
    maxRows?: number;
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
    title,
    subtitle,
    entries,
    isLoading = false,
    accentColor = '#2563eb',
    myRank,
    maxRows = 10,
}) => {
    const visible = entries.slice(0, maxRows);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(145deg, ${alpha(accentColor, 0.06)} 0%, #fff 55%)`,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EmojiEventsIcon sx={{ color: accentColor }} />
                        <Typography variant="h6" fontWeight={800}>
                            {title}
                        </Typography>
                    </Box>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Chip
                    label={`Top ${maxRows}`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: alpha(accentColor, 0.12), color: accentColor }}
                />
            </Box>

            {myRank && (
                <Alert
                    severity="info"
                    icon={<EmojiEventsIcon fontSize="small" />}
                    sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
                >
                    Your rank: #{myRank.rank} · {myRank.points} participation pts
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : visible.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        No rankings yet — complete daily challenges to climb the board.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visible.map((entry, index) => {
                        const isTopThree = entry.rank <= 3;
                        const medalColor = isTopThree ? MEDAL_COLORS[entry.rank - 1] : undefined;
                        return (
                            <Box
                                key={`${entry.rank}-${entry.name}-${index}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: isTopThree ? alpha(accentColor, 0.08) : 'grey.50',
                                    border: '1px solid',
                                    borderColor: isTopThree ? alpha(accentColor, 0.25) : 'transparent',
                                    transition: 'transform 0.15s ease',
                                    '&:hover': { transform: 'translateX(4px)' },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        fontWeight: 800,
                                        fontSize: '0.875rem',
                                        bgcolor: medalColor || alpha(accentColor, 0.85),
                                        color: isTopThree && entry.rank === 1 ? '#1e293b' : '#fff',
                                    }}
                                >
                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={isTopThree ? 800 : 600} noWrap>
                                        {entry.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Rank #{entry.rank}
                                    </Typography>
                                </Box>
                                {entry.points != null && (
                                    <Chip
                                        label={`${entry.points} pts`}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: isTopThree ? accentColor : 'grey.200',
                                            color: isTopThree ? '#fff' : 'text.primary',
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Paper>
    );
};

export default LeaderboardPanel;
