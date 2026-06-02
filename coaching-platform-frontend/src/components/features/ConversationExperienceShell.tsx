import React from 'react';
import { Box, Container } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { courseLearningTheme } from '../course/courseLearningTheme';
import { TIER_COLORS } from '../dashboard/DashboardActivitiesPanel';
import { conversationPageBg } from './conversationExperienceStyles';

export type ConversationTier = 'silver' | 'gold';

export interface ConversationExperienceShellProps {
    children: React.ReactNode;
    tier?: ConversationTier;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
}

const ConversationExperienceShell: React.FC<ConversationExperienceShellProps> = ({
    children,
    tier = 'silver',
    maxWidth = 'lg',
}) => {
    const accent = tier === 'gold' ? TIER_COLORS.GOLD : TIER_COLORS.SILVER;

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 0px)' },
                width: '100%',
                bgcolor: conversationPageBg,
                overflow: 'hidden',
                backgroundImage: `
                    radial-gradient(ellipse 80% 50% at 0% 0%, ${alpha(accent, 0.14)} 0%, transparent 55%),
                    radial-gradient(ellipse 70% 45% at 100% 100%, ${alpha(courseLearningTheme.accent, 0.12)} 0%, transparent 50%),
                    radial-gradient(circle at 50% 30%, ${alpha(accent, 0.06)} 0%, transparent 40%),
                    repeating-linear-gradient(
                        125deg,
                        transparent,
                        transparent 24px,
                        ${alpha('#fff', 0.012)} 24px,
                        ${alpha('#fff', 0.012)} 25px
                    )
                `,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `linear-gradient(180deg, ${alpha(conversationPageBg, 0)} 0%, ${alpha(conversationPageBg, 0.4)} 100%)`,
                }}
            />
            <Container
                maxWidth={maxWidth === false ? false : maxWidth}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 2, sm: 3 },
                    pb: { xs: 4, sm: 5 },
                }}
            >
                {children}
            </Container>
        </Box>
    );
};

export default ConversationExperienceShell;
