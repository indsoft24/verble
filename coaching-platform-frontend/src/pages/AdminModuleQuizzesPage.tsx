import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
    FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AdminLayout from '../components/layout/AdminLayout';
import AdminModuleQuizBulkDialog from '../components/admin/AdminModuleQuizBulkDialog';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getModulesForCourseAdmin, type Module } from '../services/moduleAdminService';
import {
    createModuleQuizAdmin,
    getModuleQuizByModuleAdmin,
    importModuleQuizAdmin,
    updateModuleQuizAdmin,
    type QuizQuestionInput,
} from '../services/moduleQuizAdminService';
import type { ModuleQuizImportPayload } from '../utils/moduleQuizBulkCsv';

const DEFAULT_OPTION_COUNT = 4;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const padOptions = (options: string[]): string[] => {
    const padded = [...options];
    while (padded.length < DEFAULT_OPTION_COUNT) padded.push('');
    return padded.slice(0, MAX_OPTIONS);
};

const normalizeQuestion = (q: QuizQuestionInput): QuizQuestionInput => {
    const options = padOptions(q.options?.length ? q.options : ['', '']);
    let correctAnswer = q.correctAnswer ?? 0;
    if (correctAnswer >= options.length) correctAnswer = 0;
    return { ...q, options, correctAnswer };
};

const emptyQuestion = (): QuizQuestionInput =>
    normalizeQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        points: 1,
    });

const AdminModuleQuizzesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
    const [moduleId, setModuleId] = useState(searchParams.get('moduleId') || '');
    const [quizId, setQuizId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [passingScore, setPassingScore] = useState(70);
    const [isActive, setIsActive] = useState(true);
    const [questions, setQuestions] = useState<QuizQuestionInput[]>([emptyQuestion()]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);

    useEffect(() => {
        getAllCoursesAdmin().then(setCourses).catch(() => setError('Failed to load courses'));
    }, []);

    useEffect(() => {
        if (!courseId) {
            setModules([]);
            return;
        }
        getModulesForCourseAdmin(courseId).then(setModules).catch(() => setError('Failed to load modules'));
    }, [courseId]);

    const loadQuiz = useCallback(async () => {
        if (!moduleId) {
            setQuizId(null);
            setTitle('');
            setDescription('');
            setQuestions([emptyQuestion()]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const quiz = await getModuleQuizByModuleAdmin(moduleId);
            if (quiz) {
                setQuizId(quiz._id);
                setTitle(quiz.title);
                setDescription(quiz.description || '');
                setPassingScore(quiz.passingScore);
                setIsActive(quiz.isActive);
                setQuestions(
                    quiz.questions.length
                        ? quiz.questions.map(normalizeQuestion)
                        : [emptyQuestion()]
                );
            } else {
                setQuizId(null);
                setTitle('');
                setDescription('');
                setPassingScore(70);
                setIsActive(true);
                setQuestions([emptyQuestion()]);
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        void loadQuiz();
    }, [loadQuiz]);

    const updateQuestion = (index: number, patch: Partial<QuizQuestionInput>) => {
        setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex) return q;
                const options = [...q.options];
                options[optIndex] = value;
                return { ...q, options };
            })
        );
    };

    const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
    const removeQuestion = (index: number) =>
        setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

    const removeOption = (qIndex: number, optIndex: number) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex || q.options.length <= MIN_OPTIONS) return q;
                const options = q.options.filter((_, oi) => oi !== optIndex);
                let correctAnswer = q.correctAnswer;
                if (correctAnswer === optIndex) correctAnswer = 0;
                else if (correctAnswer > optIndex) correctAnswer -= 1;
                return { ...q, options, correctAnswer };
            })
        );
    };

    const addOption = (qIndex: number) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex || q.options.length >= MAX_OPTIONS) return q;
                return { ...q, options: [...q.options, ''] };
            })
        );
    };

    const handleSave = async () => {
        if (!moduleId || !title.trim()) {
            setError('Select a module and enter a quiz title.');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload = {
                title: title.trim(),
                description,
                questions: questions.map((q) => {
                    const pairs = q.options
                        .map((o, idx) => ({ text: o.trim(), idx }))
                        .filter((p) => p.text);
                    const options = pairs.map((p) => p.text);
                    const found = pairs.findIndex((p) => p.idx === q.correctAnswer);
                    return {
                        ...q,
                        options,
                        correctAnswer: found >= 0 ? found : 0,
                    };
                }),
                passingScore,
                isActive,
            };
            if (quizId) {
                await updateModuleQuizAdmin(quizId, payload);
                setSuccess('Quiz updated.');
            } else {
                const created = await createModuleQuizAdmin({ moduleId, ...payload });
                setQuizId(created._id);
                setSuccess('Quiz created.');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to save quiz');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Module Quizzes">
            <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

                <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        One multiple-choice quiz per module. Learners see it after watching all module videos.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                label="Course"
                                value={courseId}
                                onChange={(e) => {
                                    setCourseId(e.target.value);
                                    setModuleId('');
                                    setSearchParams({});
                                }}
                            >
                                <MenuItem value="">Select course</MenuItem>
                                {courses.map((c) => (
                                    <MenuItem key={c._id} value={c._id}>
                                        {c.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" disabled={!courseId}>
                            <InputLabel>Module</InputLabel>
                            <Select
                                label="Module"
                                value={moduleId}
                                onChange={(e) => {
                                    setModuleId(e.target.value);
                                    setSearchParams({ courseId, moduleId: e.target.value });
                                }}
                            >
                                <MenuItem value="">Select module</MenuItem>
                                {modules.map((m) => (
                                    <MenuItem key={m._id} value={m._id}>
                                        {m.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {moduleId && !loading && (
                    <Paper sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField label="Quiz title" fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} />
                            <TextField
                                label="Description"
                                fullWidth
                                size="small"
                                multiline
                                minRows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Passing score %"
                                    type="number"
                                    size="small"
                                    value={passingScore}
                                    onChange={(e) => setPassingScore(Number(e.target.value))}
                                    inputProps={{ min: 0, max: 100 }}
                                    sx={{ width: 140 }}
                                />
                                <FormControlLabel
                                    control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                                    label="Active"
                                />
                            </Stack>

                            <Typography variant="subtitle1" fontWeight={600}>
                                Questions
                            </Typography>
                            {questions.map((q, qIndex) => (
                                <Paper key={qIndex} variant="outlined" sx={{ p: 2 }}>
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight={600}>Question {qIndex + 1}</Typography>
                                            <IconButton size="small" onClick={() => removeQuestion(qIndex)} aria-label="Remove question">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                        <TextField
                                            label="Question"
                                            fullWidth
                                            size="small"
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                                        />
                                        {q.options.map((opt, optIndex) => (
                                            <Stack key={optIndex} direction="row" spacing={1} alignItems="center">
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={q.correctAnswer === optIndex}
                                                            onChange={() => updateQuestion(qIndex, { correctAnswer: optIndex })}
                                                        />
                                                    }
                                                    label="Correct"
                                                    sx={{ mr: 0, minWidth: 88 }}
                                                />
                                                <TextField
                                                    label={`Option ${optIndex + 1}`}
                                                    fullWidth
                                                    size="small"
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                                />
                                                <IconButton
                                                    size="small"
                                                    aria-label={`Remove option ${optIndex + 1}`}
                                                    onClick={() => removeOption(qIndex, optIndex)}
                                                    disabled={q.options.length <= MIN_OPTIONS}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ))}
                                        <Button
                                            size="small"
                                            onClick={() => addOption(qIndex)}
                                            disabled={q.options.length >= MAX_OPTIONS}
                                        >
                                            Add option
                                        </Button>
                                        <TextField
                                            label="Explanation (optional)"
                                            fullWidth
                                            size="small"
                                            value={q.explanation || ''}
                                            onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                            <Button startIcon={<AddIcon />} onClick={addQuestion}>
                                Add question
                            </Button>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                    variant="outlined"
                                    startIcon={<UploadFileIcon />}
                                    onClick={() => setBulkOpen(true)}
                                >
                                    Import from CSV
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => void handleSave()}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving…' : quizId ? 'Update quiz' : 'Create quiz'}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                )}
            </Stack>

            <AdminModuleQuizBulkDialog
                open={bulkOpen}
                moduleTitle={modules.find((m) => m._id === moduleId)?.title}
                onClose={() => setBulkOpen(false)}
                onImport={async (payload: ModuleQuizImportPayload) => {
                    if (!moduleId) return;
                    const result = await importModuleQuizAdmin(moduleId, payload);
                    setQuizId(result.quiz._id);
                    setTitle(result.quiz.title);
                    setDescription(result.quiz.description || '');
                    setPassingScore(result.quiz.passingScore);
                    setIsActive(result.quiz.isActive);
                    setQuestions(result.quiz.questions.map(normalizeQuestion));
                    setSuccess(result.created ? 'Quiz imported (created).' : 'Quiz imported (updated).');
                    setBulkOpen(false);
                }}
            />
        </AdminLayout>
    );
};

export default AdminModuleQuizzesPage;
