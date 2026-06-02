import React from 'react';
import { Box, Typography, Paper, Button, List, ListItemButton, ListItemText, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { DailyContent } from '../../services/dailyContentService';
import { getContentDisplayNumber } from '../../utils/dailyActivityUi';
import { getAdjacentTag } from '../../utils/professionalConversationLibraryUtils';
import { professionalConversationTheme as theme } from './professionalConversationTheme';
import { conversationBackButtonSx } from './conversationExperienceStyles';
import ProfessionalConversationNavBar from './ProfessionalConversationNavBar';

export interface ProfessionalConversationsTagListViewProps {
    activeTag: string;
    conversations: DailyContent[];
    sortedTags: string[];
    onBack: () => void;
    onSelectConversation: (conversation: DailyContent) => void;
    onChangeTag: (tag: string) => void;
}

const ProfessionalConversationsTagListView: React.FC<ProfessionalConversationsTagListViewProps> = ({
    activeTag,
    conversations,
    sortedTags,
    onBack,
    onSelectConversation,
    onChangeTag,
}) => {
    const prevTag = getAdjacentTag(sortedTags, activeTag, 'prev');
    const nextTag = getAdjacentTag(sortedTags, activeTag, 'next');

    return (
        <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={conversationBackButtonSx}>
                All topics
            </Button>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    bgcolor: theme.headerBg,
                    border: theme.practiceBorder,
                    boxShadow: theme.cardShadow,
                    mb: 2,
                }}
            >
                <Typography variant="h5" fontWeight={800} sx={{ color: theme.headerText }}>
                    {activeTag}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.headerMuted, mt: 0.5 }}>
                    {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
                </Typography>
            </Paper>

            {conversations.length === 0 ? (
                <Typography sx={{ color: theme.headerMuted, py: 4, textAlign: 'center' }}>
                    No conversations in this topic.
                </Typography>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        bgcolor: theme.chatBg,
                        border: theme.practiceBorder,
                        overflow: 'hidden',
                    }}
                >
                    <List disablePadding>
                        {conversations.map((conv, idx) => {
                            const displayNum = getContentDisplayNumber(conv.sequenceNumber);
                            const description = conv.metadata?.description || conv.metadata?.topicName || '';
                            return (
                                <ListItemButton
                                    key={conv._id}
                                    onClick={() => onSelectConversation(conv)}
                                    divider={idx < conversations.length - 1}
                                    sx={{
                                        py: 1.25,
                                        px: 2,
                                        borderColor: alpha(theme.accent, 0.15),
                                        transition: 'background-color 0.15s',
                                        '&:hover': { bgcolor: alpha(theme.accent, 0.12) },
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                                {displayNum && (
                                                    <Chip
                                                        label={displayNum}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(theme.accent, 0.2),
                                                            color: theme.headerAccentLabel,
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                )}
                                                <Typography component="span" fontWeight={700} sx={{ color: theme.headerText }}>
                                                    {conv.metadata?.topicName || conv.title}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            description ? (
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: theme.headerMuted, mt: 0.5 }}
                                                    noWrap
                                                >
                                                    {description}
                                                </Typography>
                                            ) : null
                                        }
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Paper>
            )}

            <ProfessionalConversationNavBar
                leftLabel="Previous list"
                rightLabel="Next list"
                onLeft={prevTag ? () => onChangeTag(prevTag) : undefined}
                onRight={nextTag ? () => onChangeTag(nextTag) : undefined}
                leftDisabled={!prevTag}
                rightDisabled={!nextTag}
            />
        </Box>
    );
};

export default ProfessionalConversationsTagListView;
