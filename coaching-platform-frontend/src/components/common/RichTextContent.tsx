import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import parse from 'html-react-parser';
import { courseTiptapSx } from '../course/courseLearningTheme';

export const lightRichTextSx = {
    '& p': { typography: 'body1', lineHeight: 1.75, mb: 2, color: 'text.secondary' },
    '& ul, & ol': { pl: 3, mb: 2 },
    '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.75 },
    '& strong': { fontWeight: 700, color: 'text.primary' },
    '& em': { fontStyle: 'italic' },
    '& u': { textDecoration: 'underline' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
    '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2.5, mb: 1, fontWeight: 700, color: 'text.primary' },
} as const;

interface RichTextContentProps {
    html?: string | null;
    variant?: 'light' | 'dark';
    sx?: SxProps<Theme>;
    fallback?: React.ReactNode;
}

const RichTextContent: React.FC<RichTextContentProps> = ({
    html,
    variant = 'light',
    sx,
    fallback,
}) => {
    const variantSx = variant === 'dark' ? courseTiptapSx : lightRichTextSx;
    const trimmed = html?.trim();

    if (!trimmed) {
        return fallback ? <>{fallback}</> : null;
    }

    return (
        <Box className="tiptap-rendered-content" sx={{ ...variantSx, ...sx }}>
            {parse(trimmed)}
        </Box>
    );
};

export default RichTextContent;
