import React from 'react';
import { Box, Typography, List, ListItem, Tooltip, alpha } from '@mui/material';
import type { UserWordSubmission } from '../../services/sentenceSubmissionService';

export const SubmissionHistoryItem: React.FC<{ submission: UserWordSubmission }> = ({
    submission,
}) => {
    const isCorrect = submission.isCorrect === true;
    const isWrong = submission.isCorrect === false;
    const color = isCorrect ? '#22c55e' : isWrong ? '#ef4444' : alpha('#e2e8f0', 0.85);
    const correction = submission.feedback?.trim();

    const row = (
        <ListItem sx={{ py: 0.75, px: 0, display: 'block' }}>
            <Typography
                variant="body2"
                sx={{
                    color,
                    fontWeight: isWrong || isCorrect ? 600 : 400,
                    lineHeight: 1.45,
                }}
            >
                {submission.sentence}
            </Typography>
            {isWrong && correction && (
                <Typography variant="caption" sx={{ display: 'block', color: '#86efac', mt: 0.5 }}>
                    {correction}
                </Typography>
            )}
        </ListItem>
    );

    if (isWrong && correction) {
        return (
            <Tooltip title={correction} placement="top" enterTouchDelay={0}>
                <Box component="span" sx={{ display: 'block' }}>
                    {row}
                </Box>
            </Tooltip>
        );
    }

    return row;
};

export const SummaryHistoryList: React.FC<{ sentences: string[] }> = ({ sentences }) => (
    <List dense disablePadding>
        {sentences.map((s, i) => (
            <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.9) }}>
                    {s}
                </Typography>
            </ListItem>
        ))}
    </List>
);
