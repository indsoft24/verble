import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardActionArea, CardContent,
    CircularProgress, Alert, Box, Paper, Breadcrumbs, Link as MuiLink, Button
} from '@mui/material';
import parse from 'html-react-parser';

// --- CORRECTED: Use relative paths instead of aliases ---
import { getCoursesForCategory, type ExamCategory } from '../services/examCategoryService';
import { type Course } from '../services/courseAdminService';
import { getImageUrl } from '../utils/imageUtils';
import { extractId } from '../utils/idUtils';

const ExamCategoryCoursesPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const [category, setCategory] = useState<ExamCategory | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategoryCourses = useCallback(async () => {
        if (!slug) {
            setError("Category not specified in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { category: fetchedCategory, courses: fetchedCourses } = await getCoursesForCategory(slug);
            setCategory(fetchedCategory);
            setCourses(fetchedCourses || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load data for this category.');
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchCategoryCourses();
    }, [fetchCategoryCourses]);

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    }

    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    if (!category) {
        return <Container sx={{ mt: 4 }}><Alert severity="info">Category not found.</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Home</MuiLink>
                <Typography color="text.primary">{category.name}</Typography>
            </Breadcrumbs>

            <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, mb: 4, bgcolor: 'primary.lighter', borderRadius: '12px' }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {category.name}
                </Typography>
                <Box
                    className="tiptap-rendered-content"
                    sx={{
                        color: 'text.secondary',
                        '& p': { typography: 'h6', mb: 0.5 },
                        '& ul, & ol': { pl: 3, mb: 1 },
                        '& li': { mb: 0.5, typography: 'h6' },
                        '& strong': { fontWeight: 'bold' },
                        '& em': { fontStyle: 'italic' },
                        '& u': { textDecoration: 'underline' },
                        '& a': { color: 'primary.main' },
                    }}
                >
                    {category.description ? parse(category.description) : `Browse available courses for the ${category.name} category.`}
                </Box>
            </Paper>

            {courses.length === 0 ? (
                <Typography>No courses are currently available in this category. Please check back later.</Typography>
            ) : (
                <Grid container spacing={4}>
                    {courses.map((course) => {
                        const courseId = extractId(course) || course._id;
                        if (!courseId) return null; // Skip if no valid ID
                        
                        return (
                        <Grid key={courseId} sx={{width: {xs: '50%', sm: '33.33%', md: '25%' }}}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', transition: 'all 0.3s', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
                                <CardActionArea
                                    component={RouterLink}
                                    to={`/courses/${courseId}`} 
                                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                >
                                    {course.image && (
                                        <Box sx={{ width: '100%', height: 160, overflow: 'hidden' }}>
                                            <img 
                                                src={getImageUrl(course.image, 'course')} 
                                                alt={course.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                                            {course.title}
                                        </Typography>
                                        <Box
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                minHeight: '3.9em',
                                                color: 'text.secondary',
                                                '& p': { typography: 'body2', mb: 0.5, display: 'inline' },
                                                '& ul, & ol': { display: 'none' },
                                                '& strong': { fontWeight: 'bold' },
                                                '& em': { fontStyle: 'italic' },
                                            }}
                                        >
                                            {course.description ? parse(course.description) : 'Click to view details and available subscription plans.'}
                                        </Box>
                                    </CardContent>
                                    <Box sx={{ p: 2, pt: 1, width: '100%', mt: 'auto' }}>
                                         <Button variant="contained" fullWidth>
                                            View Plans
                                        </Button>
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                        );
                    })}
                </Grid>
            )}
        </Container>
    );
};

export default ExamCategoryCoursesPage;
