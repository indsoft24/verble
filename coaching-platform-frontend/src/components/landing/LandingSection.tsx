import React from 'react';
import { Box } from '@mui/material';
import { SECTION_PADDING_Y, SECTION_PADDING_X } from '../../landing/designSystem';

type LandingSectionProps = {
    children: React.ReactNode;
    /** Background color (optional) */
    bgcolor?: string;
    /** Extra sx */
    sx?: object;
};

/**
 * Wraps a landing section with consistent vertical padding.
 * 40px mobile, 56px tablet, 80px desktop.
 */
const LandingSection: React.FC<LandingSectionProps> = ({ children, bgcolor, sx = {} }) => (
    <Box
        component="section"
        sx={{
            py: { xs: SECTION_PADDING_Y.xs, sm: SECTION_PADDING_Y.sm, md: SECTION_PADDING_Y.md },
            px: { xs: SECTION_PADDING_X, sm: SECTION_PADDING_X, md: SECTION_PADDING_X },
            ...(bgcolor ? { bgcolor } : {}),
            ...sx,
        }}
    >
        {children}
    </Box>
);

export default LandingSection;
