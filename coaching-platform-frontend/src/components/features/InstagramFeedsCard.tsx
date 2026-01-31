// src/components/features/InstagramFeedsCard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Divider,
    Chip,
    Link as MuiLink
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { parseISO } from 'date-fns';

interface InstagramFeedsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
}

interface InstagramPost {
    imageUrl: string;
    credit: string;
    postLink: string;
    caption?: string;
}

const InstagramFeedsCard: React.FC<InstagramFeedsCardProps> = ({ data, onContentChange }) => {
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    useEffect(() => {
        setCurrentContent(data);
        checkNavigationAvailability();
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            const [prevContent, nextContent] = await Promise.all([
                getAdjacentContent(data.date, 'FEED', data.level, 'prev'),
                getAdjacentContent(data.date, 'FEED', data.level, 'next')
            ]);

            setHasPrevious(!!prevContent);
            setHasNext(!!nextContent);
        } catch (error) {
            setHasPrevious(false);
            setHasNext(false);
        }
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(
                currentContent.date,
                'FEED',
                currentContent.level,
                direction
            );

            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                if (onContentChange) {
                    onContentChange(adjacentContent);
                }
                await checkNavigationAvailability();
            }
        } catch (error: any) {
            console.error('Failed to load adjacent content:', error);
        } finally {
            setIsLoadingNav(false);
        }
    };

    const feedNumber = currentContent.sequenceNumber || currentContent.metadata?.feedNumber || 0;

    const feedTitle = currentContent.title || 'Curated Instagram Feeds';
    const posts: InstagramPost[] = currentContent.metadata?.posts || [];

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 900,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Feed #{feedNumber}
                        </Typography>
                        <Chip label={currentContent.level} size="small" color="primary" />
                    </Box>
                    
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                        }}
                    >
                        {feedTitle}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Instagram Posts - Displayed Vertically */}
                {posts.length > 0 ? (
                    <Box sx={{ mb: 4 }}>
                        {posts.map((post: InstagramPost, index: number) => (
                            <Box
                                key={index}
                                sx={{
                                    mb: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    backgroundColor: 'white',
                                }}
                            >
                                {/* Post Image */}
                                {post.imageUrl && (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            backgroundColor: 'grey.200',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={post.imageUrl}
                                            alt={`Instagram post ${index + 1}`}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                            onError={(e) => {
                                                // Hide image if it fails to load
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Post Caption (if available) */}
                                {post.caption && (
                                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                            {post.caption}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Credits and Link */}
                                <Box
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        backgroundColor: 'grey.50',
                                    }}
                                >
                                    {post.credit && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                            Credit: {post.credit}
                                        </Typography>
                                    )}
                                    {post.postLink && (
                                        <MuiLink
                                            href={post.postLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                textDecoration: 'none',
                                                color: 'primary.main',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                },
                                            }}
                                        >
                                            <Typography variant="body2">
                                                View Post
                                            </Typography>
                                            <OpenInNewIcon fontSize="small" />
                                        </MuiLink>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No posts available for this feed.
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => handleNavigation('prev')}
                        disabled={!hasPrevious || isLoadingNav}
                    >
                        Previous Feed
                    </Button>
                    <Button
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleNavigation('next')}
                        disabled={!hasNext || isLoadingNav}
                    >
                        Next Feed
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default InstagramFeedsCard;
