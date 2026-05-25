// src/pages/BlogPostDetailPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, CircularProgress, Alert, Box, Paper,
    Chip, Divider, Button, Breadcrumbs, Link as MuiLink, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, Select, MenuItem, InputLabel, FormControl, type SelectChangeEvent,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import parse from 'html-react-parser';

import { getPublishedBlogPostBySlugUser, type BlogPostDetail } from '../services/blogUserService';
import { submitLeadAndGetToken } from '../services/leadService';
import DocumentHead from '../components/seo/DocumentHead';
import { getSplashImageUrl } from '../utils/imageUtils';

const courseOptions = {
    "Law": ["CLAT", "AILET", "DULLB/CUET-PG", "Judiciary", "LLM"],
    "Government Exam": ["UPSC-CSE", "State PCS", "SSC", "Banking", "Railway", "Police"],
    "Engineering": ["JEE Mains", "JEE-Advance"],
    "Medical": ["NEET", "Pharmacy", "Nursing"],
};

const BlogPostDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const [post, setPost] = useState<BlogPostDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAttachment, setCurrentAttachment] = useState<{ id: string; label: string; fileName: string } | null>(null);
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadCourse, setLeadCourse] = useState<string>('');
    const [leadOtherCourse, setLeadOtherCourse] = useState('');
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const [leadError, setLeadError] = useState('');

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    const fetchPost = useCallback(async () => {
        if (!slug) {
            setError("Blog post slug not found in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedPost = await getPublishedBlogPostBySlugUser(slug);
            setPost(fetchedPost);
        } catch (err: any) {
            setError(err.message || 'Failed to load blog post.');
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);


    const handleDownloadClick = (attachmentId: string, label: string, fileName: string) => {
        setCurrentAttachment({ id: attachmentId, label, fileName });
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadCourse('');
        setLeadOtherCourse('');
        setLeadError('');
        setIsModalOpen(true);
    };

    const handleLeadFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentAttachment || !post) return;

        setIsSubmittingLead(true);
        setLeadError('');
        try {
            const leadData = {
                name: leadName, email: leadEmail, phoneNumber: leadPhone,
                interestedCourses: leadCourse ? [leadCourse] : [], otherCourseInterest: leadOtherCourse,
                sourceUrl: window.location.href,
                postId: post._id,
                attachmentId: currentAttachment.id,
            };

            const { token } = await submitLeadAndGetToken(leadData);

            const downloadUrl = `${apiBaseUrl}/downloads/gated-file/${token}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', currentAttachment.fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsModalOpen(false);
        } catch (err: any) {
            setLeadError(err.message || 'Submission failed. Please check your details and try again.');
        } finally {
            setIsSubmittingLead(false);
        }
    };

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getImageUrl = (imageUrl?: string) => {
        if (!imageUrl) return getSplashImageUrl();
        if (imageUrl.startsWith('blob:')) return imageUrl;
        try {
            const url = new URL(imageUrl);
            const pathSegments = url.pathname.split('/');
            const fileName = pathSegments[pathSegments.length - 1];
            if (!fileName) return getSplashImageUrl();
            if (url.pathname.includes('/blog_content_images/')) {
                return `${apiBaseUrl}/blog/content-image/${fileName}`;
            } else if (url.pathname.includes('/blog_images/')) {
                return `${apiBaseUrl}/blog/image/${fileName}`;
            }
            return imageUrl;
        } catch (e) {
            return getSplashImageUrl();
        }
    };

    const renderInteractiveContent = (htmlContent: string) => {
        if (!htmlContent) return null;
        return parse(htmlContent, {
            replace: (domNode: any) => {
                if (domNode.name === 'div' && domNode.attribs?.['data-gated-download']) {
                    const attachmentId = domNode.attribs['data-attachment-id'];
                    const label = domNode.attribs['data-label'] || 'Download File';
                    const attachment = post?.gatedAttachments?.find(a => a._id === attachmentId);

                    if (!attachment) return null;

                    return (
                        <Box sx={{ my: 3, p: 2, border: '2px dashed', borderColor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<FileDownloadIcon />}
                                onClick={() => handleDownloadClick(attachment._id, attachment.label, attachment.originalFileName)}
                            >
                                {label}
                            </Button>
                        </Box>
                    );
                }
            }
        });
    };

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /><Typography sx={{ ml: 1 }}>Loading Post...</Typography></Container>;
    }
    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error" action={<Button onClick={fetchPost}>Retry</Button>}>{error}</Alert></Container>;
    }
    if (!post) {
        return <Container sx={{ mt: 4 }}><Alert severity="info">Blog post not found or not available.</Alert></Container>;
    }

    // --- THIS IS THE CORRECTED LINE ---
    const authorName = post.author && typeof post.author === 'object' ? post.author.name : 'Anonymous';
    
    const canonicalUrl = `${window.location.origin}/blog/${post.slug}`;

    return (
        <>
            <DocumentHead
                title={`${post.title} | Tutor Uncle`}
                description={post.description || 'Read this insightful blog post from Tutor Uncle.'}
                canonicalUrl={canonicalUrl}
            />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">Home</MuiLink>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/blog">Blog</MuiLink>
                    <Typography color="text.primary" sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</Typography>
                </Breadcrumbs>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                        <img
                            src={post.featureImage ? getImageUrl(post.featureImage) : getSplashImageUrl()}
                            alt={post.title}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = getSplashImageUrl();
                            }}
                        />
                    </Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {post.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{authorName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{formatDate(post.publishedAt || post.createdAt)}</Typography>
                        </Box>
                        {post.category && post.category !== "Uncategorized" && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CategoryIcon fontSize="small" sx={{ mr: 0.5 }} />
                                <Chip label={post.category} size="small" component={RouterLink} to={`/blog/category/${slugifyCategory(post.category)}`} clickable />
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box
                        className="tiptap-rendered-content"
                        sx={{
                            '& table': { borderCollapse: 'collapse', width: '100%', my: 2, overflowX: 'auto', display: 'block' },
                            '& td, & th': { border: '1px solid', borderColor: 'divider', padding: '8px 12px', textAlign: 'left', minWidth: '100px' },
                            '& th': { fontWeight: 'bold', backgroundColor: 'action.hover' },
                            '& h1': { typography: 'h4', mt: 3, mb: 2 },
                            '& h2': { typography: 'h5', mt: 2.5, mb: 1.5 },
                            '& h3': { typography: 'h6', mt: 2, mb: 1 },
                            '& h4': { typography: 'subtitle1', mt: 1.5, mb: 0.5, fontWeight: 'bold' },
                            '& p': { typography: 'body1', lineHeight: 1.7, mb: 2, textAlign: 'justify' },
                            '& p[style*="text-align: center"]': { textAlign: 'center' },
                            '& p[style*="text-align: right"]': { textAlign: 'right' },
                            '& ul, & ol': { pl: 3, mb: 2 },
                            '& li': { mb: 0.5, typography: 'body1', lineHeight: 1.7 },
                            '& a': { color: 'primary.main' },
                            '& blockquote': { borderLeft: '4px solid', borderColor: 'divider', pl: 2, ml: 0, my: 2, fontStyle: 'italic', color: 'text.secondary' },
                            '& pre': { backgroundColor: 'action.hover', p: 2, borderRadius: 1, overflowX: 'auto', fontFamily: 'monospace' },
                            '& code': { backgroundColor: 'action.selected', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.9em' },
                            '& img': { maxWidth: '100%', height: 'auto', my: 2, borderRadius: 1, display: 'block', marginLeft: 'auto', marginRight: 'auto' },
                            '& u': { textDecoration: 'underline' },
                            '& mark': { backgroundColor: '#ffcc00', color: 'black' },
                        }}
                    >
                        {renderInteractiveContent(post.content)}
                    </Box>

                    {post.tags && post.tags.length > 0 && (
                        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" component="span" sx={{ mr: 1, fontWeight: 'bold' }}>Tags:</Typography>
                            {post.tags.map((tag, index) => (
                                <Chip
                                    key={`${tag}-${index}`}
                                    label={tag}
                                    size="small"
                                    component={RouterLink}
                                    to={`/blog/tag/${slugifyCategory(tag)}`}
                                    clickable
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            ))}
                        </Box>
                    )}
                </Paper>
                <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <DialogTitle>Access Your Free Material</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Please provide your details to download: <strong>{currentAttachment?.label}</strong>
                        </Typography>
                        {leadError && <Alert severity="error" sx={{ mb: 2 }}>{leadError}</Alert>}
                        <Box component="form" id="lead-form" onSubmit={handleLeadFormSubmit}>
                            <Grid container spacing={2}>
                                <Grid sx={{width: { xs:'100%'}}}><TextField name="name" label="Full Name" fullWidth required value={leadName} onChange={(e) => setLeadName(e.target.value)} disabled={isSubmittingLead} /></Grid>
                                <Grid sx={{width: { xs:'100%'}}}><TextField name="email" label="Email Address" type="email" fullWidth required value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} disabled={isSubmittingLead} /></Grid>
                                <Grid sx={{width: { xs:'100%'}}}><TextField name="phoneNumber" label="Phone Number" fullWidth required value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} disabled={isSubmittingLead} /></Grid>
                                <Grid sx={{width: { xs:'100%'}}}>
                                    <FormControl fullWidth>
                                        <InputLabel id="courses-select-label">Interested Course</InputLabel>
                                        <Select
                                            labelId="courses-select-label"
                                            value={leadCourse}
                                            onChange={(e: SelectChangeEvent<string>) => setLeadCourse(e.target.value)}
                                            label="Interested Course"
                                        >
                                            <MenuItem value=""><em>-- Please select a course --</em></MenuItem>
                                            {Object.entries(courseOptions).map(([group, options]) => [
                                                <Typography component="div" key={group} sx={{ fontWeight: 'bold', pl: 2, my: 1, color: 'text.secondary', pointerEvents: 'none' }}>{group}</Typography>,
                                                ...options.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)
                                            ])}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid sx={{width: {sm:'100%'}}}>
                                    <TextField name="other" label="Other (if not listed)" fullWidth value={leadOtherCourse} onChange={(e) => setLeadOtherCourse(e.target.value)} disabled={isSubmittingLead} />
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsModalOpen(false)} disabled={isSubmittingLead}>Cancel</Button>
                        <Button type="submit" form="lead-form" variant="contained" disabled={isSubmittingLead}>
                            {isSubmittingLead ? <CircularProgress size={24} /> : 'Download Now'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

const slugifyCategory = (categoryName: string) => {
    if (!categoryName) return '';
    return categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export default BlogPostDetailPage;