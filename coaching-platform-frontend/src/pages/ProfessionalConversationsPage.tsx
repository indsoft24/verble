// src/pages/ProfessionalConversationsPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import ConversationExperienceShell from '../components/features/ConversationExperienceShell';
import ProfessionalConversationsTagsView from '../components/features/ProfessionalConversationsTagsView';
import ProfessionalConversationsTagListView from '../components/features/ProfessionalConversationsTagListView';
import ProfessionalConversationViewer from '../components/features/ProfessionalConversationViewer';
import ActivityTierNavFooter from '../components/features/ActivityTierNavFooter';
import { conversationBreadcrumbSx } from '../components/features/conversationExperienceStyles';
import { getProfessionalLibrary, type DailyContent } from '../services/dailyContentService';
import { buildTagIndex } from '../utils/professionalConversationLibraryUtils';
import { TIER_COLORS } from '../components/dashboard/DashboardActivitiesPanel';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

type View = 'tags' | 'tagList' | 'detail';

type ProConversationsLocationState = {
    sceneContent?: DailyContent | null;
};

const ProfessionalConversationsPage: React.FC = () => {
    useUserLayoutPage({ title: 'Professional Conversations', variant: 'conversations' });
    const [view, setView] = useState<View>('tags');
    const [library, setLibrary] = useState<DailyContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<DailyContent | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const sceneContent = (location.state as ProConversationsLocationState | null)?.sceneContent;

    const tagIndex = useMemo(() => (library.length > 0 ? buildTagIndex(library) : null), [library]);

    const tagConversations = useMemo(() => {
        if (!activeTag || !tagIndex) return [];
        return tagIndex.byTag.get(activeTag) ?? [];
    }, [activeTag, tagIndex]);

    const fetchLibrary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const content = await getProfessionalLibrary();
            setLibrary(content);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load professional conversations.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const handleSelectTag = (tag: string) => {
        setActiveTag(tag);
        setSelectedConversation(null);
        setView('tagList');
    };

    const handleSelectConversation = (conversation: DailyContent) => {
        setSelectedConversation(conversation);
        setView('detail');
    };

    const handleBackToTags = () => {
        setActiveTag(null);
        setSelectedConversation(null);
        setView('tags');
    };

    const handleBackToTagList = () => {
        setSelectedConversation(null);
        setView('tagList');
    };

    const handleChangeTag = (tag: string) => {
        setActiveTag(tag);
        setSelectedConversation(null);
        setView('tagList');
    };

    const breadcrumbTail =
        view === 'detail' && selectedConversation
            ? [
                  activeTag && (
                      <Link
                          key="tag"
                          component="button"
                          type="button"
                          underline="hover"
                          color="inherit"
                          onClick={handleBackToTagList}
                          sx={{ cursor: 'pointer', background: 'none', border: 0, font: 'inherit' }}
                      >
                          {activeTag}
                      </Link>
                  ),
                  <Typography key="detail" color="inherit">
                      {selectedConversation.metadata?.topicName || selectedConversation.title}
                  </Typography>,
              ].filter(Boolean)
            : view === 'tagList' && activeTag
              ? [<Typography key="tag" color="inherit">{activeTag}</Typography>]
              : [];

    const shellMaxWidth = view === 'detail' ? ('sm' as const) : ('lg' as const);

    return (
        <ConversationExperienceShell tier="gold" maxWidth={shellMaxWidth}>
                <Breadcrumbs sx={conversationBreadcrumbSx}>
                    <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
                        Dashboard
                    </Link>
                    {view !== 'tags' ? (
                        <Link
                            component="button"
                            type="button"
                            underline="hover"
                            color="inherit"
                            onClick={handleBackToTags}
                            sx={{ cursor: 'pointer', background: 'none', border: 0, font: 'inherit' }}
                        >
                            Professional Conversations
                        </Link>
                    ) : (
                        <Typography color="inherit">Professional Conversations</Typography>
                    )}
                    {breadcrumbTail}
                </Breadcrumbs>

                {view === 'tags' && (
                    <ProfessionalConversationsTagsView
                        tagIndex={tagIndex}
                        isLoading={isLoading}
                        error={error}
                        onSelectTag={handleSelectTag}
                    />
                )}

                {view === 'tagList' && activeTag && tagIndex && (
                    <ProfessionalConversationsTagListView
                        activeTag={activeTag}
                        conversations={tagConversations}
                        sortedTags={tagIndex.sortedTags}
                        onBack={handleBackToTags}
                        onSelectConversation={handleSelectConversation}
                        onChangeTag={handleChangeTag}
                    />
                )}

                {view === 'detail' && selectedConversation && activeTag && (
                    <ProfessionalConversationViewer
                        conversation={selectedConversation}
                        tagConversations={tagConversations}
                        activeTag={activeTag}
                        onBack={handleBackToTagList}
                        onSelectConversation={handleSelectConversation}
                    />
                )}

                {sceneContent && view === 'tags' && (
                    <ActivityTierNavFooter
                        variant="dark"
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
            </ConversationExperienceShell>
    );
};

export default ProfessionalConversationsPage;
