import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    LinearProgress,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserLayout from '../components/layout/UserLayout';
import {
    getModuleQuiz,
    submitModuleQuiz,
    type ModuleQuizForStudent,
} from '../services/moduleQuizService';

const ModuleQuizPage: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [quiz, setQuiz] = useState<ModuleQuizForStudent | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        score: number;
        passed: boolean;
        moduleCompleted: boolean;
    } | null>(null);
    const [meta, setMeta] = useState<{ bestScore: number | null; previousAttempts: number } | null>(null);

    const loadQuiz = useCallback(async () => {
        if (!moduleId) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await getModuleQuiz(moduleId);
            setQuiz(data.quiz);
            setMeta({ bestScore: data.bestScore, previousAttempts: data.previousAttempts });
            setAnswers({});
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
            const msg = axiosErr.response?.data?.message || 'Failed to load quiz.';
            setError(msg);
            if (axiosErr.response?.status === 403) {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        void loadQuiz();
    }, [loadQuiz]);

    const handleSubmit = async () => {
        if (!moduleId || !quiz) return;
        const unanswered = quiz.questions.findIndex((_, i) => answers[i] === undefined);
        if (unanswered >= 0) {
            setError(`Please answer question ${unanswered + 1}.`);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const payload = quiz.questions.map((_, i) => ({ selectedAnswer: answers[i] }));
            const submission = await submitModuleQuiz(moduleId, payload);
            setResult({
                score: submission.score,
                passed: submission.passed,
                moduleCompleted: submission.moduleCompleted,
            });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to submit quiz.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!moduleId) {
        return (
            <UserLayout title="Module Quiz">
                <Alert severity="error">Invalid module.</Alert>
            </UserLayout>
        );
    }

    return (
        <UserLayout title={quiz?.title || 'Module Quiz'}>
            <Box sx={{ maxWidth: 720, mx: 'auto', py: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    component={RouterLink}
                    to={`/modules/${moduleId}/videos`}
                    sx={{ mb: 2 }}
                >
                    Back to lessons
                </Button>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && !loading && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                        {error.includes('Watch all videos') && (
                            <Box sx={{ mt: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    component={RouterLink}
                                    to={`/modules/${moduleId}/videos`}
                                >
                                    Continue watching videos
                                </Button>
                            </Box>
                        )}
                    </Alert>
                )}

                {result && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Stack spacing={2} alignItems="center" textAlign="center">
                                {result.passed ? (
                                    <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
                                ) : (
                                    <CancelIcon color="error" sx={{ fontSize: 56 }} />
                                )}
                                <Typography variant="h5" fontWeight={700}>
                                    {result.passed ? 'Quiz passed!' : 'Not passed yet'}
                                </Typography>
                                <Typography color="text.secondary">
                                    Score: {result.score}% (need {quiz?.passingScore ?? 70}% to pass)
                                </Typography>
                                {result.passed && result.moduleCompleted && (
                                    <Typography color="success.main" fontWeight={600}>
                                        Module marked complete.
                                    </Typography>
                                )}
                                {!result.passed && (
                                    <Typography variant="body2" color="text.secondary">
                                        Review the lesson videos carefully, then try again.
                                    </Typography>
                                )}
                                <Stack direction="row" spacing={1}>
                                    {!result.passed && (
                                        <Button variant="contained" onClick={() => void loadQuiz()}>
                                            Retry quiz
                                        </Button>
                                    )}
                                    <Button
                                        variant={result.passed ? 'contained' : 'outlined'}
                                        component={RouterLink}
                                        to={`/modules/${moduleId}/videos`}
                                    >
                                        Back to module
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {quiz && !loading && !result && (
                    <>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            {quiz.title}
                        </Typography>
                        {quiz.description && (
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {quiz.description}
                            </Typography>
                        )}
                        {meta && meta.previousAttempts > 0 && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Previous attempts: {meta.previousAttempts}
                                {meta.bestScore != null ? ` · Best score: ${meta.bestScore}%` : ''}
                            </Alert>
                        )}
                        <LinearProgress
                            variant="determinate"
                            value={
                                (Object.keys(answers).length / Math.max(quiz.questions.length, 1)) * 100
                            }
                            sx={{ mb: 3, height: 8, borderRadius: 4 }}
                        />
                        {quiz.questions.map((q, index) => (
                            <Card key={q._id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography fontWeight={600} sx={{ mb: 1.5 }}>
                                        {index + 1}. {q.question}
                                    </Typography>
                                    <FormControl component="fieldset" fullWidth>
                                        <RadioGroup
                                            value={answers[index] ?? ''}
                                            onChange={(e) =>
                                                setAnswers((prev) => ({
                                                    ...prev,
                                                    [index]: Number(e.target.value),
                                                }))
                                            }
                                        >
                                            {q.options.map((opt, optIdx) => (
                                                <FormControlLabel
                                                    key={optIdx}
                                                    value={optIdx}
                                                    control={<Radio />}
                                                    label={opt}
                                                />
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                </CardContent>
                            </Card>
                        ))}
                        <Divider sx={{ my: 2 }} />
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={submitting}
                            onClick={() => void handleSubmit()}
                        >
                            {submitting ? 'Submitting…' : 'Submit quiz'}
                        </Button>
                    </>
                )}
            </Box>
        </UserLayout>
    );
};

export default ModuleQuizPage;
