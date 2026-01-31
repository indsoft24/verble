// src/components/features/ProfessionalConversationsList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Grid,
    CircularProgress,
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getDailyContent, type DailyContent } from '../../services/dailyContentService';

interface ProfessionalConversationsListProps {
    onSelectConversation: (conversation: DailyContent) => void;
}

const ProfessionalConversationsList: React.FC<ProfessionalConversationsListProps> = ({ onSelectConversation }) => {
    const [conversations, setConversations] = useState<DailyContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all professional conversations (CONVERSATION type, GOLD level)
            const allConversations = await getDailyContent(undefined, 'GOLD');
            const professionalConversations = allConversations.filter(
                content => content.type === 'CONVERSATION'
            );
            setConversations(professionalConversations);
        } catch (err: any) {
            setError(err.message || 'Failed to load conversations.');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract all unique tags from conversations
    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        conversations.forEach(conv => {
            const tags = conv.metadata?.tags || [];
            tags.forEach((tag: string) => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }, [conversations]);

    // Filter conversations based on search and tags
    const filteredConversations = useMemo(() => {
        return conversations.filter(conv => {
            // Search filter
            const matchesSearch = searchTerm.trim() === '' ||
                conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (conv.metadata?.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Tag filter
            const convTags = conv.metadata?.tags || [];
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.some(tag => convTags.includes(tag));

            return matchesSearch && matchesTags;
        });
    }, [conversations, searchTerm, selectedTags]);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedTags([]);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                Professional Conversations
            </Typography>

            {/* Search and Filters */}
            <Box sx={{ mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                />

                {/* Tags Filter */}
                {allTags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Filter by tags:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {allTags.map(tag => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                    variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Clear Filters */}
                {(searchTerm || selectedTags.length > 0) && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearFilters}
                        sx={{ mb: 2 }}
                    >
                        Clear Filters
                    </Button>
                )}

                <Typography variant="body2" color="text.secondary">
                    Showing {filteredConversations.length} conversation(s)
                </Typography>
            </Box>

            {/* Conversations List */}
            {filteredConversations.length > 0 ? (
                <Grid container spacing={3}>
                    {filteredConversations.map((conversation) => (
                        <Grid item xs={12} sm={6} md={4} key={conversation._id}>
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
                                onClick={() => onSelectConversation(conversation)}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        {conversation.title}
                                    </Typography>
                                    {conversation.metadata?.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {conversation.metadata.description}
                                        </Typography>
                                    )}
                                    {conversation.metadata?.tags && conversation.metadata.tags.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                                            {conversation.metadata.tags.map((tag: string, index: number) => (
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
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No conversations found. {searchTerm || selectedTags.length > 0 ? 'Try adjusting your filters.' : ''}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ProfessionalConversationsList;
