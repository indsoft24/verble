import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, LinearProgress, Paper, Stack, Typography,
} from '@mui/material';
import {
    getFinalAssessmentEligibility, saveFinalAssessmentAnswers,
    startFinalAssessment, submitFinalAssessment, type FinalAssessmentAttempt,
    type FinalAssessmentEligibility, type FinalAssessmentResult,
} from '../services/finalAssessmentService';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

const FinalAssessmentPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    useUserLayoutPage({ title: 'Final Assessment', variant: 'learning' });
    const [eligibility, setEligibility] = useState<FinalAssessmentEligibility | null>(null);
    const [attempt, setAttempt] = useState<FinalAssessmentAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<string, number | null>>({});
    const [current, setCurrent] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FinalAssessmentResult | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const saveTimers = useRef<Record<string, number>>({});
    const submittingRef = useRef(false);
    const answersRef = useRef<Record<string, number | null>>({});
    useEffect(() => { answersRef.current = answers; }, [answers]);

    const syncTimer = useCallback((activeAttempt: FinalAssessmentAttempt) => {
        const serverNow = new Date(activeAttempt.serverNow).getTime();
        const expires = new Date(activeAttempt.expiresAt).getTime();
        setRemainingSeconds(Math.max(0, Math.floor((expires - serverNow) / 1000)));
    }, []);

    const load = useCallback(async () => {
        if (!courseId) return;
        setLoading(true);
        setError(null);
        try {
            const gate = await getFinalAssessmentEligibility(courseId);
            setEligibility(gate);
            if (gate.activeAttemptId) {
                const active = await startFinalAssessment(courseId);
                setAttempt(active);
                setAnswers(active.answers || {});
                syncTimer(active);
            }
        } catch (err) {
            const responseError = err as { response?: { data?: { message?: string } } };
            setError(responseError.response?.data?.message || 'Unable to load this assessment.');
        } finally {
            setLoading(false);
        }
    }, [courseId, syncTimer]);

    useEffect(() => { void load(); }, [load]);
    useEffect(() => () => Object.values(saveTimers.current).forEach(window.clearTimeout), []);

    const finish = useCallback(async () => {
        if (!attempt || submittingRef.current) return;
        submittingRef.current = true;
        setBusy(true);
        setConfirmOpen(false);
        try {
            const submitted = await submitFinalAssessment(
                attempt.attemptId,
                attempt.questions.map((question) => answersRef.current[question.id] ?? -1)
            );
            setResult(submitted);
            setAttempt(null);
        } catch (err) {
            const responseError = err as { response?: { data?: { message?: string } } };
            setError(responseError.response?.data?.message || 'Assessment submission failed.');
        } finally {
            submittingRef.current = false;
            setBusy(false);
        }
    }, [attempt]);

    useEffect(() => {
        if (!attempt || result) return;
        const timer = window.setInterval(() => {
            setRemainingSeconds((seconds) => {
                if (seconds <= 1) {
                    window.clearInterval(timer);
                    void finish();
                    return 0;
                }
                return seconds - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [attempt, finish, result]);

    const begin = async () => {
        if (!courseId) return;
        setBusy(true);
        setError(null);
        try {
            const active = await startFinalAssessment(courseId);
            setAttempt(active);
            setAnswers(active.answers || {});
            setCurrent(0);
            syncTimer(active);
        } catch (err) {
            const responseError = err as { response?: { data?: { message?: string } } };
            setError(responseError.response?.data?.message || 'Could not start the assessment.');
        } finally {
            setBusy(false);
        }
    };

    const choose = (questionId: string, selectedOption: number) => {
        if (!attempt) return;
        const nextAnswers = { ...answersRef.current, [questionId]: selectedOption };
        answersRef.current = nextAnswers;
        setAnswers(nextAnswers);
        window.clearTimeout(saveTimers.current.all);
        saveTimers.current.all = window.setTimeout(async () => {
            try {
                const saved = await saveFinalAssessmentAnswers(
                    attempt.attemptId,
                    attempt.questions.map((question) => answersRef.current[question.id] ?? -1)
                );
                setLastSaved(saved.savedAt);
            } catch {
                setError('Your answer is shown locally but could not be saved. Please select it again.');
            }
        }, 350);
    };

    const unanswered = useMemo(
        () => attempt?.questions.filter((question) => answers[question.id] == null).length ?? 0,
        [answers, attempt]
    );
    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;
    if (!courseId) return <Alert severity="error">Invalid course.</Alert>;
    if (result) {
        return (
            <Paper sx={{ p: 4, maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800}>{result.passed ? 'Assessment passed' : 'Assessment completed'}</Typography>
                <Typography variant="h2" color={result.passed ? 'success.main' : 'text.primary'} sx={{ my: 2 }}>{result.score}%</Typography>
                <Typography color="text.secondary">
                    {result.passed ? 'You met the final assessment requirement.' : 'Review your course material before your next eligible attempt.'}
                </Typography>
                <Button component={RouterLink} to="/my-certificates" variant="contained" sx={{ mt: 3 }}>
                    View credentials
                </Button>
            </Paper>
        );
    }
    if (!attempt) {
        return (
            <Stack spacing={2} sx={{ maxWidth: 780, mx: 'auto' }}>
                {error && <Alert severity="error">{error}</Alert>}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h4" fontWeight={800}>{eligibility?.courseTitle || 'Final assessment'}</Typography>
                    <Stack direction="row" spacing={1} sx={{ my: 2 }}>
                        <Chip label={`${eligibility?.questionCount || 0} questions`} />
                        <Chip label={`${eligibility?.timeLimitMinutes || 0} minutes`} />
                        <Chip label={`${eligibility?.passingScore || 0}% to pass`} />
                    </Stack>
                    <Typography variant="h6">Instructions</Typography>
                    <Box component="ul">
                        {(eligibility?.instructions?.length ? eligibility.instructions : [
                            'Your answers save automatically.',
                            'The timer continues if you leave this page.',
                            'Correct answers are never shown before submission.',
                        ]).map((instruction) => <li key={instruction}>{instruction}</li>)}
                    </Box>
                    {!eligibility?.eligible && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {(eligibility?.reasons || ['You are not eligible yet.']).join(' ')}
                        </Alert>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Attempts used: {eligibility?.attemptsUsed || 0} of {eligibility?.attemptsAllowed || 0}
                    </Typography>
                    <Button variant="contained" size="large" disabled={!eligibility?.eligible || busy} onClick={() => void begin()}>
                        {busy ? 'Starting…' : 'Start assessment'}
                    </Button>
                </Paper>
            </Stack>
        );
    }

    const question = attempt.questions[current];
    return (
        <Stack spacing={2}>
            {error && <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>}
            <Paper sx={{ p: 2, position: 'sticky', top: 8, zIndex: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>Question {current + 1} of {attempt.questions.length}</Typography>
                    <Chip color={remainingSeconds < 300 ? 'error' : 'primary'} label={formatTime(remainingSeconds)} />
                </Stack>
                <LinearProgress variant="determinate" value={((current + 1) / attempt.questions.length) * 100} sx={{ mt: 1 }} />
            </Paper>
            <Stack direction="row" flexWrap="wrap" gap={1}>
                {attempt.questions.map((item, index) => (
                    <Button key={item.id} size="small" variant={index === current ? 'contained' : answers[item.id] == null ? 'outlined' : 'text'} onClick={() => setCurrent(index)}>
                        {index + 1}
                    </Button>
                ))}
            </Stack>
            <Paper sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h6" sx={{ mb: 3 }}>{question.question}</Typography>
                <Stack spacing={1.5}>
                    {question.options.map((option, index) => (
                        <Button key={index} variant={answers[question.id] === index ? 'contained' : 'outlined'} onClick={() => choose(question.id, index)} sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}>
                            {String.fromCharCode(65 + index)}. {option}
                        </Button>
                    ))}
                </Stack>
            </Paper>
            <Stack direction="row" justifyContent="space-between">
                <Button disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>Previous</Button>
                <Typography variant="caption" color="text.secondary">{lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Answers autosave'}</Typography>
                {current < attempt.questions.length - 1
                    ? <Button variant="contained" onClick={() => setCurrent((value) => value + 1)}>Next</Button>
                    : <Button color="success" variant="contained" onClick={() => setConfirmOpen(true)}>Review & submit</Button>}
            </Stack>
            <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)}>
                <DialogTitle>Submit final assessment?</DialogTitle>
                <DialogContent>
                    <Typography>{unanswered ? `${unanswered} question(s) are unanswered.` : 'All questions are answered.'}</Typography>
                    <Typography variant="body2" color="text.secondary">Submission is final and uses one attempt.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setConfirmOpen(false); if (unanswered) setCurrent(attempt.questions.findIndex((item) => answers[item.id] == null)); }}>Review</Button>
                    <Button variant="contained" disabled={busy} onClick={() => void finish()}>Submit</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default FinalAssessmentPage;
