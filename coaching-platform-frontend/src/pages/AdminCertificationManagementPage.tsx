import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select,
    Stack, Switch, Tab, Tabs, Table, TableBody, TableCell, TableHead, TablePagination,
    TableRow, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import {
    createFinalExamQuestionAdmin, deleteFinalExamQuestionAdmin, exportFinalExamQuestionsAdmin, exportIssuedCertificatesAdmin,
    fetchDemoCertificatePdf, getCertificateBrandingAdmin, getCertificateNumberingAdmin,
    getCertificateRulesAdmin, getFinalExamAttemptsAdmin, getFinalExamQuestionsAdmin,
    getFinalExamSettingsAdmin, getIssuedCertificatesAdmin, importFinalExamQuestionsAdmin,
    issueCertificateAdmin, regenerateCertificatePdfAdmin, revokeCertificateAdmin,
    unrevokeCertificateAdmin, updateCertificateBrandingAdmin, updateCertificateNumberingAdmin,
    updateCertificateRuleAdmin, updateFinalExamQuestionAdmin, updateFinalExamSettingsAdmin,
    uploadCertificateLogoAdmin, uploadCertificateSignatureAdmin, type CertificateBranding,
    type CertificateNumberingTemplate, type CertificateRuleRow, type FinalExamAttemptRow,
    type FinalExamQuestion, type FinalExamSettings, type IssuedCertificateFilters,
    type IssuedCertificateRow,
} from '../services/certificationAdminService';
import type { FinalExamQuestionInput } from '../utils/finalExamCsv';
import { questionsToFinalExamCsv } from '../utils/finalExamCsv';
import FinalExamCsvImportDialog from '../components/admin/FinalExamCsvImportDialog';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

const tabs = ['Overview', 'Course Rules', 'Final Exams', 'Question Bank', 'Numbering & Branding', 'Issued Certificates'];
const message = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
    (error as Error)?.message || fallback;
const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    URL.revokeObjectURL(url);
};

const formatSnapshotDate = (value: unknown) => {
    if (typeof value !== 'string' && !(value instanceof Date)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
};

const SnapshotField = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 600 }}>
            {value}
        </Typography>
    </Box>
);

