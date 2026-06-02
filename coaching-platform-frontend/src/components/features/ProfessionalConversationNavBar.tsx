import React from 'react';
import { Box, Button, alpha } from '@mui/material';
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
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={onLeft}
                    disabled={leftDisabled || !onLeft}
                    aria-label={leftLabel}
                    sx={{
                        color: theme.headerText,
                        fontWeight: 600,
                        flex: '1 1 0',
                        minWidth: 0,
                        justifyContent: 'flex-start',
                    }}
                >
                    {leftLabel}
                </Button>
            ) : (
                <Box sx={{ flex: '1 1 0' }} />
            )}
            {showRight ? (
                <Button
                    variant="text"
                    endIcon={<ArrowForwardIcon />}
                    onClick={onRight}
                    disabled={rightDisabled || !onRight}
                    aria-label={rightLabel}
                    sx={{
                        color: theme.headerText,
                        fontWeight: 600,
                        flex: '1 1 0',
                        minWidth: 0,
                        justifyContent: 'flex-end',
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
