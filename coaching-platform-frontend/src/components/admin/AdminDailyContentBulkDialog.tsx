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
    Stack,
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
    deleteMisdatedDailyContentAdmin,
    previewMisdatedDailyContentAdmin,
    type BulkImportProgress,
    type CreateDailyContentPayload,
    type MisdatedCleanupResult,
} from '../../services/dailyContentAdminService';

export interface AdminDailyContentBulkDialogProps {
    open: boolean;
    onClose: () => void;
    onImported: (info?: { minDate?: string; maxDate?: string }) => void;
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
    const [misdatedPreview, setMisdatedPreview] = useState<MisdatedCleanupResult | null>(null);
    const [misdatedBusy, setMisdatedBusy] = useState(false);
    const [misdatedMessage, setMisdatedMessage] = useState<string | null>(null);

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
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
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
            const dates = validatedPayloads.map((p) => p.date).filter(Boolean).sort();
            const dateRange =
                dates.length > 0
                    ? { minDate: dates[0], maxDate: dates[dates.length - 1] }
                    : undefined;

            if (out.createdCount === 0) {
                const detail = out.failures
                    .slice(0, 8)
                    .map((f) => `Row ${f.index + 1}: ${f.message}`)
                    .join('; ');
                setImportError(
                    `No records were imported. ${out.failedCount} failed.${detail ? ` ${detail}` : ''}${
                        out.failures.length > 8 ? '…' : ''
                    }`
                );
                return;
            }

            if (out.failedCount > 0) {
                const detail = out.failures
                    .slice(0, 5)
                    .map((f) => `Row ${f.index + 1}: ${f.message}`)
                    .join('; ');
                setImportSummary(
                    `Imported ${out.createdCount} item(s). ${out.failedCount} failed. ${detail}${
                        out.failures.length > 5 ? '…' : ''
                    }${dateRange ? ` Scheduled ${dateRange.minDate} – ${dateRange.maxDate}.` : ''}`
                );
            } else {
                setImportSummary(
                    `Successfully imported ${out.createdCount} item(s).${
                        dateRange ? ` Scheduled ${dateRange.minDate} – ${dateRange.maxDate}.` : ''
                    }`
                );
            }
            onImported(dateRange);
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

    const handlePreviewMisdated = async () => {
        setMisdatedBusy(true);
        setMisdatedMessage(null);
        try {
            const result = await previewMisdatedDailyContentAdmin();
            setMisdatedPreview(result);
            if ((result.count ?? 0) === 0) {
                setMisdatedMessage('No misdated records found.');
            }
        } catch (err: unknown) {
            setMisdatedMessage(err instanceof Error ? err.message : 'Could not preview misdated records.');
        } finally {
            setMisdatedBusy(false);
        }
    };

    const handleDeleteMisdated = async () => {
        setMisdatedBusy(true);
        setMisdatedMessage(null);
        try {
            const result = await deleteMisdatedDailyContentAdmin();
            setMisdatedPreview(null);
            setMisdatedMessage(`Deleted ${result.deletedCount ?? 0} misdated record(s). You can re-import your CSV now.`);
        } catch (err: unknown) {
            setMisdatedMessage(err instanceof Error ? err.message : 'Could not delete misdated records.');
        } finally {
            setMisdatedBusy(false);
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
                                    Fill your CSV — <strong>one row per scheduled day</strong>. The next day goes on the
                                    next row.
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
                                <li>
                                    <strong>Vocab set:</strong> one row per day — use <code>word_1</code>,{' '}
                                    <code>pronunciation_hi_1</code>, <code>meaning_hi_1</code> through{' '}
                                    <code>word_10</code> (up to 10 words per set).
                                </li>
                                <li>
                                    <strong>Conversations:</strong> one row per day — set <code>scenario_title</code> /{' '}
                                    <code>topic_name</code> and <code>participant_1</code>, <code>participant_2</code> once;
                                    use <code>line_1_speaker</code>, <code>line_1_text_en</code>, <code>line_1_text_hi</code>{' '}
                                    through <code>line_12</code> for dialogue.
                                </li>
                                <li>
                                    <strong>Puzzles:</strong> one row per day with exactly 5 questions —{' '}
                                    <code>question_1</code>, <code>option_1_1</code>…<code>correct_option_1</code> through
                                    question 5.
                                </li>
                                <li>
                                    <strong>Instagram feed:</strong> one row per day — <code>post_1_image_url</code>,{' '}
                                    <code>post_1_credit</code>, … through <code>post_6</code> (up to 6 posts).
                                </li>
                                <li>
                                    Use <code>yyyy-MM-dd</code> dates when possible; <code>06/01/26</code> also works
                                    (parsed as 1 June 2026).
                                </li>
                                <li>
                                    If a past bulk import used short dates like <code>06/01/26</code> before the fix,
                                    use <strong>Fix misdated imports</strong> below before re-uploading.
                                </li>
                                <li>
                                    <strong>Multi-value fields</strong> (story important words, scene keywords, speech /
                                    lyrics words &amp; phrases): use <code>word:en:hi|word2:en2:hi2</code> or{' '}
                                    <code>phrase:en:hi|phrase2:en2:hi2</code>.
                                </li>
                            </Box>
                            {calendarDate && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Calendar filter is on {format(calendarDate, 'MMM d, yyyy')} for reference only — schedule
                                    dates come from the <code>date</code> column in your file.
                                </Typography>
                            )}
                        </Alert>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Fix misdated imports
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Removes content scheduled outside 2000–2100 (e.g. year 0026 from old CSV date parsing).
                                Preview first, then delete, then re-import your file.
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={misdatedBusy}
                                    onClick={handlePreviewMisdated}
                                >
                                    Preview misdated
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="warning"
                                    disabled={misdatedBusy || (misdatedPreview?.count ?? 0) === 0}
                                    onClick={handleDeleteMisdated}
                                >
                                    Delete misdated records
                                </Button>
                            </Stack>
                            {misdatedPreview && (misdatedPreview.count ?? 0) > 0 && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Found {misdatedPreview.count} record(s)
                                    {misdatedPreview.preview?.[0]
                                        ? ` (e.g. ${misdatedPreview.preview[0].title} on ${misdatedPreview.preview[0].dateKey})`
                                        : ''}
                                </Typography>
                            )}
                            {misdatedMessage && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    {misdatedMessage}
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
                            {(bulkType === 'VOCAB_SET' ||
                                bulkType === 'CONVERSATION' ||
                                bulkType === 'PROFESSIONAL_CONVERSATION' ||
                                bulkType === 'PUZZLE_SPOT' ||
                                bulkType === 'PUZZLE_GRAMMAR' ||
                                bulkType === 'FEED') && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    One CSV row = one scheduled day. Multiple items (words, dialogue lines, questions, or
                                    posts) use numbered columns on the same row — leave unused slots empty.
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
                            Example CSV (10-row round-trip template)
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
