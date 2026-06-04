import React from 'react';
import { Box, Button, alpha, type SxProps, type Theme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export interface NavFooterSlot {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export interface ActivityTierNavFooterProps {
    accentColor: string;
    variant?: 'dark' | 'light';
    /** Stacked: primary link full width, then side links in one row (best for puzzles on mobile). */
    layout?: 'inline' | 'stacked';
    left?: NavFooterSlot;
    center?: NavFooterSlot;
    right?: NavFooterSlot;
    sx?: SxProps<Theme>;
}

/**
 * Bottom navigation bar matching Free tier (Word ↔ Phrase):
 * sequential prev (left) · peer link (center, outlined) · sequential next (right).
 */
const ActivityTierNavFooter: React.FC<ActivityTierNavFooterProps> = ({
    accentColor,
    variant = 'dark',
    layout = 'inline',
    left,
    center,
    right,
    sx,
}) => {
    const showLeft = Boolean(left?.label);
    const showCenter = Boolean(center?.onClick);
    const showRight = Boolean(right?.label);
    if (!showLeft && !showCenter && !showRight) return null;

    const isDark = variant === 'dark';
    const textColor = isDark ? alpha('#e2e8f0', 0.85) : 'text.primary';
    const borderColor = alpha(accentColor, isDark ? 0.25 : 0.35);

    const renderSide = (slot: NavFooterSlot | undefined, side: 'left' | 'right') => {
        if (!slot?.label) {
            return <Box sx={{ flex: '1 1 0', minWidth: { sm: 120 } }} />;
        }
        const icon = side === 'left' ? <ArrowBackIcon /> : <ArrowForwardIcon />;
        const clickable = Boolean(slot.onClick) && !slot.disabled && !slot.loading;

        const stacked = layout === 'stacked';

        return (
            <Button
                variant="text"
                startIcon={side === 'left' ? icon : undefined}
                endIcon={side === 'right' ? icon : undefined}
                onClick={slot.onClick}
                disabled={!clickable}
                sx={{
                    color: textColor,
                    fontWeight: 600,
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    flex: stacked ? '1 1 50%' : '1 1 0',
                    minWidth: 0,
                    minHeight: 44,
                    justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
                    textAlign: side,
                    px: { xs: 0.75, sm: 1 },
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                        flexShrink: 0,
                    },
                }}
            >
                {slot.loading ? 'Loading…' : slot.label}
            </Button>
        );
    };

    const centerButton = showCenter ? (
        <Button
            variant="outlined"
            size="medium"
            fullWidth={layout === 'stacked'}
            onClick={center!.onClick}
            disabled={center!.disabled || center!.loading}
            sx={{
                borderColor: accentColor,
                color: accentColor,
                fontWeight: 700,
                fontSize: '0.9375rem',
                textTransform: 'none',
                py: 1.1,
                px: 2,
                minHeight: 48,
                flexShrink: 0,
                '&:hover': {
                    borderColor: accentColor,
                    bgcolor: alpha(accentColor, isDark ? 0.14 : 0.08),
                },
                '&.Mui-disabled': {
                    borderColor: isDark ? alpha('#e2e8f0', 0.25) : 'divider',
                    color: isDark ? alpha('#e2e8f0', 0.4) : 'text.disabled',
                },
            }}
        >
            {center!.label}
        </Button>
    ) : null;

    if (layout === 'stacked') {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    mt: 3,
                    pt: 2.5,
                    borderTop: `1px solid ${borderColor}`,
                    ...sx,
                }}
            >
                {centerButton}
                {(showLeft || showRight) && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            width: '100%',
                        }}
                    >
                        {renderSide(left, 'left')}
                        {renderSide(right, 'right')}
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${borderColor}`,
                ...sx,
            }}
        >
            {renderSide(left, 'left')}
            {centerButton ?? (
                <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 140, flexShrink: 0 }} />
            )}
            {renderSide(right, 'right')}
        </Box>
    );
};

export default ActivityTierNavFooter;
