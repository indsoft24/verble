import React from 'react';
import { Box, Button, alpha, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { professionalConversationTheme as theme } from './professionalConversationTheme';

export interface ProfessionalConversationNavBarProps {
    leftLabel?: string;
    rightLabel?: string;
    onLeft?: () => void;
    onRight?: () => void;
    leftDisabled?: boolean;
    rightDisabled?: boolean;
}

const pillSx = {
    borderRadius: 999,
    borderColor: alpha(theme.accent, 0.5),
    color: theme.headerText,
    fontWeight: 600,
    textTransform: 'none' as const,
    px: { xs: 1.5, sm: 2 },
    py: 0.75,
    '&:hover': {
        borderColor: theme.accent,
        bgcolor: alpha(theme.accent, 0.12),
    },
    '&.Mui-disabled': {
        borderColor: alpha(theme.accent, 0.2),
        color: alpha(theme.headerText, 0.35),
    },
};

const ProfessionalConversationNavBar: React.FC<ProfessionalConversationNavBarProps> = ({
    leftLabel,
    rightLabel,
    onLeft,
    onRight,
    leftDisabled = false,
    rightDisabled = false,
}) => {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const showLeft = Boolean(leftLabel);
    const showRight = Boolean(rightLabel);
    if (!showLeft && !showRight) return null;

    const usePills = !isMobile;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.accent, 0.25)}`,
                position: { xs: 'sticky', sm: 'static' },
                bottom: 0,
                bgcolor: { xs: theme.headerBg, sm: 'transparent' },
                py: { xs: 1.5, sm: 0 },
                zIndex: 2,
            }}
        >
            {showLeft ? (
                <Button
                    variant={usePills ? 'outlined' : 'text'}
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={onLeft}
                    disabled={leftDisabled || !onLeft}
                    aria-label={leftLabel}
                    sx={{
                        ...(usePills ? pillSx : {}),
                        flex: '1 1 0',
                        minWidth: 0,
                        justifyContent: 'flex-start',
                        ...(!usePills && { color: theme.headerText, fontWeight: 600 }),
                    }}
                >
                    {leftLabel}
                </Button>
            ) : (
                <Box sx={{ flex: '1 1 0' }} />
            )}
            {showRight ? (
                <Button
                    variant={usePills ? 'outlined' : 'text'}
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={onRight}
                    disabled={rightDisabled || !onRight}
                    aria-label={rightLabel}
                    sx={{
                        ...(usePills ? pillSx : {}),
                        flex: '1 1 0',
                        minWidth: 0,
                        justifyContent: 'flex-end',
                        ...(!usePills && { color: theme.headerText, fontWeight: 600 }),
                    }}
                >
                    {rightLabel}
                </Button>
            ) : (
                <Box sx={{ flex: '1 1 0' }} />
            )}
        </Box>
    );
};

export default ProfessionalConversationNavBar;
