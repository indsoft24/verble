import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';
import { getCourseReportCard } from '../services/courseCertificateService';

const CourseReportCardPage: React.FC = () => {
    useUserLayoutPage({ title: 'Your report card' });
    const { courseId } = useParams<{ courseId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Awaited<ReturnType<typeof getCourseReportCard>> | null>(null);

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        getCourseReportCard(courseId)
            .then(setData)
            .catch((err: unknown) => {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to load report card');
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    if (!courseId) {
        return (
                <Alert severity="error">Invalid course.</Alert>
        );
    }

    if (loading) {
        return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
        );
    }

    if (error || !data?.available) {
        return (
            <>
                <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/my-courses" sx={{ mb: 2 }}>
                    Back to My Courses
                </Button>
                <Alert severity="warning">
                    {error ||
                        data?.reasons?.[0] ||
                        'Report card is only available after you meet all certification requirements. Review your lessons and daily practice, then try again.'}
                </Alert>
            </>
        );
    }

    const rc = data.reportCard as Record<string, unknown> | undefined;
    const pillars = data.pillars;

    return (
        <>
            <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/my-courses" sx={{ mb: 2 }}>
                Back to My Courses
            </Button>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Course report card
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Congratulations — you met all requirements for this course certificate.
            </Typography>

            <Grid container spacing={2}>
                {data.finalAssessment?.enabled && (
                    <Grid size={12}>
                        <Alert severity={data.finalAssessment.passed ? 'success' : data.finalAssessment.ready ? 'info' : 'warning'}>
                            {data.finalAssessment.passed
                                ? 'Final assessment passed.'
                                : data.finalAssessment.ready
                                    ? 'Your final assessment is ready.'
                                    : `Final assessment requirements remain. ${data.reasons?.[0] || ''}`}
                            {data.finalAssessment.ready && !data.finalAssessment.passed && (
                                <Button component={RouterLink} to={`/final-assessment/${courseId}`} size="small" sx={{ ml: 1 }}>
                                    Open assessment
                                </Button>
                            )}
                        </Alert>
                    </Grid>
                )}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Module progress
                            </Typography>
                            <Typography variant="h3" fontWeight={700}>
                                {String(rc?.completionPercent ?? pillars?.modules.percent ?? 0)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Number(rc?.completionPercent ?? 0)}
                                sx={{ mt: 2, height: 8, borderRadius: 4 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Module quizzes
                            </Typography>
                            <Typography variant="body1">
                                Average best score:{' '}
                                <strong>{pillars?.moduleQuizzes.averageBestScore ?? 0}%</strong>
                            </Typography>
                            <Chip
                                size="small"
                                sx={{ mt: 1 }}
                                color={pillars?.moduleQuizzes.met ? 'success' : 'default'}
                                label={pillars?.moduleQuizzes.met ? 'Requirement met' : 'In progress'}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Daily practice
                            </Typography>
                            <Typography variant="body1">
                                Success rate:{' '}
                                <strong>{pillars?.dailySubmissions.successPercent ?? 0}%</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Based on {pillars?.dailySubmissions.reviewedCount ?? 0} reviewed submissions
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Overall submissions
                            </Typography>
                            <Typography variant="body1">
                                Combined success:{' '}
                                <strong>{pillars?.overallSubmissions.successPercent ?? 0}%</strong>
                            </Typography>
                            {pillars?.assessment.score != null && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Final assessment: {pillars.assessment.score}%
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {Array.isArray(rc?.moduleQuizBreakdown) && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Module quiz breakdown
                    </Typography>
                    <Stack spacing={1}>
                        {(rc.moduleQuizBreakdown as { title: string; bestScore: number | null; passed: boolean; hasQuiz: boolean }[]).map(
                            (m) =>
                                m.hasQuiz ? (
                                    <PaperRow
                                        key={m.title}
                                        title={m.title}
                                        detail={`Best: ${m.bestScore ?? '—'}% · ${m.passed ? 'Passed' : 'Not passed'}`}
                                    />
                                ) : null
                        )}
                    </Stack>
                </Box>
            )}
        </>
    );
};

function PaperRow({ title, detail }: { title: string; detail: string }) {
    return (
        <Box
            sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            <Typography fontWeight={600}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">
                {detail}
            </Typography>
        </Box>
    );
}

export default CourseReportCardPage;
