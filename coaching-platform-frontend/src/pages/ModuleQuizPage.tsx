import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    LinearProgress,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UserLayout from '../components/layout/UserLayout';
import {
    CourseLearningShell,
    CourseLearningBreadcrumbs,
    CourseBottomNav,
    courseLearningTheme,
    courseBottomNavZIndex,
} from '../components/course';
import {
    getModuleQuiz,
    getModuleQuizAvailability,
    submitModuleQuiz,
    type ModuleQuizForStudent,
    type ModuleQuizAvailability,
} from '../services/moduleQuizService';
import { getFilledOptionEntries } from '../utils/quizOptionUtils';

const optionRowSx = (selected: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    textAlign: 'left' as const,
    minHeight: { xs: 52, sm: 56 },
    p: { xs: '12px 14px', sm: '14px 16px' },
    mb: 0,
    borderRadius: 2,
    wordBreak: 'break-word' as const,
    border: `1px solid ${selected ? courseLearningTheme.accent : alpha(courseLearningTheme.accent, 0.25)}`,
    bgcolor: selected ? alpha(courseLearningTheme.accent, 0.15) : courseLearningTheme.surfaceRaised,
    color: courseLearningTheme.textPrimary,
    cursor: 'pointer',
    fontSize: '0.9375rem',
    lineHeight: 1.45,
    transition: 'border-color 0.15s, background-color 0.15s',
    '&:hover': {
        borderColor: courseLearningTheme.accent,
        bgcolor: alpha(courseLearningTheme.accent, 0.1),
    },
});

