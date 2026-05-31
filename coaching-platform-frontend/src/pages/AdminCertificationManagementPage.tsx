import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControlLabel,
    Grid,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AdminLayout from '../components/layout/AdminLayout';
import {
    getCertificateRulesAdmin,
    getIssuedCertificatesAdmin,
    updateCertificateRuleAdmin,
    fetchDemoCertificatePdf,
    getCertificateBrandingAdmin,
    updateCertificateBrandingAdmin,
    uploadCertificateSignatureAdmin,
    uploadCertificateLogoAdmin,
    fetchBrandingImageBlob,
    type CertificateRuleRow,
    type IssuedCertificateRow,
    type CertificateBranding,
} from '../services/certificationAdminService';

const AdminCertificationManagementPage: React.FC = () => {
    const [rules, setRules] = useState<CertificateRuleRow[]>([]);
    const [issued, setIssued] = useState<IssuedCertificateRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
    const [demoLoading, setDemoLoading] = useState<'view' | 'download' | null>(null);
    const [branding, setBranding] = useState<CertificateBranding | null>(null);
    const [signatoryName, setSignatoryName] = useState('');
    const [signatoryTitle, setSignatoryTitle] = useState('');
    const [issuerTagline, setIssuerTagline] = useState('');
    const [brandingSaving, setBrandingSaving] = useState(false);
    const [signatureUploading, setSignatureUploading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const loadRules = useCallback(async () => {
        try {
            const data = await getCertificateRulesAdmin();
            setRules(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load rules');
        }
    }, []);

    const loadIssued = useCallback(async () => {
        try {
            const data = await getIssuedCertificatesAdmin({ page: page + 1, limit: rowsPerPage });
            setIssued(data.certificates || []);
            setTotal(data.pagination.total || 0);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load issued certificates');
        }
    }, [page, rowsPerPage]);

    const revokePreview = (url: string | null) => {
        if (url) URL.revokeObjectURL(url);
    };

    const loadBrandingPreviews = useCallback(async (data: CertificateBranding) => {
        setSignaturePreview((prev) => {
            revokePreview(prev);
            return null;
        });
        setLogoPreview((prev) => {
            revokePreview(prev);
            return null;
        });
        if (data.signatureUrl) {
            try {
                const blob = await fetchBrandingImageBlob(data.signatureUrl);
                setSignaturePreview(URL.createObjectURL(blob));
            } catch {
                /* preview optional */
            }
        }
        if (data.logoUrl) {
            try {
                const blob = await fetchBrandingImageBlob(data.logoUrl);
                setLogoPreview(URL.createObjectURL(blob));
            } catch {
                /* preview optional */
            }
        }
    }, []);

    const loadBranding = useCallback(async () => {
        try {
            const data = await getCertificateBrandingAdmin();
            setBranding(data);
            setSignatoryName(data.signatoryName || '');
            setSignatoryTitle(data.signatoryTitle || '');
            setIssuerTagline(data.issuerTagline || '');
            await loadBrandingPreviews(data);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to load certificate branding');
        }
    }, [loadBrandingPreviews]);

    useEffect(() => { loadRules(); }, [loadRules]);
    useEffect(() => { loadIssued(); }, [loadIssued]);
    useEffect(() => { void loadBranding(); }, [loadBranding]);

    useEffect(() => () => {
        revokePreview(signaturePreview);
        revokePreview(logoPreview);
    }, [signaturePreview, logoPreview]);

    const saveBranding = async () => {
        setBrandingSaving(true);
        setError(null);
        setBrandingSuccess(null);
        try {
            const data = await updateCertificateBrandingAdmin({
                signatoryName,
                signatoryTitle,
                issuerTagline,
            });
            setBranding(data);
            setBrandingSuccess('Certificate text saved. Demo PDF will use the new signatory details on next view.');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to save branding');
        } finally {
            setBrandingSaving(false);
        }
    };

    const uploadSignature = async (file: File) => {
        setSignatureUploading(true);
        setError(null);
        setBrandingSuccess(null);
        try {
            const data = await uploadCertificateSignatureAdmin(file);
            setBranding(data);
            await loadBrandingPreviews(data);
            setBrandingSuccess('Signature uploaded. View the demo certificate to confirm placement.');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to upload signature');
        } finally {
            setSignatureUploading(false);
            if (signatureInputRef.current) signatureInputRef.current.value = '';
        }
    };

    const uploadLogo = async (file: File) => {
        setLogoUploading(true);
        setError(null);
        setBrandingSuccess(null);
        try {
            const data = await uploadCertificateLogoAdmin(file);
            setBranding(data);
            await loadBrandingPreviews(data);
            setBrandingSuccess('Logo uploaded. It appears in corner watermarks and on the certificate border.');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to upload logo');
        } finally {
            setLogoUploading(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const updateLocalRule = (courseId: string, patch: Partial<CertificateRuleRow['rule']>) => {
        setRules((prev) => prev.map((row) => (
            row.course._id === courseId ? { ...row, rule: { ...row.rule, ...patch } } : row
        )));
    };

    const openDemoCertificate = async (mode: 'view' | 'download') => {
        setDemoLoading(mode);
        setError(null);
        try {
            const blob = await fetchDemoCertificatePdf(mode === 'download');
            const url = URL.createObjectURL(blob);
            if (mode === 'download') {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'verble-course-certificate-demo.pdf';
                link.click();
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(
                axiosErr.response?.data?.message ||
                    axiosErr.message ||
                    'Failed to load demo certificate.'
            );
        } finally {
            setDemoLoading(null);
        }
    };

    const saveRule = async (row: CertificateRuleRow) => {
        setSavingCourseId(row.course._id);
        setError(null);
        try {
            await updateCertificateRuleAdmin(row.course._id, {
                isEnabled: row.rule.isEnabled,
                requireAssessment: row.rule.requireAssessment,
                passingScore: row.rule.passingScore,
                minimumCompletionPercent: row.rule.minimumCompletionPercent,
                readOnlyMode: row.rule.readOnlyMode,
                requireModuleQuizzes: row.rule.requireModuleQuizzes,
                minimumModuleQuizScore: row.rule.minimumModuleQuizScore,
                requireDailySubmissions: row.rule.requireDailySubmissions,
                minimumDailySubmissionPercent: row.rule.minimumDailySubmissionPercent,
                dailySubmissionLookbackDays: row.rule.dailySubmissionLookbackDays,
                minimumOverallSubmissionPercent: row.rule.minimumOverallSubmissionPercent,
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to save rule');
        } finally {
            setSavingCourseId(null);
        }
    };

    return (
        <AdminLayout title="Certification Management">
            <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {brandingSuccess && <Alert severity="success" onClose={() => setBrandingSuccess(null)}>{brandingSuccess}</Alert>}

                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>Certificate appearance</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
                        Official layout includes Verble watermarks, border logos, and your signatory block.
                        Upload a signature image (PNG with transparent background works best) and optional logo override.
                        New learner certificates use this branding; already-issued PDFs keep their original file until re-generated.
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2.5,
                                    maxWidth: 480,
                                    '& .MuiFormControl-root': { margin: 0 },
                                }}
                            >
                                <TextField
                                    label="Signatory name"
                                    size="small"
                                    fullWidth
                                    value={signatoryName}
                                    onChange={(e) => setSignatoryName(e.target.value)}
                                    placeholder="e.g. Priya Sharma"
                                />
                                <TextField
                                    label="Signatory title"
                                    size="small"
                                    fullWidth
                                    value={signatoryTitle}
                                    onChange={(e) => setSignatoryTitle(e.target.value)}
                                    placeholder="e.g. Director of Learning, Verble"
                                />
                                <TextField
                                    label="Issuer tagline"
                                    size="small"
                                    fullWidth
                                    value={issuerTagline}
                                    onChange={(e) => setIssuerTagline(e.target.value)}
                                    placeholder="e.g. Speak with confidence."
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => void saveBranding()}
                                    disabled={brandingSaving || !branding}
                                    sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                                >
                                    {brandingSaving ? 'Saving…' : 'Save text'}
                                </Button>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Signature image</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<UploadFileIcon />}
                                            disabled={signatureUploading}
                                        >
                                            {signatureUploading ? 'Uploading…' : 'Upload signature'}
                                            <input
                                                ref={signatureInputRef}
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) void uploadSignature(file);
                                                }}
                                            />
                                        </Button>
                                        {!branding?.hasSignature && (
                                            <Typography variant="caption" color="text.secondary">No signature yet</Typography>
                                        )}
                                    </Stack>
                                    {signaturePreview && (
                                        <Box
                                            component="img"
                                            src={signaturePreview}
                                            alt="Signature preview"
                                            sx={{ mt: 1, maxHeight: 72, maxWidth: 220, objectFit: 'contain' }}
                                        />
                                    )}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Logo (watermarks)</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<UploadFileIcon />}
                                            disabled={logoUploading}
                                        >
                                            {logoUploading ? 'Uploading…' : 'Upload logo'}
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) void uploadLogo(file);
                                                }}
                                            />
                                        </Button>
                                        <Typography variant="caption" color="text.secondary">
                                            {branding?.hasLogo ? 'Using Verble logo' : 'Default logo pending'}
                                        </Typography>
                                    </Stack>
                                    {logoPreview && (
                                        <Box
                                            component="img"
                                            src={logoPreview}
                                            alt="Logo preview"
                                            sx={{ mt: 1, maxHeight: 56, maxWidth: 160, objectFit: 'contain' }}
                                        />
                                    )}
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 2,
                            mb: 1.5,
                        }}
                    >
                        <Box>
                            <Typography variant="h6">Sample certificate preview</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
                                Same PDF layout learners receive after they generate a course certificate on My
                                Courses. Use this to review branding before anyone completes a course.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                onClick={() => void openDemoCertificate('view')}
                                disabled={demoLoading !== null}
                            >
                                {demoLoading === 'view' ? 'Loading…' : 'View demo'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => void openDemoCertificate('download')}
                                disabled={demoLoading !== null}
                            >
                                {demoLoading === 'download' ? 'Loading…' : 'Download demo'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Course Certification Rules</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Course</TableCell>
                                <TableCell>Enabled</TableCell>
                                <TableCell>Read-only</TableCell>
                                <TableCell>Require final assessment</TableCell>
                                <TableCell>Passing score</TableCell>
                                <TableCell>Min completion %</TableCell>
                                <TableCell>Req quizzes</TableCell>
                                <TableCell>Min quiz %</TableCell>
                                <TableCell>Req daily</TableCell>
                                <TableCell>Min daily %</TableCell>
                                <TableCell>Min overall %</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map((row) => (
                                <TableRow key={row.course._id}>
                                    <TableCell>
                                        {row.course.title}{' '}
                                        {!row.course.isPublished && <Chip size="small" label="Draft" />}
                                    </TableCell>
                                    <TableCell>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={row.rule.isEnabled}
                                                    onChange={(e) => updateLocalRule(row.course._id, { isEnabled: e.target.checked })}
                                                />
                                            }
                                            label=""
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={row.rule.readOnlyMode}
                                                    onChange={(e) => updateLocalRule(row.course._id, { readOnlyMode: e.target.checked })}
                                                />
                                            }
                                            label=""
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={row.rule.requireAssessment}
                                                    onChange={(e) => updateLocalRule(row.course._id, { requireAssessment: e.target.checked })}
                                                />
                                            }
                                            label=""
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.rule.passingScore}
                                            inputProps={{ min: 0, max: 100 }}
                                            onChange={(e) => updateLocalRule(row.course._id, { passingScore: Number(e.target.value) })}
                                            sx={{ width: 90 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.rule.minimumCompletionPercent}
                                            inputProps={{ min: 1, max: 100 }}
                                            onChange={(e) => updateLocalRule(row.course._id, { minimumCompletionPercent: Number(e.target.value) })}
                                            sx={{ width: 90 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={Boolean(row.rule.requireModuleQuizzes)}
                                            onChange={(e) => updateLocalRule(row.course._id, { requireModuleQuizzes: e.target.checked })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.rule.minimumModuleQuizScore ?? 70}
                                            inputProps={{ min: 0, max: 100 }}
                                            onChange={(e) => updateLocalRule(row.course._id, { minimumModuleQuizScore: Number(e.target.value) })}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={Boolean(row.rule.requireDailySubmissions)}
                                            onChange={(e) => updateLocalRule(row.course._id, { requireDailySubmissions: e.target.checked })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.rule.minimumDailySubmissionPercent ?? 70}
                                            inputProps={{ min: 0, max: 100 }}
                                            onChange={(e) => updateLocalRule(row.course._id, { minimumDailySubmissionPercent: Number(e.target.value) })}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.rule.minimumOverallSubmissionPercent ?? 0}
                                            inputProps={{ min: 0, max: 100 }}
                                            onChange={(e) => updateLocalRule(row.course._id, { minimumOverallSubmissionPercent: Number(e.target.value) })}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={() => saveRule(row)}
                                            disabled={savingCourseId === row.course._id}
                                        >
                                            Save
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>Issued Certificates</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Certificate #</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Course</TableCell>
                                <TableCell>Completion</TableCell>
                                <TableCell>Assessment</TableCell>
                                <TableCell>Issued At</TableCell>
                                <TableCell align="right">PDF</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {issued.map((row) => (
                                <TableRow key={row._id}>
                                    <TableCell>{row.certificateNumber}</TableCell>
                                    <TableCell>{row.userName}<br />{row.userEmail}</TableCell>
                                    <TableCell>{row.courseTitle}</TableCell>
                                    <TableCell>{row.completionPercent}%</TableCell>
                                    <TableCell>{row.assessmentScore ?? '-'}</TableCell>
                                    <TableCell>{new Date(row.issuedAt).toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" href={row.pdfUrl} target="_blank" rel="noreferrer">Open</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    </Box>
                </Paper>
            </Stack>
        </AdminLayout>
    );
};

export default AdminCertificationManagementPage;
