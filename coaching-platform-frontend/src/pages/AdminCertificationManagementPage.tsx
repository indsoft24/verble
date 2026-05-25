import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControlLabel,
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
import AdminLayout from '../components/layout/AdminLayout';
import {
    getCertificateRulesAdmin,
    getIssuedCertificatesAdmin,
    updateCertificateRuleAdmin,
    type CertificateRuleRow,
    type IssuedCertificateRow,
} from '../services/certificationAdminService';

const AdminCertificationManagementPage: React.FC = () => {
    const [rules, setRules] = useState<CertificateRuleRow[]>([]);
    const [issued, setIssued] = useState<IssuedCertificateRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [savingCourseId, setSavingCourseId] = useState<string | null>(null);

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

    useEffect(() => { loadRules(); }, [loadRules]);
    useEffect(() => { loadIssued(); }, [loadIssued]);

    const updateLocalRule = (courseId: string, patch: Partial<CertificateRuleRow['rule']>) => {
        setRules((prev) => prev.map((row) => (
            row.course._id === courseId ? { ...row, rule: { ...row.rule, ...patch } } : row
        )));
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
