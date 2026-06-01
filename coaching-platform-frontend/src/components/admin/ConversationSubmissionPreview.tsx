import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { practicalConversationTheme as theme } from '../features/practicalConversationTheme';

export interface ConversationSubmissionPreviewProps {
    participant1: string;
    participant2: string;
    exchanges: Array<{ participant1Line: string; participant2Line: string }>;
}

const ConversationSubmissionPreview: React.FC<ConversationSubmissionPreviewProps> = ({
    participant1,
    exchanges,
}) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {exchanges.map((row, idx) => (
            <Box key={idx}>
                <Typography variant="caption" sx={{ color: theme.bubbleLabel, fontWeight: 700 }}>
                    Exchange {idx + 1}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                px: 1.25,
                                py: 0.75,
                                maxWidth: '95%',
                                borderRadius: '10px 10px 10px 2px',
                                bgcolor: theme.bubbleOther,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: theme.bubbleLabel, fontWeight: 700 }}>
                                {participant1}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.bubbleOtherText, whiteSpace: 'pre-wrap' }}>
                                {row.participant1Line}
                            </Typography>
                        </Paper>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                px: 1.25,
                                py: 0.75,
                                maxWidth: '95%',
                                borderRadius: '10px 10px 2px 10px',
                                bgcolor: theme.bubbleUser,
                            }}
                        >
                            <Typography variant="body2" sx={{ color: theme.bubbleUserText, whiteSpace: 'pre-wrap' }}>
                                {row.participant2Line}
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        ))}
    </Box>
);

export default ConversationSubmissionPreview;
