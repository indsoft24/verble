// src/pages/AIPromptsPage.tsx
import React from 'react';
import { Box } from '@mui/material';
import AIPromptsSection from '../components/features/AIPromptsSection';

const AIPromptsPage: React.FC = () => {
    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50', py: 4 }}>
            <AIPromptsSection />
        </Box>
    );
};

export default AIPromptsPage;
