import React, { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Alert, Box, Breadcrumbs, Link as MuiLink,
    CircularProgress, Paper, LinearProgress, Button, Grid, TextField,
    FormControl, InputLabel, Select, OutlinedInput, Chip, MenuItem, type SelectChangeEvent
} from '@mui/material';

import { initiateVideoUpload, type InitiateUploadPayload } from '../services/adminService';
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getModulesForCourseAdmin, type Module } from '../services/moduleAdminService';
import * as tus from 'tus-js-client';

const AdminCreateVideoPage: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [courseIds, setCourseIds] = useState<string[]>([]);
    const [moduleIds, setModuleIds] = useState<string[]>([]);
    const [requiredPlanIds, setRequiredPlanIds] = useState<string[]>([]);

    // Page state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Data for dropdowns
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
    const [allModules, setAllModules] = useState<Module[]>([]);

    const fetchOptions = useCallback(async () => {
        setIsLoadingOptions(true);
        try {
            const [plansData, coursesData] = await Promise.all([
                getAllSubscriptionPlansAdmin(),
                getAllCoursesAdmin()
            ]);
            
            setAvailablePlans(plansData || []);
            setAvailableCourses(coursesData || []);
            if (coursesData && coursesData.length > 0) {
                const modulePromises = coursesData.map(course => getModulesForCourseAdmin(course._id));
                const modulesByCourse = await Promise.all(modulePromises);
                setAllModules(modulesByCourse.flat());
            }

        } catch (err: any) {
            setError(err.message || "Could not load form options.");
        } finally {
            setIsLoadingOptions(false);
        }
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '));
            }
        }
    };

    const handleMultiSelectChange = (event: SelectChangeEvent<string[]>) => {
        const { name, value } = event.target;
        const values = typeof value === 'string' ? value.split(',') : value;

        if (name === 'courseIds') {
            setCourseIds(values);
            setModuleIds([]); 
        }
        if (name === 'moduleIds') setModuleIds(values);
        if (name === 'requiredPlanIds') setRequiredPlanIds(values);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedFile || !title.trim()) {
            setError("A title and video file are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setUploadProgress(0);

        try {
            const payload: InitiateUploadPayload = {
                title, description, courseIds, moduleIds, requiredPlans: requiredPlanIds
            };
            const { uploadParameters, video } = await initiateVideoUpload(payload);

            const upload = new tus.Upload(selectedFile, {
                endpoint: `https://video.bunnycdn.com/tusupload`,
                retryDelays: [0, 3000, 5000, 10000],
                headers: {
                    AuthorizationSignature: uploadParameters.authorizationSignature,
                    AuthorizationExpire: String(uploadParameters.authorizationExpires),
                    VideoId: uploadParameters.videoId,
                    LibraryId: uploadParameters.libraryId,
                },
                metadata: { filetype: selectedFile.type, title },
                onError: (error) => {
                    setError(`Direct video upload failed: ${error.message}`);
                    setIsSubmitting(false);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100));
                },
                onSuccess: () => {
                    alert(`Video "${title}" uploaded successfully! It will now be processed.`);
                    navigate(`/admin/videos/edit/${video._id}`);
                },
            });
            upload.start();
        } catch (err: any) {
            setError(err.message || "Could not start the upload process.");
            setIsSubmitting(false);
        }
    };

    const availableModulesForSelectedCourses = useMemo(() => {
        if (courseIds.length === 0) return [];
        return allModules.filter(module => {
            const moduleCourseId = typeof module.course === 'string' ? module.course : module.course._id;
            return courseIds.includes(moduleCourseId);
        });
    }, [courseIds, allModules]);

    if (isLoadingOptions) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/videos">Manage Videos</MuiLink>
                <Typography color="text.primary">Create New Video</Typography>
            </Breadcrumbs>
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
                Create and Upload New Video
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={3} component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={3}>
                    <Grid sx={{ width: '100%' }}>
                        <TextField required fullWidth label="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <TextField required fullWidth type="file" label="Video File" InputLabelProps={{ shrink: true }} onChange={handleFileChange} disabled={isSubmitting} />
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <TextField fullWidth label="Video Description" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                        <FormControl fullWidth>
                            <InputLabel>Assign to Courses</InputLabel>
                            <Select name="courseIds" label="Assign to Courses" multiple value={courseIds} onChange={handleMultiSelectChange} input={<OutlinedInput label="Assign to Courses" />} renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(id => (<Chip key={id} label={availableCourses.find(c => c._id === id)?.title || '...'} />))}</Box>)}>
                                {availableCourses.map((course) => <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                        <FormControl fullWidth disabled={courseIds.length === 0}>
                            <InputLabel>Assign to Modules</InputLabel>
                            <Select name="moduleIds" label="Assign to Modules" multiple value={moduleIds} onChange={handleMultiSelectChange} input={<OutlinedInput label="Assign to Modules" />} renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(id => <Chip key={id} label={allModules.find(m => m._id === id)?.title || '...'} />)}</Box>}>
                                {availableModulesForSelectedCourses.map((module) => {
                                    const parentCourse = availableCourses.find(c => (typeof module.course === 'string' ? module.course : module.course._id) === c._id);
                                    const displayText = parentCourse ? `${module.title} (${parentCourse.title})` : module.title;
                                    return <MenuItem key={module._id} value={module._id}>{displayText}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                            <InputLabel>Required Subscription Plans</InputLabel>
                            <Select name="requiredPlanIds" label="Required Subscription Plans" multiple value={requiredPlanIds} onChange={handleMultiSelectChange} input={<OutlinedInput label="Required Subscription Plans" />} renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(id => (<Chip key={id} label={availablePlans.find(p => p._id === id)?.name || '...'} />))}</Box>)}>
                                {availablePlans.map((plan) => <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <Button type="submit" variant="contained" size="large" disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? "Uploading..." : "Create & Upload Video"}
                        </Button>
                    </Grid>
                    {isSubmitting && (
                        <Grid sx={{ width: '100%' }}>
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                                <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 1 }}>{uploadProgress}%</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Container>
    );
};

export default AdminCreateVideoPage;
