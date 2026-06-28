// src/components/features/InstagramFeedsCard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Box, alpha } from '@mui/material';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import { normalizeInstagramPost } from '../../utils/mediaUrlUtils';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import InstagramPostCard from './InstagramPostCard';
import {
    activityCardProps,
    activityCardStackSx,
    GOLD_ACCENT,
    refreshAdjacentFlags,
    canShowNextNavigation,
} from '../../utils/dailyActivityUi';

const FEED_ACCENT = '#e1306c';

interface InstagramFeedsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    /** @deprecated Cross-tier link removed; kept for dashboard prop compatibility */
    onNavigateToSpeech?: () => void;
    onNavigateToLyrics?: () => void;
}

const InstagramFeedsCard: React.FC<InstagramFeedsCardProps> = ({
    data,
    onContentChange,
    onNavigateToSpeech,
}) => {
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    useEffect(() => {
        setCurrentContent(data);
        void checkAdjacent(data._id);
    }, [data, checkAdjacent]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacentContent = await getAdjacentContent(currentContent._id, direction);
            if (adjacentContent) {
                setCurrentContent(adjacentContent);
                onContentChange?.(adjacentContent);
                await checkAdjacent(adjacentContent._id);
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
    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);

    return (
        <Box sx={activityCardStackSx}>
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
                            label: '→ Famous Speeches',
                            onClick: onNavigateToSpeech,
                        }}
                        right={{
                            label: 'Next Feed',
                            onClick: () => handleNavigation('next'),
                            disabled: !canGoNext,
                            loading: isLoadingNav,
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default InstagramFeedsCard;
