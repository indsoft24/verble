import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConversationChat from './ConversationChat';
import type { DailyContent } from '../../services/dailyContentService';
import { getContentDisplayNumber } from '../../utils/dailyActivityUi';
import { getAdjacentConversation } from '../../utils/professionalConversationLibraryUtils';
import { professionalConversationTheme as theme } from './professionalConversationTheme';
import { conversationBackButtonSx } from './conversationExperienceStyles';
import ProfessionalConversationNavBar from './ProfessionalConversationNavBar';

export interface ProfessionalConversationViewerProps {
    conversation: DailyContent;
    tagConversations: DailyContent[];
    activeTag: string;
    onBack: () => void;
    onSelectConversation: (conversation: DailyContent) => void;
}

const ProfessionalConversationViewer: React.FC<ProfessionalConversationViewerProps> = ({
    conversation,
    tagConversations,
    activeTag,
    onBack,
    onSelectConversation,
}) => {
    const dialogue = conversation.metadata?.dialogue || [];
    const participant1 = String(
        conversation.metadata?.participant1 || conversation.metadata?.participants?.[0] || 'Speaker 1'
    );
    const participant2 = String(
        conversation.metadata?.participant2 || conversation.metadata?.participants?.[1] || 'Speaker 2'
    );
    const scenarioTitle =
        (conversation.metadata?.topicName as string) || conversation.title;
    const scenarioTitleHi = conversation.metadata?.topicNameHi as string | undefined;
    const description = conversation.metadata?.description || '';
    const tags = Array.isArray(conversation.metadata?.tags) ? conversation.metadata.tags : [];

    const prevConv = getAdjacentConversation(tagConversations, conversation._id, 'prev');
    const nextConv = getAdjacentConversation(tagConversations, conversation._id, 'next');
    const idx = tagConversations.findIndex((c) => c._id === conversation._id);

    return (
        <Box sx={{ width: '100%', maxWidth: theme.frameMaxWidth, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={conversationBackButtonSx}>
                {activeTag}
            </Button>

            {(description || tags.length > 0 || tagConversations.length > 1) && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.25, sm: 1.5 },
                        mb: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.headerBg, 0.85),
                        border: theme.practiceBorder,
                    }}
                >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                        {idx >= 0 && tagConversations.length > 1 && (
                            <Typography variant="caption" sx={{ color: theme.headerMuted, fontWeight: 600 }}>
                                {idx + 1} of {tagConversations.length}
                            </Typography>
                        )}
                        {tags.map((tag: string) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                    borderColor: alpha(theme.accent, 0.5),
                                    color: theme.headerAccentLabel,
                                    height: 24,
                                }}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                    {description && (
                        <Typography variant="body2" sx={{ color: theme.headerMuted, mt: 0.75 }}>
                            {description}
                        </Typography>
                    )}
                </Paper>
            )}

            {dialogue.length > 0 ? (
                <ConversationChat
                    dialogue={dialogue}
                    participant1={participant1}
                    participant2={participant2}
                    scenarioTitle={scenarioTitle}
                    scenarioTitleHi={scenarioTitleHi}
                    displayNumber={getContentDisplayNumber(conversation.sequenceNumber)}
                    labelOverride="Professional Conversations"
                    accentTier="gold"
                />
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                        bgcolor: theme.chatBg,
                        border: theme.practiceBorder,
                    }}
                >
                    <Typography sx={{ color: theme.headerMuted }}>
                        No dialogue available for this conversation.
                    </Typography>
                </Paper>
            )}

            <ProfessionalConversationNavBar
                leftLabel="Previous conversation"
                rightLabel="Next conversation"
                onLeft={prevConv ? () => onSelectConversation(prevConv) : undefined}
                onRight={nextConv ? () => onSelectConversation(nextConv) : undefined}
                leftDisabled={!prevConv}
                rightDisabled={!nextConv}
            />
        </Box>
    );
};

export default ProfessionalConversationViewer;
