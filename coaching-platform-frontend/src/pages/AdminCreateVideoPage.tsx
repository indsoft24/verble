import React, { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Alert, Box, Breadcrumbs, Link as MuiLink,
    CircularProgress, Paper, LinearProgress, Button, Grid, TextField,
    FormControl, InputLabel, Select, OutlinedInput, Chip, MenuItem, type SelectChangeEvent
} from '@mui/material';

import {
    initiateVideoUpload,
    uploadVideoFileAdmin,
    type InitiateUploadPayload,
} from '../services/adminService';
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getModulesForCourseAdmin, type Module } from '../services/moduleAdminService';
import AdminLayout from '../components/layout/AdminLayout';
import {
    DEFAULT_VIDEO_COURSE_ID,
    DEFAULT_VIDEO_REQUIRED_PLAN_ID,
    FALLBACK_VIDEO_COURSE_NAME,
    FALLBACK_VIDEO_REQUIRED_PLAN_NAME,
} from '../config/adminDefaults';

type UploadPhase = 'idle' | 'creating' | 'uploading' | 'done';

const AdminCreateVideoPage: React.FC = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [courseIds, setCourseIds] = useState<string[]>([]);
    const [moduleIds, setModuleIds] = useState<string[]>([]);
    const [requiredPlanIds, setRequiredPlanIds] = useState<string[]>([]);

    const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
    const [allModules, setAllModules] = useState<Module[]>([]);

    const isSubmitting = uploadPhase === 'creating' || uploadPhase === 'uploading';
    const configuredDefaultsLocked = true;

    const fetchOptions = useCallback(async () => {
        setIsLoadingOptions(true);
        try {
            const [plansData, coursesData] = await Promise.all([
                getAllSubscriptionPlansAdmin(),
                getAllCoursesAdmin()
            ]);
            
            setAvailablePlans(plansData || []);
            setAvailableCourses(coursesData || []);
            const resolvedCourseId =
                (coursesData || []).find((course) => course._id === DEFAULT_VIDEO_COURSE_ID)?._id ||
                (coursesData || []).find(
                    (course) =>
                        course.title.trim().toLowerCase() ===
                        FALLBACK_VIDEO_COURSE_NAME.trim().toLowerCase()
                )?._id ||
                (coursesData || [])[0]?._id ||
                '';
            const resolvedPlanId =
                (plansData || []).find((plan) => plan._id === DEFAULT_VIDEO_REQUIRED_PLAN_ID)?._id ||
                (plansData || []).find(
                    (plan) =>
                        plan.name.trim().toLowerCase() ===
                        FALLBACK_VIDEO_REQUIRED_PLAN_NAME.trim().toLowerCase()
                )?._id ||
                (plansData || [])[0]?._id ||
                '';
            setCourseIds(resolvedCourseId ? [resolvedCourseId] : []);
            setRequiredPlanIds(resolvedPlanId ? [resolvedPlanId] : []);
            if (coursesData && coursesData.length > 0) {
                const modulePromises = coursesData.map(course => getModulesForCourseAdmin(course._id));
                const modulesByCourse = await Promise.all(modulePromises);
                setAllModules(modulesByCourse.flat());
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Could not load form options.';
            setError(message);
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
            if (configuredDefaultsLocked) return;
            setCourseIds(values);
            setModuleIds([]); 
        }
        if (name === 'moduleIds') setModuleIds(values);
        if (name === 'requiredPlanIds') {
            if (configuredDefaultsLocked) return;
            setRequiredPlanIds(values);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedFile || !title.trim()) {
            setError("A title and video file are required.");
            return;
        }
        if (courseIds.length === 0 || requiredPlanIds.length === 0) {
            setError('Default course/plan configuration is missing. Please set admin default IDs.');
            return;
        }

        setError(null);
        setUploadProgress(0);
        setUploadPhase('creating');

        try {
            const payload: InitiateUploadPayload = {
                title,
                description,
                courseIds,
                moduleIds,
                requiredPlans: requiredPlanIds,
            };
            const { video } = await initiateVideoUpload(payload);

            setUploadPhase('uploading');
            setUploadProgress(1);
            await uploadVideoFileAdmin(video._id, selectedFile, setUploadProgress);

            setUploadPhase('done');
            setUploadProgress(100);
            alert(`Video "${title}" uploaded successfully. Transcoding has started — you can publish once processing finishes.`);
            navigate(`/admin/videos/edit/${video._id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Could not upload the video.';
            setError(message);
            setUploadPhase('idle');
        }
    };

    const availableModulesForSelectedCourses = useMemo(() => {
        if (courseIds.length === 0) return [];
        return allModules.filter(module => {
            const moduleCourseId = typeof module.course === 'string' ? module.course : module.course._id;
            return courseIds.includes(moduleCourseId);
        });
    }, [courseIds, allModules]);

    const progressLabel =
        uploadPhase === 'creating'
            ? 'Creating video record…'
            : uploadPhase === 'uploading'
              ? `Uploading to server… ${uploadProgress}%`
              : '';

    if (isLoadingOptions) {
        return (
            <AdminLayout title="Create Video">
                <Container sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Create Video">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/videos">Manage Videos</MuiLink>
                <Typography color="text.primary">Create New Video</Typography>
            </Breadcrumbs>
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Create and Upload New Video
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Videos are stored on this server and transcoded automatically after upload (HLS).
                Keep this tab open and in the foreground until the upload bar reaches 100%.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={3} component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={3}>
                    <Grid sx={{ width: '100%' }}>
                        <TextField required fullWidth label="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <TextField
                            required
                            fullWidth
                            type="file"
                            label="Video File"
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ accept: 'video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v' }}
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            helperText={selectedFile ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'MP4, MOV, MKV, WebM, and other common formats'}
                        />
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <TextField fullWidth label="Video Description" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                        <FormControl fullWidth disabled={configuredDefaultsLocked}>
                            <InputLabel>Assign to Courses</InputLabel>
                            <Select name="courseIds" label="Assign to Courses" multiple value={courseIds} onChange={handleMultiSelectChange} input={<OutlinedInput label="Assign to Courses" />} renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(id => (<Chip key={id} label={availableCourses.find(c => c._id === id)?.title || '...'} />))}</Box>)}>
                                {availableCourses.map((course) => <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>)}
                            </Select>
                            {configuredDefaultsLocked && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, ml: 1.5 }}>
                                    Defaulted by platform configuration.
                                </Typography>
                            )}
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
                        <FormControl fullWidth disabled={configuredDefaultsLocked}>
                            <InputLabel>Required Subscription Plans</InputLabel>
                            <Select name="requiredPlanIds" label="Required Subscription Plans" multiple value={requiredPlanIds} onChange={handleMultiSelectChange} input={<OutlinedInput label="Required Subscription Plans" />} renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(id => (<Chip key={id} label={availablePlans.find(p => p._id === id)?.name || '...'} />))}</Box>)}>
                                {availablePlans.map((plan) => <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>)}
                            </Select>
                            {configuredDefaultsLocked && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, ml: 1.5 }}>
                                    Defaulted by platform configuration.
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>
                    <Grid sx={{ width: '100%' }}>
                        <Button type="submit" variant="contained" size="large" disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? 'Uploading…' : 'Create & Upload Video'}
                        </Button>
                    </Grid>
                    {isSubmitting && (
                        <Grid sx={{ width: '100%' }}>
                            <Box sx={{ width: '100%', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {progressLabel}
                                </Typography>
                                <LinearProgress
                                    variant={uploadPhase === 'uploading' ? 'determinate' : 'indeterminate'}
                                    value={uploadPhase === 'uploading' ? uploadProgress : undefined}
                                />
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Container>
        </AdminLayout>
    );
};

export default AdminCreateVideoPage;
