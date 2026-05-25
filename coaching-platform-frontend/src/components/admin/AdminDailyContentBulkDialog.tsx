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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';
import { format } from 'date-fns';
import {
    getBulkSchema,
    parseCsvToObjects,
    schemaToExampleCsv,
    validateAndBuildPayloads,
    type BulkDailyContentType,
} from '../../utils/dailyContentBulkCsv';
import { DAILY_CONTENT_CATALOG, levelForAdminKey } from '../../utils/dailyContentTypeCatalog';
import {
    bulkCreateDailyContentAdmin,
    type CreateDailyContentPayload,
} from '../../services/dailyContentAdminService';


export interface AdminDailyContentBulkDialogProps {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
    /** Shown in helper text so admins align dates with the calendar filter if they want */
    calendarDate: Date | null;
}

const AdminDailyContentBulkDialog: React.FC<AdminDailyContentBulkDialogProps> = ({
    open,
    onClose,
    onImported,
    calendarDate,
}) => {
    const [bulkType, setBulkType] = useState<BulkDailyContentType>('WORD');
    const bulkLevel = levelForAdminKey(bulkType);
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvRaw, setCsvRaw] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validatedPayloads, setValidatedPayloads] = useState<CreateDailyContentPayload[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const schema = bulkType && bulkLevel ? getBulkSchema(bulkType) : null;

    useEffect(() => {
        if (open) {
            setImportError(null);
            setImportSummary(null);
        }
    }, [open]);

    const resetAll = () => {
        setFileName(null);
        setCsvRaw(null);
        setValidationErrors([]);
        setValidatedPayloads(null);
        setParseError(null);
        setImportError(null);
        setImportSummary(null);
    };

    const handleClose = () => {
        if (busy) return;
        resetAll();
        onClose();
    };

    const onTypeOrLevelChange = () => {
        resetAll();
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
        resetAll();
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
        };
        reader.onerror = () => setParseError('Could not read the file.');
        reader.readAsText(file, 'UTF-8');
    };

    const handleValidate = useCallback(() => {
        setImportError(null);
        setImportSummary(null);
        setValidationErrors([]);
        setValidatedPayloads(null);
        if (!csvRaw) {
            setParseError('Upload a CSV file first.');
            return;
        }
        try {
            const { headers, rows } = parseCsvToObjects(csvRaw);
            const result = validateAndBuildPayloads(bulkType, bulkLevel, headers, rows);
            if (!result.ok) {
                setValidationErrors(result.errors);
                setValidatedPayloads(null);
                setParseError(null);
                return;
            }
            setParseError(null);
            setValidationErrors([]);
            setValidatedPayloads(result.payloads);
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
        try {
            const out = await bulkCreateDailyContentAdmin(validatedPayloads);
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
            setFileName(null);
            setCsvRaw(null);
            setValidationErrors([]);
            setValidatedPayloads(null);
            setParseError(null);
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            setImportError(msg || (err instanceof Error ? err.message : 'Import failed.'));
        } finally {
            setBusy(false);
        }
    };

    const step2Ready = Boolean(bulkType && bulkLevel);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Bulk import daily content (CSV)</DialogTitle>
            <DialogContent dividers>
                {busy && <LinearProgress sx={{ mb: 2 }} />}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose content type first. Level is assigned automatically from the catalog ({bulkLevel}). Dates in
                    the CSV determine each row&apos;s schedule
                    {calendarDate ? ` (calendar is on ${format(calendarDate, 'MMM d, yyyy')} for reference only)` : ''}.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <FormControl sx={{ minWidth: 320 }} size="small">
                        <InputLabel id="bulk-type-label">Type</InputLabel>
                        <Select
                            labelId="bulk-type-label"
                            label="Type"
                            value={bulkType}
                            onChange={(e) => {
                                setBulkType(e.target.value as BulkDailyContentType);
                                onTypeOrLevelChange();
                            }}
                        >
                            {DAILY_CONTENT_CATALOG.map((slot) => (
                                <MenuItem key={slot.adminKey} value={slot.adminKey}>
                                    {slot.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {step2Ready && schema && (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {schema.description}
                            {schema.groupHint ? ` ${schema.groupHint}` : ''}
                        </Alert>

                        <Typography variant="subtitle2" gutterBottom>
                            Columns (required fields marked with *)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 280 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="28%">Column</TableCell>
                                        <TableCell>Required</TableCell>
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
                                fontSize: 12,
                                overflowX: 'auto',
                                whiteSpace: 'pre',
                            }}
                        >
                            {schemaToExampleCsv(schema)}
                        </Paper>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<GetAppIcon />}
                                onClick={handleDownloadTemplate}
                            >
                                Download template
                            </Button>
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
                                <Typography variant="body2" color="text.secondary">
                                    {fileName}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button variant="contained" color="secondary" onClick={handleValidate} disabled={!csvRaw || busy}>
                                Validate
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleImport}
                                disabled={!validatedPayloads?.length || busy}
                            >
                                Import {validatedPayloads?.length ? `(${validatedPayloads.length})` : ''}
                            </Button>
                        </Box>

                        {parseError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {parseError}
                            </Alert>
                        )}

                        {validationErrors.length > 0 && (
                            <Alert severity="error" sx={{ mb: 2 }}>
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

                        {validatedPayloads && validatedPayloads.length > 0 && validationErrors.length === 0 && !parseError && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Validation passed. {validatedPayloads.length} record(s) ready to import.
                            </Alert>
                        )}
                    </>
                )}

                {importError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {importError}
                    </Alert>
                )}
                {importSummary && (
                    <Alert severity={importSummary.includes('failed') ? 'warning' : 'success'} sx={{ mt: 1 }}>
                        {importSummary}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={busy}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminDailyContentBulkDialog;
