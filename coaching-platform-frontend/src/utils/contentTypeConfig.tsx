// src/utils/contentTypeConfig.tsx
import React from 'react';
import {
    MenuBook as WordIcon,
    FormatQuote as PhraseIcon,
    AutoStories as StoryIcon,
    LibraryBooks as VocabIcon,
    Chat as ConversationIcon,
    Extension as PuzzleIcon,
    Image as SceneIcon,
    RecordVoiceOver as SpeechIcon,
    MusicNote as LyricsIcon,
    Instagram as FeedIcon,
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';

export type ContentType = 
    | 'WORD' 
    | 'PHRASE' 
    | 'STORY' 
    | 'VOCAB_SET' 
    | 'CONVERSATION' 
    | 'PUZZLE' 
    | 'SCENE' 
    | 'SPEECH' 
    | 'LYRICS' 
    | 'FEED';

export interface ContentTypeConfig {
    label: string;
    color: string;
    icon: SvgIconComponent;
    backgroundColor: string;
    borderColor: string;
    chipColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export const contentTypeConfig: Record<ContentType, ContentTypeConfig> = {
    WORD: {
        label: 'Word of the Day',
        color: '#1976d2', // Blue
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
        icon: WordIcon,
        chipColor: 'primary',
    },
    PHRASE: {
        label: 'Phrase of the Day',
        color: '#7b1fa2', // Purple
        backgroundColor: '#f3e5f5',
        borderColor: '#7b1fa2',
        icon: PhraseIcon,
        chipColor: 'secondary',
    },
    STORY: {
        label: 'Story',
        color: '#388e3c', // Green
        backgroundColor: '#e8f5e9',
        borderColor: '#388e3c',
        icon: StoryIcon,
        chipColor: 'success',
    },
    VOCAB_SET: {
        label: 'Vocabulary Set',
        color: '#f57c00', // Orange
        backgroundColor: '#fff3e0',
        borderColor: '#f57c00',
        icon: VocabIcon,
        chipColor: 'warning',
    },
    CONVERSATION: {
        label: 'Conversation',
        color: '#0288d1', // Light Blue
        backgroundColor: '#e1f5fe',
        borderColor: '#0288d1',
        icon: ConversationIcon,
        chipColor: 'info',
    },
    PUZZLE: {
        label: 'Puzzle',
        color: '#c2185b', // Pink
        backgroundColor: '#fce4ec',
        borderColor: '#c2185b',
        icon: PuzzleIcon,
        chipColor: 'error',
    },
    SCENE: {
        label: 'Scene/Situation',
        color: '#5d4037', // Brown
        backgroundColor: '#efebe9',
        borderColor: '#5d4037',
        icon: SceneIcon,
        chipColor: 'default',
    },
    SPEECH: {
        label: 'Famous Speech',
        color: '#00796b', // Teal
        backgroundColor: '#e0f2f1',
        borderColor: '#00796b',
        icon: SpeechIcon,
        chipColor: 'info',
    },
    LYRICS: {
        label: 'Song Lyrics',
        color: '#e91e63', // Pink
        backgroundColor: '#fce4ec',
        borderColor: '#e91e63',
        icon: LyricsIcon,
        chipColor: 'error',
    },
    FEED: {
        label: 'Instagram Feed',
        color: '#e1306c', // Instagram Pink
        backgroundColor: '#fce4ec',
        borderColor: '#e1306c',
        icon: FeedIcon,
        chipColor: 'error',
    },
};

/**
 * Get configuration for a content type
 */
export const getContentTypeConfig = (type: ContentType): ContentTypeConfig => {
    return contentTypeConfig[type] || contentTypeConfig.WORD;
};

/**
 * Get icon component for a content type
 */
export const getContentTypeIcon = (type: ContentType): SvgIconComponent => {
    return getContentTypeConfig(type).icon;
};

/**
 * Get color for a content type
 */
export const getContentTypeColor = (type: ContentType): string => {
    return getContentTypeConfig(type).color;
};

/**
 * Get background color for a content type
 */
export const getContentTypeBackgroundColor = (type: ContentType): string => {
    return getContentTypeConfig(type).backgroundColor;
};

/**
 * Get border color for a content type
 */
export const getContentTypeBorderColor = (type: ContentType): string => {
    return getContentTypeConfig(type).borderColor;
};

/**
 * Get chip color for a content type
 */
export const getContentTypeChipColor = (type: ContentType): ContentTypeConfig['chipColor'] => {
    return getContentTypeConfig(type).chipColor;
};
