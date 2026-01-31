// src/pages/admin/AdminUsersListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Button as MuiButton,
    Chip,
    Box,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
// Ensure AdminUserView is exported from adminService.ts and includes 'subscriptions' array
import { getAllUsers, updateUserRole, deleteUser, type AdminUserView } from '../services/adminService'; 
import { useAuth } from '../contexts/AuthContext';
import CreateUserDialog from '../components/admin/CreateUserDialog';
import EditPasswordDialog from '../components/admin/EditPasswordDialog'; 

import type { SubscriptionPlan } from '../services/subscriptionPlanAdminService'; 


const AdminUsersListPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateStatus, setUpdateStatus] = useState<{ [userId: string]: { loading: boolean; error?: string; success?: string } }>({});
    const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
    const [editPasswordDialogOpen, setEditPasswordDialogOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<{ id: string; name: string } | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { user: currentAdmin } = useAuth();
    const navigate = useNavigate();

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsersArray = await getAllUsers(); 
            
            if (Array.isArray(fetchedUsersArray)) {
                // Ensure each user object has a 'subscriptions' array, even if it's empty
                const usersWithGuaranteedSubscriptions = fetchedUsersArray.map(u => ({
                    ...u,
                    subscriptions: Array.isArray(u.subscriptions) ? u.subscriptions : []
                }));
                setUsers(usersWithGuaranteedSubscriptions); 
            } else {
                throw new Error('Invalid data structure received for users from service.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching users.');
            setUsers([]); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const executeRoleChange = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'user' ? 'admin' : 'user';
        setUpdateStatus(prev => ({ ...prev, [userId]: { loading: true, error: undefined, success: undefined } }));
        setError(null); 
        try {
            const response = await updateUserRole(userId, newRole as 'user' | 'admin'); 
            
            if (response && response.role) {
                 setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user._id === userId ? { ...user, role: response.role as 'user' | 'admin' } : user
                    )
                );
                setUpdateStatus(prev => ({ ...prev, [userId]: { loading: false, success: `Role updated to ${newRole}` } }));
                setTimeout(() => {
                     setUpdateStatus(prev => ({ ...prev, [userId]: { ...prev[userId], success: undefined } }));
                }, 3000);
            } else {
                 throw new Error( `Failed to update role to ${newRole}`);
            }
        } catch (err: any) {
            setUpdateStatus(prev => ({ ...prev, [userId]: { loading: false, error: err.response?.data?.message || err.message || 'Update failed' } }));
            setTimeout(() => {
                setUpdateStatus(prev => ({ ...prev, [userId]: { ...prev[userId], error: undefined } }));
            }, 5000);
        }
    };

    const confirmAndChangeRole = (userId: string, userName: string, currentRole: 'user' | 'admin') => {
        const newRole = currentRole === 'user' ? 'admin' : 'user';
        const confirmationMessage = `Are you sure you want to change ${userName}'s role to "${newRole}"?`;
        if (window.confirm(confirmationMessage)) {
            executeRoleChange(userId, currentRole);
        }
    };

    const handleManageSubscription = (userId: string) => {
        navigate(`/admin/users/${userId}/manage-subscription`);
    };

    const handleCreateUserSuccess = () => {
        fetchUsers(); // Refresh the user list
    };

    const handleEditPassword = (userId: string, userName: string) => {
        setSelectedUserForPassword({ id: userId, name: userName });
        setEditPasswordDialogOpen(true);
    };

    const handleEditPasswordSuccess = () => {
        // Optionally show a success message
        setUpdateStatus(prev => ({
            ...prev,
            [selectedUserForPassword?.id || '']: { 
                loading: false, 
                success: 'Password updated successfully' 
            }
        }));
        setTimeout(() => {
            setUpdateStatus(prev => {
                const newStatus = { ...prev };
                if (selectedUserForPassword?.id) {
                    delete newStatus[selectedUserForPassword.id];
                }
                return newStatus;
            });
        }, 3000);
    };

    const handleDeleteClick = (userId: string, userName: string, userEmail: string) => {
        setUserToDelete({ id: userId, name: userName, email: userEmail });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setDeleteLoading(true);
        try {
            await deleteUser(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            // Refresh the user list
            await fetchUsers();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete user. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    if (isLoading && users.length === 0) {
        return (
            <AdminLayout title="Users">
                <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
                    <CircularProgress />
                    <Typography sx={{ml: 2}}>Loading users...</Typography>
                </Container>
            </AdminLayout>
        );
    }

    if (error && users.length === 0) {
        return (
            <AdminLayout title="Users">
                <Container sx={{mt:3}}>
                    <Alert severity="error">Error: {error}</Alert>
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management">
            <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                        User Management
                    </Typography>
                    <MuiButton
                        variant="contained"
                        size="small"
                        startIcon={<PersonAddIcon fontSize="small" />}
                        onClick={() => setCreateUserDialogOpen(true)}
                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                    >
                        Create New User
                    </MuiButton>
                </Box>
            {error && users.length > 0 && <Alert severity="warning" sx={{mb: 1.5, fontSize: '0.75rem', py: 0.5}}>Could not fully refresh user data: {error}</Alert>}

            {users.length === 0 && !isLoading ? (
                <Paper sx={{p: 2, textAlign: 'center'}}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>No users found.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 'calc(100vh - 100px)' }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 800 }} aria-label="users table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Current Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Subscription Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Primary Plan</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Joined</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1, textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => {
                                const statusUpdateInfo = updateStatus[user._id] || { loading: false };
                                const isAdminUser = user.role === 'admin';
                                const isCurrentUser = user._id === currentAdmin?._id;

                                // Find the first active subscription for display purposes
                                let displaySubStatus = 'none';
                                let displayPlanName = 'N/A';
                                let displaySubStatusColor: "default" | "success" | "warning" | "error" = "default";

                                if (user.subscriptions && user.subscriptions.length > 0) {
                                    const now = new Date();
                                    const activeSub = user.subscriptions.find(sub => 
                                        sub.status === 'active' && 
                                        sub.startDate && sub.endDate &&
                                        new Date(sub.startDate) <= now && 
                                        new Date(sub.endDate) >= now
                                    );

                                    if (activeSub) {
                                        displaySubStatus = activeSub.status || 'unknown';
                                        displayPlanName = activeSub.planName || (typeof activeSub.planId === 'object' ? (activeSub.planId as SubscriptionPlan).name : 'Unknown Plan');
                                        displaySubStatusColor = 'success';
                                    } else {
                                        // If no active sub, find the most recent non-active one or just show 'None'
                                        const latestSub = user.subscriptions
                                            .filter(sub => sub.endDate)
                                            .sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime())[0];
                                        if (latestSub) {
                                            displaySubStatus = latestSub.status || 'none';
                                            displayPlanName = latestSub.planName || (typeof latestSub.planId === 'object' ? (latestSub.planId as SubscriptionPlan).name : 'N/A');
                                            if (latestSub.status === 'expired' || latestSub.status === 'cancelled') {
                                                displaySubStatusColor = 'error';
                                            } else if (latestSub.status === 'pending_cancellation') {
                                                displaySubStatusColor = 'warning';
                                            }
                                        }
                                    }
                                }
                                
                                return (
                                    <TableRow 
                                        key={user._id} 
                                        sx={{ 
                                            backgroundColor: isCurrentUser ? '#e3f2fd' : 'transparent',
                                            '&:hover': { backgroundColor: '#f1f1f1' }
                                        }}
                                    >
                                        <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>{user.name}{isCurrentUser ? ' (You)' : ''}</TableCell>
                                        <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>{user.email}</TableCell>
                                        <TableCell sx={{ padding: '6px 8px' }}>
                                            <Chip label={user.role.toUpperCase()} color={isAdminUser ? "secondary" : "primary"} size="small" sx={{ fontSize: '0.7rem', height: '22px' }} />
                                        </TableCell>
                                        <TableCell sx={{ padding: '6px 8px' }}>
                                            <Chip label={displaySubStatus.toUpperCase()} color={displaySubStatusColor} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: '22px' }}/>
                                        </TableCell>
                                        <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>
                                            {displayPlanName}
                                        </TableCell>
                                        <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ padding: '6px 8px', textAlign: 'center' }}>
                                            <Box sx={{display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap'}}>
                                                {!isCurrentUser && (
                                                    <MuiButton
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
                                                        onClick={() => confirmAndChangeRole(user._id, user.name, user.role as 'user' | 'admin')}
                                                        disabled={statusUpdateInfo.loading}
                                                        sx={{textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5}}
                                                    >
                                                        {statusUpdateInfo.loading ? <CircularProgress size={14}/> : (isAdminUser ? 'Make User' : 'Make Admin')}
                                                    </MuiButton>
                                                )}
                                                <MuiButton
                                                    variant="outlined"
                                                    size="small"
                                                    color="warning"
                                                    startIcon={<LockIcon sx={{ fontSize: '0.9rem' }} />}
                                                    onClick={() => handleEditPassword(user._id, user.name)}
                                                    sx={{textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5}}
                                                >
                                                    Change Password
                                                </MuiButton>
                                                <MuiButton
                                                    variant="outlined"
                                                    size="small"
                                                    color="info"
                                                    startIcon={<SubscriptionsIcon sx={{ fontSize: '0.9rem' }} />}
                                                    onClick={() => handleManageSubscription(user._id)}
                                                    sx={{textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5}}
                                                >
                                                    Manage Subs
                                                </MuiButton>
                                                {!isCurrentUser && (
                                                    <MuiButton
                                                        variant="outlined"
                                                        size="small"
                                                        color="error"
                                                        startIcon={<DeleteIcon sx={{ fontSize: '0.9rem' }} />}
                                                        onClick={() => handleDeleteClick(user._id, user.name, user.email)}
                                                        sx={{textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5}}
                                                    >
                                                        Delete
                                                    </MuiButton>
                                                )}
                                            </Box>
                                            {statusUpdateInfo.error && <Typography color="error" variant="caption" display="block" sx={{mt:0.5, fontSize: '0.65rem'}}>{statusUpdateInfo.error}</Typography>}
                                            {statusUpdateInfo.success && <Typography color="success.main" variant="caption" display="block" sx={{mt:0.5, fontSize: '0.65rem'}}>{statusUpdateInfo.success}</Typography>}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create User Dialog */}
            <CreateUserDialog
                open={createUserDialogOpen}
                onClose={() => setCreateUserDialogOpen(false)}
                onSuccess={handleCreateUserSuccess}
            />

            {/* Edit Password Dialog */}
            {selectedUserForPassword && (
                <EditPasswordDialog
                    open={editPasswordDialogOpen}
                    onClose={() => {
                        setEditPasswordDialogOpen(false);
                        setSelectedUserForPassword(null);
                    }}
                    userId={selectedUserForPassword.id}
                    userName={selectedUserForPassword.name}
                    onSuccess={handleEditPasswordSuccess}
                />
            )}

            {/* Delete User Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Delete User
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                        <br /><br />
                        <strong>Warning:</strong> This action will permanently delete:
                        <ul style={{ marginTop: '8px', marginBottom: '8px' }}>
                            <li>User account and profile</li>
                            <li>All video watch progress</li>
                            <li>All notifications</li>
                            <li>User subscriptions</li>
                            <li>Active sessions</li>
                        </ul>
                        Blog posts, videos, and knowledge base articles created by this user will be preserved but the author will be removed.
                        <br /><br />
                        <strong>This action cannot be undone.</strong>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={handleDeleteCancel} disabled={deleteLoading}>
                        Cancel
                    </MuiButton>
                    <MuiButton 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete User'}
                    </MuiButton>
                </DialogActions>
            </Dialog>
            </Container>
        </AdminLayout>
    );
};

export default AdminUsersListPage;
