import React from 'react';
import { Box, Chip, Typography, alpha } from '@mui/material';
import {
    normalizeVocabSentences,
    type VocabSentenceEntry,
} from '../../utils/vocabSubmissionDisplay';

export interface VocabSubmissionPreviewProps {
    sentences: unknown;
    compact?: boolean;
    maxItems?: number;
}

const VocabSubmissionPreview: React.FC<VocabSubmissionPreviewProps> = ({
    sentences,
    compact = false,
    maxItems = compact ? 2 : 10,
}) => {
    const entries = normalizeVocabSentences(sentences);
    if (entries.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                —
            </Typography>
        );
    }

    const shown = entries.slice(0, maxItems);
    const remaining = entries.length - shown.length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
            {shown.map((entry, idx) => (
                <VocabSentenceBlock key={idx} index={idx} entry={entry} compact={compact} />
            ))}
            {remaining > 0 && (
                <Typography variant="caption" color="text.secondary">
                    +{remaining} more sentence{remaining === 1 ? '' : 's'}
                </Typography>
            )}
        </Box>
    );
};

function VocabSentenceBlock({
    index,
    entry,
    compact,
}: {
    index: number;
    entry: VocabSentenceEntry;
    compact: boolean;
}) {
    return (
        <Box
            sx={{
                p: compact ? 1 : 1.25,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: compact ? 'grey.50' : 'background.paper',
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.45,
                }}
            >
                {index + 1}. {entry.sentence}
            </Typography>
            {entry.vocabWordsUsed.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                    {entry.vocabWordsUsed.map((word) => (
                        <Chip
                            key={word}
                            label={word}
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                bgcolor: alpha('#1976d2', 0.1),
                                color: 'primary.dark',
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default VocabSubmissionPreview;
