import React, { useState, useEffect, useCallback, } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Alert, Box, Breadcrumbs, Link as MuiLink,
    CircularProgress, Paper,
} from '@mui/material';

import AdminVideoForm, { type VideoFormState } from '../components/features/video/AdminVideoForm';
import {
    getVideoByIdAdmin, updateVideoAdmin, type VideoMetadata, type UpdateVideoAdminData
} from '../services/adminService';
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getModulesForCourseAdmin, type Module } from '../services/moduleAdminService';
import AssociatedMaterials from '../components/features/Material/AssociatedMaterials'

const AdminEditVideoPage: React.FC = () => {
    const { id: videoId } = useParams<{ id: string }>();

    const [initialFormData, setInitialFormData] = useState<Partial<VideoFormState> | null>(null);
    const [allSubscriptionPlans, setAllSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [allModules, setAllModules] = useState<Module[]>([]);

    const [fullVideoMetadata, setFullVideoMetadata] = useState<VideoMetadata | null>(null);
    
    const [isFetchingPageData, setIsFetchingPageData] = useState<boolean>(true);
    const [fetchPageError, setFetchPageError] = useState<string | null>(null);
    
    const [isMetadataSubmitting, setIsMetadataSubmitting] = useState<boolean>(false);
    const [metadataUpdateSuccess, setMetadataUpdateSuccess] = useState<string | null>(null);
    const [metadataUpdateError, setMetadataUpdateError] = useState<string | null>(null);

    // Fetch the initial page data when the component mounts
    const fetchPageData = useCallback(async () => {
        if (!videoId) {
            setFetchPageError("Video ID is missing from URL parameter.");
            setIsFetchingPageData(false);
            return;
        }
        setIsFetchingPageData(true);
        setFetchPageError(null);
        try {
            const [videoData, plansData, coursesData] = await Promise.all([
                getVideoByIdAdmin(videoId),
                getAllSubscriptionPlansAdmin(),
                getAllCoursesAdmin(),
            ]);

            // Set the primary data for the page
            setFullVideoMetadata(videoData);
            setAllSubscriptionPlans(plansData || []);
            setAllCourses(coursesData || []);

            // After fetching courses, fetch all their associated modules
            if (coursesData && coursesData.length > 0) {
                const modulePromises = coursesData.map(course => getModulesForCourseAdmin(course._id));
                const modulesByCourse = await Promise.all(modulePromises);
                setAllModules(modulesByCourse.flat()); // Create a single flat array of all modules
            }
            
            // Now, prepare the initial form data with the correct IDs
            const currentRequiredPlanIds = videoData.requiredPlans?.map(p => typeof p === 'string' ? p : p._id).filter(id => id) || [];
            const currentCourseIds = videoData.courses?.map(c => typeof c === 'string' ? c : c._id).filter(id => id) || [];
            const currentModuleIds = videoData.modules?.map(m => typeof m === 'string' ? m : m._id).filter(id => id) || [];

            setInitialFormData({
                title: videoData.title || '',
                description: videoData.description || '',
                isPublished: videoData.isPublished || false,
                order: videoData.order || 0,
                tags: videoData.tags || [],
                courseIds: currentCourseIds,
                moduleIds: currentModuleIds,
                requiredPlanIds: currentRequiredPlanIds,
            });

        } catch (err: any) {
            setFetchPageError(err.message || 'Failed to fetch page data.');
        } finally {
            setIsFetchingPageData(false);
        }
    }, [videoId]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleMetadataFormSubmit = async (submittedFormData: VideoFormState) => {
        if (!videoId) return;

        setIsMetadataSubmitting(true);
        setMetadataUpdateError(null);
        setMetadataUpdateSuccess(null);

        const payload: UpdateVideoAdminData = {
            title: submittedFormData.title,
            description: submittedFormData.description,
            isPublished: submittedFormData.isPublished,
            order: submittedFormData.order,
            tags: submittedFormData.tags,
            courseIds: submittedFormData.courseIds,
            moduleIds: submittedFormData.moduleIds,
            requiredPlans: submittedFormData.requiredPlanIds,
        };

        try {
            await updateVideoAdmin(videoId, payload);
            setMetadataUpdateSuccess('Video metadata updated successfully!');
            fetchPageData();
        } catch (err: any) {
            setMetadataUpdateError(err.message || 'Failed to update metadata.');
        } finally {
            setIsMetadataSubmitting(false);
        }
    };
    
    if (isFetchingPageData) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography>Loading video details...</Typography>
            </Container>
        );
    }
    
    if (fetchPageError) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{fetchPageError}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/videos">Manage Videos</MuiLink>
                <Typography color="text.primary">Edit: {fullVideoMetadata?.title || videoId}</Typography>
            </Breadcrumbs>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
                {metadataUpdateError && <Alert severity="error" sx={{ mb: 2 }}>{metadataUpdateError}</Alert>}
                {metadataUpdateSuccess && <Alert severity="success" sx={{ mb: 2 }}>{metadataUpdateSuccess}</Alert>}
                
                {initialFormData ? (
                    <AdminVideoForm
                        isEditMode={true}
                        initialData={initialFormData}
                        onSubmit={handleMetadataFormSubmit}
                        isLoading={isMetadataSubmitting}
                        availableSubscriptionPlans={allSubscriptionPlans}
                        availableCourses={allCourses}
                        availableModules={allModules}
                        formTitle="Edit Video Metadata"
                        submitButtonText="Save Metadata Changes"
                    />
                ) : (
                    <Box sx={{textAlign: 'center', p: 2}}><CircularProgress /></Box>
                )}
            </Paper>
            {videoId && <AssociatedMaterials videoId={videoId} />}
        </Container>
    );
};

export default AdminEditVideoPage;
