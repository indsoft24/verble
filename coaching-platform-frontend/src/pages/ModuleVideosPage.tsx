import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardMedia, CardContent, CardActionArea,
    CircularProgress, Alert, Box, Chip, Button, Paper, Breadcrumbs, Link as MuiLink, Tooltip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- CORRECTED: Use relative path instead of alias ---
import { getPublishedModuleWithVideosForUser, type ModuleDetailUser, type VideoListItemForModulePage } from '../services/courseUserService';
import { extractId } from '../utils/idUtils';
import { getSplashImageUrl } from '../utils/imageUtils'; 

const ModuleVideosPage: React.FC = () => {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();

    const [moduleDetails, setModuleDetails] = useState<ModuleDetailUser | null>(null);
    const [videos, setVideos] = useState<VideoListItemForModulePage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    const getImageUrl = (video: VideoListItemForModulePage): string => {
        const fallback = getSplashImageUrl();

        if (video.bunnyThumbnailUrl) {
            return video.bunnyThumbnailUrl;
        }
        return fallback;
    };

    const fetchModuleData = useCallback(async () => {
        if (!moduleId) {
            setError("Module ID not found in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { module: fetchedModule, videos: fetchedVideos } = await getPublishedModuleWithVideosForUser(moduleId);
            setModuleDetails(fetchedModule);
            setVideos(fetchedVideos || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load module content.');
            setVideos([]);
        } finally {
            setIsLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        fetchModuleData();
    }, [fetchModuleData]);

    const handleVideoCardClick = (video: VideoListItemForModulePage) => {
        const videoId = extractId(video) || video._id;
        if (!videoId) {
            return;
        }
        // Check both canAccess and isLocked
        if (video.canAccess !== false && !video.isLocked) {
            navigate(`/videos/${videoId}`);
        } else if (video.isLocked) {
            alert(video.accessReason || "This video is locked. Complete previous videos to unlock.");
        } else {
            alert("A specific subscription is required to watch this video. Please check available plans.");
            navigate('/subscription-plans');
        }
    };

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /><Typography sx={{ml:1}}>Loading Module Content...</Typography></Container>;
    }
    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error" action={<Button onClick={fetchModuleData}>Retry</Button>}>{error}</Alert></Container>;
    }
    if (!moduleDetails) {
        return <Container sx={{ mt: 4 }}><Alert severity="info">Module not found or not available.</Alert></Container>;
    }
    
    const parentCourse = moduleDetails.course;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Home</MuiLink>
                {parentCourse && typeof parentCourse === 'object' && (() => {
                    const courseId = extractId(parentCourse) || (parentCourse as any)._id;
                    return courseId ? (
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to={`/courses/${courseId}`}>
                            {parentCourse.title}
                        </MuiLink>
                    ) : null;
                })()}
                <Typography color="text.primary">{moduleDetails.title}</Typography>
            </Breadcrumbs>

            <Paper elevation={2} sx={{p:3, mb:4}}>
                {moduleDetails.image && (
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <img 
                            src={moduleDetails.image} 
                            alt={moduleDetails.title}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                            }}
                        />
                    </Box>
                )}
                <Box sx={{display: 'flex', alignItems: 'center', mb:1}}>
                    <OndemandVideoIcon color="primary" sx={{mr: 1.5, fontSize: '2.5rem'}} />
                    <Typography variant="h4" component="h1">{moduleDetails.title}</Typography>
                </Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Part of course: {typeof parentCourse === 'object' ? parentCourse.title : 'N/A'}
                </Typography>
                {moduleDetails.description && (
                    <Typography variant="body1" paragraph sx={{mt:1}}>
                        {moduleDetails.description}
                    </Typography>
                )}
            </Paper>
            
            <Typography variant="h5" component="h2" gutterBottom sx={{mt: 4, mb: 2}}>
                Videos in this Module
            </Typography>
            {videos.length === 0 && !isLoading && (
                <Typography>No videos available in this module yet.</Typography>
            )}
            <Grid container spacing={3}>
                {videos.map((video) => (
                    <Grid key={video._id} sx= {{width: {xs: '100%', sm: '50%', md: '33%'}}} >
                        <Card sx={{ 
                            height: '100%', display: 'flex', flexDirection: 'column', 
                            opacity: (video.canAccess === false || video.isLocked) ? 0.7 : 1,
                            backgroundColor: (video.canAccess === false || video.isLocked) ? 'grey.100' : 'inherit',
                            transition: 'transform 0.2s', '&:hover': { transform: (video.canAccess !== false && !video.isLocked) ? 'scale(1.03)' : 'none' } 
                        }}>
                            <CardActionArea 
                                onClick={() => handleVideoCardClick(video)}
                                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', cursor: (video.canAccess === false || video.isLocked) ? 'not-allowed' : 'pointer' }}
                                disabled={video.canAccess === false || video.isLocked}
                            >
                                <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                                    <CardMedia
                                        component="img"
                                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        image={getImageUrl(video)}
                                        alt={video.title}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getSplashImageUrl(); }}
                                    />
                                    <Box sx={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        backgroundColor: (video.canAccess === false || video.isLocked) ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: (video.canAccess === false || video.isLocked) ? 1 : 0,
                                        transition: 'opacity 0.3s', '&:hover': { opacity: 1 }
                                    }}>
                                        {(video.canAccess === false || video.isLocked) ? 
                                            <LockIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.8)' }} /> :
                                            <PlayCircleOutlineIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.9)' }} />
                                        }
                                    </Box>
                                </Box>
                                <CardContent sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Tooltip title={video.title}>
                                        <Typography gutterBottom variant="h6" component="h2" sx={{fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.8em'}}>
                                            {video.title}
                                        </Typography>
                                    </Tooltip>
                                    <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {video.durationSeconds != null && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                                <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                                <Typography variant="caption">
                                                    {Math.floor(video.durationSeconds / 60)}m {video.durationSeconds % 60}s
                                                </Typography>
                                            </Box>
                                        )}
                                        {/* Watch Count Display */}
                                        {video.canAccess && !video.isLocked && video.watchCount !== undefined && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CheckCircleIcon fontSize="small" sx={{ color: video.watchCount >= 2 ? 'error.main' : video.watchCount === 1 ? 'warning.main' : 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Watched: {video.watchCount}/2
                                                    {video.remainingWatches !== undefined && video.remainingWatches > 0 && 
                                                        ` (${video.remainingWatches} remaining)`
                                                    }
                                                </Typography>
                                            </Box>
                                        )}
                                        {/* Locked Status */}
                                        {video.isLocked && (
                                            <Chip 
                                                label={video.accessReason || "Locked"} 
                                                color="error" 
                                                size="small" 
                                                icon={<LockIcon fontSize="small"/>} 
                                                sx={{ width: '100%', mt: 0.5 }} 
                                            />
                                        )}
                                        {/* Subscription Required */}
                                        {video.canAccess === false && (
                                            <Chip 
                                                label={"Subscription Required"} 
                                                color="warning" 
                                                size="small" 
                                                icon={<LockIcon fontSize="small"/>} 
                                                sx={{ width: '100%', mt: 0.5 }} 
                                                clickable 
                                                onClick={(e) => { e.stopPropagation(); navigate('/subscription-plans');}}
                                            />
                                        )}
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default ModuleVideosPage;
