import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Chip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle as MuiDialogTitle
} from '@mui/material';
import {
    DataGrid, type GridColDef, GridActionsCellItem, type GridRowId, type GridRenderCellParams,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import {
    getAllBlogPostsAdmin,
    deleteBlogPostAdmin,
    type BlogPost
} from '../services/blogAdminService'; 

interface BlogPostDataGridRow extends BlogPost {
    id: string; 
}

const gridDateFormatter = (value: string | Date | undefined | null): string => {
    if (!value) return 'N/A';
    try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) { return 'Invalid Date'; }
};

const AdminBlogListPage: React.FC = () => {
    const [postsForGrid, setPostsForGrid] = useState<BlogPostDataGridRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [deletePostId, setDeletePostId] = useState<GridRowId | null>(null);
    const [postToDeleteTitle, setPostToDeleteTitle] = useState<string>('');
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [page, setPage] = useState(1);
    const [limit] = useState(10); 
    const [totalPosts, setTotalPosts] = useState(0);


    const fetchBlogPosts = useCallback(async (currentPage: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const { posts, total } = await getAllBlogPostsAdmin(currentPage, limit);
            const postsWithId = posts.map(post => ({ ...post, id: post._id }));
            setPostsForGrid(postsWithId || []);
            setTotalPosts(total);
            setPage(currentPage);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load blog posts.');
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchBlogPosts(page);
    }, [fetchBlogPosts, page]);

    const handleAddPost = () => navigate('/admin/blog/new');
    const handleEditPost = (id: GridRowId) => navigate(`/admin/blog/edit/${id}`);
    
    const openDeleteDialog = (id: GridRowId, title: string) => {
        setDeletePostId(id);
        setPostToDeleteTitle(title);
        setOpenDeleteConfirm(true);
    };

    const handleDeletePost = async () => {
        if (!deletePostId) return;
        setIsDeleting(true);
        setError(null);
        try {
            await deleteBlogPostAdmin(deletePostId.toString());
            fetchBlogPosts(page); // Refetch the data for the current page
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete post.');
        } finally {
            setOpenDeleteConfirm(false);
            setIsDeleting(false);
            setDeletePostId(null);
        }
    };
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    const getImageUrl = (bunnyUrl?: string) => {
        if (!bunnyUrl) {
            return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=No+Image`;
        }
        
        if (bunnyUrl.startsWith('http')) {
            try {
                const url = new URL(bunnyUrl);
                const pathSegments = url.pathname.split('/');
                const fileName = pathSegments[pathSegments.length - 1];

                if (!fileName) return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=Invalid+URL`;

                return `${apiBaseUrl}/blog/image/${fileName}`;
            } catch (e) {
                return `https://placehold.co/600x400/EAEAEA/B0B0B0?text=Invalid+Image`;
            }
        }
        return `${apiBaseUrl.replace(/\/$/, '')}/${bunnyUrl.replace(/^\//, '')}`;
    };

    const columns = useMemo((): GridColDef<BlogPostDataGridRow>[] => [ 
        { 
            field: 'featureImage', headerName: 'Image', width: 100, sortable: false, filterable: false,
            renderCell: (params: GridRenderCellParams) => (
                params.row?.featureImage ? 
                <img 
                    src={getImageUrl(params.row.featureImage)}
                    alt={params.row.title?.substring(0,10) || 'feature'} 
                    style={{width: 50, height: 50, objectFit: 'cover', borderRadius: '4px'}}
                /> 
                : <PhotoCameraIcon color="action" sx={{fontSize: 30}}/>
            )
        },
        { field: 'title', headerName: 'Title', flex: 0.4, minWidth: 250 },
        { field: 'slug', headerName: 'Slug', width: 200 },
        { 
            field: 'author', 
            headerName: 'Author', 
            width: 180,
            renderCell: (params: GridRenderCellParams) => {
                const author = params.row.author;
                if (typeof author === 'object' && author !== null && author.name) {
                    return author.name;
                }
                return String(author) || 'Unknown Author';
            }
        },
        { 
            field: 'isPublished', headerName: 'Status', width: 120,
            renderCell: (params: GridRenderCellParams) => 
                params.row?.isPublished ? 
                <Chip icon={<VisibilityIcon fontSize="small"/>} label="Published" color="success" size="small" variant="outlined" /> : 
                <Chip icon={<VisibilityOffIcon fontSize="small"/>} label="Draft" color="default" size="small" variant="outlined" />
        },
        { 
            field: 'publishedAt', headerName: 'Published On', width: 180, type: 'dateTime', 
            valueFormatter: (params) => gridDateFormatter(params)
        },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 120,
            getActions: ({ id, row }) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleEditPost(id)} color="primary" key={`edit-${id}`}/>,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => openDeleteDialog(id, row.title)} color="inherit" key={`delete-${id}`}/>,
            ],
        },
    ], []); 

    if (isLoading && postsForGrid.length === 0) return <Container sx={{mt:5, textAlign:'center'}}><CircularProgress /></Container>;

    return (
        <AdminLayout title="Blog Posts">
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>Manage Blog Posts</Typography>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddPost}>
                        Add New Post
                    </Button>
                </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ height: 650, width: '100%' }}>
                <DataGrid
                    rows={postsForGrid} 
                    columns={columns}
                    rowCount={totalPosts} 
                    paginationMode="server" 
                    pageSizeOptions={[limit]} 
                    paginationModel={{ page: page - 1, pageSize: limit }} 
                    onPaginationModelChange={(model) => setPage(model.page + 1)} 
                    disableRowSelectionOnClick
                    loading={isLoading}
                />
            </Paper>

            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <MuiDialogTitle>Confirm Post Deletion</MuiDialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete the post "<strong>{postToDeleteTitle}</strong>"? This action cannot be undone.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
                    <Button onClick={handleDeletePost} color="error" variant="contained" autoFocus disabled={isDeleting}>
                        {isDeleting ? <CircularProgress size={24}/> : "Delete Post"}
                    </Button>
                </DialogActions>
            </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminBlogListPage;
