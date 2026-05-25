import React from 'react';
import { Box } from '@mui/material';
import { CONTAINER_MAX_WIDTH } from '../../landing/designSystem';

type LandingContainerProps = {
    children: React.ReactNode;
    /** Max width in px; default 1200 */
    maxWidth?: number;
    sx?: object;
};

/**
 * Centered container with max-width 1200px.
 * Use inside LandingSection (section already has horizontal padding).
 */
const LandingContainer: React.FC<LandingContainerProps> = ({
    children,
    maxWidth = CONTAINER_MAX_WIDTH,
    sx = {},
}) => (
    <Box
        sx={{
            maxWidth: maxWidth,
            margin: '0 auto',
            width: '100%',
            ...sx,
        }}
    >
        {children}
    </Box>
);

export default LandingContainer;
