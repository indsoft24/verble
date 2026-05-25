// src/pages/ProfessionalConversationsPage.tsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import UserLayout from '../components/layout/UserLayout';
import ProfessionalConversationsList from '../components/features/ProfessionalConversationsList';
import ProfessionalConversationDetail from '../components/features/ProfessionalConversationDetail';
import { type DailyContent } from '../services/dailyContentService';

const ProfessionalConversationsPage: React.FC = () => {
    const [selectedConversation, setSelectedConversation] = useState<DailyContent | null>(null);

    return (
        <UserLayout title="Professional Conversations">
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
                        Dashboard
                    </Link>
                    <Typography color="text.primary">Professional Conversations</Typography>
                </Breadcrumbs>

                {selectedConversation ? (
                    <ProfessionalConversationDetail
                        conversation={selectedConversation}
                        onBack={() => setSelectedConversation(null)}
                        onSelectConversation={setSelectedConversation}
                    />
                ) : (
                    <ProfessionalConversationsList onSelectConversation={setSelectedConversation} />
                )}
            </Box>
        </UserLayout>
    );
};

export default ProfessionalConversationsPage;
