import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Paper,
    Step,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';
import {
    MODULE_QUIZ_COLUMNS,
    moduleQuizTemplateCsv,
    validateModuleQuizCsv,
    type ModuleQuizImportPayload,
} from '../../utils/moduleQuizBulkCsv';

const STEPS = ['Guide', 'Template & columns', 'Upload & validate', 'Import'];

export interface AdminModuleQuizBulkDialogProps {
    open: boolean;
    moduleTitle?: string;
    onClose: () => void;
    onImport: (payload: ModuleQuizImportPayload) => Promise<void>;
}

const AdminModuleQuizBulkDialog: React.FC<AdminModuleQuizBulkDialogProps> = ({
    open,
    moduleTitle,
    onClose,
    onImport,
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvRaw, setCsvRaw] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [payload, setPayload] = useState<ModuleQuizImportPayload | null>(null);
    const [busy, setBusy] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const reset = () => {
        setActiveStep(0);
        setFileName(null);
        setCsvRaw(null);
        setErrors([]);
        setPayload(null);
        setImportError(null);
    };

    const handleClose = () => {
        if (busy) return;
        reset();
        onClose();
    };

    const downloadTemplate = () => {
        const blob = new Blob(['\uFEFF' + moduleQuizTemplateCsv()], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'verble-module-quiz-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFile = (file: File | null) => {
        setErrors([]);
        setPayload(null);
        setImportError(null);
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setErrors(['Please choose a .csv file.']);
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            setCsvRaw(text);
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleValidate = () => {
        setImportError(null);
        if (!csvRaw) {
            setErrors(['Upload a CSV file first.']);
            return;
        }
        const result = validateModuleQuizCsv(csvRaw);
        if (!result.ok) {
            setErrors(result.errors);
            setPayload(null);
            return;
        }
        setErrors([]);
        setPayload(result.payload);
        setActiveStep(3);
    };

    const handleImport = async () => {
        if (!payload) return;
        setBusy(true);
        setImportError(null);
        try {
            await onImport(payload);
            handleClose();
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setImportError(msg || (e instanceof Error ? e.message : 'Import failed.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Import module quiz from CSV</DialogTitle>
            <DialogContent dividers>
                {busy && <LinearProgress sx={{ mb: 2 }} />}
                {moduleTitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Module: <strong>{moduleTitle}</strong>
                    </Typography>
                )}
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && (
                    <Alert severity="info">
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            How it works
                        </Typography>
                        <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                            <li>Download the template (all columns included).</li>
                            <li>Fill one row per question. Put quiz title on the first row; later rows can leave quiz columns blank.</li>
                            <li>Mark the correct answer with <code>correct_option</code> (1 = first option, 2 = second, etc.).</li>
                            <li>Upload, validate, then import — this replaces the module quiz.</li>
                        </Box>
                    </Alert>
                )}

                {activeStep >= 1 && (
                    <>
                        <Typography variant="subtitle2" gutterBottom>
                            Columns
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 240 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Column</TableCell>
                                        <TableCell>Required</TableCell>
                                        <TableCell>Maps to form</TableCell>
                                        <TableCell>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {MODULE_QUIZ_COLUMNS.map((col) => (
                                        <TableRow key={col.key}>
                                            <TableCell>
                                                <code>{col.label}</code>
                                            </TableCell>
                                            <TableCell>{col.required ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>{col.formField || '—'}</TableCell>
                                            <TableCell>{col.hint || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="subtitle2" gutterBottom>
                            Example CSV
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                mb: 2,
                                bgcolor: 'grey.50',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: 11,
                                overflowX: 'auto',
                                whiteSpace: 'pre',
                            }}
                        >
                            {moduleQuizTemplateCsv()}
                        </Paper>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<GetAppIcon />}
                            onClick={downloadTemplate}
                            sx={{ mr: 1 }}
                        >
                            Download template
                        </Button>
                    </>
                )}

                {activeStep >= 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                            Choose CSV
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                hidden
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                        </Button>
                        {fileName && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'inline', ml: 1 }}>
                                {fileName}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button variant="contained" color="secondary" onClick={handleValidate} disabled={!csvRaw || busy}>
                                Validate
                            </Button>
                        </Box>
                    </Box>
                )}

                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {errors.map((err, i) => (
                                <li key={i}>
                                    <Typography variant="body2">{err}</Typography>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {payload && errors.length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Ready to import: &quot;{payload.title}&quot; with {payload.questions.length} question(s).
                    </Alert>
                )}

                {importError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {importError}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={busy}>
                    Cancel
                </Button>
                {activeStep < STEPS.length - 1 && (
                    <Button
                        variant="contained"
                        onClick={() => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))}
                        disabled={activeStep === 2 && !csvRaw}
                    >
                        Next
                    </Button>
                )}
                {activeStep === STEPS.length - 1 && payload && (
                    <Button variant="contained" onClick={() => void handleImport()} disabled={busy}>
                        Import quiz
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AdminModuleQuizBulkDialog;
