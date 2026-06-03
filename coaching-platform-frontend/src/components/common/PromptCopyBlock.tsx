import React, { useEffect, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Button, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

type PromptCopyBlockProps = {
    promptText: string;
    onCopied?: () => void | Promise<void>;
};

const PLACEHOLDER_PATTERN = /(\[[^\]]+\])/g;

const PromptCopyBlock: React.FC<PromptCopyBlockProps> = ({ promptText, onCopied }) => {
    const [copied, setCopied] = useState(false);
    const resetTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
        };
    }, []);

    const handleCopy = async () => {
        const text = promptText.trim();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            await onCopied?.();
            setCopied(true);
            if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
            resetTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard permission may be blocked
        }
    };

    if (!promptText.trim()) return null;

    return (
        <Box
            className="prompt-copy-block"
            sx={{
                my: 2.5,
                borderRadius: 2.5,
                overflow: 'hidden',
                border: `1px solid ${alpha('#475569', 0.9)}`,
                bgcolor: '#0f172a',
                boxShadow: `0 16px 40px ${alpha('#020617', 0.35)}`,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: '#1e293b',
                    borderBottom: `1px solid ${alpha('#64748b', 0.5)}`,
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                    AI prompt
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    onClick={() => void handleCopy()}
                    startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2,
                        bgcolor: copied ? '#16a34a' : '#2563eb',
                        '&:hover': { bgcolor: copied ? '#15803d' : '#1d4ed8' },
                    }}
                >
                    {copied ? 'Copied!' : 'Copy prompt'}
                </Button>
            </Stack>
            <Box
                component="pre"
                sx={{
                    m: 0,
                    p: 2,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: `'JetBrains Mono', 'Fira Code', Consolas, monospace`,
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: '#e2e8f0',
                    maxHeight: 480,
                    overflowY: 'auto',
                }}
            >
                {promptText.split(PLACEHOLDER_PATTERN).map((part, idx) =>
                    /^\[[^\]]+\]$/.test(part) ? (
                        <Box
                            key={`ph-${idx}`}
                            component="span"
                            sx={{
                                color: '#93c5fd',
                                fontWeight: 700,
                                bgcolor: alpha('#2563eb', 0.2),
                                borderRadius: 0.5,
                                px: 0.5,
                            }}
                        >
                            {part}
                        </Box>
                    ) : (
                        <React.Fragment key={`txt-${idx}`}>{part}</React.Fragment>
                    )
                )}
            </Box>
        </Box>
    );
};

export default PromptCopyBlock;
