import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid,
    Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl,
    type SelectChangeEvent, FormHelperText, Chip, InputAdornment, OutlinedInput
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

import {
    getAllSubscriptionPlansAdmin,
    createSubscriptionPlanAdmin,
    updateSubscriptionPlanAdmin,
    deleteSubscriptionPlanAdmin,
    type SubscriptionPlan,
    type SubscriptionPlanInput,
} from '../services/subscriptionPlanAdminService';

import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getImageUrl } from '../utils/imageUtils';

interface SubscriptionPlanRow extends SubscriptionPlan {
    id: string;
}

const initialPlanFormData: SubscriptionPlanInput = {
    name: '',
    description: '',
    price: 0,
    currency: 'INR', // Default to INR as per backend changes
    duration: { value: 1, unit: 'month' },
    features: [],
    isActive: true,
    stripePriceId: '',
    course: '',
    topic: '',
    subTopic: '',
};


type GridDateFormatter = (value: string | undefined | null) => string;

const gridDateFormatter: GridDateFormatter = (value) => {
    if (!value) return '';
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
};


const AdminSubscriptionPlansListPage: React.FC = () => {
    const [plansForGrid, setPlansForGrid] = useState<SubscriptionPlanRow[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanInput | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deletePlanId, setDeletePlanId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
            const [fetchedPlans, fetchedCourses] = await Promise.all([
                getAllSubscriptionPlansAdmin(),
                getAllCoursesAdmin()
            ]);
            const plansWithId = fetchedPlans.map(plan => ({ ...plan, id: plan._id }));
            setPlansForGrid(plansWithId || []);
            setAllCourses(fetchedCourses || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load page data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const filteredPlans = useMemo(() => {
        return plansForGrid.filter(plan => {
            const matchesSearch = searchTerm.trim() === '' ||
                plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plan.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plan.subTopic || '').toLowerCase().includes(searchTerm.toLowerCase());

            const courseId = typeof plan.course === 'object' && plan.course !== null ? plan.course._id : plan.course;
            const matchesCourse = selectedCourseIds.length === 0 ||
                (courseId && selectedCourseIds.includes(courseId));

            const matchesActive =
                activeFilter === 'all' ||
                (activeFilter === 'active' && plan.isActive) ||
                (activeFilter === 'inactive' && !plan.isActive);

            return matchesSearch && matchesCourse && matchesActive;
        });
    }, [plansForGrid, searchTerm, selectedCourseIds, activeFilter]);

    const hasActiveFilters = useMemo(() => {
        return searchTerm.trim() !== '' ||
            selectedCourseIds.length > 0 ||
            activeFilter !== 'all';
    }, [searchTerm, selectedCourseIds, activeFilter]);

    useEffect(() => {
        setPaginationModel(prev => {
            const maxPage = Math.max(0, Math.ceil(filteredPlans.length / prev.pageSize) - 1);
            if (prev.page > maxPage) {
                return { ...prev, page: maxPage };
            }
            return prev;
        });
    }, [filteredPlans]);

    const visibleCount = filteredPlans.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(
                filteredPlans.length - paginationModel.page * paginationModel.pageSize,
                paginationModel.pageSize
            )
        );

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCourseIds([]);
        setActiveFilter('all');
    };

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setCurrentPlan({ ...initialPlanFormData, duration: { ...initialPlanFormData.duration }, features: [] });
        setSelectedImage(null);
        setImagePreview(null);
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleOpenEditDialog = (plan: SubscriptionPlanRow) => {
        setIsEditMode(true);
        const courseId = typeof plan.course === 'object' && plan.course !== null ? plan.course._id : plan.course;
        setCurrentPlan({
            ...plan,
            features: plan.features ? plan.features.join(', ') : '',
            duration: plan.duration ? { ...plan.duration } : { value: 1, unit: 'month' },
            course: courseId,
        } as unknown as SubscriptionPlanInput);
        setSelectedImage(null);
        setImagePreview(plan.image ? getImageUrl(plan.image, 'subscription') : null);
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenFormDialog(false);
        setCurrentPlan(null);
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

    // --- THIS IS THE CORRECTED handleFormChange FUNCTION ---
    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        if (!currentPlan) return;
        const { name, value } = event.target;

        switch (name) {
            case 'isActive':
                const checked = (event as React.ChangeEvent<HTMLInputElement>).target.checked;
                setCurrentPlan(prev => prev ? { ...prev, isActive: checked } : null);
                break;
            case 'price':
                setCurrentPlan(prev => prev ? { ...prev, price: parseInt(value, 10) || 0 } : null);
                break;
            case 'currency':
                // Allow user to type, convert to uppercase, and limit to 3 chars
                setCurrentPlan(prev => prev ? { ...prev, currency: value.toUpperCase().slice(0, 3) } : null);
                break;
            case 'durationValue':
                // Correctly update the nested duration value
                const numValue = parseInt(value, 10);
                setCurrentPlan(prev => prev ? {
                    ...prev,
                    duration: { ...prev.duration!, value: isNaN(numValue) ? 1 : numValue }
                } : null);
                break;
            case 'durationUnit':
                // Correctly update the nested duration unit
                setCurrentPlan(prev => prev ? {
                    ...prev,
                    duration: { ...prev.duration!, unit: value as 'day' | 'week' | 'month' | 'year' }
                } : null);
                break;
            default:
                // Handle all other standard fields (name, description, etc.)
                setCurrentPlan(prev => prev ? { ...prev, [name]: value } : null);
                break;
        }
    };
    
    const handleFormSubmit = async () => {
        if (!currentPlan || !currentPlan.course) {
            setFormError("A course must be selected for this plan.");
            return;
        }
        setFormError(null);
        setIsSubmitting(true);

        const featuresArray = (typeof currentPlan.features === 'string')
            ? (currentPlan.features as string).split(',').map(f => f.trim()).filter(f => f)
            : (currentPlan.features || []);

        try {
            let planPayload;
            
            if (selectedImage) {
                // Use FormData for file upload
                planPayload = new FormData();
                planPayload.append('name', currentPlan.name);
                planPayload.append('description', currentPlan.description || '');
                planPayload.append('price', currentPlan.price.toString());
                planPayload.append('currency', currentPlan.currency);
                planPayload.append('durationValue', currentPlan.duration?.value.toString() || '1');
                planPayload.append('durationUnit', currentPlan.duration?.unit || 'month');
                planPayload.append('features', JSON.stringify(featuresArray));
                planPayload.append('isActive', currentPlan.isActive.toString());
                planPayload.append('stripePriceId', currentPlan.stripePriceId || '');
                planPayload.append('course', typeof currentPlan.course === 'object' ? currentPlan.course._id : currentPlan.course);
                planPayload.append('topic', currentPlan.topic || '');
                planPayload.append('subTopic', currentPlan.subTopic || '');
                planPayload.append('image', selectedImage);
            } else {
                // Use regular object for updates without new image
                planPayload = {
                    name: currentPlan.name,
                    description: currentPlan.description,
                    price: Number(currentPlan.price),
                    currency: currentPlan.currency,
                    duration: { value: Number(currentPlan.duration?.value || 1), unit: currentPlan.duration?.unit || 'month' },
                    features: featuresArray,
                    isActive: currentPlan.isActive,
                    stripePriceId: currentPlan.stripePriceId,
                    course: typeof currentPlan.course === 'object' ? currentPlan.course._id : currentPlan.course,
                    topic: currentPlan.topic,
                    subTopic: currentPlan.subTopic,
                };
            }

            if (isEditMode && currentPlan._id) {
                await updateSubscriptionPlanAdmin(currentPlan._id, planPayload);
            } else {
                await createSubscriptionPlanAdmin(planPayload);
            }
            fetchPageData();
            handleCloseDialog();
        } catch (err: any) { setFormError(err.response?.data?.message || err.message || 'Submission failed.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeletePlan = async () => {
        if (!deletePlanId) return;
        setIsSubmitting(true);
        try {
            await deleteSubscriptionPlanAdmin(deletePlanId.toString());
            fetchPageData();
        } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to delete plan.'); }
        finally {
            setIsSubmitting(false);
            setOpenDeleteConfirm(false);
            setDeletePlanId(null);
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


    const columns = useMemo((): GridColDef<SubscriptionPlanRow>[] => [
        { field: 'name', headerName: 'Plan Name', width: 200, flex: 0.2 },
        {
            field: 'course', headerName: 'Course', width: 200, flex: 0.2,
            renderCell: (params: GridRenderCellParams<SubscriptionPlanRow>) => {
                const course = params.row.course;
                if (typeof course === 'object' && course !== null && 'title' in course) {
                    return course.title;
                }
                return 'N/A';
            }
        },
        {
            field: 'price', headerName: 'Price', width: 130, type: 'number',
            renderCell: (params: GridRenderCellParams<SubscriptionPlanRow>) => {
                if (!params.row || params.row.price == null || typeof params.row.currency !== 'string') return <span>N/A</span>;
                return <span>{`${(params.row.price / 100).toFixed(2)} ${params.row.currency.toUpperCase()}`}</span>;
            }
        },
        {
            field: 'duration', headerName: 'Duration', width: 150,
            renderCell: (params: GridRenderCellParams<SubscriptionPlanRow>) => {
                if (!params.row || !params.row.duration || typeof params.row.duration.value !== 'number' || !params.row.duration.unit) return <span>N/A</span>;
                return <span>{`${params.row.duration.value} ${params.row.duration.unit}(s)`}</span>;
            }
        },
        { field: 'topic', headerName: 'Topic', width: 120, flex: 0.15 },
        { field: 'subTopic', headerName: 'Sub Topic', width: 150, flex: 0.2 },
        {
            field: 'isActive', headerName: 'Active', width: 100, type: 'boolean',
            renderCell: (params: GridRenderCellParams<SubscriptionPlanRow, boolean>) => params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />
        },
        {
            field: 'features', headerName: 'Features', width: 250, flex: 0.3,
            renderCell: (params: GridRenderCellParams<SubscriptionPlanRow>) => {
                if (!params.row || !Array.isArray(params.row.features) || params.row.features.length === 0) return <span>No features listed</span>;
                return <span>{params.row.features.join(', ')}</span>;
            }
        },
        {
            field: 'createdAt', headerName: 'Created At', width: 180, type: 'dateTime',
            valueFormatter: (params) => gridDateFormatter(params)
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 100, cellClassName: 'actions',
            getActions: ({ id, row }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpenEditDialog(row as SubscriptionPlanRow)} color="inherit" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => { setDeletePlanId(id); setOpenDeleteConfirm(true); }} color="inherit" />,
            ],
        },
    ], []);

    if (isLoading) return (
        <AdminLayout title="Subscription Plans">
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        </AdminLayout>
    );
    if (plansForGrid === null) return (
        <AdminLayout title="Subscription Plans">
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Error: Plans data is null.</Alert>
            </Container>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Subscription Plans">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>
                        Manage Subscription Plans
                    </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                >
                    Add New Plan
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
                            placeholder="Search by plan, topic, or sub-topic..."
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
                            <InputLabel>Courses</InputLabel>
                            <Select
                                multiple
                                value={selectedCourseIds}
                                onChange={(e) => setSelectedCourseIds(e.target.value as string[])}
                                input={<OutlinedInput label="Courses" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as string[]).map((value) => {
                                            const course = allCourses.find(c => c._id === value);
                                            return <Chip key={value} label={course?.title || value} size="small" />;
                                        })}
                                    </Box>
                                )}
                            >
                                {allCourses.map(course => (
                                    <MenuItem key={course._id} value={course._id}>
                                        {course.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Active Status</InputLabel>
                            <Select
                                value={activeFilter}
                                label="Active Status"
                                onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {hasActiveFilters && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {searchTerm && (
                            <Chip label={`Search: ${searchTerm}`} onDelete={() => setSearchTerm('')} size="small" />
                        )}
                        {selectedCourseIds.length > 0 && (
                            <Chip
                                label={`Courses: ${selectedCourseIds.length}`}
                                onDelete={() => setSelectedCourseIds([])}
                                size="small"
                            />
                        )}
                        {activeFilter !== 'all' && (
                            <Chip
                                label={`Active: ${activeFilter === 'active' ? 'Yes' : 'No'}`}
                                onDelete={() => setActiveFilter('all')}
                                size="small"
                            />
                        )}
                    </Box>
                )}
            </Paper>

            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {visibleCount} of {filteredPlans.length} plans
                </Typography>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredPlans}
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                />
            </Paper>

            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentPlan && (
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid sx={{width:{xs :"100%"}}}>
                                <FormControl fullWidth margin="dense" required error={!currentPlan.course}>
                                    <InputLabel id="course-select-label">Course</InputLabel>
                                    <Select
                                        labelId="course-select-label"
                                        name="course"
                                        value={typeof currentPlan.course === 'object' && currentPlan.course !== null ? currentPlan.course._id : currentPlan.course || ''}
                                        label="Course"
                                        onChange={handleFormChange}
                                        disabled={isSubmitting || allCourses.length === 0}
                                    >
                                        <MenuItem value=""><em>-- Select a Course --</em></MenuItem>
                                        {allCourses.map((course) => (
                                            <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{width:{xs :"100%"}}}><TextField autoFocus margin="dense" name="name" label="Plan Name" fullWidth value={currentPlan.name} onChange={handleFormChange} required /></Grid>
                            <Grid sx={{width:{xs :"100%"}}}><TextField margin="dense" name="topic" label="Topic (e.g., UPSC, Law, Government)" fullWidth value={currentPlan.topic || ''} onChange={handleFormChange} helperText="Main category for filtering plans" /></Grid>
                            <Grid sx={{width:{xs :"100%"}}}><TextField margin="dense" name="subTopic" label="Sub Topic (e.g., Full UPSC course, Only G.S, Only CSAT, Optional)" fullWidth value={currentPlan.subTopic || ''} onChange={handleFormChange} helperText="Sub-category for more specific filtering" /></Grid>
                            <Grid sx={{width:{xs :"100%"}}}>
                                <Typography variant="subtitle1">Description*</Typography>
                                <TiptapEditor
                                    content={currentPlan.description || ''}
                                    onChange={(newContent) => setCurrentPlan(prev => prev ? { ...prev, description: newContent } : null)}
                                    readOnly={isUploadingGatedFile}
                                    onAddGatedFileClick={handleOpenGatedFileDialog}
                                    attachmentToInsert={attachmentToInsert}
                                    onAttachmentInserted={() => setAttachmentToInsert(null)}
                                />
                                <FormHelperText sx={{ mt: 0.5 }}>Use the rich text editor above for your subscription plan description.</FormHelperText>
                            </Grid>
                            <Grid sx={{width:{xs :"100%"}}}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="subscription-image-upload"
                                    type="file"
                                    onChange={handleImageChange}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="subscription-image-upload">
                                    <Button variant="outlined" component="span" disabled={isSubmitting} sx={{ mb: 2 }}>
                                        Upload Subscription Plan Image
                                    </Button>
                                </label>
                                {imagePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Subscription plan preview"
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
                            <Grid sx={{width:{xs :"100%", sm: "50%"}}}><TextField margin="dense" name="price" label="Price (in cents)" type="number" fullWidth value={currentPlan.price} onChange={handleFormChange} required InputProps={{ inputProps: { min: 0 } }} /></Grid>
                            
                            <Grid sx={{width:{xs :"100%", sm: "50%"}}}>
                                <TextField margin="dense" name="currency" label="Currency (e.g., INR)" fullWidth value={currentPlan.currency || ''} onChange={handleFormChange} required inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }} />
                            </Grid>

                            <Grid sx={{width:{xs :"100%", sm: "50%"}}}>
                                <TextField margin="dense" name="durationValue" label="Duration Value" type="number" fullWidth value={currentPlan.duration?.value || 1} onChange={handleFormChange} required InputProps={{ inputProps: { min: 1 } }} />
                            </Grid>

                            <Grid sx={{width:{xs :"100%", sm: "50%"}}}>
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel id="duration-unit-label">Duration Unit</InputLabel>
                                    <Select labelId="duration-unit-label" name="durationUnit" value={currentPlan.duration?.unit || 'month'} onChange={handleFormChange} label="Duration Unit">
                                        <MenuItem value="day">Day(s)</MenuItem><MenuItem value="week">Week(s)</MenuItem><MenuItem value="month">Month(s)</MenuItem><MenuItem value="year">Year(s)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{width:{xs :"100%"}}}><TextField margin="dense" name="features" label="Features (comma-separated)" fullWidth value={typeof currentPlan.features === 'string' ? currentPlan.features : (currentPlan.features || []).join(', ')} onChange={handleFormChange} helperText="e.g., Feature 1, Another Feature" /></Grid>
                            <Grid sx={{width:{xs :"100%"}}}><TextField margin="dense" name="stripePriceId" label="Stripe Price ID (Optional)" fullWidth value={currentPlan.stripePriceId || ''} onChange={handleFormChange} /></Grid>
                            <Grid sx={{width:{xs :"100%"}}}><FormControlLabel control={<Switch checked={currentPlan.isActive} onChange={handleFormChange} name="isActive" />} label="Plan is Active" /></Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Save Changes' : 'Create Plan')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete this plan?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleDeletePlan} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : "Delete"}
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

export default AdminSubscriptionPlansListPage;