const EligibilitySnapshotView = ({ snapshot }: { snapshot?: Record<string, unknown> | null }) => {
    if (!snapshot || Object.keys(snapshot).length === 0) {
        return <Typography variant="body2" color="text.secondary">No eligibility details were recorded for this certificate.</Typography>;
    }

    const completedAt = formatSnapshotDate(snapshot.completedAt);
    const videosCompleted = typeof snapshot.videosCompleted === 'number' ? snapshot.videosCompleted : null;
    const totalVideos = typeof snapshot.totalVideos === 'number' ? snapshot.totalVideos : null;
    const quizPassed = typeof snapshot.quizPassed === 'boolean' ? snapshot.quizPassed : null;
    const quizScore = typeof snapshot.quizScore === 'number' ? snapshot.quizScore : null;
    const completionPercent = typeof snapshot.completionPercent === 'number' ? snapshot.completionPercent : null;
    const assessmentScore = typeof snapshot.assessmentScore === 'number' ? snapshot.assessmentScore : null;
    const passed = typeof snapshot.passed === 'boolean' ? snapshot.passed : null;
    const manuallyOverridden = Boolean(snapshot.manuallyOverridden);
    const reasons = Array.isArray(snapshot.reasons)
        ? snapshot.reasons.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                    {completionPercent != null && (
                        <Chip size="small" color="success" variant="outlined" label={`${completionPercent}% complete`} />
                    )}
                    {quizPassed != null && (
                        <Chip
                            size="small"
                            color={quizPassed ? 'success' : 'warning'}
                            variant="outlined"
                            label={quizPassed ? 'Quiz passed' : 'Quiz not passed'}
                        />
                    )}
                    {passed != null && (
                        <Chip
                            size="small"
                            color={passed ? 'success' : 'warning'}
                            variant="outlined"
                            label={passed ? 'Assessment passed' : 'Assessment not passed'}
                        />
                    )}
                    {manuallyOverridden && <Chip size="small" color="info" variant="outlined" label="Manual override" />}
                </Stack>

                <Grid container spacing={2}>
                    {videosCompleted != null && totalVideos != null && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SnapshotField label="Lessons completed" value={`${videosCompleted} / ${totalVideos}`} />
                        </Grid>
                    )}
                    {quizScore != null && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SnapshotField label="Quiz score" value={`${quizScore}%`} />
                        </Grid>
                    )}
                    {assessmentScore != null && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SnapshotField label="Assessment score" value={`${assessmentScore}%`} />
                        </Grid>
                    )}
                    {completedAt && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SnapshotField label="Completed at" value={completedAt} />
                        </Grid>
                    )}
                </Grid>

                {reasons.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Notes
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ m: 0, mt: 0.75, pl: 2 }}>
                            {reasons.map((reason) => (
                                <Typography key={reason} component="li" variant="body2">{reason}</Typography>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
};

const AdminCertificationManagementPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Certification Management' });
    const [tab, setTab] = useState(0);
    const [rules, setRules] = useState<CertificateRuleRow[]>([]);
    const [exams, setExams] = useState<FinalExamSettings[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const loadFoundation = useCallback(async () => {
        try {
            const [ruleRows, examRows] = await Promise.all([getCertificateRulesAdmin(), getFinalExamSettingsAdmin()]);
            setRules(ruleRows); setExams(examRows);
        } catch (err) { setError(message(err, 'Failed to load certification settings.')); }
    }, []);
    useEffect(() => { void loadFoundation(); }, [loadFoundation]);
    const notify = (text: string) => { setSuccess(text); setError(null); };

    return (
        <Stack spacing={2}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
            <Paper variant="outlined"><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
                {tabs.map((label) => <Tab key={label} label={label} />)}
            </Tabs></Paper>
            {tab === 0 && <Overview rules={rules} exams={exams} onNavigate={setTab} />}
            {tab === 1 && <CourseRules rules={rules} setRules={setRules} busy={busy} setBusy={setBusy} onError={setError} onSuccess={notify} />}
            {tab === 2 && <FinalExams exams={exams} setExams={setExams} busy={busy} setBusy={setBusy} onError={setError} onSuccess={notify} />}
            {tab === 3 && <QuestionBank courses={exams} onError={setError} onSuccess={notify} />}
            {tab === 4 && <NumberingBranding onError={setError} onSuccess={notify} />}
            {tab === 5 && <IssuedCertificates courses={rules} onError={setError} onSuccess={notify} />}
        </Stack>
    );
};

const Overview = ({ rules, exams, onNavigate }: { rules: CertificateRuleRow[]; exams: FinalExamSettings[]; onNavigate: (tab: number) => void }) => {
    const metrics = [
        ['Certification courses', rules.filter((row) => row.rule.isEnabled).length, 1],
        ['Active final exams', exams.filter((exam) => exam.status === 'active').length, 2],
        ['Question bank items', exams.reduce((sum, exam) => sum + (exam.questionBankCount || 0), 0), 3],
        ['Courses needing exam setup', exams.filter((exam) => exam.questionBankCount && exam.questionBankCount < exam.randomQuestionCount).length, 2],
    ];
    return <Grid container spacing={2}>{metrics.map(([label, value, target]) => (
        <Grid key={String(label)} size={{ xs: 12, sm: 6, lg: 3 }}><Paper sx={{ p: 3 }}><Typography color="text.secondary">{label}</Typography><Typography variant="h3" fontWeight={800}>{value}</Typography><Button size="small" onClick={() => onNavigate(Number(target))}>Manage</Button></Paper></Grid>
    ))}</Grid>;
};

interface CommonProps { busy: string | null; setBusy: (value: string | null) => void; onError: (value: string) => void; onSuccess: (value: string) => void }
const CourseRules = ({ rules, setRules, busy, setBusy, onError, onSuccess }: CommonProps & { rules: CertificateRuleRow[]; setRules: React.Dispatch<React.SetStateAction<CertificateRuleRow[]>> }) => {
    const patch = (id: string, values: Partial<CertificateRuleRow['rule']>) => setRules((current) => current.map((row) => row.course._id === id ? { ...row, rule: { ...row.rule, ...values } } : row));
    const save = async (row: CertificateRuleRow) => {
        setBusy(row.course._id);
        try { await updateCertificateRuleAdmin(row.course._id, row.rule); onSuccess(`Saved ${row.course.title} rules.`); }
        catch (err) { onError(message(err, 'Failed to save rules.')); } finally { setBusy(null); }
    };
    return <Paper sx={{ p: 2, overflow: 'auto' }}><Table size="small"><TableHead><TableRow>
        <TableCell>Course</TableCell><TableCell>Enabled</TableCell><TableCell>Read only</TableCell><TableCell>Final assessment</TableCell><TableCell>Pass %</TableCell><TableCell>Completion %</TableCell><TableCell>Module quizzes</TableCell><TableCell>Quiz %</TableCell><TableCell>Daily practice</TableCell><TableCell />
    </TableRow></TableHead><TableBody>{rules.map((row) => <TableRow key={row.course._id}>
        <TableCell>{row.course.title} {!row.course.isPublished && <Chip size="small" label="Draft" />}</TableCell>
        <TableCell><Switch checked={row.rule.isEnabled} onChange={(_, value) => patch(row.course._id, { isEnabled: value })} /></TableCell>
        <TableCell><Switch checked={row.rule.readOnlyMode} onChange={(_, value) => patch(row.course._id, { readOnlyMode: value })} /></TableCell>
        <TableCell><Switch checked={row.rule.requireAssessment} onChange={(_, value) => patch(row.course._id, { requireAssessment: value })} /></TableCell>
        <TableCell><NumberField value={row.rule.passingScore} onChange={(value) => patch(row.course._id, { passingScore: value })} /></TableCell>
        <TableCell><NumberField value={row.rule.minimumCompletionPercent} onChange={(value) => patch(row.course._id, { minimumCompletionPercent: value })} /></TableCell>
        <TableCell><Switch checked={row.rule.requireModuleQuizzes} onChange={(_, value) => patch(row.course._id, { requireModuleQuizzes: value })} /></TableCell>
        <TableCell><NumberField value={row.rule.minimumModuleQuizScore} onChange={(value) => patch(row.course._id, { minimumModuleQuizScore: value })} /></TableCell>
        <TableCell><Switch checked={row.rule.requireDailySubmissions} onChange={(_, value) => patch(row.course._id, { requireDailySubmissions: value })} /></TableCell>
        <TableCell><Button startIcon={<SaveIcon />} disabled={busy === row.course._id} onClick={() => void save(row)}>Save</Button></TableCell>
    </TableRow>)}</TableBody></Table></Paper>;
};
const NumberField = ({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) =>
    <TextField size="small" type="number" value={value} inputProps={{ min, max }} onChange={(event) => onChange(Number(event.target.value))} sx={{ width: 82 }} />;

const FinalExams = ({ exams, setExams, busy, setBusy, onError, onSuccess }: CommonProps & { exams: FinalExamSettings[]; setExams: React.Dispatch<React.SetStateAction<FinalExamSettings[]>> }) => {
    const [attempts, setAttempts] = useState<FinalExamAttemptRow[]>([]);
    const [attemptCourseId, setAttemptCourseId] = useState('');
    const patch = (id: string, values: Partial<FinalExamSettings>) => setExams((current) => current.map((exam) => exam.courseId === id ? { ...exam, ...values } : exam));
    useEffect(() => {
        if (!attemptCourseId && exams[0]) setAttemptCourseId(exams[0].courseId);
    }, [attemptCourseId, exams]);
    useEffect(() => {
        if (!attemptCourseId) return;
        getFinalExamAttemptsAdmin({ page: 1, limit: 20, courseId: attemptCourseId }).then((data) => setAttempts(data.attempts)).catch(() => undefined);
    }, [attemptCourseId]);
    const save = async (exam: FinalExamSettings) => {
        if (exam.randomQuestionCount < 80 || exam.randomQuestionCount > 100) { onError('Random question count must be 80–100.'); return; }
        setBusy(exam.courseId);
        try { const updated = await updateFinalExamSettingsAdmin(exam.courseId, exam); patch(exam.courseId, { ...updated, courseTitle: exam.courseTitle }); onSuccess(`Saved ${exam.courseTitle} final exam.`); }
        catch (err) { onError(message(err, 'Failed to save exam.')); } finally { setBusy(null); }
    };
    return <Stack spacing={2}>
        {exams.map((exam) => <Paper key={exam.courseId} sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Box><Typography variant="h6">{exam.courseTitle}</Typography><Chip size="small" color={exam.status === 'active' ? 'success' : 'default'} label={exam.status} /></Box>
                <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
                    <FormControl size="small" sx={{ width: 110 }}><InputLabel>Status</InputLabel><Select label="Status" value={exam.status} onChange={(event) => patch(exam.courseId, { status: event.target.value as 'active' | 'draft' })}><MenuItem value="draft">Draft</MenuItem><MenuItem value="active">Active</MenuItem></Select></FormControl>
                    <LabeledNumber label="Questions" value={exam.randomQuestionCount} min={80} max={100} onChange={(value) => patch(exam.courseId, { randomQuestionCount: value })} />
                    <LabeledNumber label="Pass %" value={exam.passingScore} onChange={(value) => patch(exam.courseId, { passingScore: value })} />
                    <LabeledNumber label="Minutes" value={exam.timeLimitMinutes} min={1} max={600} onChange={(value) => patch(exam.courseId, { timeLimitMinutes: value })} />
                    <LabeledNumber label="Attempts" value={exam.maxAttempts} min={1} max={20} onChange={(value) => patch(exam.courseId, { maxAttempts: value })} />
                    <LabeledNumber label="Cooldown h" value={exam.cooldownHours} min={0} max={720} onChange={(value) => patch(exam.courseId, { cooldownHours: value })} />
                    {(['shuffleQuestions', 'shuffleOptions', 'allowReview', 'unlockOnRequirementsMet'] as const).map((key) => <FormControlLabel key={key} control={<Switch checked={exam[key]} onChange={(_, value) => patch(exam.courseId, { [key]: value })} />} label={{ shuffleQuestions: 'Shuffle questions', shuffleOptions: 'Shuffle options', allowReview: 'Post-submit review', unlockOnRequirementsMet: 'Auto unlock' }[key]} />)}
                    <Button variant="contained" disabled={busy === exam.courseId} onClick={() => void save(exam)}>Save</Button>
                </Stack>
            </Stack>
        </Paper>)}
        <Paper sx={{ p: 2, overflow: 'auto' }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}><Typography variant="h6">Recent attempts</Typography><TextField select size="small" label="Course" value={attemptCourseId} onChange={(event) => setAttemptCourseId(event.target.value)} sx={{ minWidth: 220 }}>{exams.map((exam) => <MenuItem key={exam.courseId} value={exam.courseId}>{exam.courseTitle}</MenuItem>)}</TextField></Stack><Table size="small"><TableHead><TableRow><TableCell>Learner</TableCell><TableCell>Attempt</TableCell><TableCell>Status</TableCell><TableCell>Score</TableCell><TableCell>Started</TableCell></TableRow></TableHead><TableBody>{attempts.map((attempt) => <TableRow key={attempt._id}><TableCell>{attempt.learnerName}<br /><Typography variant="caption">{attempt.learnerEmail}</Typography></TableCell><TableCell>{attempt.attemptNumber}</TableCell><TableCell><Chip size="small" label={attempt.status} /></TableCell><TableCell>{attempt.score ?? '—'}</TableCell><TableCell>{new Date(attempt.startedAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></Paper>
    </Stack>;
};
const LabeledNumber = ({ label, ...props }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) =>
    <TextField label={label} size="small" type="number" value={props.value} inputProps={{ min: props.min ?? 0, max: props.max ?? 100 }} onChange={(event) => props.onChange(Number(event.target.value))} sx={{ width: 100 }} />;

const emptyQuestion: FinalExamQuestionInput = { stableKey: '', question: '', options: ['', ''], correctOption: 0, difficulty: 'medium', points: 1, active: true };
const QuestionBank = ({ courses, onError, onSuccess }: { courses: FinalExamSettings[]; onError: (value: string) => void; onSuccess: (value: string) => void }) => {
    const [courseId, setCourseId] = useState('');
    const [search, setSearch] = useState(''); const [difficulty, setDifficulty] = useState('');
    const [category, setCategory] = useState(''); const [active, setActive] = useState('');
    const [rows, setRows] = useState<FinalExamQuestion[]>([]); const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0); const [dialog, setDialog] = useState(false);
    const [editing, setEditing] = useState<FinalExamQuestion | null>(null); const [form, setForm] = useState<FinalExamQuestionInput>(emptyQuestion);
    const load = useCallback(async () => {
        try { const data = await getFinalExamQuestionsAdmin({ page: page + 1, limit: 25, courseId: courseId || undefined, search: search || undefined, difficulty: difficulty || undefined, category: category || undefined, active: active || undefined }); setRows(data.questions); setTotal(data.pagination.total); }
        catch (err) { onError(message(err, 'Failed to load questions.')); }
    }, [active, category, courseId, difficulty, onError, page, search]);
    useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);
    const save = async () => {
        if (!courseId) { onError('Select a course first.'); return; }
        if (!form.stableKey.trim() || !form.question.trim() || form.options.filter(Boolean).length < 2) { onError('Stable key, question, and at least two options are required.'); return; }
        try {
            if (editing) await updateFinalExamQuestionAdmin(courseId, editing._id, form); else await createFinalExamQuestionAdmin({ ...form, courseId });
            setEditing(null); setForm(emptyQuestion); onSuccess('Question saved.'); await load();
        } catch (err) { onError(message(err, 'Failed to save question.')); }
    };
    const exportBank = async () => {
        try {
            const blob = await exportFinalExamQuestionsAdmin({ courseId: courseId || undefined, search: search || undefined, category: category || undefined, difficulty: difficulty || undefined, active: active || undefined });
            downloadBlob(blob, 'final-exam-question-bank.csv');
        } catch {
            downloadBlob(new Blob([`\uFEFF${questionsToFinalExamCsv(rows)}`], { type: 'text/csv;charset=utf-8' }), 'final-exam-question-bank.csv');
            onSuccess('The server export was unavailable; exported the visible validated page.');
        }
    };
    return <Stack spacing={2}>
        <Paper sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
            <FormControl size="small" sx={{ minWidth: 240 }}><InputLabel>Course</InputLabel><Select label="Course" value={courseId} onChange={(event) => { setCourseId(event.target.value); setPage(0); }}><MenuItem value="">All courses</MenuItem>{courses.map((course) => <MenuItem key={course.courseId} value={course.courseId}>{course.courseTitle}</MenuItem>)}</Select></FormControl>
            <TextField size="small" label="Search key or question" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            <TextField size="small" label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }} />
            <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Difficulty</InputLabel><Select label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="easy">Easy</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="hard">Hard</MenuItem></Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 110 }}><InputLabel>Active</InputLabel><Select label="Active" value={active} onChange={(event) => setActive(event.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></Select></FormControl>
            <Button startIcon={<UploadFileIcon />} disabled={!courseId} onClick={() => setDialog(true)}>Import CSV</Button>
            <Button startIcon={<DownloadIcon />} disabled={!rows.length} onClick={() => void exportBank()}>Export bank</Button>
            <Button variant="contained" disabled={!courseId} onClick={() => { setEditing(null); setForm(emptyQuestion); }}>New question</Button>
        </Stack></Paper>
        {courseId && <QuestionEditor form={form} setForm={setForm} editing={editing} onSave={() => void save()} />}
        <Paper sx={{ overflow: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Stable key</TableCell><TableCell>Question</TableCell><TableCell>Category</TableCell><TableCell>Difficulty</TableCell><TableCell>Points</TableCell><TableCell>Active</TableCell><TableCell /></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row._id}><TableCell>{row.stableKey}</TableCell><TableCell>{row.question}</TableCell><TableCell>{row.category || '—'}</TableCell><TableCell>{row.difficulty}</TableCell><TableCell>{row.points}</TableCell><TableCell>{row.active ? 'Yes' : 'No'}</TableCell><TableCell><Button size="small" onClick={() => { setEditing(row); setForm(row); }}>Edit</Button><Button size="small" color="error" onClick={async () => { if (window.confirm('Delete this question?')) { await deleteFinalExamQuestionAdmin(courseId, row._id); await load(); } }}>Delete</Button></TableCell></TableRow>)}</TableBody></Table><TablePagination component="div" count={total} page={page} rowsPerPage={25} rowsPerPageOptions={[25]} onPageChange={(_, value) => setPage(value)} /></Paper>
        <FinalExamCsvImportDialog open={dialog} onClose={() => setDialog(false)} onImport={async (mode, questions) => { await importFinalExamQuestionsAdmin(courseId, mode, questions); onSuccess('Question bank imported.'); await load(); }} />
    </Stack>;
};
const QuestionEditor = ({ form, setForm, editing, onSave }: { form: FinalExamQuestionInput; setForm: React.Dispatch<React.SetStateAction<FinalExamQuestionInput>>; editing: FinalExamQuestion | null; onSave: () => void }) =>
    <Paper sx={{ p: 2 }}><Typography variant="h6">{editing ? 'Edit question' : 'Create question'}</Typography><Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Stable key" value={form.stableKey} onChange={(event) => setForm({ ...form, stableKey: event.target.value })} /></Grid>
        <Grid size={{ xs: 12, md: 9 }}><TextField fullWidth label="Question" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} /></Grid>
        {Array.from({ length: 6 }, (_, index) => <Grid key={index} size={{ xs: 12, md: 4 }}><TextField fullWidth label={`Option ${index + 1}`} value={form.options[index] || ''} onChange={(event) => { const options = [...form.options]; options[index] = event.target.value; setForm({ ...form, options }); }} /></Grid>)}
        <Grid size={{ xs: 6, md: 2 }}><NumberField value={form.correctOption + 1} min={1} max={6} onChange={(value) => setForm({ ...form, correctOption: value - 1 })} /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><NumberField value={form.points} min={1} max={100} onChange={(value) => setForm({ ...form, points: value })} /></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField select fullWidth label="Difficulty" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as FinalExamQuestionInput['difficulty'] })}><MenuItem value="easy">Easy</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="hard">Hard</MenuItem></TextField></Grid>
        <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Category" value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><FormControlLabel control={<Switch checked={form.active} onChange={(_, value) => setForm({ ...form, active: value })} />} label="Active" /></Grid>
        <Grid size={12}><TextField fullWidth multiline label="Explanation" value={form.explanation || ''} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></Grid>
        <Grid size={12}><Button variant="contained" onClick={onSave}>Save question</Button></Grid>
    </Grid></Paper>;

