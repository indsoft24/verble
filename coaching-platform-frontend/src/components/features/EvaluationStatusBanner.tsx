import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

export interface EvaluationStatusProps {
    isCorrect?: boolean | null;
    evaluationPoints?: number;
    pointsEarned?: number;
    feedback?: string;
    reviewedAt?: string | Date | null;
    /** Use on dark activity cards so alert text stays readable */
    variant?: 'default' | 'onDark';
}

const onDarkAlertSx = {
    '& .MuiAlert-message': { color: '#f8fafc', width: '100%' },
    '& .MuiAlert-icon': { color: 'inherit' },
};

const EvaluationStatusBanner: React.FC<EvaluationStatusProps> = ({
    isCorrect,
    evaluationPoints,
    pointsEarned,
    feedback,
    reviewedAt,
    variant = 'default',
}) => {
    const darkSx = variant === 'onDark' ? onDarkAlertSx : {};
    const pts = evaluationPoints ?? pointsEarned ?? 0;
    const reviewed = reviewedAt != null || isCorrect !== null && isCorrect !== undefined;

    if (!reviewed && (isCorrect === null || isCorrect === undefined)) {
        return (
            <Alert
                severity="info"
                sx={{
                    mb: 2,
                    ...(variant === 'onDark'
                        ? {
                              bgcolor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#e0f2fe',
                              ...onDarkAlertSx,
                          }
                        : {}),
                }}
            >
                Awaiting review — evaluation score not final.
            </Alert>
        );
    }

    if (isCorrect === true) {
        return (
            <Alert severity="success" sx={{ mb: 2 }}>
                Reviewed: correct — evaluation score {pts} point{pts === 1 ? '' : 's'}.
            </Alert>
        );
    }

    if (isCorrect === false) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="body2" fontWeight={700}>
                        Reviewed: incorrect — no evaluation points deducted from your leaderboard standing.
                    </Typography>
                    {feedback && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Feedback: {feedback}
                        </Typography>
                    )}
                </Box>
            </Alert>
        );
    }

    return null;
};

export default EvaluationStatusBanner;
