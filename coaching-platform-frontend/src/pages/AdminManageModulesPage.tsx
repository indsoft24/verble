// File: src/pages/admin/AdminManageModulesPage.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid,
    Breadcrumbs, Link as MuiLink, Select, MenuItem, InputLabel, FormControl, FormHelperText,
    Chip, OutlinedInput
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

import TiptapEditor from '../components/features/blog/LazyTiptapEditor';

import {
    getModulesForCourseAdmin,
    createModuleAdmin,
    updateModuleAdmin,
    deleteModuleAdmin,
    getModuleByIdAdmin,
    type Module,
    type ModuleInput
} from '../services/moduleAdminService';
import { getCourseByIdAdmin, type Course } from '../services/courseAdminService';
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

const AdminManageModulesPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [course, setCourse] = useState<Course | null>(null);
    const [modulesForGrid, setModulesForGrid] = useState<ModuleDataGridRow[]>([]);
    const [allSubscriptionPlans, setAllSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
    const [currentModule, setCurrentModule] = useState<ModuleInput & { _id?: string } | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [deleteModuleId, setDeleteModuleId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    // TiptapEditor state
    const [isGatedFileDialogOpen, setIsGatedFileDialogOpen] = useState(false);
    const [gatedFile, setGatedFile] = useState<File | null>(null);
    const [gatedFileLabel, setGatedFileLabel] = useState('');
    const [isUploadingGatedFile, setIsUploadingGatedFile] = useState(false);
    const [attachmentToInsert, setAttachmentToInsert] = useState<{ id: string; label: string } | null>(null);

    const fetchModulesAndCourse = useCallback(async () => {
        if (!courseId) {
            setError("Course ID is missing from URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [courseData, fetchedModules, fetchedPlans] = await Promise.all([
                getCourseByIdAdmin(courseId),
                getModulesForCourseAdmin(courseId),
                getAllSubscriptionPlansAdmin()
            ]);
            setCourse(courseData);
            const modulesWithId = fetchedModules.map(mod => ({ ...mod, id: mod._id }));
            setModulesForGrid(modulesWithId || []);
            setAllSubscriptionPlans(fetchedPlans || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load modules or course details.');
            setModulesForGrid([]);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchModulesAndCourse();
    }, [fetchModulesAndCourse]);

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
    
    const handleFormSubmit = async () => {
        if (!currentModule || !currentModule.title || !courseId) {
            setFormError("Title is required and Course ID must be present.");
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
                await createModuleAdmin(courseId, modulePayload);
            }
            fetchModulesAndCourse(); 
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
            fetchModulesAndCourse(); 
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

    const columns = useMemo((): GridColDef<ModuleDataGridRow>[] => [ 
        { field: 'title', headerName: 'Module Title', width: 250, flex: 0.3 },
        { field: 'description', headerName: 'Description', width: 300, flex: 0.3, 
            renderCell: (params: GridRenderCellParams<ModuleDataGridRow>) => (
                <Tooltip title={params.value || ''} placement="bottom-start">
                    <Typography noWrap variant="body2">{params.value || 'N/A'}</Typography>
                </Tooltip>
            )
        },
        { 
            field: 'subscriptionPlans', headerName: 'Subscription Plans', width: 200, flex: 0.2,
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
    

    if (isLoading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/courses">Courses</MuiLink>
                <Typography color="text.primary">{course ? course.title : 'Course Modules'}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
                        Manage Modules for: {course?.title || '...'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                        Course ID: {courseId}
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

            <Paper sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={modulesForGrid} 
                    columns={columns}
                    paginationModel={{ page: 0, pageSize: 10 }}
                    pageSizeOptions={[5, 10, 20]}
                    disableRowSelectionOnClick
                    // No slots.toolbar prop needed for this simplified button placement
                />
            </Paper>

            {/* Create/Edit Module Dialog */}
            <Dialog open={openFormDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Module' : 'Create New Module'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    {currentModule && (
                        <Grid container spacing={2} sx={{pt: 1}}>
                            <Grid sx={{ width:{ xs: '100%' }}}>
                                <TextField autoFocus margin="dense" name="title" label="Module Title" fullWidth value={currentModule.title} onChange={handleFormChange} required disabled={isSubmitting}/>
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
    );
};

export default AdminManageModulesPage;