const NumberingBranding = ({ onError, onSuccess }: { onError: (value: string) => void; onSuccess: (value: string) => void }) => {
    const [templates, setTemplates] = useState<CertificateNumberingTemplate[]>([]);
    const [branding, setBranding] = useState<CertificateBranding | null>(null);
    useEffect(() => { Promise.all([getCertificateNumberingAdmin(), getCertificateBrandingAdmin()]).then(([numbering, brand]) => { setTemplates(numbering); setBranding(brand); }).catch((err) => onError(message(err, 'Failed to load numbering and branding.'))); }, [onError]);
    const preview = (item: CertificateNumberingTemplate) => [item.prefix, item.includeYear ? new Date().getFullYear() : '', String(item.nextSequence).padStart(item.padding, '0')].filter(String).join(item.separator);
    const patch = (type: string, values: Partial<CertificateNumberingTemplate>) => setTemplates((current) => current.map((item) => item.type === type ? { ...item, ...values } : item));
    return <Stack spacing={2}>
        <Grid container spacing={2}>{templates.map((item) => <Grid key={item.type} size={{ xs: 12, md: 6 }}><Paper sx={{ p: 2 }}><Typography variant="h6" textTransform="capitalize">{item.type} numbering</Typography><Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField label="Prefix" value={item.prefix} onChange={(event) => patch(item.type, { prefix: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} />
            <TextField label="Separator" value={item.separator} inputProps={{ maxLength: 2 }} onChange={(event) => patch(item.type, { separator: event.target.value })} />
            <LabeledNumber label="Padding" value={item.padding} min={3} max={12} onChange={(value) => patch(item.type, { padding: value })} />
            <TextField label="Next sequence preview" type="number" value={item.nextSequence} disabled helperText="The server counter advances atomically." />
            <FormControlLabel control={<Switch checked={item.includeYear} onChange={(_, value) => patch(item.type, { includeYear: value })} />} label="Include year" />
            <TextField select label="Sequence reset" value={item.reset} onChange={(event) => patch(item.type, { reset: event.target.value as 'never' | 'yearly' })}><MenuItem value="never">Never</MenuItem><MenuItem value="yearly">Yearly</MenuItem></TextField>
            <Alert severity="info">Live preview: <strong>{preview(item)}</strong></Alert>
            <Button variant="contained" onClick={async () => { if (!item.prefix || !item.separator || item.padding < 3) { onError('Prefix, separator, and padding of at least 3 are required.'); return; } await updateCertificateNumberingAdmin(item.type, item); onSuccess(`${item.type} numbering saved.`); }}>Save template</Button>
        </Stack></Paper></Grid>)}</Grid>
        {branding && <Paper sx={{ p: 2 }}><Typography variant="h6">Certificate branding</Typography><Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Signatory name" value={branding.signatoryName} onChange={(event) => setBranding({ ...branding, signatoryName: event.target.value })} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Signatory title" value={branding.signatoryTitle} onChange={(event) => setBranding({ ...branding, signatoryTitle: event.target.value })} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Issuer tagline" value={branding.issuerTagline} onChange={(event) => setBranding({ ...branding, issuerTagline: event.target.value })} /></Grid>
            <Grid size={12}><Stack direction="row" gap={1} flexWrap="wrap">
                <Button component="label" startIcon={<UploadFileIcon />}>Upload signature<input hidden type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) setBranding(await uploadCertificateSignatureAdmin(file)); }} /></Button>
                <Button component="label" startIcon={<UploadFileIcon />}>Upload logo<input hidden type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) setBranding(await uploadCertificateLogoAdmin(file)); }} /></Button>
                <Button variant="contained" onClick={async () => { setBranding(await updateCertificateBrandingAdmin(branding)); onSuccess('Branding saved.'); }}>Save branding</Button>
                <Button onClick={async () => downloadBlob(await fetchDemoCertificatePdf(true), 'certificate-demo.pdf')}>Download preview</Button>
            </Stack></Grid>
        </Grid></Paper>}
    </Stack>;
};

