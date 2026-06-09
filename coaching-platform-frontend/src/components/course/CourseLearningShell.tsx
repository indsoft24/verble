import React from 'react';
import { Box, Container } from '@mui/material';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseLearningShellProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    disableGutters?: boolean;
}

const CourseLearningShell: React.FC<CourseLearningShellProps> = ({
    children,
    maxWidth = 'lg',
    disableGutters = false,
}) => (
    <Box
        sx={{
            minHeight: '100%',
            bgcolor: courseLearningTheme.pageBg,
            pb: `${courseLearningTheme.contentPaddingBottom}px`,
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100%',
        }}
    >
        <Container
            maxWidth={maxWidth}
            disableGutters={disableGutters}
            sx={{
                px: disableGutters ? courseLearningTheme.shellPx : courseLearningTheme.shellPx,
                pt: courseLearningTheme.shellPt,
            }}
        >
            {children}
        </Container>
    </Box>
);

export default CourseLearningShell;
