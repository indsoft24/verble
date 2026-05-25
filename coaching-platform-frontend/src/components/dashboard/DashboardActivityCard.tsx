import React from 'react';
import { Box, Card, CardContent, Typography, Chip, alpha } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import TouchAppIcon from '@mui/icons-material/TouchApp';

export interface DashboardActivityCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    /** Accent used for border / icon when accessible */
    accentColor: string;
    /** Tier lock: show overlay and lock affordance */
    lockedByTier: boolean;
    /** Unlocked tier but CMS has no row for today */
    emptyToday?: boolean;
    onOpen: () => void;
    onLockedClick: () => void;
    /** Optional chip label when not tier-locked */
    statusChip?: { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' };
}

const DashboardActivityCard: React.FC<DashboardActivityCardProps> = ({
    title,
    description,
    icon,
    accentColor,
    lockedByTier,
    emptyToday,
    onOpen,
    onLockedClick,
    statusChip,
}) => {
    const interactive = lockedByTier || (!emptyToday && !lockedByTier);
    const handleActivate = () => {
        if (lockedByTier) {
            onLockedClick();
            return;
        }
        if (emptyToday) return;
        onOpen();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (interactive) handleActivate();
        }
    };

    return (
        <Card
            elevation={lockedByTier ? 1 : 3}
            sx={{
                height: '100%',
                borderRadius: 2.5,
                position: 'relative',
                overflow: 'hidden',
                border: lockedByTier ? '1px solid' : `2px solid ${alpha(accentColor, 0.35)}`,
                borderColor: lockedByTier ? 'divider' : alpha(accentColor, 0.35),
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                outline: 'none',
                '&:hover': interactive
                    ? {
                          transform: 'translateY(-2px)',
                          boxShadow: lockedByTier ? 4 : 8,
                      }
                    : undefined,
                '&:focus-visible': {
                    boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.35)}`,
                },
            }}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={
                lockedByTier
                    ? `${title}, locked. Activate to learn how to unlock.`
                    : emptyToday
                      ? `${title}, no content scheduled today.`
                      : `${title}. Open activity.`
            }
            onClick={() => interactive && handleActivate()}
            onKeyDown={handleKeyDown}
        >
            <CardContent
                sx={{
                    p: { xs: 2, sm: 2.5, md: 3 },
                    filter: lockedByTier ? 'grayscale(0.25) brightness(0.97)' : 'none',
                    opacity: emptyToday && !lockedByTier ? 0.72 : 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            bgcolor: alpha(accentColor, lockedByTier ? 0.08 : 0.14),
                            color: lockedByTier ? 'text.disabled' : accentColor,
                            '& svg': { fontSize: 28 },
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.3 }}>
                            {title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75, alignItems: 'center' }}>
                            {lockedByTier ? (
                                <Chip size="small" icon={<LockIcon sx={{ fontSize: '16px !important' }} />} label="Locked" color="default" variant="outlined" />
                            ) : statusChip ? (
                                <Chip size="small" label={statusChip.label} color={statusChip.color} variant="outlined" />
                            ) : emptyToday ? (
                                <Chip size="small" label="No item today" color="default" variant="outlined" />
                            ) : (
                                <Chip size="small" label="Open" color="success" variant="outlined" />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.55 }}>
                            {description}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>

            {lockedByTier && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                        py: 3,
                        background: 'linear-gradient(165deg, rgba(15,23,42,0.52) 0%, rgba(15,23,42,0.78) 100%)',
                        backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)',
                        color: 'common.white',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.25,
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        <LockIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.02 }}>
                        Members only
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.92, maxWidth: 220, mt: 0.5, display: 'block' }}>
                        Tap for clear steps to unlock this track
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, opacity: 0.85 }}>
                        <TouchAppIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Tap anywhere
                        </Typography>
                    </Box>
                </Box>
            )}
        </Card>
    );
};

export default DashboardActivityCard;
