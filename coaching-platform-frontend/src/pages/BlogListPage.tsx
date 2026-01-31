import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Container, Typography, Grid, Card, CardActionArea, CardContent, CardMedia,
    CircularProgress, Alert, Box, Paper, Pagination, Breadcrumbs, Link as MuiLink
} from '@mui/material';

// Import the new function
import { getAllPublishedBlogPostsUser, getPublishedPostsByCategoryUser, type BlogPostListItem } from '../services/blogUserService';
import BlogSidebar from '../components/features/blog/BlogSidebar';
import { getSplashImageUrl } from '../utils/imageUtils';

const BlogListPage: React.FC = () => {
    // Get the category slug from the URL if it exists
    const { categorySlug } = useParams<{ categorySlug: string }>();
    
    const [posts, setPosts] = useState<BlogPostListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Add state for a dynamic page title
    const [pageTitle, setPageTitle] = useState('Our Blog');

    const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
    const [totalPages, setTotalPages] = useState<number>(1);
    const postsPerPage = 9;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    const getImageUrl = (bunnyUrl?: string) => {
        if (!bunnyUrl) {
            return getSplashImageUrl();
        }
        
        if (bunnyUrl.startsWith('http')) {
            try {
                const url = new URL(bunnyUrl);
                const pathSegments = url.pathname.split('/');
                const fileName = pathSegments[pathSegments.length - 1];

                if (!fileName) return getSplashImageUrl();

                return `${apiBaseUrl}/blog/image/${fileName}`;
            } catch (e) {
                return getSplashImageUrl();
            }
        }
        return `${apiBaseUrl.replace(/\/$/, '')}/${bunnyUrl.replace(/^\//, '')}`;
    };

    // This function now handles both general listing and category-specific listing
    const fetchBlogPosts = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (categorySlug) {
                setPageTitle(`Category: ${categorySlug.replace(/-/g, ' ')}`);
                data = await getPublishedPostsByCategoryUser(categorySlug, page, postsPerPage);
            } else {
                setPageTitle('Our Blog');
                data = await getAllPublishedBlogPostsUser(page, postsPerPage);
            }
            
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || page);
        } catch (err: any) {
            setError(err.message || 'Failed to load blog posts.');
        } finally {
            setIsLoading(false);
        }
    }, [categorySlug, postsPerPage]);

    useEffect(() => {
        const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        fetchBlogPosts(pageFromUrl);
    }, [fetchBlogPosts, searchParams]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setSearchParams({ page: value.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ bgcolor: 'grey.50', py: 5 }}>
            <Container maxWidth="xl">
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Home</MuiLink>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/blog">Blog</MuiLink>
                    {categorySlug && <Typography color="text.primary">Category: {categorySlug}</Typography>}
                </Breadcrumbs>

                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 5, fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {pageTitle}
                </Typography>

                <Grid container spacing={5} sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' } }}>
                    <Grid sx={{ width: { xs: '100%', md: '73%' }, order: { xs: 2, md: 1 } }}>
                        {isLoading ? <Box sx={{display: 'flex', justifyContent: 'center', p: 5}}><CircularProgress /></Box>
                        : error ? <Alert severity="error">{error}</Alert>
                        : posts.length > 0 ? (
                            <>
                                <Grid container spacing={3}>
                                    {posts.map((post) => (
                                        <Grid key={post._id} sx={{ width: { xs: '100%', sm: '47%', lg: '30.33%' } }}>
                                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <CardActionArea component={RouterLink} to={`/blog/${post.slug}`} sx={{ flexGrow: 1 }}>
                                                    <CardMedia
                                                        component="img"
                                                        image={post.featureImage ? getImageUrl(post.featureImage) : getSplashImageUrl()}
                                                        alt={post.title}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getSplashImageUrl();
                                                        }}
                                                        sx={{ aspectRatio: '16/9' }}
                                                    />
                                                    <CardContent>
                                                        <Typography gutterBottom variant="h6" component="h2">{post.title}</Typography>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                {totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                                        <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" />
                                    </Box>
                                )}
                            </>
                        ) : (
                             <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6">No Posts Found</Typography>
                                <Typography color="text.secondary">There are no posts in this category yet.</Typography>
                            </Paper>
                        )}
                    </Grid>
                    <Grid sx={{ width: { xs: '100%', md: '23%' }, order: { xs: 1, md: 2 } }}>
                        <BlogSidebar />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BlogListPage;
