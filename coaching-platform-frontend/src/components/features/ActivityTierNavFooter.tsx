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
                    flex: '1 1 0',
                    minWidth: 0,
                    justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
                    textAlign: side,
                    px: { xs: 0.5, sm: 1 },
                }}
            >
                {slot.loading ? 'Loading…' : slot.label}
            </Button>
        );
    };

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

            {showCenter ? (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={center!.onClick}
                    disabled={center!.disabled || center!.loading}
                    sx={{
                        borderColor: accentColor,
                        color: accentColor,
                        fontWeight: 700,
                        px: 2,
                        mx: { xs: 'auto', sm: 1 },
                        order: { xs: -1, sm: 0 },
                        width: { xs: '100%', sm: 'auto' },
                        flexShrink: 0,
                        '&:hover': {
                            borderColor: accentColor,
                            bgcolor: alpha(accentColor, isDark ? 0.12 : 0.08),
                        },
                        '&.Mui-disabled': {
                            borderColor: isDark ? alpha('#e2e8f0', 0.2) : 'divider',
                            color: isDark ? alpha('#e2e8f0', 0.35) : 'text.disabled',
                        },
                    }}
                >
                    {center!.label}
                </Button>
            ) : (
                <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 140, flexShrink: 0 }} />
            )}

            {renderSide(right, 'right')}
        </Box>
    );
};

export default ActivityTierNavFooter;
