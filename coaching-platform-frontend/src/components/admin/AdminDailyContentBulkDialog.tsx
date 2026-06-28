import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';
import { format } from 'date-fns';
import {
    getBulkSchema,
    parseCsvToObjects,
    schemaToExampleCsv,
    buildExampleCsvFromSchema,
    validateAndBuildPayloads,
    type BulkDailyContentType,
} from '../../utils/dailyContentBulkCsv';
import { DAILY_CONTENT_CATALOG, levelForAdminKey } from '../../utils/dailyContentTypeCatalog';
import {
    bulkCreateDailyContentAdminChunked,
    BULK_IMPORT_BATCH_SIZE,
    type BulkImportProgress,
    type CreateDailyContentPayload,
} from '../../services/dailyContentAdminService';

export interface AdminDailyContentBulkDialogProps {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
    calendarDate: Date | null;
}

const STEPS = ['Choose type', 'Columns & template', 'Upload & validate', 'Import'];

const AdminDailyContentBulkDialog: React.FC<AdminDailyContentBulkDialogProps> = ({
    open,
    onClose,
    onImported,
    calendarDate,
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [bulkType, setBulkType] = useState<BulkDailyContentType>('WORD');
    const bulkLevel = levelForAdminKey(bulkType);
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvRaw, setCsvRaw] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationNotes, setValidationNotes] = useState<string[]>([]);
    const [validatedPayloads, setValidatedPayloads] = useState<CreateDailyContentPayload[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState<BulkImportProgress | null>(null);
    const [busy, setBusy] = useState(false);

    const schema = bulkType && bulkLevel ? getBulkSchema(bulkType) : null;

    useEffect(() => {
        if (open) {
            setImportError(null);
            setImportSummary(null);
            setActiveStep(0);
        }
    }, [open]);

    const resetUpload = () => {
        setFileName(null);
        setCsvRaw(null);
        setValidationErrors([]);
        setValidationNotes([]);
        setValidatedPayloads(null);
        setParseError(null);
        setImportError(null);
        setImportSummary(null);
        setImportProgress(null);
    };

    const handleClose = () => {
        if (busy) return;
        resetUpload();
        setActiveStep(0);
        onClose();
    };

    const onTypeChange = () => {
        resetUpload();
        setActiveStep(0);
    };

    const handleDownloadTemplate = () => {
        if (!schema) return;
        const csv = schemaToExampleCsv(schema);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verble-bulk-${bulkType.toLowerCase()}-template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFile = (file: File | null) => {
        resetUpload();
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setParseError('Please choose a .csv file.');
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            if (!text.trim()) {
                setParseError('The file is empty.');
                return;
            }
            setCsvRaw(text);
            setParseError(null);
        };
        reader.onerror = () => setParseError('Could not read the file.');
        reader.readAsText(file, 'UTF-8');
    };

    const handleValidate = useCallback(() => {
        setImportError(null);
        setImportSummary(null);
        setValidationErrors([]);
        setValidationNotes([]);
        setValidatedPayloads(null);
        if (!csvRaw) {
            setParseError('Upload a CSV file first.');
            return;
        }
        try {
            const { headers, rows } = parseCsvToObjects(csvRaw);
            const result = validateAndBuildPayloads(bulkType, bulkLevel, headers, rows);
            const notes = result.errors.filter((e) => e.startsWith('Note:'));
            const hard = result.errors.filter((e) => !e.startsWith('Note:'));
            if (!result.ok) {
                setValidationErrors(hard);
                setValidationNotes(notes);
                setValidatedPayloads(null);
                setParseError(null);
                return;
            }
            setParseError(null);
            setValidationErrors([]);
            setValidationNotes(notes);
            setValidatedPayloads(result.payloads);
            setActiveStep(3);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Could not parse CSV.';
            setParseError(msg);
            setValidatedPayloads(null);
        }
    }, [bulkType, bulkLevel, csvRaw]);

    const handleImport = async () => {
        if (!validatedPayloads?.length) return;
        setBusy(true);
        setImportError(null);
        setImportSummary(null);
        setImportProgress(null);
        try {
            const out = await bulkCreateDailyContentAdminChunked(validatedPayloads, {
                batchSize: BULK_IMPORT_BATCH_SIZE,
                onProgress: setImportProgress,
            });
            if (out.failedCount > 0) {
                const detail = out.failures
                    .slice(0, 5)
                    .map((f) => `#${f.index + 1}: ${f.message}`)
                    .join('; ');
                setImportSummary(
                    `Imported ${out.createdCount} item(s). ${out.failedCount} failed. ${detail}${
                        out.failures.length > 5 ? '…' : ''
                    }`
                );
            } else {
                setImportSummary(`Successfully imported ${out.createdCount} item(s).`);
            }
            onImported();
            resetUpload();
            setActiveStep(0);
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setImportError(msg || (err instanceof Error ? err.message : 'Import failed.'));
        } finally {
            setBusy(false);
            setImportProgress(null);
        }
    };

    const importBatchLabel =
        importProgress && importProgress.totalBatches > 1
            ? `Importing batch ${importProgress.batchIndex} of ${importProgress.totalBatches}…`
            : null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Bulk import daily content (CSV)</DialogTitle>
            <DialogContent dividers>
                {busy && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress
                            variant={importProgress ? 'determinate' : 'indeterminate'}
                            value={
                                importProgress && importProgress.totalCount > 0
                                    ? (importProgress.processedCount / importProgress.totalCount) * 100
                                    : undefined
                            }
                        />
                        {importProgress && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {importBatchLabel} ({importProgress.processedCount} / {importProgress.totalCount}{' '}
                                records)
                            </Typography>
                        )}
                    </Box>
                )}

                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                How it works
                            </Typography>
                            <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                                <li>Choose the content type (membership level is set automatically).</li>
                                <li>Download the template — it lists every column; leave cells empty if you do not need them.</li>
                                <li>
                                    Fill your CSV. For grouped types (vocab, conversations, puzzles, feed), repeat{' '}
                                    <code>date</code> and <code>title</code> on each line in the group.
                                </li>
                                <li>
                                    Upload, validate, fix any errors, then import. Column headers are flexible:{' '}
                                    <code>hi</code> works for <code>meaning_hi</code>, <code>en</code> for{' '}
                                    <code>meaning_en</code> (Excel exports often use short names).
                                </li>
                                <li>
                                    For Word / Phrase of the Day, add multiple examples using{' '}
                                    <code>example_1_en</code>, <code>example_1_hi</code>, <code>example_2_en</code>,{' '}
                                    <code>example_2_hi</code>, and so on — no JSON required.
                                </li>
                            </Box>
                            {calendarDate && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Calendar filter is on {format(calendarDate, 'MMM d, yyyy')} for reference only — schedule
                                    dates come from the <code>date</code> column in your file.
                                </Typography>
                            )}
                        </Alert>
                        <FormControl fullWidth size="small">
                            <InputLabel id="bulk-type-label">Type</InputLabel>
                            <Select
                                labelId="bulk-type-label"
                                label="Type"
                                value={bulkType}
                                onChange={(e) => {
                                    setBulkType(e.target.value as BulkDailyContentType);
                                    onTypeChange();
                                }}
                            >
                                {DAILY_CONTENT_CATALOG.map((slot) => (
                                    <MenuItem key={slot.adminKey} value={slot.adminKey}>
                                        {slot.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Level for this type: <strong>{bulkLevel}</strong>
                        </Typography>
                    </>
                )}

                {activeStep >= 1 && schema && (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {schema.description}
                            {(bulkType === 'WORD' || bulkType === 'PHRASE') && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Multiple examples: use <code>example_1_en</code> / <code>example_1_hi</code>, then{' '}
                                    <code>example_2_en</code> / <code>example_2_hi</code>, up to 5 pairs. Leave unused
                                    columns empty. Only use <code>examples_json</code> if you prefer raw JSON.
                                </Typography>
                            )}
                            {schema.groupHint && (
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                                    Grouped import: {schema.groupHint}
                                </Typography>
                            )}
                        </Alert>

                        <Typography variant="subtitle2" gutterBottom>
                            All columns (required fields marked *)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 280 }}>
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
                                    {schema.columns.map((col) => (
                                        <TableRow key={col.key}>
                                            <TableCell>
                                                <code>{col.label}</code>
                                            </TableCell>
                                            <TableCell>{col.required ? 'Yes *' : 'No'}</TableCell>
                                            <TableCell>{col.formField || '—'}</TableCell>
                                            <TableCell>{col.hint || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="subtitle2" gutterBottom>
                            Example CSV (single-row template)
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                mb: 1,
                                bgcolor: 'grey.50',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: 11,
                                overflowX: 'auto',
                                whiteSpace: 'pre',
                            }}
                        >
                            {buildExampleCsvFromSchema(schema)}
                        </Paper>

                        {schema.rowMode === 'grouped' && schema.exampleRows.length > 0 && (
                            <>
                                <Typography variant="subtitle2" gutterBottom>
                                    Grouped example (additional rows)
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
                                    {schemaToExampleCsv(schema)}
                                </Paper>
                            </>
                        )}

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<GetAppIcon />}
                            onClick={handleDownloadTemplate}
                        >
                            Download full template
                        </Button>
                    </>
                )}

                {activeStep >= 2 && schema && (
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
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Selected: {fileName}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleValidate}
                                disabled={!csvRaw || busy}
                            >
                                Validate
                            </Button>
                        </Box>
                    </Box>
                )}

                {parseError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {parseError}
                    </Alert>
                )}

                {validationNotes.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {validationNotes.map((n, i) => (
                            <Typography key={i} variant="body2">
                                {n}
                            </Typography>
                        ))}
                    </Alert>
                )}

                {validationErrors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Fix these issues and validate again:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 220, overflow: 'auto' }}>
                            {validationErrors.map((err, i) => (
                                <li key={i}>
                                    <Typography variant="body2">{err}</Typography>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {validatedPayloads && validatedPayloads.length > 0 && validationErrors.length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Validation passed. {validatedPayloads.length} record(s) ready to import.
                        {validatedPayloads.length > BULK_IMPORT_BATCH_SIZE && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Large files import in batches of {BULK_IMPORT_BATCH_SIZE} records.
                            </Typography>
                        )}
                    </Alert>
                )}

                {importError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {importError}
                    </Alert>
                )}
                {importSummary && (
                    <Alert severity={importSummary.includes('failed') ? 'warning' : 'success'} sx={{ mt: 2 }}>
                        {importSummary}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={busy}>
                    Close
                </Button>
                {activeStep > 0 && activeStep < STEPS.length - 1 && (
                    <Button onClick={() => setActiveStep((s) => s - 1)} disabled={busy}>
                        Back
                    </Button>
                )}
                {activeStep < STEPS.length - 1 && (
                    <Button
                        variant="contained"
                        onClick={() => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))}
                        disabled={activeStep === 0 && !bulkType}
                    >
                        Next
                    </Button>
                )}
                {activeStep === STEPS.length - 1 && validatedPayloads && validatedPayloads.length > 0 && (
                    <Button variant="contained" onClick={() => void handleImport()} disabled={busy}>
                        {importBatchLabel ||
                            `Import ${validatedPayloads.length} record(s)${
                                validatedPayloads.length > BULK_IMPORT_BATCH_SIZE ? ' in batches' : ''
                            }`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AdminDailyContentBulkDialog;
