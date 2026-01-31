// src/pages/TestAdminBunnyUpload.tsx
import React, { useState, type ChangeEvent } from 'react';
import {
    Container, Typography, Box, Paper, TextField, Button,
    LinearProgress, Alert, CircularProgress
} from '@mui/material';
import * as tus from 'tus-js-client';

const TestAdminBunnyUpload: React.FC = () => {
    const [libraryId, setLibraryId] = useState<string>(import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || ''); 
    const [bunnyVideoId, setBunnyVideoId] = useState<string>(''); 
    const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_BUNNY_STREAM_API_KEY || ''); 

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [tusUpload, setTusUpload] = useState<tus.Upload | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setUploadError(null);
            setUploadSuccess(null);
            setUploadProgress(0);
        } else {
            setSelectedFile(null);
        }
    };

    const handleStartUpload = () => {
        if (!selectedFile) {
            setUploadError("Please select a video file.");
            return;
        }
        if (!libraryId.trim()) {
            setUploadError("Please enter your Bunny Stream Library ID.");
            return;
        }
        if (!bunnyVideoId.trim()) {
            setUploadError("Please enter the Bunny Stream Video ID (GUID) for the video placeholder.");
            return;
        }
        if (!apiKey.trim()) {
            setUploadError("Please enter your Bunny Stream Video Library API Key (AccessKey).");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        setUploadSuccess(null);

        const endpoint = `https://video.bunnycdn.com/tusupload`; 

        const upload = new tus.Upload(selectedFile, {
            endpoint: endpoint,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: {
                filetype: selectedFile.type,
                filename: selectedFile.name,
            },
            headers: {
                AccessKey: apiKey,       
                LibraryId: libraryId,    
                VideoId: bunnyVideoId,   
            },
            onError: (error) => {
                let detailedErrorMessage = 'Upload failed.';
                const tusError = error as any;
                if (tusError.originalResponse) {
                    detailedErrorMessage += ` Server responded: ${tusError.originalResponse.getStatus()} ${tusError.originalResponse.getBody() || '(No response body)'}`;
                } else { 
                    detailedErrorMessage += ` ${error.message || 'Unknown TUS error'}`;
                }
                setUploadError(detailedErrorMessage);
                setIsUploading(false);
                setTusUpload(null);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                if (bytesTotal > 0) {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percentage);
                }
            },
            onSuccess: async () => {
                setUploadSuccess(`Video "${selectedFile?.name}" uploaded successfully to Bunny Video ID: ${bunnyVideoId}. Bunny Stream will now process it.`);
                setIsUploading(false);
                setTusUpload(null);
                setSelectedFile(null); // Clear the file input
                // Consider clearing bunnyVideoId field to prevent re-upload to same ID without re-entry
            }
        });

        setTusUpload(upload);
        upload.start();
    };

    const handleCancelUpload = () => {
        if (tusUpload) {
            tusUpload.abort(true)
                .then(() => {
                    setUploadError("Upload cancelled by user.");
                })
                .catch(() => { 
                    setUploadError("Failed to cancel upload properly.");
                })
                .finally(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    setTusUpload(null);
                });
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Test Bunny.net TUS Upload
            </Typography>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body1" sx={{mb: 2}}>
                    This page is for testing direct TUS uploads to an existing Bunny Stream video placeholder.
                    You need to create a video object via the Bunny API or dashboard first to get a Video ID (GUID).
                </Typography>
                <Box component="form" noValidate>
                    <TextField
                        label="Bunny Stream Library ID"
                        value={libraryId}
                        onChange={(e) => setLibraryId(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        helperText="Your Video Library ID from Bunny dashboard."
                        disabled={isUploading}
                    />
                    <TextField
                        label="Bunny Stream Video ID (GUID)"
                        value={bunnyVideoId}
                        onChange={(e) => setBunnyVideoId(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        helperText="The GUID of the video placeholder created on Bunny Stream."
                        disabled={isUploading}
                    />
                    <TextField
                        label="Bunny Stream Video Library API Key (AccessKey)"
                        type="password" // Keep it masked
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        helperText="Your Stream API Key (found in your Video Library settings on Bunny)."
                        disabled={isUploading}
                    />
                    <TextField
                        type="file"
                        onChange={handleFileChange}
                        fullWidth
                        variant="outlined"
                        label="Video File to Upload"
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2, mb: 1 }}
                        disabled={isUploading}
                    />
                    {selectedFile && !isUploading && (
                        <Typography variant="caption" display="block" sx={{mb:1}}>
                            Selected: {selectedFile.name} ({(selectedFile.size / (1024*1024)).toFixed(2)} MB)
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleStartUpload}
                        disabled={!selectedFile || isUploading || !libraryId || !bunnyVideoId || !apiKey}
                        sx={{ mt: 2, mr: 1 }}
                    >
                        {isUploading ? <CircularProgress size={24} sx={{mr:1}}/> : null}
                        {isUploading ? `Uploading (${uploadProgress}%)` : 'Start TUS Upload'}
                    </Button>
                    {isUploading && tusUpload && (
                        <Button onClick={handleCancelUpload} color="warning" variant="outlined" sx={{ mt: 2 }}>
                            Cancel Upload
                        </Button>
                    )}

                    {uploadProgress > 0 && isUploading && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                        </Box>
                    )}
                    {uploadError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>{uploadError}</Alert>}
                    {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setUploadSuccess(null)}>{uploadSuccess}</Alert>}
                </Box>
            </Paper>
        </Container>
    );
};

export default TestAdminBunnyUpload;