import React from 'react';
import { Box, Typography, Chip, alpha } from '@mui/material';

export interface DashboardAgendaTileProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accentColor: string;
    sectionLocked?: boolean;
    emptyToday?: boolean;
    onClick?: () => void;
    variant?: 'default' | 'hero';
    badgeLabel?: string;
}

const DashboardAgendaTile: React.FC<DashboardAgendaTileProps> = ({
    title,
    subtitle,
    icon,
    accentColor,
    sectionLocked = false,
    emptyToday = false,
    onClick,
    variant = 'default',
    badgeLabel,
}) => {
    const interactive = !sectionLocked && !emptyToday && !!onClick;

    const handleActivate = () => {
        if (interactive && onClick) onClick();
    };

    return (
        <Box
            role={interactive ? 'button' : sectionLocked ? 'button' : undefined}
            tabIndex={interactive || sectionLocked ? 0 : -1}
            onClick={sectionLocked ? onClick : handleActivate}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && (interactive || sectionLocked)) {
                    e.preventDefault();
                    if (sectionLocked && onClick) onClick();
                    else handleActivate();
                }
            }}
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: variant === 'hero' ? 2 : 2,
                borderRadius: 2,
                border: `1px solid ${alpha(accentColor, sectionLocked ? 0.25 : 0.45)}`,
                bgcolor: alpha('#1a1f2e', 0.95),
                background:
                    variant === 'hero'
                        ? `linear-gradient(135deg, ${alpha(accentColor, 0.22)} 0%, ${alpha('#1a1f2e', 0.98)} 70%)`
                        : alpha('#1a1f2e', 0.95),
                opacity: sectionLocked ? 0.45 : emptyToday ? 0.65 : 1,
                cursor: interactive || sectionLocked ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                minHeight: variant === 'hero' ? 96 : 88,
                alignSelf: 'stretch',
                '&:hover': interactive
                    ? {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(accentColor, 0.25)}`,
                      }
                    : undefined,
                '&:focus-visible': {
                    boxShadow: `0 0 0 2px ${alpha(accentColor, 0.5)}`,
                },
            }}
        >
            <Box
                sx={{
                    width: variant === 'hero' ? 52 : 44,
                    height: variant === 'hero' ? 52 : 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: alpha(accentColor, 0.15),
                    color: accentColor,
                    '& svg': { fontSize: variant === 'hero' ? 30 : 26 },
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant={variant === 'hero' ? 'subtitle1' : 'subtitle2'}
                        sx={{ fontWeight: 800, color: accentColor, lineHeight: 1.3 }}
                    >
                        {title}
                    </Typography>
                    {badgeLabel && (
                        <Chip
                            label={badgeLabel}
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                borderColor: alpha(accentColor, 0.55),
                                color: accentColor,
                            }}
                        />
                    )}
                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 1,
                        color: alpha('#e2e8f0', 0.75),
                        lineHeight: 1.45,
                        flex: 1,
                    }}
                >
                    {emptyToday && !sectionLocked ? 'No item scheduled today' : subtitle}
                </Typography>
            </Box>
        </Box>
    );
};

export default DashboardAgendaTile;
