// src/pages/ProfessionalConversationsPage.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import UserLayout from '../components/layout/UserLayout';
import ProfessionalConversationsList from '../components/features/ProfessionalConversationsList';
import ProfessionalConversationDetail from '../components/features/ProfessionalConversationDetail';
import ActivityTierNavFooter from '../components/features/ActivityTierNavFooter';
import { type DailyContent } from '../services/dailyContentService';
import { TIER_COLORS } from '../components/dashboard/DashboardActivitiesPanel';

type ProConversationsLocationState = {
    sceneContent?: DailyContent | null;
};

const ProfessionalConversationsPage: React.FC = () => {
    const [selectedConversation, setSelectedConversation] = useState<DailyContent | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const sceneContent = (location.state as ProConversationsLocationState | null)?.sceneContent;

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

                {sceneContent && !selectedConversation && (
                    <ActivityTierNavFooter
                        variant="light"
                        accentColor={TIER_COLORS.GOLD}
                        center={{
                            label: '← Explain the Scene',
                            onClick: () =>
                                navigate('/dashboard', {
                                    state: {
                                        openActivity: { kind: 'scene', content: sceneContent },
                                    },
                                }),
                        }}
                        sx={{ mt: 3 }}
                    />
                )}
            </Box>
        </UserLayout>
    );
};

export default ProfessionalConversationsPage;
