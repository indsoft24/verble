import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AdminLayout from '../components/layout/AdminLayout';
import DatabaseDocumentFormEditor from '../components/admin/DatabaseDocumentFormEditor';
import { getCollectionDisplayName } from '../utils/collectionDisplayNames';
import {
    createCollectionDocument,
    deleteCollectionDocument,
    getCollectionDocuments,
    getDbAuditLogs,
    getDbCollections,
    updateCollectionDocument,
    type AuditLogRecord,
    type DbCollectionItem,
} from '../services/databaseManagerService';

const DEFAULT_PAGE_SIZE = 25;

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const AdminDatabaseManagerPage: React.FC = () => {
    const [collections, setCollections] = useState<DbCollectionItem[]>([]);
    const [collectionsSearch, setCollectionsSearch] = useState('');
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [docs, setDocs] = useState<Record<string, any>[]>([]);
    const [fields, setFields] = useState<string[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterJson, setFilterJson] = useState('{}');
    const [dateField, setDateField] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('_id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
    const [totalRows, setTotalRows] = useState(0);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<'create' | 'update'>('create');
    const [editorTargetId, setEditorTargetId] = useState<string | null>(null);
    const [editorDoc, setEditorDoc] = useState<Record<string, unknown>>({});
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [softDelete, setSoftDelete] = useState(true);
    const [saving, setSaving] = useState(false);
    const [auditPage, setAuditPage] = useState(0);
    const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);

    const visibleFields = useMemo(
        () => fields.filter((field) => field !== '_id').slice(0, 7),
        [fields]
    );

    const loadCollections = useCallback(async () => {
        setLoadingCollections(true);
        setError(null);
        try {
            const data = await getDbCollections(collectionsSearch);
            const allowed = data.filter((c) => !c.restricted);
            setCollections(allowed);
            if (!selectedCollection && allowed[0]) {
                setSelectedCollection(allowed[0].name);
            }
            if (selectedCollection && !allowed.find((c) => c.name === selectedCollection)) {
                setSelectedCollection(allowed[0]?.name || '');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch collections.');
        } finally {
            setLoadingCollections(false);
        }
    }, [collectionsSearch, selectedCollection]);

    const loadDocuments = useCallback(async () => {
        if (!selectedCollection) return;
        setLoadingDocs(true);
        setError(null);
        try {
            const data = await getCollectionDocuments(selectedCollection, {
                page: page + 1,
                limit: rowsPerPage,
                search,
                filterJson: filterJson.trim() || '{}',
                dateField: dateField || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                sortField,
                sortDirection,
            });
            setDocs(data.documents);
            setFields(data.fields);
            setTotalRows(data.pagination.total);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch documents.');
        } finally {
            setLoadingDocs(false);
        }
    }, [selectedCollection, page, rowsPerPage, search, filterJson, dateField, dateFrom, dateTo, sortField, sortDirection]);

    const loadAuditLogs = useCallback(async () => {
        if (!selectedCollection) return;
        try {
            const data = await getDbAuditLogs({
                page: auditPage + 1,
                limit: 10,
                collectionName: selectedCollection,
            });
            setAuditLogs(data.logs || []);
            setAuditTotal(data.pagination.total);
        } catch {
            setAuditLogs([]);
            setAuditTotal(0);
        }
    }, [auditPage, selectedCollection]);

    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    useEffect(() => {
        setPage(0);
    }, [selectedCollection]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    useEffect(() => {
        loadAuditLogs();
    }, [loadAuditLogs]);

    const openCreateDialog = () => {
        setEditorMode('create');
        setEditorTargetId(null);
        setEditorDoc({});
        setEditorOpen(true);
    };

    const openUpdateDialog = (doc: Record<string, any>) => {
        setEditorMode('update');
        setEditorTargetId(doc._id);
        setEditorDoc({ ...doc });
        setEditorOpen(true);
    };

    const handleSaveDocument = async () => {
        if (!selectedCollection) return;
        setSaving(true);
        setError(null);
        try {
            const payload = { ...editorDoc };
            if (editorMode === 'create') {
                delete payload._id;
                delete payload.__v;
                delete payload.createdAt;
                delete payload.updatedAt;
            }
            if (editorMode === 'create') {
                await createCollectionDocument(selectedCollection, payload);
            } else if (editorTargetId) {
                await updateCollectionDocument(selectedCollection, editorTargetId, payload);
            }
            setEditorOpen(false);
            await loadDocuments();
            await loadAuditLogs();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to save document.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCollection || !deleteTargetId) return;
        setSaving(true);
        setError(null);
        try {
            await deleteCollectionDocument(selectedCollection, deleteTargetId, softDelete);
            setDeleteTargetId(null);
            await loadDocuments();
            await loadAuditLogs();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to delete document.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Database Manager">
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <Paper sx={{ p: 2, width: { xs: '100%', lg: 320 }, flexShrink: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Collections</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Search collections"
                        value={collectionsSearch}
                        onChange={(e) => setCollectionsSearch(e.target.value)}
                        onBlur={loadCollections}
                    />
                    <Divider sx={{ my: 1.5 }} />
                    {loadingCollections ? <CircularProgress size={24} /> : (
                        <Stack spacing={1} sx={{ maxHeight: 540, overflowY: 'auto' }}>
                            {collections.map((collection) => (
                                <Button
                                    key={collection.name}
                                    onClick={() => setSelectedCollection(collection.name)}
                                    variant={selectedCollection === collection.name ? 'contained' : 'outlined'}
                                    sx={{
                                        justifyContent: 'space-between',
                                        textTransform: 'none',
                                        alignItems: 'flex-start',
                                        py: 1.25,
                                    }}
                                >
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography variant="body2" component="span" sx={{ display: 'block', fontWeight: 600 }}>
                                            {getCollectionDisplayName(collection.name)}
                                        </Typography>
                                        <Typography variant="caption" component="span" color="text.secondary">
                                            {collection.name}
                                        </Typography>
                                    </Box>
                                    <Chip label={collection.count} size="small" />
                                </Button>
                            ))}
                        </Stack>
                    )}
                </Paper>

                <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Paper sx={{ p: 2 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                            <TextField size="small" label="Search keyword" value={search} onChange={(e) => setSearch(e.target.value)} />
                            <TextField size="small" label="JSON filter" value={filterJson} onChange={(e) => setFilterJson(e.target.value)} />
                            <TextField size="small" label="Date field" value={dateField} onChange={(e) => setDateField(e.target.value)} />
                            <TextField size="small" type="date" label="Date from" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                            <TextField size="small" type="date" label="Date to" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                            <Button variant="contained" onClick={() => loadDocuments()}>Apply</Button>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Sort field</InputLabel>
                                <Select value={sortField} label="Sort field" onChange={(e) => setSortField(e.target.value)}>
                                    {['_id', ...visibleFields].map((field) => (
                                        <MenuItem key={field} value={field}>{field}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Sort direction</InputLabel>
                                <Select value={sortDirection} label="Sort direction" onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}>
                                    <MenuItem value="desc">DESC</MenuItem>
                                    <MenuItem value="asc">ASC</MenuItem>
                                </Select>
                            </FormControl>
                            <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)} sx={{ minHeight: 40 }}>
                                <Tab label="Table View" value="table" />
                                <Tab label="Raw JSON View" value="json" />
                            </Tabs>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button startIcon={<AddIcon />} variant="contained" onClick={openCreateDialog}>
                                Create
                            </Button>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

                        {loadingDocs ? <CircularProgress /> : viewMode === 'table' ? (
                            <>
                                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ID</TableCell>
                                                {visibleFields.map((field) => <TableCell key={field}>{field}</TableCell>)}
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {docs.map((doc) => (
                                                <React.Fragment key={doc._id}>
                                                    <TableRow hover>
                                                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <Button size="small" onClick={() => setExpandedId(expandedId === doc._id ? null : doc._id)}>
                                                                {doc._id}
                                                            </Button>
                                                        </TableCell>
                                                        {visibleFields.map((field) => (
                                                            <TableCell key={`${doc._id}-${field}`} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {typeof doc[field] === 'object' ? prettyJson(doc[field]) : String(doc[field] ?? '')}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell align="right">
                                                            <Button size="small" startIcon={<EditIcon />} onClick={() => openUpdateDialog(doc)}>Edit</Button>
                                                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteTargetId(doc._id)}>Delete</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedId === doc._id && (
                                                        <TableRow>
                                                            <TableCell colSpan={visibleFields.length + 2} sx={{ p: 0 }}>
                                                                <Box sx={{ p: 1.5, bgcolor: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                                                    {prettyJson(doc)}
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={totalRows}
                                    page={page}
                                    onPageChange={(_, nextPage) => setPage(nextPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                />
                            </>
                        ) : (
                            <Paper sx={{ p: 1.5, maxHeight: 560, overflow: 'auto', bgcolor: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace' }}>
                                {prettyJson(docs)}
                            </Paper>
                        )}
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Audit History</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>When</TableCell>
                                    <TableCell>User</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Doc ID</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {auditLogs.map((log) => (
                                    <TableRow key={log._id}>
                                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{log.userEmail || log.userId}</TableCell>
                                        <TableCell><Chip size="small" label={log.action.toUpperCase()} /></TableCell>
                                        <TableCell>{log.documentId}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={auditTotal}
                            page={auditPage}
                            onPageChange={(_, next) => setAuditPage(next)}
                            rowsPerPage={10}
                            rowsPerPageOptions={[10]}
                        />
                    </Paper>
                </Stack>
            </Stack>

            <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    {editorMode === 'create' ? 'Create Document' : 'Update Document'}
                    {selectedCollection ? ` — ${getCollectionDisplayName(selectedCollection)}` : ''}
                </DialogTitle>
                <DialogContent>
                    <DatabaseDocumentFormEditor
                        collectionName={selectedCollection}
                        value={editorDoc}
                        onChange={setEditorDoc}
                        mode={editorMode}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveDocument} variant="contained" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm delete</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        This action will remove the selected document.
                    </Typography>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Deletion mode</InputLabel>
                        <Select
                            value={softDelete ? 'soft' : 'hard'}
                            label="Deletion mode"
                            onChange={(e) => setSoftDelete(e.target.value === 'soft')}
                        >
                            <MenuItem value="soft">Soft delete (recommended)</MenuItem>
                            <MenuItem value="hard">Hard delete</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTargetId(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
                        {saving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminDatabaseManagerPage;
