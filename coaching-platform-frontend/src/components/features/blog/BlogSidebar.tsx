import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItemText, CircularProgress, Chip, Divider, Link as MuiLink } from '@mui/material';
import { getRecentBlogPostsUser, getAllBlogCategoriesUser, type RecentBlogPost, type BlogCategoryWithCount } from '../../../services/blogUserService';
import slugify from 'slugify'; 

const BlogSidebar: React.FC = () => {
    const [recentPosts, setRecentPosts] = useState<RecentBlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategoryWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const [recentData, categoriesData] = await Promise.all([
                    getRecentBlogPostsUser(5),
                    getAllBlogCategoriesUser()
                ]);
                setRecentPosts(recentData);
                setCategories(categoriesData);
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };
        fetchSidebarData();
    }, []);
    
    // Simple slugify function
    const slugifyCategory = (name: string) => slugify(name, { lower: true, strict: true });

    return (
        <Paper elevation={2} sx={{ p: 2, position: 'sticky', top: 20 }}>
            {isLoading ? <CircularProgress /> : (
                <>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Recent Posts</Typography>
                    <List dense>
                        {recentPosts.map(post => (
                            <MuiLink component={RouterLink} to={`/blog/${post.slug}`} key={post._id} underline="hover" color="inherit">
                                <ListItemText primary={post.title} secondary={new Date(post.publishedAt || '').toLocaleDateString()} />
                            </MuiLink>
                        ))}
                    </List>
                    
                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Categories</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {categories.map(cat => (
                            <Chip
                                key={cat.name}
                                label={`${cat.name} (${cat.count})`}
                                component={RouterLink}
                                to={`/blog/category/${slugifyCategory(cat.name)}`}
                                clickable
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default BlogSidebar;