const ModuleQuizPage: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [quiz, setQuiz] = useState<ModuleQuizForStudent | null>(null);
    const [gate, setGate] = useState<ModuleQuizAvailability | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        score: number;
        passed: boolean;
        moduleCompleted: boolean;
        retakeMessage?: string;
    } | null>(null);
    const [meta, setMeta] = useState<{ bestScore: number | null; previousAttempts: number } | null>(null);

    const lessonsPath = moduleId ? `/modules/${moduleId}/videos` : '/my-courses';

    const loadGate = useCallback(async () => {
        if (!moduleId) return null;
        try {
            const availability = await getModuleQuizAvailability(moduleId);
            setGate(availability);
            return availability;
        } catch {
            setGate(null);
            return null;
        }
    }, [moduleId]);

    const loadQuiz = useCallback(async () => {
        if (!moduleId) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const availability = await loadGate();
            if (availability?.quizState === 'exhausted' || availability?.needsAdminReset) {
                setError(availability.message);
                setQuiz(null);
                return;
            }
            if (!availability?.canTakeQuiz) {
                setError(availability?.message || 'Complete a lesson cycle to unlock this quiz.');
                setQuiz(null);
                return;
            }
            const data = await getModuleQuiz(moduleId);
            setQuiz(data.quiz);
            setMeta({ bestScore: data.bestScore, previousAttempts: data.previousAttempts });
            setAnswers({});
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
            setError(axiosErr.response?.data?.message || 'Failed to load quiz.');
            setQuiz(null);
        } finally {
            setLoading(false);
        }
    }, [moduleId, loadGate]);

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
                retakeMessage: submission.retakeMessage,
            });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to submit quiz.');
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = quiz?.questions.length ?? 0;
    const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    if (!moduleId) {
        return (
            <UserLayout title="Module Quiz" variant="learning">
                <CourseLearningShell maxWidth="sm">
                    <Alert severity="error">Invalid module.</Alert>
                </CourseLearningShell>
            </UserLayout>
        );
    }

    const layout = (content: React.ReactNode) => (
        <UserLayout title={quiz?.title || 'Module Quiz'} variant="learning">
            <CourseLearningShell>
                <CourseLearningBreadcrumbs
                    items={[
                        { label: 'My Courses', to: '/my-courses' },
                        { label: 'Module', to: lessonsPath },
                        { label: 'Quiz' },
                    ]}
                />
                {content}
            </CourseLearningShell>
            <CourseBottomNav backLabel="Back to lessons" backTo={lessonsPath} />
        </UserLayout>
    );

    if (loading) {
        return layout(
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress size={28} sx={{ color: courseLearningTheme.accent }} />
                <Typography sx={{ color: courseLearningTheme.textMuted }}>Loading quiz…</Typography>
            </Box>
        );
    }

    if (result) {
        return layout(
            <Box
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                    border: courseLearningTheme.tileBorder(),
                    bgcolor: courseLearningTheme.tileBg,
                    textAlign: 'center',
                }}
            >
                <Stack spacing={2} alignItems="center">
                    {result.passed ? (
                        <CheckCircleIcon sx={{ fontSize: 56, color: courseLearningTheme.accent }} />
                    ) : (
                        <CancelIcon sx={{ fontSize: 56, color: courseLearningTheme.highlight }} />
                    )}
                    <Typography variant="h5" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary }}>
                        {result.passed ? 'Quiz passed!' : 'Not passed yet'}
                    </Typography>
                    <Typography sx={{ color: courseLearningTheme.textBody }}>
                        Score: {result.score}% (need {quiz?.passingScore ?? 70}% to pass)
                    </Typography>
                    {result.passed && result.moduleCompleted && (
                        <Typography sx={{ color: courseLearningTheme.accent, fontWeight: 600 }}>
                            Module marked complete.
                        </Typography>
                    )}
                    {result.retakeMessage && !result.passed && (
                        <Typography variant="body2" sx={{ color: courseLearningTheme.textMuted, maxWidth: 420 }}>
                            {result.retakeMessage}
                        </Typography>
                    )}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1 }}>
                        {!result.passed && gate?.quizState !== 'exhausted' && (
                            <Button
                                variant="contained"
                                onClick={() => void loadQuiz()}
                                sx={{
                                    bgcolor: courseLearningTheme.accent,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                }}
                            >
                                Retry quiz
                            </Button>
                        )}
                        <Button
                            variant={result.passed ? 'contained' : 'outlined'}
                            component={RouterLink}
                            to={lessonsPath}
                            sx={{
                                ...(result.passed
                                    ? {
                                          bgcolor: courseLearningTheme.accent,
                                          '&:hover': { bgcolor: courseLearningTheme.accentDark },
                                      }
                                    : {
                                          borderColor: alpha(courseLearningTheme.accent, 0.5),
                                          color: courseLearningTheme.textPrimary,
                                      }),
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Back to lessons
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        );
    }

    return layout(
        <>
            {error && !quiz && (
                <Alert
                    severity={gate?.quizState === 'exhausted' ? 'warning' : 'error'}
                    sx={{ mb: 2 }}
                    action={
                        <Button
                            size="small"
                            component={RouterLink}
                            to={lessonsPath}
                            sx={{ color: 'inherit', fontWeight: 700 }}
                        >
                            Back to lessons
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {quiz && (
                <>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: courseLearningTheme.textPrimary, mb: 0.5 }}>
                        {quiz.title}
                    </Typography>
                    {quiz.description && (
                        <Typography sx={{ color: courseLearningTheme.textBody, mb: 2, lineHeight: 1.55 }}>
                            {quiz.description}
                        </Typography>
                    )}
                    {meta && meta.previousAttempts > 0 && (
                        <Typography variant="body2" sx={{ color: courseLearningTheme.textMuted, mb: 2 }}>
                            Previous attempts: {meta.previousAttempts}
                            {meta.bestScore != null ? ` · Best score: ${meta.bestScore}%` : ''}
                        </Typography>
                    )}

                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                            {answeredCount} of {totalQuestions} answered
                        </Typography>
                        <Typography variant="caption" sx={{ color: courseLearningTheme.textMuted }}>
                            Passing score: {quiz.passingScore}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={progressPct}
                        sx={{
                            mb: 3,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(courseLearningTheme.accent, 0.2),
                            '& .MuiLinearProgress-bar': { bgcolor: courseLearningTheme.accent },
                        }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Stack sx={{ gap: 2, mb: 3 }}>
                        {quiz.questions.map((q, index) => (
                            <Box
                                key={q._id}
                                sx={{
                                    p: { xs: 1.25, sm: 2 },
                                    borderRadius: 2,
                                    border: courseLearningTheme.tileBorder(),
                                    bgcolor: courseLearningTheme.tileBg,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: courseLearningTheme.textPrimary,
                                        mb: 1.5,
                                        lineHeight: 1.5,
                                        fontSize: { xs: '1rem', sm: '1.0625rem' },
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {index + 1}. {q.question}
                                </Typography>
                                <Box
                                    component="div"
                                    role="radiogroup"
                                    aria-label={`Question ${index + 1}`}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: { xs: 1.25, sm: 1.5 },
                                    }}
                                >
                                    {getFilledOptionEntries(q.options).map(({ text, index: optIdx }) => (
                                        <Box
                                            key={optIdx}
                                            component="button"
                                            type="button"
                                            role="radio"
                                            aria-checked={answers[index] === optIdx}
                                            onClick={() =>
                                                setAnswers((prev) => ({ ...prev, [index]: optIdx }))
                                            }
                                            sx={optionRowSx(answers[index] === optIdx)}
                                        >
                                            {text}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Box
                        sx={{
                            position: 'sticky',
                            bottom: { xs: 88, sm: 88 },
                            zIndex: courseBottomNavZIndex - 1,
                            pt: 1,
                            pb: 1,
                            bgcolor: alpha(courseLearningTheme.pageBg, 0.92),
                        }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={submitting}
                            onClick={() => void handleSubmit()}
                            sx={{
                                bgcolor: courseLearningTheme.accent,
                                fontWeight: 700,
                                textTransform: 'none',
                                py: 1.25,
                                '&:hover': { bgcolor: courseLearningTheme.accentDark },
                            }}
                        >
                            {submitting ? 'Submitting…' : 'Submit quiz'}
                        </Button>
                    </Box>
                </>
            )}
        </>
    );
};

export default ModuleQuizPage;
