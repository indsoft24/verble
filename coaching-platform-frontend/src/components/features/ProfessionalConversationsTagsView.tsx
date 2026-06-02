import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { Link as RouterLink } from 'react-router-dom';
import { professionalConversationTheme as theme } from './professionalConversationTheme';
import type { ProfessionalTagIndex } from '../../utils/professionalConversationLibraryUtils';

export interface ProfessionalConversationsTagsViewProps {
    tagIndex: ProfessionalTagIndex | null;
    isLoading: boolean;
    error: string | null;
    onSelectTag: (tag: string) => void;
}

const ProfessionalConversationsTagsView: React.FC<ProfessionalConversationsTagsViewProps> = ({
    tagIndex,
    isLoading,
    error,
    onSelectTag,
}) => {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: theme.accent }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    const tags = tagIndex?.sortedTags ?? [];

    return (
        <Box sx={{ width: '100%' }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    bgcolor: theme.headerBg,
                    border: theme.practiceBorder,
                    boxShadow: theme.cardShadow,
                    mb: 3,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <RecordVoiceOverIcon sx={{ color: theme.accent, fontSize: 32 }} />
                    <Typography variant="h5" fontWeight={800} sx={{ color: theme.headerText }}>
                        Professional Conversations
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.headerMuted }}>
                    Browse workplace dialogues by topic. Select a category to see conversations—read-only,
                    no practice submission.
                </Typography>
            </Paper>

            {tags.length === 0 ? (
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
                    <Typography sx={{ color: theme.headerMuted, mb: 2 }}>
                        No professional conversations in the library yet.
                    </Typography>
                    <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ color: theme.accent, borderColor: theme.accent }}>
                        Back to Dashboard
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {tags.map((tag) => {
                        const count = tagIndex?.byTag.get(tag)?.length ?? 0;
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tag}>
                                <Paper
                                    component="button"
                                    onClick={() => onSelectTag(tag)}
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        minHeight: 88,
                                        p: 2.5,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        border: `1px solid ${alpha(theme.accent, 0.35)}`,
                                        borderRadius: 2.5,
                                        bgcolor: theme.chatBg,
                                        color: theme.headerText,
                                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.cardShadow,
                                            borderColor: theme.accent,
                                        },
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.headerAccentLabel }}>
                                        {tag}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.headerMuted, mt: 0.5 }}>
                                        {count} conversation{count === 1 ? '' : 's'}
                                    </Typography>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default ProfessionalConversationsTagsView;
