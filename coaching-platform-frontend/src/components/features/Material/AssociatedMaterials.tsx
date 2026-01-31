import React, { useState } from 'react';
import { 
    Box, Typography, Button, TextField, List, ListItem, ListItemText, 
    IconButton, CircularProgress, Alert, Paper, Divider, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle 
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';

import { getVideoByIdAdmin, uploadMaterialForVideo, deleteMaterialForVideo, downloadMaterialForVideo } from '../../../services/adminService';

// --- The Final Component ---
const AssociatedMaterials = ({ videoId }: { videoId: string }) => {
    const queryClient = useQueryClient();
    const [label, setLabel] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<string | null>(null); 

    // 1. Fetch video data using the getVideoByIdAdmin service function
    const { data: video, isLoading, error: videoError } = useQuery({
        queryKey: ['videoAdmin', videoId], 
        queryFn: () => getVideoByIdAdmin(videoId),
        enabled: !!videoId,
    });
                                            
    // 2. Mutation for uploading a new material
    const uploadMutation = useMutation({
        mutationFn: uploadMaterialForVideo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videoAdmin', videoId] });
            setLabel('');
            setFile(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMaterialForVideo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videoAdmin', videoId] });
            setOpenDeleteConfirm(null); 
        },
    });

    // --- Event Handlers ---

    const handleDownload = async (materialId: string, fileName: string) => {
        try {
            const { fileData } = await downloadMaterialForVideo({ videoId, materialId, fileName });
            saveAs(fileData, fileName);
        } catch (error) {
            alert("Download failed. Please check the console for details.");
        }
    };

    const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || !label) {
            alert('Please provide both a label and a file.');
            return;
        }

        const formData = new FormData();
        formData.append('label', label);
        formData.append('materialFile', file); // 'materialFile' must match the backend multer config

        uploadMutation.mutate({ videoId, formData });
    };
    
    const handleDeleteClick = (materialId: string) => {
        setOpenDeleteConfirm(materialId); // Open the confirmation dialog
    };

    const handleConfirmDelete = () => {
        if (openDeleteConfirm) {
            deleteMutation.mutate({ videoId, materialId: openDeleteConfirm });
        }
    };

    // --- Render Logic ---

    if (isLoading) return <CircularProgress />;
    if (videoError) return <Alert severity="error">{(videoError as Error).message || 'Failed to load video details.'}</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                Associated Materials
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Form for uploading new materials */}
            <Box component="form" onSubmit={handleUploadSubmit} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Upload New Material</Typography>
                <TextField
                    label="Material Label (e.g., Lecture Notes)"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                    disabled={uploadMutation.isPending}
                />
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={uploadMutation.isPending}
                >
                    Select File
                    <input
                        type="file"
                        hidden
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    />
                </Button>
                {file && <Typography sx={{ display: 'inline', ml: 2 }}>{file.name}</Typography>}
                
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ display: 'block', mt: 2 }}
                    disabled={uploadMutation.isPending || !file || !label}
                >
                    {uploadMutation.isPending ? <CircularProgress size={24} /> : 'Upload Material'}
                </Button>
                {uploadMutation.isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {(uploadMutation.error as any)?.message || 'An error occurred during upload.'}
                    </Alert>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* List of existing materials */}
            <Typography variant="h6" sx={{ mb: 2 }}>Uploaded Materials</Typography>
            {video?.associatedMaterials && video.associatedMaterials.length > 0 ? (
                <List>
                    {video.associatedMaterials.map((material) => (
                        <ListItem key={material._id} secondaryAction={
                            <>
                                <IconButton edge="end" aria-label="download" onClick={() => handleDownload(material._id, material.fileName)}>
                                    <DownloadIcon />
                                </IconButton>
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(material._id)} sx={{ml: 1}} disabled={deleteMutation.isPending}>
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        }>
                            <ListItemText primary={material.label} secondary={material.fileName} />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography color="text.secondary">No materials have been uploaded for this video yet.</Typography>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!openDeleteConfirm}
                onClose={() => setOpenDeleteConfirm(null)}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this material? This action cannot be undone.
                    </DialogContentText>
                    {deleteMutation.isError && (
                         <Alert severity="error" sx={{ mt: 2 }}>
                            {(deleteMutation.error as any)?.message || 'Failed to delete material.'}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(null)} disabled={deleteMutation.isPending}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default AssociatedMaterials;
