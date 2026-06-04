import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { activityAlertOnDarkSx } from '../../utils/dailyActivityUi';

export interface EvaluationStatusProps {
    isCorrect?: boolean | null;
    evaluationPoints?: number;
    pointsEarned?: number;
    feedback?: string;
    reviewedAt?: string | Date | null;
    /** Use on dark activity cards so alert text stays readable */
    variant?: 'default' | 'onDark';
}

const EvaluationStatusBanner: React.FC<EvaluationStatusProps> = ({
    isCorrect,
    evaluationPoints,
    pointsEarned,
    feedback,
    reviewedAt,
    variant = 'default',
}) => {
    const pts = evaluationPoints ?? pointsEarned ?? 0;
    const reviewed = reviewedAt != null || (isCorrect !== null && isCorrect !== undefined);
    const onDark = variant === 'onDark';

    if (!reviewed && (isCorrect === null || isCorrect === undefined)) {
        return (
            <Alert severity="info" sx={onDark ? activityAlertOnDarkSx('info') : { mb: 2 }}>
                Awaiting review — evaluation score not final.
            </Alert>
        );
    }

    if (isCorrect === true) {
        return (
            <Alert severity="success" sx={onDark ? activityAlertOnDarkSx('success') : { mb: 2 }}>
                Reviewed: correct — evaluation score {pts} point{pts === 1 ? '' : 's'}.
            </Alert>
        );
    }

    if (isCorrect === false) {
        return (
            <Alert severity="warning" sx={onDark ? activityAlertOnDarkSx('warning') : { mb: 2 }}>
                <Box>
                    <Typography variant="body2" fontWeight={700} component="div">
                        Reviewed: incorrect — no evaluation points deducted from your leaderboard standing.
                    </Typography>
                    {feedback && (
                        <Typography variant="body2" sx={{ mt: 1 }} component="div">
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
