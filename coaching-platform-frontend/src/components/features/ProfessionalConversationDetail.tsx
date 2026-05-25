// src/components/features/ProfessionalConversationDetail.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConversationChat from './ConversationChat';
import { getDailyContent, type DailyContent } from '../../services/dailyContentService';

interface ProfessionalConversationDetailProps {
    conversation: DailyContent;
    onBack: () => void;
    onSelectConversation?: (conversation: DailyContent) => void;
}

const ProfessionalConversationDetail: React.FC<ProfessionalConversationDetailProps> = ({ conversation, onBack, onSelectConversation }) => {
    const [relatedConversations, setRelatedConversations] = useState<DailyContent[]>([]);

    useEffect(() => {
        fetchRelatedConversations();
    }, [conversation]);

    const fetchRelatedConversations = async () => {
        try {
            // Get tags from current conversation
            const tags = conversation.metadata?.tags || [];
            if (tags.length === 0) {
                setRelatedConversations([]);
                return;
            }

            // Fetch all conversations and filter by matching tags
            const allConversations = await getDailyContent(undefined, 'GOLD');
            const related = allConversations.filter(
                content =>
                    content.type === 'CONVERSATION' &&
                    content._id !== conversation._id &&
                    content.metadata?.tags &&
                    content.metadata.tags.some((tag: string) => tags.includes(tag))
            );

            // Limit to 6 related conversations
            setRelatedConversations(related.slice(0, 6));
        } catch (error) {
            console.error('Failed to fetch related conversations:', error);
            setRelatedConversations([]);
        }
    };

    const dialogue = conversation.metadata?.dialogue || [];
    const tags = conversation.metadata?.tags || [];
    const description = conversation.metadata?.description || '';

    return (
        <Box sx={{ maxWidth: 900, margin: '0 auto', p: 3 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{ mb: 3 }}
            >
                Back to Conversations
            </Button>

            {/* Conversation Header */}
            <Card elevation={4} sx={{ mb: 4, borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            mb: 2,
                        }}
                    >
                        {conversation.title}
                    </Typography>

                    {description && (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {description}
                        </Typography>
                    )}

                    {tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {tags.map((tag: string, index: number) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Conversation Display */}
            {dialogue.length > 0 ? (
                <Card elevation={4} sx={{ mb: 4, borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                            Conversation
                        </Typography>
                        <ConversationChat
                            dialogue={dialogue}
                            participant1={String(conversation.metadata?.participant1 || conversation.metadata?.participants?.[0] || 'Speaker 1')}
                            participant2={String(conversation.metadata?.participant2 || conversation.metadata?.participants?.[1] || 'Speaker 2')}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card elevation={4} sx={{ mb: 4, borderRadius: 3 }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No conversation dialogue available.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Related Conversations */}
            {relatedConversations.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        Related Conversations
                    </Typography>
                    <Grid container spacing={3}>
                        {relatedConversations.map((relatedConv) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={relatedConv._id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 6,
                                        },
                                    }}
                                    onClick={() => {
                                        if (onSelectConversation) {
                                            onSelectConversation(relatedConv);
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                            {relatedConv.title}
                                        </Typography>
                                        {relatedConv.metadata?.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {relatedConv.metadata.description}
                                            </Typography>
                                        )}
                                        {relatedConv.metadata?.tags && relatedConv.metadata.tags.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                                                {relatedConv.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
                                                    <Chip
                                                        key={index}
                                                        label={tag}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default ProfessionalConversationDetail;
