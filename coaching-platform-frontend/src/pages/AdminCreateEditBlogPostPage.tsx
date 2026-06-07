// File: src/pages/admin/AdminCreateEditBlogPostPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper,
    TextField, Grid, Switch, FormControlLabel, Autocomplete, Chip, FormHelperText,
    Breadcrumbs, Link as MuiLink, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import slugify from 'slugify';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

import TiptapEditor from '../components/features/blog/LazyTiptapEditor';
import { useAuth } from '../contexts/AuthContext';
import {
    createBlogPostAdmin,
    updateBlogPostAdmin,
    getBlogPostByIdAdmin,
    type BlogPostCreateInput,
    type BlogPostUpdateInput,
    uploadGatedAttachmentAdmin
} from '../services/blogAdminService';

interface AttachmentToInsert {
    id: string;
    label: string;
}

const AdminCreateEditBlogPostPage: React.FC = () => {
    const { postId } = useParams<{ postId?: string }>();
    const isEditMode = Boolean(postId);
    useAdminLayoutPage({ title: isEditMode ? 'Edit Blog Post' : 'Create Blog Post' });
    const navigate = useNavigate();
    const { user: adminUser } = useAuth();
    const editorRef = useRef<any>(null);

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Uncategorized');
    const [tags, setTags] = useState<string[]>([]);
    const [isPublished, setIsPublished] = useState(false);
    const [publishedAt, setPublishedAt] = useState<Date | null>(null);
    const [featureImageFile, setFeatureImageFile] = useState<File | null>(null);
    const [currentFeatureImageUrl, setCurrentFeatureImageUrl] = useState<string | null>(null);
    const [removeFeatureImage, setRemoveFeatureImage] = useState<boolean>(false);
    const [isGatedFileDialogOpen, setIsGatedFileDialogOpen] = useState(false);
    const [gatedFile, setGatedFile] = useState<File | null>(null);
    const [gatedFileLabel, setGatedFileLabel] = useState('');
    const [isUploadingGatedFile, setIsUploadingGatedFile] = useState(false);
    const [attachmentToInsert, setAttachmentToInsert] = useState<AttachmentToInsert | null>(null);


    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const generateSlug = useCallback((titleToSlug: string) => {
        return slugify(titleToSlug, { lower: true, strict: true, remove: /[*+~.()'"!:@#?$]/g });
    }, []);

    // Fetch post data if in edit mode
    useEffect(() => {
        if (isEditMode && postId) {
            setIsLoading(true);
            getBlogPostByIdAdmin(postId)
                .then(post => {
                    setTitle(post.title);
                    setSlug(post.slug);
                    setDescription(post.description || '');
                    setContent(post.content);
                    setCategory(post.category || 'Uncategorized');
                    setTags(Array.isArray(post.tags) ? post.tags : []);
                    setIsPublished(post.isPublished || false);
                    setPublishedAt(post.publishedAt ? new Date(post.publishedAt) : null);
                    setCurrentFeatureImageUrl(post.featureImage || null);
                    setRemoveFeatureImage(false);
                })
                .catch(err => {
                    setError(err.message || "Failed to load post details.");
                })
                .finally(() => setIsLoading(false));
        } else {
            setContent('<p>Start writing your amazing blog post here...</p>');
        }
    }, [postId, isEditMode]);

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        if (!slug || slug === generateSlug(title)) {
            setSlug(generateSlug(newTitle));
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFeatureImageFile(event.target.files[0]);
            setCurrentFeatureImageUrl(URL.createObjectURL(event.target.files[0]));
            setRemoveFeatureImage(false);
        }
    };

    const handleRemoveFeatureImage = () => {
        setFeatureImageFile(null);
        setCurrentFeatureImageUrl(null);
        setRemoveFeatureImage(true);
    };

    const handleOpenGatedFileDialog = () => {
        if (!isEditMode) {
            alert("Please save the blog post first before adding downloadable files.");
            return;
        }
        setGatedFile(null);
        setGatedFileLabel('');
        setIsGatedFileDialogOpen(true);
    };

    const handleGatedFileUpload = async () => {
        if (!postId || !gatedFile || !gatedFileLabel.trim()) {
            alert("Please provide a file and a label.");
            return;
        }

        setIsUploadingGatedFile(true);
        const formData = new FormData();
        formData.append('gatedFile', gatedFile);
        formData.append('label', gatedFileLabel);

        try {
            const newAttachment = await uploadGatedAttachmentAdmin(postId, formData);
            if (newAttachment?._id && newAttachment?.label) {
                setAttachmentToInsert({
                    id: newAttachment._id,
                    label: newAttachment.label,
                });
            }

            setIsGatedFileDialogOpen(false); 
        } catch (err: any) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setIsUploadingGatedFile(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!adminUser) { setError("Authentication error. Please log in again."); return; }
        if (!title.trim() || !content.trim() || !description.trim()) {
            setError("Title, Description, and Content are required fields.");
            return;
        }

        setIsLoading(true); setError(null); setSuccess(null);

        let finalSlug = slug.trim() ? slugify(slug.trim(), { lower: true, strict: true }) : generateSlug(title);
        if (!finalSlug && title.trim()) finalSlug = generateSlug(title.trim());

        if (!finalSlug) {
            setError("Could not generate a valid slug. Please check the title or enter a slug manually.");
            setIsLoading(false);
            return;
        }

        if (isEditMode && postId) {
            const updatePayload: BlogPostUpdateInput = {
                title, slug: finalSlug, description, content, category, tags, isPublished,
                publishedAt: isPublished ? (publishedAt || new Date()) : null,
                removeFeatureImage: removeFeatureImage,
            };
            if (featureImageFile) {
                updatePayload.featureImage = featureImageFile;
            }

            try {
                await updateBlogPostAdmin(postId, updatePayload);
                setSuccess("Blog post updated successfully!");
                setTimeout(() => navigate('/admin/blog'), 1500);
            } catch (err: any) { setError(err.message || "Failed to update blog post."); }

        } else {
            const createPayload: BlogPostCreateInput = {
                title, description, content, category, tags, isPublished,
                publishedAt: isPublished ? (publishedAt || new Date()) : null,
                slug: finalSlug,
                featureImage: featureImageFile,
            };
            try {
                await createBlogPostAdmin(createPayload);
                setSuccess("Blog post created successfully! Redirecting...");
                setTimeout(() => navigate('/admin/blog'), 1500);
            } catch (err: any) { setError(err.message || "Failed to create blog post."); }
        }
        setIsLoading(false);
    };

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    const getImageUrl = (imageUrl?: string) => {
        if (!imageUrl) {
            return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=No+Image`;
        }

        if (imageUrl.startsWith('http')) {
            try {
                const url = new URL(imageUrl);
                const pathSegments = url.pathname.split('/');
                const fileName = pathSegments[pathSegments.length - 1];

                if (!fileName) return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=Invalid+URL`;

                return `${apiBaseUrl}/blog/image/${fileName}`;
            } catch (e) {
                return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=Invalid+Image`;
            }
        }
        return `${apiBaseUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
    };

    if (isLoading && isEditMode && !title) {
        return <Container sx={{ mt: 5, textAlign: 'center' }}><CircularProgress /></Container>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">Admin</MuiLink>
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/blog">Manage Blog</MuiLink>
                    <Typography color="text.primary">{isEditMode ? `Edit: ${title || 'Post'}` : 'Create New Post'}</Typography>
                </Breadcrumbs>

                <Typography variant="h4" component="h1" gutterBottom>
                    {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={3}>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <TextField label="Post Title" fullWidth required value={title} onChange={handleTitleChange} disabled={isLoading} helperText="The main title of your blog post." />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <TextField label="Slug (URL)" fullWidth value={slug} onChange={(e) => setSlug(e.target.value)} helperText="URL-friendly version of the title (e.g., my-awesome-post). Auto-generated if left blank." disabled={isLoading} />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <TextField label="Short Description / Excerpt" fullWidth required multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} helperText="A brief summary for previews and SEO (max 300 characters)." disabled={isLoading} />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <Typography variant="subtitle1">Main Content*</Typography>
                            <TiptapEditor
                                onEditorReady={(editor) => { editorRef.current = editor; }}
                                content={content}
                                onChange={setContent}
                                readOnly={isUploadingGatedFile}
                                onAddGatedFileClick={handleOpenGatedFileDialog}
                                attachmentToInsert={attachmentToInsert}
                                onAttachmentInserted={() => setAttachmentToInsert(null)}
                            />
                            <FormHelperText sx={{ mt: 0.5 }}>Use the rich text editor above for your post content.</FormHelperText>
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <TextField label="Category" fullWidth value={category} onChange={(e) => setCategory(e.target.value)} helperText="e.g., Technology, Health, News" disabled={isLoading} />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <Autocomplete multiple freeSolo options={[]} value={tags}
                                onChange={(_, newValue) => {
                                    setTags(newValue.map(tag => typeof tag === 'string' ? tag.trim() : tag).filter(Boolean));
                                }}
                                renderTags={(value: readonly string[], getTagProps) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return <Chip variant="outlined" label={option} {...tagProps} key={key || index} />;
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Tags" helperText="Press Enter to add a new tag." disabled={isLoading} />
                                )}
                            />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%' } }}>
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Feature Image</Typography>
                                <Button variant="outlined" component="label" size="small" disabled={isLoading} sx={{ mr: 2 }}>
                                    {featureImageFile ? 'Change Image' : (currentFeatureImageUrl ? 'Change Image' : 'Upload Image')}
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </Button>
                                {currentFeatureImageUrl && (
                                    <Button size="small" color="error" variant="text" onClick={handleRemoveFeatureImage} disabled={isLoading}>Remove Image</Button>
                                )}
                                {currentFeatureImageUrl && (
                                    <Box sx={{ mt: 1, border: '1px solid #ddd', p: 1, borderRadius: 1, display: 'inline-block' }}>
                                        <img
                                            src={currentFeatureImageUrl.startsWith('blob:') ? currentFeatureImageUrl : `${getImageUrl(currentFeatureImageUrl)}`}
                                            alt="Feature preview"
                                            style={{ maxHeight: '100px', maxWidth: '150px', display: 'block' }}
                                        />
                                    </Box>
                                )}
                                {featureImageFile && (
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>New: {featureImageFile.name}</Typography>
                                )}
                            </Box>
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <FormControlLabel
                                control={<Switch checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} name="isPublished" />}
                                label={isPublished ? "Published" : "Draft (Not Published)"}
                                disabled={isLoading}
                                sx={{ mb: 1 }}
                            />
                            {isPublished && (
                                <DateTimePicker
                                    label="Publish Date/Time"
                                    value={publishedAt}
                                    onChange={(newValue) => setPublishedAt(newValue)}
                                    sx={{ width: '100%' }}
                                    slotProps={{ textField: { size: 'small', helperText: "Defaults to now if publishing and left blank." } }}
                                    disabled={isLoading}
                                />
                            )}
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button component={RouterLink} to="/admin/blog" color="inherit" sx={{ mr: 2 }} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                            {isLoading ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Create Post')}
                        </Button>
                    </Box>
                </Paper>
                <Dialog open={isGatedFileDialogOpen} onClose={() => setIsGatedFileDialogOpen(false)}>
                    <DialogTitle>Add Gated File</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Button Label (e.g., Download PDF)"
                            fullWidth
                            variant="standard"
                            value={gatedFileLabel}
                            onChange={(e) => setGatedFileLabel(e.target.value)}
                        />
                        <Button component="label" sx={{ mt: 2 }}>
                            Select File
                            <input type="file" hidden onChange={(e) => setGatedFile(e.target.files?.[0] || null)} />
                        </Button>
                        {gatedFile && <Typography variant="caption" sx={{ ml: 1 }}>{gatedFile.name}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsGatedFileDialogOpen(false)} disabled={isUploadingGatedFile}>Cancel</Button>
                        <Button onClick={handleGatedFileUpload} variant="contained" disabled={isUploadingGatedFile}>
                            {isUploadingGatedFile ? <CircularProgress size={24} /> : "Upload & Insert"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default AdminCreateEditBlogPostPage;