import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
    Switch, FormControlLabel, FormHelperText, FormControl, InputLabel, Select, MenuItem,
    Chip, InputAdornment, Grid
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId,
    type GridRenderCellParams,
    type GridPaginationModel,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import TiptapEditor from '../components/features/blog/LazyTiptapEditor';
import { stripHtmlTags } from '../utils/htmlUtils';

// --- CORRECTED: Changed import path from alias to relative ---
import {
    getAllExamCategoriesAdmin,
    createExamCategoryAdmin,
    updateExamCategoryAdmin,
    deleteExamCategoryAdmin,
    type ExamCategory,
    type ExamCategoryInput
} from '../services/examCategoryService';

interface ExamCategoryRow extends ExamCategory {
    id: string; // Required by DataGrid
}

const initialCategoryFormData: ExamCategoryInput = {
    name: '',
    description: '',
    imageUrl: '',
    isPublished: true,
};

const AdminExamCategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<ExamCategoryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentCategory, setCurrentCategory] = useState<ExamCategoryInput & { _id?: string } | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deleteCategoryId, setDeleteCategoryId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all');
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    // TiptapEditor state
    const [isGatedFileDialogOpen, setIsGatedFileDialogOpen] = useState(false);
    const [gatedFile, setGatedFile] = useState<File | null>(null);
    const [gatedFileLabel, setGatedFileLabel] = useState('');
    const [isUploadingGatedFile, setIsUploadingGatedFile] = useState(false);
    const [attachmentToInsert, setAttachmentToInsert] = useState<{ id: string; label: string } | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedCategories = await getAllExamCategoriesAdmin();
            const categoriesWithId = fetchedCategories.map(cat => ({ ...cat, id: cat._id }));
            setCategories(categoriesWithId || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load exam categories.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            const descPlainText = stripHtmlTags(category.description || '', 500).toLowerCase();
            const matchesSearch = searchTerm.trim() === '' ||
                category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                descPlainText.includes(searchTerm.toLowerCase());

            const matchesPublished =
                publishedFilter === 'all' ||
                (publishedFilter === 'published' && category.isPublished) ||
                (publishedFilter === 'unpublished' && !category.isPublished);

            return matchesSearch && matchesPublished;
        });
    }, [categories, searchTerm, publishedFilter]);

    const hasActiveFilters = useMemo(() => {
        return searchTerm.trim() !== '' || publishedFilter !== 'all';
    }, [searchTerm, publishedFilter]);

    useEffect(() => {
        setPaginationModel(prev => {
            const maxPage = Math.max(0, Math.ceil(filteredCategories.length / prev.pageSize) - 1);
            if (prev.page > maxPage) {
                return { ...prev, page: maxPage };
            }
            return prev;
        });
    }, [filteredCategories]);

    const visibleCount = filteredCategories.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(
                filteredCategories.length - paginationModel.page * paginationModel.pageSize,
                paginationModel.pageSize
            )
        );

    const handleClearFilters = () => {
        setSearchTerm('');
        setPublishedFilter('all');
    };

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setCurrentCategory({ ...initialCategoryFormData });
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleOpenEditDialog = (category: ExamCategoryRow) => {
        setIsEditMode(true);
        setFormError(null);
        setCurrentCategory({ ...category });
        setOpenFormDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenFormDialog(false);
        setCurrentCategory(null);
        setFormError(null);
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentCategory) return;
        const { name, value, type, checked } = event.target;
        setCurrentCategory(prev => prev ? ({ ...prev, [name]: type === 'checkbox' ? checked : value }) : null);
    };
    
    const handleFormSubmit = async () => {
        if (!currentCategory || !currentCategory.name) {
            setFormError("Category name is required.");
            return;
        }
        setFormError(null);
        setIsSubmitting(true);

        // Only include fields that have values (filter out undefined)
        const payload: ExamCategoryInput = {
            name: currentCategory.name,
            ...(currentCategory.description !== undefined && { description: currentCategory.description }),
            ...(currentCategory.imageUrl !== undefined && { imageUrl: currentCategory.imageUrl }),
            ...(currentCategory.isPublished !== undefined && { isPublished: currentCategory.isPublished }),
        };

        try {
            if (isEditMode && currentCategory._id) {
                await updateExamCategoryAdmin(currentCategory._id, payload);
            } else {
                await createExamCategoryAdmin(payload);
            }
            fetchCategories(); 
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.response?.data?.message || err.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteCategoryId) return;
        setIsSubmitting(true); 
        setError(null);
        try {
            await deleteExamCategoryAdmin(deleteCategoryId.toString());
            fetchCategories(); 
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete category.');
        } finally {
            setIsSubmitting(false);
            setOpenDeleteConfirm(false);
            setDeleteCategoryId(null);
        }
    };
    
    // TiptapEditor handlers
    const handleOpenGatedFileDialog = () => {
        setIsGatedFileDialogOpen(true);
    };

    const handleGatedFileUpload = async () => {
        if (!gatedFile || !gatedFileLabel.trim()) {
            alert('Please provide both a file and a label.');
            return;
        }

        setIsUploadingGatedFile(true);
        try {
            // For now, we'll just simulate the upload since we don't have the upload service
            // In a real implementation, you'd call the appropriate upload service
            const mockAttachmentId = `attachment_${Date.now()}`;
            setAttachmentToInsert({
                id: mockAttachmentId,
                label: gatedFileLabel.trim()
            });
            setIsGatedFileDialogOpen(false);
            setGatedFile(null);
            setGatedFileLabel('');
        } catch (error) {
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploadingGatedFile(false);
        }
    };
    
    const columns: GridColDef<ExamCategoryRow>[] = useMemo(() => [
        { field: 'name', headerName: 'Category Name', width: 250, flex: 0.3 },
        { 
            field: 'description', 
            headerName: 'Description', 
            width: 400, 
            flex: 0.4,
            renderCell: (params: GridRenderCellParams<ExamCategoryRow>) => {
                const plainText = stripHtmlTags(params.value, 100);
                return (
                    <Tooltip title={plainText} placement="bottom-start">
                        <Typography noWrap variant="body2">{plainText || 'N/A'}</Typography>
                    </Tooltip>
                );
            }
        },
        { 
            field: 'isPublished', headerName: 'Published', width: 120, type: 'boolean',
            renderCell: (params: GridRenderCellParams<ExamCategoryRow, boolean>) => 
                params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="action" />
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 120,
            getActions: ({ row }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpenEditDialog(row)} color="inherit"/>,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => { setDeleteCategoryId(row.id); setOpenDeleteConfirm(true); }} color="inherit"/>,
            ],
        },
    ], []);
    
    if (isLoading) return (
        <AdminLayout title="Exam Categories">
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Exam Categories">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>
                        Manage Exam Categories
                    </Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                    Add New Category
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Filters & Search
                    </Typography>
                    {hasActiveFilters && (
                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={handleClearFilters}
                        >
                            Clear All
                        </Button>
                    )}
                </Box>
                <Grid container spacing={2}>
                    <Grid sx={{ width: { xs: '100%', md: '60%' } }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', md: '40%' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Published Status</InputLabel>
                            <Select
                                value={publishedFilter}
                                label="Published Status"
                                onChange={(e) => setPublishedFilter(e.target.value as typeof publishedFilter)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="unpublished">Unpublished</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {hasActiveFilters && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {searchTerm && (
                            <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm('')} size="small" />
                        )}
                        {publishedFilter !== 'all' && (
                            <Chip
                                label={`Published: ${publishedFilter === 'published' ? 'Yes' : 'No'}`}
                                onDelete={() => setPublishedFilter('all')}
                                size="small"
                            />
                        )}
                    </Box>
                )}
            </Paper>

            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {visibleCount} of {filteredCategories.length} categories
                </Typography>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredCategories}
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Create/Edit Dialog */}
            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Exam Category' : 'Create New Exam Category'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentCategory && (
                        <Box component="form" sx={{ pt: 1 }}>
                            <TextField autoFocus margin="dense" name="name" label="Category Name" fullWidth value={currentCategory.name} onChange={handleFormChange} required disabled={isSubmitting}/>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Description*</Typography>
                            <TiptapEditor
                                content={currentCategory.description || ''}
                                onChange={(newContent) => setCurrentCategory(prev => prev ? { ...prev, description: newContent } : null)}
                                readOnly={isUploadingGatedFile}
                                onAddGatedFileClick={handleOpenGatedFileDialog}
                                attachmentToInsert={attachmentToInsert}
                                onAttachmentInserted={() => setAttachmentToInsert(null)}
                            />
                            <FormHelperText sx={{ mt: 0.5 }}>Use the rich text editor above for your exam category description.</FormHelperText>
                            <TextField margin="dense" name="imageUrl" label="Image URL (Optional)" fullWidth value={currentCategory.imageUrl || ''} onChange={handleFormChange} disabled={isSubmitting}/>
                            <FormControlLabel control={<Switch checked={currentCategory.isPublished} onChange={handleFormChange} name="isPublished" />} label="Published" disabled={isSubmitting}/>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{p: '16px 24px'}}>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : (isEditMode ? 'Save Changes' : 'Create Category')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this category? This can only be done if no courses are assigned to it.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleDeleteCategory} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24}/> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Gated File Dialog */}
            <Dialog open={isGatedFileDialogOpen} onClose={() => setIsGatedFileDialogOpen(false)}>
                <DialogTitle>Add Gated File</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Button Label (e.g., Download PDF)"
                        fullWidth
                        variant="standard"
                        value={gatedFileLabel}
                        onChange={(e) => setGatedFileLabel(e.target.value)}
                    />
                    <Button component="label" sx={{ mt: 2 }}>
                        Select File
                        <input type="file" hidden onChange={(e) => setGatedFile(e.target.files?.[0] || null)} />
                    </Button>
                    {gatedFile && <Typography variant="caption" sx={{ ml: 1 }}>{gatedFile.name}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsGatedFileDialogOpen(false)} disabled={isUploadingGatedFile}>Cancel</Button>
                    <Button onClick={handleGatedFileUpload} variant="contained" disabled={isUploadingGatedFile}>
                        {isUploadingGatedFile ? <CircularProgress size={24} /> : "Upload & Insert"}
                    </Button>
                </DialogActions>
            </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminExamCategoriesPage;
