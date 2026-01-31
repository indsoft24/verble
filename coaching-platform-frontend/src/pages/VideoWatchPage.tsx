// src/pages/VideoWatchPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Alert, Paper, Button, Divider, List, ListItem, ListItemText, IconButton, Chip, Snackbar } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { saveAs } from 'file-saver';

// Import the necessary service functions
import { getVideoByIdForUser, getVideoPlayToken, downloadMaterialForUser, markVideoCompleted } from '../services/videoService';
import type { VideoDetail } from '../services/videoService';
import BunnyPlayer from '../components/features/video/BunnyPlayer';
import VideoWatermark from '../components/features/video/VideoWatermark';
import { useAuth } from '../contexts/AuthContext';

const VideoWatchPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const { user } = useAuth();

    const [video, setVideo] = useState<VideoDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [playToken, setPlayToken] = useState<{ token: string; expires: number } | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [watchProgress, setWatchProgress] = useState<{ watchCount: number; remainingWatches: number } | null>(null);
    const hasMarkedCompleteRef = useRef(false); // Prevent duplicate completion calls

    const fetchVideoAndToken = useCallback(async () => {
        if (!videoId) {
            setError({ message: "No video ID provided in the URL." });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlayToken(null);

        try {
            const videoData = await getVideoByIdForUser(videoId);
            setVideo(videoData);
            
            // Update watch progress from video data
            if (videoData.watchCount !== undefined && videoData.remainingWatches !== undefined) {
                setWatchProgress({
                    watchCount: videoData.watchCount,
                    remainingWatches: videoData.remainingWatches
                });
            }

            if (videoData.canAccess && videoData.videoStatus === 'AVAILABLE') {
                const tokenData = await getVideoPlayToken(videoId);
                setPlayToken(tokenData);
            }
        } catch (err: any) {
            setError({ message: err.message || 'Failed to load video.', code: err.code });
            if (err.data?.video) {
                setVideo(err.data.video);
                // Update watch progress from error response if available
                if (err.data.video.watchCount !== undefined && err.data.video.remainingWatches !== undefined) {
                    setWatchProgress({
                        watchCount: err.data.video.watchCount,
                        remainingWatches: err.data.video.remainingWatches
                    });
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        fetchVideoAndToken();
    }, [fetchVideoAndToken]);

    const handleDownload = async (materialId: string, fileName: string) => {
        if (!videoId) return;
        setIsDownloading(materialId);
        try {
            const { fileData } = await downloadMaterialForUser({ videoId, materialId, fileName });
            saveAs(fileData, fileName);
        } catch (err) {
            setError({ message: "Download failed. You may not have access to this file." });
        } finally {
            setIsDownloading(null);
        }
    };

    const handleVideoComplete = useCallback(async () => {
        if (!videoId || hasMarkedCompleteRef.current || isMarkingComplete) {
            return;
        }

        // Allow marking as complete even if video is locked (for watch count tracking)
        // The backend will handle the actual access check and watch limit

        setIsMarkingComplete(true);
        hasMarkedCompleteRef.current = true;

        try {
            const result = await markVideoCompleted(videoId);
            
            // Update watch progress
            setWatchProgress({
                watchCount: result.watchCount,
                remainingWatches: result.remainingWatches
            });

            // Update video state
            if (video) {
                setVideo({
                    ...video,
                    watchCount: result.watchCount,
                    remainingWatches: result.remainingWatches
                });
            }

            // Show success message
            let message = `Video marked as completed. Watched ${result.watchCount}/2 times.`;
            if (result.setComplete) {
                message += ' Set completed!';
            }
            if (result.moduleComplete) {
                message += ' Module completed!';
            }
            if (result.nextCycleStarted) {
                message += ' New cycle started!';
            }
            setCompletionMessage(message);

            // Only refresh if video is actually locked (no remaining watches) AND module is complete
            // Don't refresh if video can still be watched - this prevents interrupting playback
            if (result.moduleComplete && result.remainingWatches === 0) {
                // Delay refresh to allow user to see completion message
                // Only refresh if video is truly locked
                setTimeout(() => {
                    // Check if video is still accessible before refreshing
                    if (result.remainingWatches === 0) {
                        fetchVideoAndToken();
                    }
                }, 5000); // Longer delay to avoid interrupting user
            }
        } catch (err: any) {
            hasMarkedCompleteRef.current = false; // Allow retry on error
            setError({ 
                message: err.response?.data?.message || err.message || "Failed to mark video as completed." 
            });
        } finally {
            setIsMarkingComplete(false);
        }
    }, [videoId, video, fetchVideoAndToken, isMarkingComplete]);

    const watermarkText = user ? `${user.email} | ${user.phoneNumber || ''}` : 'Verble';

    // Reset completion flag when video changes
    useEffect(() => {
        hasMarkedCompleteRef.current = false;
    }, [videoId]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !video) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <Alert severity="error">{error.message}</Alert>
                <Button component={RouterLink} to="/videos" variant="outlined" sx={{ mt: 2 }}>Back to Videos</Button>
            </Container>
        );
    }

    if (!video) {
        return <Alert severity="warning">Could not find video data.</Alert>;
    }

    // --- Main Component Return ---
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        {video.title}
                    </Typography>
                    {/* Watch Count Display */}
                    {watchProgress !== null && video.canAccess && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip 
                                icon={<CheckCircleIcon />}
                                label={`Watched: ${watchProgress.watchCount}/2`}
                                color={watchProgress.watchCount >= 2 ? 'error' : watchProgress.watchCount === 1 ? 'warning' : 'default'}
                                size="small"
                            />
                            {watchProgress.remainingWatches > 0 && (
                                <Chip 
                                    label={`${watchProgress.remainingWatches} watch${watchProgress.remainingWatches > 1 ? 'es' : ''} remaining`}
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {watchProgress.remainingWatches === 0 && (
                                <Chip 
                                    label="Watch limit reached"
                                    color="error"
                                    size="small"
                                />
                            )}
                        </Box>
                    )}
                </Box>

                {/* Conditionally render the player or the access denied message */}
                {video.canAccess && video.videoStatus === 'AVAILABLE' && playToken ? (
                    <>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                            <BunnyPlayer
                                libraryId={video.bunnyVideoLibraryId}
                                videoId={video.bunnyVideoId}
                                token={playToken.token}
                                expires={playToken.expires}
                                onVideoComplete={handleVideoComplete}
                                durationSeconds={video.durationSeconds}
                                enableScreenProtection={true}
                                watermarkText={watermarkText}
                            />
                            <VideoWatermark text={watermarkText} />
                        </Box>
                        {/* Manual completion button as fallback */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleVideoComplete}
                                disabled={isMarkingComplete || hasMarkedCompleteRef.current || (watchProgress?.remainingWatches === 0)}
                                startIcon={isMarkingComplete ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                            >
                                {isMarkingComplete ? 'Marking as Complete...' : 'Mark Video as Complete'}
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Alert severity="error" icon={<LockIcon fontSize="inherit" />} sx={{ aspectRatio: '16 / 9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>Access Denied</Typography>
                        <Typography sx={{ mb: 2 }}>{error?.message || "This video requires a subscription or is still processing."}</Typography>
                        <Button component={RouterLink} to="/subscription-plans" variant="contained" color="primary">
                            View Subscription Plans
                        </Button>
                    </Alert>
                )}
                {/* Video Description */}
                {video.description && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6">Description</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                            {video.description}
                        </Typography>
                    </Box>
                )}

                {/* --- Associated Materials Section --- */}
                {video.canAccess && video.associatedMaterials && video.associatedMaterials.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">Study Materials</Typography>
                        <Divider sx={{ my: 1 }} />
                        <List>
                            {video.associatedMaterials.map((material) => (
                                <ListItem
                                    key={material._id}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="download"
                                            onClick={() => handleDownload(material._id, material.fileName)}
                                            disabled={isDownloading === material._id}
                                        >
                                            {isDownloading === material._id ? <CircularProgress size={24} /> : <DownloadIcon />}
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={material.label}
                                        secondary={material.fileName}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Paper>

            {/* Completion Success Snackbar */}
            <Snackbar
                open={!!completionMessage}
                autoHideDuration={6000}
                onClose={() => setCompletionMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setCompletionMessage(null)} severity="success" sx={{ width: '100%' }}>
                    {completionMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default VideoWatchPage;
