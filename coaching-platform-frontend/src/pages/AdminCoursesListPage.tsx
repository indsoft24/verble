// File: src/pages/admin/AdminCoursesListPage.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { stripHtmlTags } from '../utils/htmlUtils';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid,
    Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl, type SelectChangeEvent,
    FormHelperText, Chip, InputAdornment, OutlinedInput
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
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import TiptapEditor from '../components/features/blog/TiptapEditor';

import {
    getAllCoursesAdmin,
    createCourseAdmin,
    updateCourseAdmin,
    deleteCourseAdmin,
    getCourseByIdAdmin,
    type Course,
    type CourseInput
} from '../services/courseAdminService'; 
import { getAllExamCategoriesAdmin, type ExamCategory } from '../services/examCategoryService';
import { getImageUrl } from '../utils/imageUtils';

interface CourseDataGridRow extends Course {
    id: string; 
}

const initialCourseFormData: CourseInput = {
    title: '',
    description: '',
    isPublished: false,
    examCategory: '',
};

const gridDateFormatter = (value: string | undefined | null): string => {
    if (!value) return '';
    try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) { return 'Invalid Date'; }
};

const AdminCoursesListPage: React.FC = () => {
    const [coursesForGrid, setCoursesForGrid] = useState<CourseDataGridRow[]>([]);
    const [allExamCategories, setAllExamCategories] = useState<ExamCategory[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentCourse, setCurrentCourse] = useState<CourseInput & { _id?: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deleteCourseId, setDeleteCourseId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
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

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedCourses, fetchedCategories] = await Promise.all([
                getAllCoursesAdmin(),
                getAllExamCategoriesAdmin()
            ]);
            
            const coursesWithId = fetchedCourses.map(course => ({ ...course, id: course._id }));
            setCoursesForGrid(coursesWithId || []);
            setAllExamCategories(fetchedCategories || []);

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load page data.');
            setCoursesForGrid([]);
            setAllExamCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const filteredCourses = useMemo(() => {
        return coursesForGrid.filter(course => {
            const titleMatch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
            const descMatch = stripHtmlTags(course.description || '', 500).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSearch = searchTerm.trim() === '' || titleMatch || descMatch;

            const courseCategoryId = typeof course.examCategory === 'object'
                ? course.examCategory?._id
                : course.examCategory;
            const matchesCategory = selectedCategoryIds.length === 0 ||
                (courseCategoryId && selectedCategoryIds.includes(courseCategoryId));

            const matchesPublished =
                publishedFilter === 'all' ||
                (publishedFilter === 'published' && course.isPublished) ||
                (publishedFilter === 'unpublished' && !course.isPublished);

            return matchesSearch && matchesCategory && matchesPublished;
        });
    }, [coursesForGrid, searchTerm, selectedCategoryIds, publishedFilter]);

    const hasActiveFilters = useMemo(() => {
        return searchTerm.trim() !== '' ||
            selectedCategoryIds.length > 0 ||
            publishedFilter !== 'all';
    }, [searchTerm, selectedCategoryIds, publishedFilter]);

    useEffect(() => {
        setPaginationModel(prev => {
            const maxPage = Math.max(0, Math.ceil(filteredCourses.length / prev.pageSize) - 1);
            if (prev.page > maxPage) {
                return { ...prev, page: maxPage };
            }
            return prev;
        });
    }, [filteredCourses]);

    const visibleCount = filteredCourses.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(
                filteredCourses.length - paginationModel.page * paginationModel.pageSize,
                paginationModel.pageSize
            )
        );

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategoryIds([]);
        setPublishedFilter('all');
    };

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setCurrentCourse({ ...initialCourseFormData });
        setSelectedImage(null);
        setImagePreview(null);
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleOpenEditDialog = async (courseId: GridRowId) => {
        setIsEditMode(true);
        setFormError(null);
        try {
            const courseToEdit = await getCourseByIdAdmin(courseId.toString());
            const categoryId = typeof courseToEdit.examCategory === 'string' 
                ? courseToEdit.examCategory 
                : courseToEdit.examCategory._id;

            setCurrentCourse({
                _id: courseToEdit._id,
                title: courseToEdit.title,
                description: courseToEdit.description || '',
                isPublished: courseToEdit.isPublished || false,
                examCategory: categoryId
            });
            setSelectedImage(null);
            setImagePreview(courseToEdit.image ? getImageUrl(courseToEdit.image, 'course') : null);
            setOpenFormDialog(true);
        } catch (err: any) {
            setError("Failed to load course details for editing.");
        }
    };

    const handleCloseDialog = () => {
        setOpenFormDialog(false);
        setCurrentCourse(null);
        setSelectedImage(null);
        setImagePreview(null);
        setFormError(null);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
    ) => {
        if (!currentCourse) return;
    
        // Handle Switch (isPublished) separately
        if (
            event.target.name === 'isPublished' &&
            'checked' in event.target
        ) {
            setCurrentCourse(prev => prev ? ({ ...prev, isPublished: (event.target as HTMLInputElement).checked }) : null);
        } else {
            const { name, value } = event.target;
            setCurrentCourse(prev => prev ? ({ ...prev, [name]: value }) : null);
        }
    };
    
    const handleFormSubmit = async () => {
        if (!currentCourse || !currentCourse.title || !currentCourse.examCategory) {
            setFormError("Title and Exam Category are required.");
            return;
        }
        setFormError(null);
        setIsSubmitting(true);

        try {
            let coursePayload;
            
            if (selectedImage) {
                // Use FormData for file upload
                coursePayload = new FormData();
                coursePayload.append('title', currentCourse.title);
                coursePayload.append('description', currentCourse.description || '');
                coursePayload.append('isPublished', (currentCourse.isPublished ?? false).toString());
                coursePayload.append('examCategory', currentCourse.examCategory);
                coursePayload.append('image', selectedImage);
            } else {
                // Use regular object for updates without new image
                coursePayload = {
                    title: currentCourse.title,
                    description: currentCourse.description,
                    isPublished: currentCourse.isPublished,
                    examCategory: currentCourse.examCategory,
                };
            }

            if (isEditMode && currentCourse._id) {
                await updateCourseAdmin(currentCourse._id, coursePayload);
            } else {
                await createCourseAdmin(coursePayload);
            }
            fetchPageData(); 
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.response?.data?.message || err.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!deleteCourseId) return;
        setIsSubmitting(true); 
        setError(null);
        try {
            await deleteCourseAdmin(deleteCourseId.toString());
            setOpenDeleteConfirm(false);
            setDeleteCourseId(null);
            fetchPageData(); 
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete course.');
            setOpenDeleteConfirm(false); 
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleManageModules = (courseId: GridRowId) => {
        navigate(`/admin/courses/${courseId}/modules`);
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

    const columns = useMemo((): GridColDef<CourseDataGridRow>[] => [ 
        { field: 'title', headerName: 'Course Title', width: 300, flex: 0.4 },
        { field: 'description', headerName: 'Description', width: 400, flex: 0.4, 
            renderCell: (params: GridRenderCellParams<CourseDataGridRow>) => {
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
            renderCell: (params: GridRenderCellParams<CourseDataGridRow, boolean>) => 
                params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="action" />
        },
        { 
            field: 'createdAt', headerName: 'Created At', width: 180, type: 'dateTime', 
            valueFormatter: (params)=> gridDateFormatter(params)
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 180, cellClassName: 'actions',
            getActions: ({ id }) => [ // Removed 'row' as it's not used directly here
                <GridActionsCellItem icon={<EditIcon />} label="Edit Course" onClick={() => handleOpenEditDialog(id)} color="inherit"/>,
                <GridActionsCellItem icon={<SchoolIcon />} label="Manage Modules" onClick={() => handleManageModules(id)} color="primary"/>,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete Course" onClick={() => { setDeleteCourseId(id); setOpenDeleteConfirm(true); }} color="inherit"/>,
            ],
        },
    ], [navigate]); 
    

    if (isLoading) return (
        <AdminLayout title="Courses">
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Courses">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>
                        Manage Courses
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                        Add New Course
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
                    <Grid sx={{ width: { xs: '100%', md: '40%' } }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by title or description..."
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
                    <Grid sx={{ width: { xs: '100%', md: '35%' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Exam Categories</InputLabel>
                            <Select
                                multiple
                                value={selectedCategoryIds}
                                onChange={(e) => setSelectedCategoryIds(e.target.value as string[])}
                                input={<OutlinedInput label="Exam Categories" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as string[]).map((value) => {
                                            const category = allExamCategories.find(cat => cat._id === value);
                                            return (
                                                <Chip key={value} label={category?.name || value} size="small" />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {allExamCategories.map((category) => (
                                    <MenuItem key={category._id} value={category._id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
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
                        {selectedCategoryIds.length > 0 && (
                            <Chip
                                label={`Categories: ${selectedCategoryIds.length}`}
                                onDelete={() => setSelectedCategoryIds([])}
                                size="small"
                            />
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
                    Showing {visibleCount} of {filteredCourses.length} courses
                </Typography>
            </Box>

            <Paper sx={{ height: 650, width: '100%' }}>
                <DataGrid
                    rows={filteredCourses} 
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Create/Edit Course Dialog */}
            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentCourse && (
                        <Grid container spacing={2} sx={{pt: 1}}>
                            <Grid sx={{ width: {xs: '100%'} }} >
                                <TextField autoFocus margin="dense" name="title" label="Course Title" fullWidth value={currentCourse.title} onChange={handleFormChange} required disabled={isSubmitting}/>
                            </Grid>
                            <Grid  sx={{ width: {xs: '100%'} }} >
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel id="exam-category-select-label">Exam Category</InputLabel>
                                    <Select
                                        labelId="exam-category-select-label"
                                        name="examCategory"
                                        value={typeof currentCourse.examCategory === 'object' ? currentCourse.examCategory : currentCourse.examCategory}
                                        label="Exam Category"
                                        onChange={handleFormChange}
                                        disabled={isSubmitting || allExamCategories.length === 0}
                                    >
                                        <MenuItem value=""><em>-- Select a Category --</em></MenuItem>
                                        {allExamCategories.map((cat) => (
                                            <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{ width: {xs: '100%'} }}>
                                <Typography variant="subtitle1">Description*</Typography>
                                <TiptapEditor
                                    content={currentCourse.description || ''}
                                    onChange={(newContent) => setCurrentCourse(prev => prev ? { ...prev, description: newContent } : null)}
                                    readOnly={isUploadingGatedFile}
                                    onAddGatedFileClick={handleOpenGatedFileDialog}
                                    attachmentToInsert={attachmentToInsert}
                                    onAttachmentInserted={() => setAttachmentToInsert(null)}
                                />
                                <FormHelperText sx={{ mt: 0.5 }}>Use the rich text editor above for your course description.</FormHelperText>
                            </Grid>
                            <Grid sx={{ width: {xs: '100%'} }}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="course-image-upload"
                                    type="file"
                                    onChange={handleImageChange}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="course-image-upload">
                                    <Button variant="outlined" component="span" disabled={isSubmitting} sx={{ mb: 2 }}>
                                        Upload Course Image
                                    </Button>
                                </label>
                                {imagePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Course preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </Box>
                                )}
                            </Grid>
                            <Grid sx={{ width: {xs: '100%'} }}>
                                <FormControlLabel control={<Switch checked={currentCourse.isPublished || false} onChange={handleFormChange} name="isPublished" />} label="Published" disabled={isSubmitting}/>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{p: '16px 24px'}}>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : (isEditMode ? 'Save Changes' : 'Create Course')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <DialogTitle>Confirm Course Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this course? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleDeleteCourse} color="error" variant="contained" autoFocus disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24}/> : "Delete Course"}
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

export default AdminCoursesListPage;