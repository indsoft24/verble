import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

export interface EvaluationStatusProps {
    isCorrect?: boolean | null;
    evaluationPoints?: number;
    pointsEarned?: number;
    feedback?: string;
    reviewedAt?: string | Date | null;
}

const EvaluationStatusBanner: React.FC<EvaluationStatusProps> = ({
    isCorrect,
    evaluationPoints,
    pointsEarned,
    feedback,
    reviewedAt,
}) => {
    const pts = evaluationPoints ?? pointsEarned ?? 0;
    const reviewed = reviewedAt != null || isCorrect !== null && isCorrect !== undefined;

    if (!reviewed && (isCorrect === null || isCorrect === undefined)) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
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
