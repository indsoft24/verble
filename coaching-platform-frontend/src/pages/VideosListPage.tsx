import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardActionArea, CardContent, CardMedia,
    CircularProgress, Alert, Box, Button, Paper, Pagination, Chip, TextField, Tooltip
} from '@mui/material';
import { getAllPublishedVideosUser, type VideoListItem } from '../services/videoService'; 
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { useAuth } from '../contexts/AuthContext';
import { extractId } from '../utils/idUtils';
import { getSplashImageUrl, resolveBackendMediaUrl } from '../utils/imageUtils';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const VideosListPage: React.FC = () => {
    useUserLayoutPage({ title: 'My Videos' });
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
    const [totalPages, setTotalPages] = useState<number>(1);
    const videosPerPage = 12; 

    const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);


    const fetchVideos = useCallback(async (page: number, search: string | null) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllPublishedVideosUser(page, videosPerPage, search);
            setVideos(data.videos || []);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
            
            const newSearchParams = new URLSearchParams();
            if (search) newSearchParams.set('search', search);
            if (data.currentPage > 1) newSearchParams.set('page', data.currentPage.toString());
            
            if (newSearchParams.toString() !== searchParams.toString()) {
                setSearchParams(newSearchParams, { replace: true });
            }

        } catch (err: any) {
            setError(err.message || 'Failed to load videos.');
            setVideos([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [videosPerPage, setSearchParams, searchParams]); 

    const formatDuration = (seconds?: number) => {
        if (seconds == null || Number.isNaN(seconds)) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    useEffect(() => {
        const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        const searchFromUrl = searchParams.get('search') || null;
        if (pageFromUrl !== currentPage) {
            setCurrentPage(pageFromUrl);
        }
        if (searchFromUrl !== searchTerm && !debouncedSearchTerm) { 
             setSearchTerm(searchFromUrl || '');
        }
        fetchVideos(pageFromUrl, searchFromUrl);
    }, [debouncedSearchTerm, searchParams, fetchVideos, currentPage, searchTerm]); 

        const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        if (currentPage !== 1) setCurrentPage(1); 
        const newSearchParams = new URLSearchParams(searchParams);
        if (event.target.value.trim()) {
            newSearchParams.set('search', event.target.value.trim());
        } else {
            newSearchParams.delete('search');
        }
        newSearchParams.set('page', '1'); 
        setSearchParams(newSearchParams, { replace: true });
    };
    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', value.toString());
        setSearchParams(newSearchParams); 
        window.scrollTo(0, 0);
    };

    if (isLoading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ml: 2}}>Loading videos...</Typography>
                </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button variant="outlined" onClick={() => fetchVideos(1, searchTerm || null)}>Try Again</Button>
                </Container>
        );
    }

    return (
        <Container maxWidth="xl">
                <Typography
                    variant="h5"
                    component="h1"
                    gutterBottom
                    sx={{ mb: 1, fontWeight: 'bold', color: learnerBrandTheme.textPrimary }}
                >
                    Explore Our Videos
                </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <TextField
                    label="Search Videos"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{
                        width: { xs: '100%', sm: '70%', md: '50%' },
                        '& .MuiOutlinedInput-root': { bgcolor: learnerBrandTheme.surface },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {isLoading && videos.length === 0 && (
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                    <CircularProgress size={40} /><Typography sx={{ml:2}}>Loading Videos...</Typography>
                </Box>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={() => fetchVideos(1, searchTerm || null)}>Retry</Button>}>
                    {error}
                </Alert>
            )}
            
            {!isLoading && videos.length === 0 && !error && (
                <Paper sx={{ p: 3, textAlign: 'center', mt: 3, border: `1px solid ${learnerBrandTheme.border}` }}>
                    <Typography variant="subtitle1">
                        {debouncedSearchTerm ? `No videos found matching "${debouncedSearchTerm}".` : "No videos available at the moment. Please check back soon!"}
                    </Typography>
                    {debouncedSearchTerm && <Button onClick={() => {setSearchTerm(''); setSearchParams({}, {replace: true});}} sx={{mt:1}}>Clear Search</Button>}
                </Paper>
            )}

            <Grid container spacing={3}>
                {videos.map((video) => {
                    const videoId = extractId(video) || video._id;
                    if (!videoId) return null; // Skip if no valid ID
                    
                    return (
                    <Grid key={videoId} sx={{width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
                        {(() => {
                            const isLockedForGuest = !user && video.canAccess === false;
                            const showLockOverlay = isLockedForGuest;
                            const cardOpacity = showLockOverlay ? 0.65 : 1;
                            const cardBg = showLockOverlay ? '#f0f0f0' : 'inherit';
                            const disableNavigation = showLockOverlay;

                            return (
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', 
                                    opacity: cardOpacity,
                                    backgroundColor: cardBg,
                                    border: `1px solid ${learnerBrandTheme.border}`,
                                    boxShadow: 3, '&:hover': { boxShadow: 7, transform: !disableNavigation ? 'translateY(-4px)' : 'none' }, 
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out' }}>
                            <CardActionArea 
                                component={RouterLink} 
                                to={!disableNavigation ? `/videos/${videoId}` : '#'}
                                onClick={(e) => {
                                    if (disableNavigation) {
                                        e.preventDefault();
                                        alert("Please log in and subscribe to watch this video.");
                                        navigate('/subscription-plans');
                                    }
                                }}
                                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: disableNavigation ? 'default' : 'pointer' }}
                            >
                                <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                                    <CardMedia component="img"
                                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        image={resolveBackendMediaUrl(video.thumbnailUrl)}
                                        alt={video.title}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getSplashImageUrl(); }}
                                    />
                                     {showLockOverlay && (
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LockIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.7)' }} />
                                        </Box>
                                    )}
                                </Box>
                                <CardContent sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Tooltip title={video.title}>
                                        <Typography gutterBottom variant="h6" component="h2" sx={{fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.8em'}}>
                                            {video.title}
                                        </Typography>
                                    </Tooltip>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb:1 }}>
                                        <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                        <Typography variant="caption">
                                            {formatDuration(video.durationSeconds)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{mt: 'auto'}}>
                                        {video.tags && video.tags.length > 0 && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, mt:1 }}>
                                                {video.tags.slice(0, 2).map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                            );
                        })()}
                    </Grid>
                    );
                })}
            </Grid>
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                    <Pagination 
                        count={totalPages} 
                        page={currentPage} 
                        onChange={handlePageChange} 
                        color="primary" 
                        showFirstButton 
                        showLastButton
                    />
                </Box>
            )}
            </Container>
    );
};

export default VideosListPage;
