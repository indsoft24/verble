// src/components/features/InstagramFeedsCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, alpha } from '@mui/material';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import { normalizeInstagramPost } from '../../utils/mediaUrlUtils';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import InstagramPostCard from './InstagramPostCard';
import { activityCardProps, GOLD_ACCENT } from '../../utils/dailyActivityUi';

const FEED_ACCENT = '#e1306c';

interface InstagramFeedsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onNavigateToSpeech?: () => void;
    onNavigateToLyrics?: () => void;
}

const InstagramFeedsCard: React.FC<InstagramFeedsCardProps> = ({
    data,
    onContentChange,
    onNavigateToSpeech,
    onNavigateToLyrics,
}) => {
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);

    useEffect(() => {
        setCurrentContent(data);
        void checkNavigationAvailability();
    }, [data]);

    const checkNavigationAvailability = async () => {
        try {
            const prevContent = await getAdjacentContent(data._id, 'prev');
            setHasPrevious(!!prevContent);
        } catch {
            setHasPrevious(false);
        }
    };

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);
            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                onContentChange?.(adjacentContent);
                await checkNavigationAvailability();
            }
        } catch {
            /* ignore */
        } finally {
            setIsLoadingNav(false);
        }
    };

    const feedDisplayTag = getDisplayTag(currentContent.sequenceNumber);
    const feedTitle = currentContent.title || 'Curated Instagram Feeds';
    const rawPosts = (currentContent.metadata?.posts as Record<string, unknown>[]) || [];
    const posts = rawPosts.map((p) => normalizeInstagramPost(p));

    return (
        <Box sx={{ maxWidth: { xs: '100%', sm: 800 }, mx: 'auto' }}>
            <Card {...activityCardProps(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="FEED"
                        accentColor={FEED_ACCENT}
                        displayNumber={feedDisplayTag}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            mb: 3,
                            background: `linear-gradient(135deg, #e2e8f0, ${FEED_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {feedTitle}
                    </Typography>

                    {posts.length > 0 ? (
                        <Box sx={{ mb: 2 }}>
                            {posts.map((post, index) => (
                                <InstagramPostCard key={index} post={post} index={index} />
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6), py: 4, textAlign: 'center' }}>
                            No posts available for this feed.
                        </Typography>
                    )}

                    <ActivityTierNavFooter
                        accentColor={GOLD_ACCENT}
                        left={{
                            label: 'Previous Feed',
                            onClick: () => handleNavigation('prev'),
                            disabled: !hasPrevious,
                            loading: isLoadingNav,
                        }}
                        center={{
                            label: '← Song Lyrics',
                            onClick: onNavigateToLyrics,
                        }}
                        right={{
                            label: 'Famous Speeches',
                            onClick: onNavigateToSpeech,
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default InstagramFeedsCard;
