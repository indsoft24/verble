// File: src/pages/admin/AdminModulesListPage.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { stripHtmlTags } from '../utils/htmlUtils';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid,
    Select, MenuItem, InputLabel, FormControl, FormHelperText,
    Chip, OutlinedInput, IconButton, InputAdornment
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
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import TiptapEditor from '../components/features/blog/TiptapEditor';

import {
    getAllModulesAdmin,
    createModuleAdmin,
    updateModuleAdmin,
    deleteModuleAdmin,
    getModuleByIdAdmin,
    type Module,
    type ModuleInput
} from '../services/moduleAdminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { getImageUrl } from '../utils/imageUtils';

interface ModuleDataGridRow extends Module {
    id: string;
}

const initialModuleFormData: ModuleInput = {
    title: '',
    description: '',
    subscriptionPlans: [],
    order: 0,
};

const gridDateFormatter = (value: string | undefined | null): string => {
    if (!value) return '';
    try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) { return 'Invalid Date'; }
};

const AdminModulesListPage: React.FC = () => {
    const navigate = useNavigate();

    const [modulesForGrid, setModulesForGrid] = useState<ModuleDataGridRow[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [allSubscriptionPlans, setAllSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentModule, setCurrentModule] = useState<ModuleInput & { _id?: string; course?: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deleteModuleId, setDeleteModuleId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

    // TiptapEditor state
    const [isGatedFileDialogOpen, setIsGatedFileDialogOpen] = useState(false);
    const [gatedFile, setGatedFile] = useState<File | null>(null);
    const [gatedFileLabel, setGatedFileLabel] = useState('');
    const [isUploadingGatedFile, setIsUploadingGatedFile] = useState(false);
    const [attachmentToInsert, setAttachmentToInsert] = useState<{ id: string; label: string } | null>(null);

    const fetchModulesAndData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedModules, fetchedCourses, fetchedPlans] = await Promise.all([
                getAllModulesAdmin(),
                getAllCoursesAdmin(),
                getAllSubscriptionPlansAdmin()
            ]);
            
            const modulesWithId = fetchedModules.map(mod => ({ ...mod, id: mod._id }));
            setModulesForGrid(modulesWithId || []);
            setAllCourses(fetchedCourses || []);
            setAllSubscriptionPlans(fetchedPlans || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModulesAndData();
    }, [fetchModulesAndData]);

    const filteredModules = useMemo(() => {
        return modulesForGrid.filter(module => {
            const matchesSearch = searchTerm.trim() === '' ||
                module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stripHtmlTags(module.description || '', 200).toLowerCase().includes(searchTerm.toLowerCase());

            const moduleCourseId = typeof module.course === 'object' ? module.course?._id : module.course;
            const matchesCourse = selectedCourseIds.length === 0 ||
                (moduleCourseId && selectedCourseIds.includes(moduleCourseId));

            const planIds = Array.isArray(module.subscriptionPlans)
                ? module.subscriptionPlans.map(plan => typeof plan === 'object' ? plan._id : plan)
                : [];
            const matchesPlans = selectedPlanIds.length === 0 ||
                planIds.some(planId => selectedPlanIds.includes(planId));

            return matchesSearch && matchesCourse && matchesPlans;
        });
    }, [modulesForGrid, searchTerm, selectedCourseIds, selectedPlanIds]);

    const hasActiveFilters = useMemo(() => {
        return searchTerm.trim() !== '' ||
            selectedCourseIds.length > 0 ||
            selectedPlanIds.length > 0;
    }, [searchTerm, selectedCourseIds, selectedPlanIds]);

    useEffect(() => {
        setPaginationModel(prev => {
            const maxPage = Math.max(0, Math.ceil(filteredModules.length / prev.pageSize) - 1);
            if (prev.page > maxPage) {
                return { ...prev, page: maxPage };
            }
            return prev;
        });
    }, [filteredModules]);

    const visibleCount = filteredModules.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(
                filteredModules.length - paginationModel.page * paginationModel.pageSize,
                paginationModel.pageSize
            )
        );

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCourseIds([]);
        setSelectedPlanIds([]);
    };

    const handleOpenCreateDialog = () => {
        setIsEditMode(false);
        setCurrentModule({ ...initialModuleFormData });
        setSelectedImage(null);
        setImagePreview(null);
        setFormError(null);
        setOpenFormDialog(true);
    };

    const handleOpenEditDialog = async (moduleId: GridRowId) => {
        setIsEditMode(true);
        setFormError(null);
        try {
            const moduleToEdit = await getModuleByIdAdmin(moduleId.toString());
            
            // Handle subscriptionPlans - convert to array of IDs
            let subscriptionPlans: string[] = [];
            if (moduleToEdit.subscriptionPlans) {
                if (Array.isArray(moduleToEdit.subscriptionPlans)) {
                    subscriptionPlans = moduleToEdit.subscriptionPlans.map(plan => 
                        typeof plan === 'object' && plan !== null ? plan._id : plan
                    );
                }
            }
            
            setCurrentModule({
                _id: moduleToEdit._id,
                title: moduleToEdit.title,
                description: moduleToEdit.description || '',
                subscriptionPlans: subscriptionPlans,
                order: moduleToEdit.order || 0,
                course: typeof moduleToEdit.course === 'object' ? moduleToEdit.course._id : moduleToEdit.course,
            });
            setSelectedImage(null);
            setImagePreview(moduleToEdit.image ? getImageUrl(moduleToEdit.image, 'module') : null);
            setOpenFormDialog(true);
        } catch (err: any) {
            setError("Failed to load module details for editing.");
        }
    };

    const handleCloseDialog = () => {
        setOpenFormDialog(false);
        setCurrentModule(null);
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

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentModule) return;
        const { name, value } = event.target;
        if (name === "order") {
            setCurrentModule(prev => prev ? ({ ...prev, [name]: parseInt(value, 10) || 0 }) : null);
        } else {
            setCurrentModule(prev => prev ? ({ ...prev, [name]: value }) : null);
        }
    };

    const handleSubscriptionPlansChange = (event: any) => {
        if (!currentModule) return;
        const value = event.target.value;
        setCurrentModule(prev => prev ? ({ 
            ...prev, 
            subscriptionPlans: typeof value === 'string' ? value.split(',') : value 
        }) : null);
    };

    const handleCourseChange = (event: any) => {
        if (!currentModule) return;
        setCurrentModule(prev => prev ? ({ 
            ...prev, 
            course: event.target.value 
        }) : null);
    };
    
    const handleFormSubmit = async () => {
        if (!currentModule || !currentModule.title || !currentModule.course) {
            setFormError("Title and Course are required.");
            return;
        }
        setFormError(null);
        setIsSubmitting(true);

        try {
            let modulePayload;
            
            if (selectedImage) {
                // Use FormData for file upload
                modulePayload = new FormData();
                modulePayload.append('title', currentModule.title);
                modulePayload.append('description', currentModule.description || '');
                modulePayload.append('subscriptionPlans', JSON.stringify(currentModule.subscriptionPlans || []));
                modulePayload.append('order', (currentModule.order ?? 0).toString());
                modulePayload.append('image', selectedImage);
            } else {
                // Use regular object for updates without new image
                modulePayload = {
                    title: currentModule.title,
                    description: currentModule.description,
                    subscriptionPlans: currentModule.subscriptionPlans || [],
                    order: currentModule.order,
                };
            }

            if (isEditMode && currentModule._id) {
                await updateModuleAdmin(currentModule._id, modulePayload);
            } else {
                await createModuleAdmin(currentModule.course, modulePayload);
            }
            fetchModulesAndData(); 
            handleCloseDialog();
        } catch (err: any) {
            setFormError(err.response?.data?.message || err.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteModule = async () => {
        if (!deleteModuleId) return;
        setIsSubmitting(true); 
        setError(null);
        try {
            await deleteModuleAdmin(deleteModuleId.toString());
            setOpenDeleteConfirm(false);
            setDeleteModuleId(null);
            fetchModulesAndData(); 
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete module.');
            setOpenDeleteConfirm(false); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManageVideos = (moduleId: GridRowId) => {
        navigate(`/admin/modules/${moduleId}/videos`);
    };

    const handleGoToCourse = (courseId: string) => {
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
            // Implementation for gated file upload
            // This would typically upload the file and return an attachment ID
            const mockAttachmentId = `attachment_${Date.now()}`;
            setAttachmentToInsert({ id: mockAttachmentId, label: gatedFileLabel });
            setIsGatedFileDialogOpen(false);
            setGatedFile(null);
            setGatedFileLabel('');
        } catch (error) {
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploadingGatedFile(false);
        }
    };

    const columns = useMemo((): GridColDef<ModuleDataGridRow>[] => [ 
        { field: 'title', headerName: 'Module Title', width: 250, flex: 0.25 },
        { 
            field: 'course', headerName: 'Course', width: 200, flex: 0.2,
            renderCell: (params: GridRenderCellParams<ModuleDataGridRow>) => {
                const course = params.value as { _id: string; title: string } | string;
                const courseTitle = typeof course === 'object' ? course.title : 'Unknown Course';
                const courseId = typeof course === 'object' ? course._id : course;
                
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                            {courseTitle}
                        </Typography>
                        <IconButton 
                            size="small" 
                            onClick={() => handleGoToCourse(courseId)}
                            title="Go to Course Modules"
                        >
                            <SchoolIcon fontSize="small" />
                        </IconButton>
                    </Box>
                );
            }
        },
        { field: 'description', headerName: 'Description', width: 300, flex: 0.25, 
            renderCell: (params: GridRenderCellParams<ModuleDataGridRow>) => {
                const plainText = stripHtmlTags(params.value, 100);
                return (
                    <Tooltip title={plainText} placement="bottom-start">
                        <Typography noWrap variant="body2">{plainText || 'N/A'}</Typography>
                    </Tooltip>
                );
            }
        },
        { 
            field: 'subscriptionPlans', headerName: 'Subscription Plans', width: 200, flex: 0.15,
            renderCell: (params: GridRenderCellParams<ModuleDataGridRow>) => {
                const plans = params.value as { _id: string; name: string; price: number; currency: string }[] | string[] | undefined;
                if (!plans || plans.length === 0) {
                    return <Typography variant="body2" color="text.secondary">No plans</Typography>;
                }
                
                const planNames = plans.map(plan => 
                    typeof plan === 'string' ? plan : plan.name
                );
                
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {planNames.slice(0, 2).map((name, index) => (
                            <Chip key={index} label={name} size="small" variant="outlined" />
                        ))}
                        {planNames.length > 2 && (
                            <Chip label={`+${planNames.length - 2}`} size="small" variant="outlined" />
                        )}
                    </Box>
                );
            }
        },
        { field: 'order', headerName: 'Order', type: 'number', width: 80 },
        { 
            field: 'createdAt', headerName: 'Created At', width: 150, type: 'dateTime', 
            valueFormatter: (params) => gridDateFormatter(params)
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 200, cellClassName: 'actions',
            getActions: ({ id }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit Module" onClick={() => handleOpenEditDialog(id)} color="inherit"/>,
                <GridActionsCellItem icon={<VideoLibraryIcon />} label="Manage Videos" onClick={() => handleManageVideos(id)} color="primary"/>,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete Module" onClick={() => { setDeleteModuleId(id); setOpenDeleteConfirm(true); }} color="inherit"/>,
            ],
        },
    ], [navigate, handleOpenEditDialog]);
    

    if (isLoading) return (
        <AdminLayout title="Modules">
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        </AdminLayout>
    );

    return (
        <AdminLayout title="All Modules">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" component="h1" fontWeight={600} gutterBottom sx={{ mb: 0 }}>
                            Manage All Modules
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                        Total Modules: {modulesForGrid.length}
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />} 
                    onClick={handleOpenCreateDialog}
                >
                    Add New Module
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
                            placeholder="Search modules..."
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
                    <Grid sx={{ width: { xs: '100%', md: '30%' } }}>
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
                    <Grid sx={{ width: { xs: '100%', md: '30%' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Subscription Plans</InputLabel>
                            <Select
                                multiple
                                value={selectedPlanIds}
                                onChange={(e) => setSelectedPlanIds(e.target.value as string[])}
                                input={<OutlinedInput label="Subscription Plans" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as string[]).map((value) => {
                                            const plan = allSubscriptionPlans.find(p => p._id === value);
                                            return <Chip key={value} label={plan?.name || value} size="small" />;
                                        })}
                                    </Box>
                                )}
                            >
                                {allSubscriptionPlans.map(plan => (
                                    <MenuItem key={plan._id} value={plan._id}>
                                        {plan.name}
                                    </MenuItem>
                                ))}
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
                        {selectedPlanIds.length > 0 && (
                            <Chip
                                label={`Plans: ${selectedPlanIds.length}`}
                                onDelete={() => setSelectedPlanIds([])}
                                size="small"
                            />
                        )}
                    </Box>
                )}
            </Paper>

            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {visibleCount} of {filteredModules.length} modules
                </Typography>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredModules} 
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 20, 50]}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Create/Edit Module Dialog */}
            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Module' : 'Create New Module'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentModule && (
                        <Grid container spacing={2} sx={{pt: 1}}>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <TextField autoFocus margin="dense" name="title" label="Module Title" fullWidth value={currentModule.title} onChange={handleFormChange} required disabled={isSubmitting}/>
                            </Grid>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <FormControl fullWidth margin="dense" required>
                                    <InputLabel id="course-select-label">Course</InputLabel>
                                    <Select
                                        labelId="course-select-label"
                                        name="course"
                                        value={currentModule.course || ''}
                                        label="Course"
                                        onChange={handleCourseChange}
                                        disabled={isSubmitting || isEditMode}
                                    >
                                        {allCourses.map((course) => (
                                            <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <Typography variant="subtitle1">Description*</Typography>
                                <TiptapEditor
                                    content={currentModule.description || ''}
                                    onChange={(newContent) => setCurrentModule(prev => prev ? { ...prev, description: newContent } : null)}
                                    readOnly={isUploadingGatedFile}
                                    onAddGatedFileClick={handleOpenGatedFileDialog}
                                    attachmentToInsert={attachmentToInsert}
                                    onAttachmentInserted={() => setAttachmentToInsert(null)}
                                />
                                <FormHelperText sx={{ mt: 0.5 }}>Use the rich text editor above for your module description.</FormHelperText>
                            </Grid>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="module-image-upload"
                                    type="file"
                                    onChange={handleImageChange}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="module-image-upload">
                                    <Button variant="outlined" component="span" disabled={isSubmitting} sx={{ mb: 2 }}>
                                        Upload Module Image
                                    </Button>
                                </label>
                                {imagePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Module preview"
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
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel id="subscription-plans-select-label">Subscription Plans (Optional)</InputLabel>
                                    <Select
                                        labelId="subscription-plans-select-label"
                                        multiple
                                        value={currentModule.subscriptionPlans || []}
                                        onChange={handleSubscriptionPlansChange}
                                        input={<OutlinedInput label="Subscription Plans (Optional)" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {(selected as string[]).map((value) => {
                                                    const plan = allSubscriptionPlans.find(p => p._id === value);
                                                    return (
                                                        <Chip key={value} label={plan?.name || value} size="small" />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                        disabled={isSubmitting}
                                    >
                                        {allSubscriptionPlans.map((plan) => (
                                            <MenuItem key={plan._id} value={plan._id}>
                                                {plan.name} - ₹{plan.price}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>Select multiple subscription plans that can access this module</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <TextField margin="dense" name="order" label="Order" type="number" fullWidth value={currentModule.order || 0} onChange={handleFormChange} InputProps={{ inputProps: { min: 0 } }} disabled={isSubmitting}/>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{p: '16px 24px'}}>
                    <Button onClick={handleCloseDialog} color="inherit" disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : (isEditMode ? 'Save Changes' : 'Create Module')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <DialogTitle>Confirm Module Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this module? This will dissociate it from any videos. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleDeleteModule} color="error" variant="contained" autoFocus disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24}/> : "Delete Module"}
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

export default AdminModulesListPage;
