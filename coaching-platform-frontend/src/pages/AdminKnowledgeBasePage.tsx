import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid,
    Switch, FormControlLabel, Autocomplete, Chip
} from '@mui/material';
import {
    DataGrid, type GridColDef, GridActionsCellItem, type GridRowId
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import {
    getAllArticlesAdmin, createArticleAdmin, updateArticleAdmin, deleteArticleAdmin,
    type KnowledgeBaseArticle, type KnowledgeBaseArticleInput
} from '../services/knowledgeBaseAdminService';

interface ArticleRow extends KnowledgeBaseArticle {
    id: string; 
}

const AdminKnowledgeBasePage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentArticle, setCurrentArticle] = useState<(KnowledgeBaseArticleInput & { _id?: string }) | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deleteArticleId, setDeleteArticleId] = useState<GridRowId | null>(null);

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedArticles = await getAllArticlesAdmin();
            setArticles(fetchedArticles.map(a => ({ ...a, id: a._id })));
        } catch (err: any) {
            setError(err.message || 'Failed to load articles.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setCurrentArticle({ title: '', content: '', keywords: [], category: '', isEnabled: true });
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleOpenEditDialog = (article: ArticleRow) => {
        setIsEditMode(true);
        setCurrentArticle({ ...article });
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenFormDialog(false);
        setCurrentArticle(null);
    };

    const handleFormSubmit = async () => {
        if (!currentArticle || !currentArticle.title || !currentArticle.content) {
            setFormError("Title and Content are required.");
            return;
        }
        setIsSubmitting(true);
        setFormError(null);

        const payload: KnowledgeBaseArticleInput = {
            title: currentArticle.title,
            content: currentArticle.content,
            keywords: currentArticle.keywords,
            isEnabled: currentArticle.isEnabled,
        };

        try {
            if (isEditMode && currentArticle._id) {
                await updateArticleAdmin(currentArticle._id, payload);
            } else {
                await createArticleAdmin(payload);
            }
            fetchArticles();
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.message || 'Failed to save article.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteArticleId) return;
        setIsSubmitting(true);
        try {
            await deleteArticleAdmin(deleteArticleId.toString());
            fetchArticles();
        } catch (err: any) {
            setError(err.message || 'Failed to delete article.');
        } finally {
            setIsSubmitting(false);
            setDeleteArticleId(null);
        }
    };

    const columns = useMemo((): GridColDef<ArticleRow>[] => [
        { field: 'title', headerName: 'Title', width: 250, flex: 0.3 },
        { field: 'category', headerName: 'Category', width: 150, flex: 0.15, renderCell: params => params.value ? <Chip label={params.value} size="small" color="primary" variant="outlined" /> : <Typography variant="body2" color="text.secondary">—</Typography> },
        { field: 'content', headerName: 'Content Preview', width: 400, flex: 0.4, renderCell: params => <Typography noWrap variant="body2">{params.value}</Typography> },
        { field: 'keywords', headerName: 'Keywords', width: 200, flex: 0.2, renderCell: params => <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{(params.value as string[])?.map((k: string) => <Chip key={k} label={k} size="small" />)}</Box> },
        { field: 'isEnabled', headerName: 'Enabled', width: 100, type: 'boolean', renderCell: params => params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="action" /> },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 100,
            getActions: ({ row }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpenEditDialog(row)} />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => setDeleteArticleId(row.id)} />,
            ],
        },
    ], []);

    if (isLoading) return (
        <AdminLayout title="Knowledge Base">
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Knowledge Base">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>Chatbot Knowledge Base</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>Add New Article</Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper sx={{ height: 650, width: '100%' }}>
                <DataGrid rows={articles} columns={columns} disableRowSelectionOnClick />
            </Paper>

            {/* Create/Edit Dialog */}
            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Article' : 'Create New Article'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentArticle && (
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid sx={{width: {xs: '100%'}}}>
                                <TextField autoFocus name="title" label="Title" fullWidth value={currentArticle.title} onChange={e => setCurrentArticle(p => p ? {...p, title: e.target.value} : null)} required />
                            </Grid>
                            <Grid sx={{width: {xs: '100%'}}}>
                                <TextField name="category" label="Category (Optional)" fullWidth value={currentArticle.category || ''} onChange={e => setCurrentArticle(p => p ? {...p, category: e.target.value} : null)} helperText="e.g., Getting Started, Account, Features, Troubleshooting" />
                            </Grid>
                            <Grid sx={{width: {xs: '100%'}}}>
                                <TextField name="content" label="Content" fullWidth multiline rows={8} value={currentArticle.content} onChange={e => setCurrentArticle(p => p ? {...p, content: e.target.value} : null)} required />
                            </Grid>
                            <Grid sx={{width: {xs: '100%'}}}>
                                <Autocomplete multiple freeSolo options={[]} value={currentArticle.keywords}
                                    onChange={(_, newValue) => setCurrentArticle(p => p ? {...p, keywords: newValue} : null)}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...tagProps } = getTagProps({ index });
                                            return <Chip key={key} label={option} {...tagProps} />;
                                        })
                                    }
                                    renderInput={(params) => <TextField {...params} label="Keywords" helperText="Press Enter to add a keyword." />}
                                />
                            </Grid>
                            <Grid sx={{width: {xs: '100%'}}}>
                                <FormControlLabel control={<Switch checked={currentArticle.isEnabled} onChange={e => setCurrentArticle(p => p ? {...p, isEnabled: e.target.checked} : null)} />} label="Enabled" />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Save Article'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteArticleId} onClose={() => setDeleteArticleId(null)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete this article?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteArticleId(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminKnowledgeBasePage;
