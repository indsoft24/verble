import React, { useState } from 'react';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
    InputLabel, MenuItem, Paper, Select, Step, StepLabel, Stepper, Table, TableBody,
    TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import {
    FINAL_EXAM_COLUMNS, finalExamTemplateCsv, validateFinalExamCsv,
    type FinalExamImportMode, type FinalExamQuestionInput,
} from '../../utils/finalExamCsv';

interface Props {
    open: boolean;
    onClose: () => void;
    onImport: (mode: FinalExamImportMode, questions: FinalExamQuestionInput[]) => Promise<void>;
}

const FinalExamCsvImportDialog: React.FC<Props> = ({ open, onClose, onImport }) => {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState<FinalExamImportMode>('upsert');
    const [questions, setQuestions] = useState<FinalExamQuestionInput[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const close = () => {
        if (busy) return;
        setStep(0); setQuestions([]); setErrors([]); setMode('upsert'); onClose();
    };
    const download = () => {
        const url = URL.createObjectURL(new Blob([`\uFEFF${finalExamTemplateCsv()}`], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url; link.download = 'verble-final-exam-question-bank.csv'; link.click();
        URL.revokeObjectURL(url);
    };
    const selectFile = (file?: File) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) { setErrors(['Choose a CSV file.']); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const result = validateFinalExamCsv(String(reader.result || ''));
            setErrors(result.errors); setQuestions(result.questions);
            if (result.ok) setStep(2);
        };
        reader.readAsText(file, 'UTF-8');
    };
    const submit = async () => {
        setBusy(true);
        try { await onImport(mode, questions); close(); }
        catch (error) {
            const responseError = error as { response?: { data?: { message?: string } } };
            setErrors([responseError.response?.data?.message || 'Import failed.']);
        } finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onClose={close} maxWidth="lg" fullWidth>
            <DialogTitle>Import final-exam question bank</DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={step} sx={{ mb: 3 }}>
                    {['Template', 'Validate', 'Preview & import'].map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>
                {step === 0 && (
                    <StackContent>
                        <Alert severity="info">Use one stable key per question. Upsert matches that key, so wording can change without creating duplicates.</Alert>
                        <Typography variant="body2">Required columns: {FINAL_EXAM_COLUMNS.join(', ')}</Typography>
                        <Button variant="outlined" onClick={download}>Download UTF-8 CSV template</Button>
                    </StackContent>
                )}
                {step === 1 && (
                    <StackContent>
                        <Button variant="outlined" component="label">
                            Choose and validate CSV
                            <input hidden type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0])} />
                        </Button>
                        {errors.length > 0 && <Alert severity="error"><Box component="ul" sx={{ m: 0 }}>{errors.map((error) => <li key={error}>{error}</li>)}</Box></Alert>}
                    </StackContent>
                )}
                {step === 2 && (
                    <StackContent>
                        <FormControl size="small" sx={{ width: 240 }}>
                            <InputLabel>Import mode</InputLabel>
                            <Select value={mode} label="Import mode" onChange={(event) => setMode(event.target.value as FinalExamImportMode)}>
                                <MenuItem value="append">Append only</MenuItem>
                                <MenuItem value="upsert">Upsert by stable key</MenuItem>
                                <MenuItem value="replace">Replace course bank</MenuItem>
                            </Select>
                        </FormControl>
                        {mode === 'replace' && <Alert severity="warning">Replace removes existing questions for the selected course before importing this validated bank.</Alert>}
                        <Typography>{questions.length} validated question(s)</Typography>
                        <Paper variant="outlined" sx={{ overflow: 'auto', maxHeight: 360 }}>
                            <Table size="small" stickyHeader>
                                <TableHead><TableRow><TableCell>Key</TableCell><TableCell>Question</TableCell><TableCell>Category</TableCell><TableCell>Difficulty</TableCell><TableCell>Points</TableCell></TableRow></TableHead>
                                <TableBody>{questions.slice(0, 100).map((question) => (
                                    <TableRow key={question.stableKey}><TableCell>{question.stableKey}</TableCell><TableCell>{question.question}</TableCell><TableCell>{question.category || '—'}</TableCell><TableCell>{question.difficulty}</TableCell><TableCell>{question.points}</TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        </Paper>
                        {errors.length > 0 && <Alert severity="error">{errors.join(' ')}</Alert>}
                    </StackContent>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={close} disabled={busy}>Cancel</Button>
                {step > 0 && <Button onClick={() => setStep((value) => value - 1)} disabled={busy}>Back</Button>}
                {step < 1 && <Button variant="contained" onClick={() => setStep(1)}>Next</Button>}
                {step === 2 && <Button variant="contained" onClick={() => void submit()} disabled={busy}>{busy ? 'Importing…' : 'Import'}</Button>}
            </DialogActions>
        </Dialog>
    );
};

const StackContent = ({ children }: { children: React.ReactNode }) => <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>;
export default FinalExamCsvImportDialog;
