import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper,
    Breadcrumbs, Link as MuiLink, Dialog, DialogActions, DialogContent, DialogTitle,
    DialogContentText, Autocomplete, TextField, Checkbox, Chip
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

import { 
    getVideosForModuleAdminService, 
    adminRemoveVideoFromModuleService,
    adminLinkVideosToModuleService,
    getAllVideosAdmin,
    type VideoMetadata, 
} from '../services/adminService';

import type { Module } from '../services/moduleAdminService';

interface VideoDataGridRow extends VideoMetadata {
    id: string; 
}

const AdminModuleVideosPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Module Videos' });
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();

    const [moduleDetails, setModuleDetails] = useState<Module | null>(null);
    const [videosForGrid, setVideosForGrid] = useState<VideoDataGridRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [videoToRemove, setVideoToRemove] = useState<VideoDataGridRow | null>(null);
    const [openRemoveConfirm, setOpenRemoveConfirm] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [openLinkVideoDialog, setOpenLinkVideoDialog] = useState<boolean>(false);
    const [allAvailableVideos, setAllAvailableVideos] = useState<VideoMetadata[]>([]);
    const [selectedVideosToLink, setSelectedVideosToLink] = useState<VideoMetadata[]>([]);
    const [isLoadingAllVideos, setIsLoadingAllVideos] = useState<boolean>(false);

    const fetchModuleVideos = useCallback(async () => {
        if (!moduleId) return;
        setIsLoading(true);
        setError(null);
        try {
            const { module: fetchedModule, videos: fetchedVideos } = await getVideosForModuleAdminService(moduleId);
            setModuleDetails(fetchedModule);
            setVideosForGrid(fetchedVideos.map(video => ({ ...video, id: video._id })));
        } catch (err: any) {
            setError(err.message || 'Failed to load videos for this module.');
        } finally {
            setIsLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        fetchModuleVideos();
    }, [fetchModuleVideos]);

    const handleEditVideo = (videoId: GridRowId) => {
        navigate(`/admin/videos/edit/${videoId}`);
    };

    // const handleManageVideos = (moduleId: GridRowId) => {
    //     navigate(`/admin/modules/${moduleId}/videos`);
    // };

    const openRemoveConfirmationDialog = (video: VideoDataGridRow) => {
        setVideoToRemove(video);
        setOpenRemoveConfirm(true);
    };

    const handleConfirmRemoveVideo = async () => {
        if (!moduleId || !videoToRemove) return;
        setIsSubmitting(true);
        try {
            await adminRemoveVideoFromModuleService(videoToRemove._id, moduleId);
            setSuccessMessage(`Video "${videoToRemove.title}" unlinked successfully.`);
            fetchModuleVideos();
        } catch (err: any) {
            setError(err.message || 'Failed to remove video.');
        } finally {
            setIsSubmitting(false);
            setOpenRemoveConfirm(false);
            setVideoToRemove(null);
        }
    };
    
    const handleOpenLinkVideoDialog = async () => {
        setIsLoadingAllVideos(true);
        setOpenLinkVideoDialog(true);
        try {
            const allVidsData = await getAllVideosAdmin(1, 1000); // Get a large number to fetch all videos
            const allVids = allVidsData.videos;
            const currentVideoIdsInModule = new Set(videosForGrid.map((v: VideoDataGridRow) => v._id));
            setAllAvailableVideos(allVids.filter((v: VideoMetadata) => !currentVideoIdsInModule.has(v._id)));
        } catch (err: any) {
            setError(err.message || "Failed to load available videos.");
        } finally {
            setIsLoadingAllVideos(false);
        }
        setSelectedVideosToLink([]);
    };

    const handleLinkVideoDialogClose = () => {
        setOpenLinkVideoDialog(false);
        setSelectedVideosToLink([]);
    };

    const handleConfirmLinkVideos = async () => {
        if (!moduleId || selectedVideosToLink.length === 0) return;
        setIsSubmitting(true);
        try {
            const videoIdsToLink = selectedVideosToLink.map(v => v._id);
            await adminLinkVideosToModuleService(moduleId, videoIdsToLink);
            setSuccessMessage(`${selectedVideosToLink.length} video(s) linked successfully.`);
            fetchModuleVideos();
            handleLinkVideoDialogClose();
        } catch (err: any) {
            setError(err.message || 'Failed to link videos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = useMemo((): GridColDef<VideoDataGridRow>[] => [
        { field: 'title', headerName: 'Video Title', flex: 1, minWidth: 250 },
        { 
            field: 'order', 
            headerName: 'Order',
            type: 'number', 
            width: 100,
            // --- FIX: Safely access the row's order property ---
            valueGetter: (params: GridRenderCellParams<VideoDataGridRow>) => params.row?.order ?? 0
        },
        { 
            field: 'isPublished', headerName: 'Published', width: 120,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow, boolean>) => 
                params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="action" />
        },
        { 
            field: 'videoStatus', headerName: 'Status', width: 180,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => (
                <Chip 
                    label={params.row?.videoStatus?.replace(/_/g, ' ') || 'N/A'} 
                    size="small" 
                    color={params.row?.videoStatus === 'AVAILABLE' ? 'success' : 'default'} 
                    variant="outlined"
                />
            )
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 150,
            getActions: ({ id, row }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit Video" onClick={() => handleEditVideo(id)} color="primary" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Unlink from Module" onClick={() => openRemoveConfirmationDialog(row)} color="inherit" />,
            ],
        },
    ], [navigate]);

    if (isLoading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

    const courseOfModule = typeof moduleDetails?.course === 'object' ? moduleDetails.course : null;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/courses">Courses</MuiLink>
                {courseOfModule && (
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to={`/admin/courses/${courseOfModule._id}/modules`}>
                        {courseOfModule.title}
                    </MuiLink>
                )}
                <Typography color="text.primary">{moduleDetails?.title || 'Module Videos'}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" component="h1">Videos in: {moduleDetails?.title || '...'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {moduleId && courseOfModule && (
                        <Button
                            variant="outlined"
                            component={RouterLink}
                            to={`/admin/module-quizzes?courseId=${courseOfModule._id}&moduleId=${moduleId}`}
                        >
                            Manage quiz
                        </Button>
                    )}
                    <Button variant="contained" color="primary" startIcon={<AddLinkIcon />} onClick={handleOpenLinkVideoDialog}>
                        Link Existing Video
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid rows={videosForGrid} columns={columns} disableRowSelectionOnClick />
            </Paper>

            {/* --- Dialogs --- */}
            <Dialog open={openRemoveConfirm} onClose={() => setOpenRemoveConfirm(false)}>
                <DialogTitle>Confirm Unlink</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to unlink the video "{videoToRemove?.title}" from this module?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRemoveConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleConfirmRemoveVideo} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24}/> : "Confirm"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openLinkVideoDialog} onClose={handleLinkVideoDialogClose} maxWidth="md" fullWidth>
                <DialogTitle>Link Existing Videos to: {moduleDetails?.title}</DialogTitle>
                <DialogContent>
                    {isLoadingAllVideos ? <Box sx={{display: 'flex', justifyContent: 'center', my:3}}><CircularProgress /></Box>
                    : (
                        <Autocomplete
                            multiple
                            options={allAvailableVideos}
                            getOptionLabel={(option) => option.title}
                            value={selectedVideosToLink}
                            onChange={(_, newValue) => setSelectedVideosToLink(newValue)}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            renderInput={(params) => <TextField {...params} variant="standard" label="Search and Select Videos" />}
                            // --- FIX: The `props` object from renderOption already contains the key. ---
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    <Checkbox checked={selected} sx={{mr:1}} />
                                    {option.title}
                                </li>
                            )}
                            sx={{mt:1}}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLinkVideoDialogClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleConfirmLinkVideos} color="primary" variant="contained" disabled={isSubmitting || selectedVideosToLink.length === 0}>
                        {isSubmitting ? <CircularProgress size={24}/> : "Link Selected"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminModuleVideosPage;
