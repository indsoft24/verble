// src/pages/ProfessionalConversationsPage.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ProfessionalConversationsList from '../components/features/ProfessionalConversationsList';
import ProfessionalConversationDetail from '../components/features/ProfessionalConversationDetail';
import { type DailyContent } from '../services/dailyContentService';

const ProfessionalConversationsPage: React.FC = () => {
    const [selectedConversation, setSelectedConversation] = useState<DailyContent | null>(null);

    const handleSelectConversation = (conversation: DailyContent) => {
        setSelectedConversation(conversation);
    };

    const handleBackToList = () => {
        setSelectedConversation(null);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50', py: 4 }}>
            {selectedConversation ? (
                <ProfessionalConversationDetail
                    conversation={selectedConversation}
                    onBack={handleBackToList}
                    onSelectConversation={handleSelectConversation}
                />
            ) : (
                <ProfessionalConversationsList
                    onSelectConversation={handleSelectConversation}
                />
            )}
        </Box>
    );
};

export default ProfessionalConversationsPage;