const IssuedCertificates = ({ courses, onError, onSuccess }: { courses: CertificateRuleRow[]; onError: (value: string) => void; onSuccess: (value: string) => void }) => {
    const [filters, setFilters] = useState<IssuedCertificateFilters>({ page: 1, limit: 25 });
    const [rows, setRows] = useState<IssuedCertificateRow[]>([]); const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<IssuedCertificateRow | null>(null);
    const [manualOpen, setManualOpen] = useState(false); const [manual, setManual] = useState({ userId: '', type: 'course' as 'course' | 'module', courseId: '', moduleId: '', reason: '' });
    const query = useMemo(() => filters, [filters]);
    const load = useCallback(async () => { try { const data = await getIssuedCertificatesAdmin(query); setRows(data.certificates); setTotal(data.pagination.total); } catch (err) { onError(message(err, 'Failed to load certificates.')); } }, [onError, query]);
    useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);
    const patchFilter = (values: Partial<IssuedCertificateFilters>) => setFilters((current) => ({ ...current, page: 1, ...values }));
    const statusAction = async (row: IssuedCertificateRow) => {
        const reason = window.prompt(row.status === 'revoked' ? 'Reason for reinstating this certificate:' : 'Reason for revocation:');
        if (!reason?.trim()) return;
        try { if (row.status === 'revoked') await unrevokeCertificateAdmin(row._id, reason); else await revokeCertificateAdmin(row._id, reason); onSuccess('Certificate status updated.'); await load(); } catch (err) { onError(message(err, 'Status update failed.')); }
    };
    return <Stack spacing={2}>
        <Paper sx={{ p: 2 }}><Stack direction="row" gap={1} flexWrap="wrap">
            <TextField size="small" label="Learner, email, or number" value={filters.search || ''} onChange={(event) => patchFilter({ search: event.target.value })} />
            <TextField select size="small" label="Type" value={filters.type || ''} onChange={(event) => patchFilter({ type: event.target.value as IssuedCertificateFilters['type'] })} sx={{ minWidth: 120 }}><MenuItem value="">All</MenuItem><MenuItem value="course">Course</MenuItem><MenuItem value="module">Module</MenuItem></TextField>
            <TextField select size="small" label="Course" value={filters.courseId || ''} onChange={(event) => patchFilter({ courseId: event.target.value })} sx={{ minWidth: 200 }}><MenuItem value="">All</MenuItem>{courses.map((row) => <MenuItem key={row.course._id} value={row.course._id}>{row.course.title}</MenuItem>)}</TextField>
            <TextField size="small" label="Module ID" value={filters.moduleId || ''} onChange={(event) => patchFilter({ moduleId: event.target.value })} />
            <TextField select size="small" label="Status" value={filters.status || ''} onChange={(event) => patchFilter({ status: event.target.value as IssuedCertificateFilters['status'] })} sx={{ minWidth: 120 }}><MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="revoked">Revoked</MenuItem></TextField>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.dateFrom || ''} onChange={(event) => patchFilter({ dateFrom: event.target.value })} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.dateTo || ''} onChange={(event) => patchFilter({ dateTo: event.target.value })} />
            <Button startIcon={<DownloadIcon />} onClick={async () => downloadBlob(await exportIssuedCertificatesAdmin(filters), 'issued-certificates.csv')}>Export CSV</Button>
            <Button variant="contained" onClick={() => setManualOpen(true)}>Manual issue</Button>
        </Stack></Paper>
        <Paper sx={{ overflow: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Certificate</TableCell><TableCell>Learner</TableCell><TableCell>Credential</TableCell><TableCell>Status</TableCell><TableCell>Issued</TableCell><TableCell /></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row._id}><TableCell>{row.certificateNumber}<br /><Typography variant="caption">{row.type || 'course'}</Typography></TableCell><TableCell>{row.userName}<br /><Typography variant="caption">{row.userEmail}</Typography></TableCell><TableCell>{row.moduleTitle || row.courseTitle}</TableCell><TableCell><Chip size="small" color={row.status === 'revoked' ? 'error' : 'success'} label={row.status || 'active'} /></TableCell><TableCell>{new Date(row.issuedAt).toLocaleDateString()}</TableCell><TableCell><Button size="small" onClick={() => setSelected(row)}>Details</Button><Button size="small" onClick={() => void statusAction(row)}>{row.status === 'revoked' ? 'Unrevoke' : 'Revoke'}</Button><Button size="small" onClick={async () => { await regenerateCertificatePdfAdmin(row._id); onSuccess('PDF regenerated.'); await load(); }}>Regenerate</Button></TableCell></TableRow>)}</TableBody></Table><TablePagination component="div" count={total} page={filters.page - 1} rowsPerPage={filters.limit} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, value) => setFilters({ ...filters, page: value + 1 })} onRowsPerPageChange={(event) => setFilters({ ...filters, page: 1, limit: Number(event.target.value) })} /></Paper>
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Certificate details</DialogTitle>
            <DialogContent dividers>
                {selected && (
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{selected.certificateNumber}</Typography>
                            <Typography variant="body2" color="text.secondary">{selected.userName} · {selected.userEmail}</Typography>
                            <Typography sx={{ mt: 0.75 }}>{selected.moduleTitle || selected.courseTitle}</Typography>
                            {selected.moduleTitle && (
                                <Typography variant="body2" color="text.secondary">{selected.courseTitle}</Typography>
                            )}
                        </Box>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            <Chip size="small" label={(selected.type || 'course').toUpperCase()} variant="outlined" />
                            <Chip size="small" color={selected.status === 'revoked' ? 'error' : 'success'} label={selected.status || 'active'} />
                            <Chip size="small" variant="outlined" label={`Issued ${new Date(selected.issuedAt).toLocaleDateString()}`} />
                        </Stack>
                        {selected.verificationCode && (
                            <SnapshotField label="Verification code" value={selected.verificationCode} />
                        )}
                        {selected.revokedReason && (
                            <Alert severity="warning">Revocation reason: {selected.revokedReason}</Alert>
                        )}
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Eligibility summary</Typography>
                            <EligibilitySnapshotView snapshot={selected.eligibilitySnapshot} />
                        </Box>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSelected(null)}>Close</Button>
                {selected?.pdfUrl && <Button href={selected.pdfUrl} target="_blank">Open PDF</Button>}
            </DialogActions>
        </Dialog>
        <Dialog open={manualOpen} onClose={() => setManualOpen(false)}><DialogTitle>Manually issue certificate</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1, minWidth: 380 }}><TextField label="Learner user ID" value={manual.userId} onChange={(event) => setManual({ ...manual, userId: event.target.value })} /><TextField select label="Type" value={manual.type} onChange={(event) => setManual({ ...manual, type: event.target.value as 'course' | 'module' })}><MenuItem value="course">Course</MenuItem><MenuItem value="module">Module</MenuItem></TextField><TextField select label="Course" value={manual.courseId} onChange={(event) => setManual({ ...manual, courseId: event.target.value })}>{courses.map((row) => <MenuItem key={row.course._id} value={row.course._id}>{row.course.title}</MenuItem>)}</TextField>{manual.type === 'module' && <TextField label="Module ID" value={manual.moduleId} onChange={(event) => setManual({ ...manual, moduleId: event.target.value })} />}<TextField required multiline label="Administrative reason" value={manual.reason} onChange={(event) => setManual({ ...manual, reason: event.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setManualOpen(false)}>Cancel</Button><Button variant="contained" disabled={!manual.userId || (manual.type === 'course' ? !manual.courseId : !manual.moduleId) || !manual.reason.trim()} onClick={async () => { await issueCertificateAdmin(manual); setManualOpen(false); onSuccess('Certificate issued.'); await load(); }}>Issue</Button></DialogActions></Dialog>
    </Stack>;
};

export default AdminCertificationManagementPage;
