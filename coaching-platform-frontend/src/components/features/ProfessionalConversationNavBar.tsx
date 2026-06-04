import React from 'react';
import { Box, Button, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { courseLearningTheme } from '../course/courseLearningTheme';
import { TIER_COLORS } from '../dashboard/DashboardActivitiesPanel';

/** Bright gold for nav CTAs — high contrast on dark page background */
const NAV_GOLD = courseLearningTheme.highlight;
const NAV_GOLD_DARK = TIER_COLORS.GOLD;
const NAV_TEXT_ON_GOLD = '#141a18';

export interface ProfessionalConversationNavBarProps {
    leftLabel?: string;
    rightLabel?: string;
    onLeft?: () => void;
    onRight?: () => void;
    leftDisabled?: boolean;
    rightDisabled?: boolean;
}

function navButtonSx(enabled: boolean) {
    return {
        flex: { xs: '1 1 0', sm: '0 1 auto' },
        minWidth: 0,
        maxWidth: { xs: 'none', sm: 300 },
        minHeight: 48,
        borderRadius: 2,
        fontWeight: 800,
        fontSize: { xs: '0.8125rem', sm: '0.9rem' },
        textTransform: 'none' as const,
        px: { xs: 1.5, sm: 2.75 },
        py: 1.25,
        border: '2px solid',
        borderColor: enabled ? alpha('#fffef5', 0.45) : alpha(NAV_GOLD, 0.28),
        bgcolor: enabled ? NAV_GOLD : alpha(NAV_GOLD_DARK, 0.18),
        color: enabled ? NAV_TEXT_ON_GOLD : alpha('#f8fafc', 0.45),
        boxShadow: enabled
            ? `0 6px 22px ${alpha(NAV_GOLD, 0.55)}, inset 0 1px 0 ${alpha('#fff', 0.4)}`
            : 'none',
        '&:hover': enabled
            ? {
                  bgcolor: '#f0d04a',
                  borderColor: alpha('#fff', 0.55),
                  color: NAV_TEXT_ON_GOLD,
                  boxShadow: `0 8px 28px ${alpha(NAV_GOLD, 0.65)}`,
              }
            : {},
        '&.Mui-disabled': {
            bgcolor: alpha(NAV_GOLD_DARK, 0.14),
            borderColor: alpha(NAV_GOLD, 0.22),
            color: alpha('#f8fafc', 0.38),
            boxShadow: 'none',
        },
        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            color: 'inherit',
            marginInline: { xs: 0.25, sm: 0.5 },
        },
    };
}

const ProfessionalConversationNavBar: React.FC<ProfessionalConversationNavBarProps> = ({
    leftLabel,
    rightLabel,
    onLeft,
    onRight,
    leftDisabled = false,
    rightDisabled = false,
}) => {
    const showLeft = Boolean(leftLabel);
    const showRight = Boolean(rightLabel);
    if (!showLeft && !showRight) return null;

    const leftEnabled = Boolean(onLeft) && !leftDisabled;
    const rightEnabled = Boolean(onRight) && !rightDisabled;

    return (
        <Box
            component="nav"
            aria-label="Conversation navigation"
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'stretch',
                gap: { xs: 1.25, sm: 2 },
                mt: 2.5,
                pt: 2,
                pb: { xs: 1.5, sm: 1 },
                px: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                border: `1px solid ${alpha(NAV_GOLD, 0.45)}`,
                bgcolor: alpha('#0f1619', 0.85),
                backgroundImage: `linear-gradient(180deg, ${alpha(NAV_GOLD, 0.12)} 0%, transparent 100%)`,
                boxShadow: `0 0 24px ${alpha(NAV_GOLD, 0.12)}`,
            }}
        >
            {showLeft ? (
                <Button
                    variant="contained"
                    disableElevation
                    size="medium"
                    startIcon={<ArrowBackIcon fontSize="small" />}
                    onClick={onLeft}
                    disabled={!leftEnabled}
                    aria-label={leftLabel}
                    sx={{
                        ...navButtonSx(leftEnabled),
                        justifyContent: 'center',
                    }}
                >
                    {leftLabel}
                </Button>
            ) : (
                <Box sx={{ flex: { xs: 0, sm: '1 1 0' } }} />
            )}
            {showRight ? (
                <Button
                    variant="contained"
                    disableElevation
                    size="medium"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    onClick={onRight}
                    disabled={!rightEnabled}
                    aria-label={rightLabel}
                    sx={{
                        ...navButtonSx(rightEnabled),
                        justifyContent: 'center',
                        ml: { sm: 'auto' },
                    }}
                >
                    {rightLabel}
                </Button>
            ) : (
                <Box sx={{ flex: { xs: 0, sm: '1 1 0' } }} />
            )}
        </Box>
    );
};

export default ProfessionalConversationNavBar;
