// src/components/features/LyricsCard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import { extractYouTubeVideoId } from '../../utils/mediaUrlUtils';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import ActivitySourceCredit from './ActivitySourceCredit';
import YouTubeAudioPlayer from './YouTubeAudioPlayer';
import DirectAudioPlayer from './DirectAudioPlayer';
import { activityCardShell, GOLD_ACCENT } from '../../utils/dailyActivityUi';

const LYRICS_ACCENT = '#e91e63';

interface LyricsCardProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onNavigateToSpeech?: () => void;
    onNavigateToFeed?: () => void;
}

const darkAccordionSx = {
    mb: 2,
    bgcolor: alpha('#1a1f2e', 0.4),
    color: '#f8fafc',
    '&:before': { display: 'none' },
};

const LyricsCard: React.FC<LyricsCardProps> = ({
    data,
    onContentChange,
    onNavigateToSpeech,
    onNavigateToFeed,
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

    const lyricsDisplayTag = getDisplayTag(currentContent.sequenceNumber);
    const songTitle = currentContent.title || '';
    const artist = String(currentContent.metadata?.artist || '');
    const lyrics = String(currentContent.metadata?.lyrics || '');
    const youtubeUrl = String(currentContent.metadata?.youtubeUrl || '');
    const audioUrl = String(currentContent.metadata?.audio || '');
    const credit = String(currentContent.metadata?.credit || '');
    const creditUrl = String(currentContent.metadata?.creditUrl || '');
    const words = (currentContent.metadata?.words as unknown[]) || [];
    const phrases = (currentContent.metadata?.phrases as unknown[]) || [];

    const hasYoutube = Boolean(extractYouTubeVideoId(youtubeUrl));

    return (
        <Box sx={{ maxWidth: { xs: '100%', sm: 800 }, mx: 'auto' }}>
            <Card elevation={0} sx={activityCardShell(GOLD_ACCENT)}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <ActivityContentHeader
                        contentType="LYRICS"
                        accentColor={LYRICS_ACCENT}
                        displayNumber={lyricsDisplayTag}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 900,
                            background: `linear-gradient(135deg, #e2e8f0, ${LYRICS_ACCENT})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {songTitle}
                    </Typography>
                    {artist && (
                        <Typography variant="body1" sx={{ color: alpha('#e2e8f0', 0.7), mt: 0.5 }}>
                            by {artist}
                        </Typography>
                    )}

                    <ActivitySourceCredit
                        creditLabel={credit}
                        creditUrl={creditUrl}
                        accentColor={LYRICS_ACCENT}
                    />

                    {hasYoutube ? (
                        <YouTubeAudioPlayer youtubeUrl={youtubeUrl} accentColor={LYRICS_ACCENT} />
                    ) : audioUrl ? (
                        <DirectAudioPlayer audioUrl={audioUrl} accentColor={LYRICS_ACCENT} />
                    ) : null}

                    {lyrics && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                                Lyrics
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    maxHeight: 500,
                                    overflowY: 'auto',
                                    bgcolor: alpha('#1a1f2e', 0.55),
                                    border: `1px solid ${alpha(LYRICS_ACCENT, 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.9,
                                        color: alpha('#e2e8f0', 0.92),
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {lyrics}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {words.length > 0 && (
                        <Accordion sx={darkAccordionSx}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: LYRICS_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>
                                    Important Words ({words.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {(words as Record<string, string>[]).map((word, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {word.word || word.text}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                {word.meaning || word.meaning_en}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {phrases.length > 0 && (
                        <Accordion sx={darkAccordionSx}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: LYRICS_ACCENT }} />}>
                                <Typography sx={{ fontWeight: 700 }}>
                                    Important Phrases ({phrases.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List dense>
                                    {(phrases as Record<string, string>[]).map((phrase, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
                                        >
                                            <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                                                {phrase.phrase || phrase.text}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.7) }}>
                                                {phrase.meaning || phrase.meaning_en}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    <ActivityTierNavFooter
                        accentColor={GOLD_ACCENT}
                        left={{
                            label: 'Previous Lyrics',
                            onClick: () => handleNavigation('prev'),
                            disabled: !hasPrevious,
                            loading: isLoadingNav,
                        }}
                        center={{
                            label: '→ Instagram Feeds',
                            onClick: onNavigateToFeed,
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

export default LyricsCard;
