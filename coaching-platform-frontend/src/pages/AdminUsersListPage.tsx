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
    DialogActions,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    resendLoginPinForUser,
    type AdminUserView,
} from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import CreateUserDialog from '../components/admin/CreateUserDialog';
import { getUserPhone, getUserPlanDisplay } from '../utils/adminUserDisplay';

type UserListTab = 'free' | 'premium' | 'search';

const AdminUsersListPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateStatus, setUpdateStatus] = useState<{
        [userId: string]: { loading: boolean; error?: string; success?: string };
    }>({});
    const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState<UserListTab>('free');
    const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);

    const { user: currentAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedSearch) {
            setActiveTab('search');
        } else {
            setActiveTab((t) => (t === 'search' ? 'free' : t));
        }
    }, [debouncedSearch]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const query =
                debouncedSearch.length > 0
                    ? { search: debouncedSearch, limit: 100 }
                    : activeTab === 'search'
                      ? { segment: 'free' as const, limit: 50 }
                      : { segment: activeTab, limit: 50 };

            const fetchedUsersArray = await getAllUsers(query);
            if (Array.isArray(fetchedUsersArray)) {
                setUsers(
                    fetchedUsersArray.map((u) => ({
                        ...u,
                        subscriptions: Array.isArray(u.subscriptions) ? u.subscriptions : [],
                    }))
                );
            } else {
                throw new Error('Invalid data structure received for users from service.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred while fetching users.';
            setError(message);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, activeTab]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const executeRoleChange = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'user' ? 'admin' : 'user';
        setUpdateStatus((prev) => ({ ...prev, [userId]: { loading: true, error: undefined, success: undefined } }));
        setError(null);
        try {
            const response = await updateUserRole(userId, newRole as 'user' | 'admin');
            if (response && response.role) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user._id === userId ? { ...user, role: response.role as 'user' | 'admin' } : user
                    )
                );
                setUpdateStatus((prev) => ({
                    ...prev,
                    [userId]: { loading: false, success: `Role updated to ${newRole}` },
                }));
                setTimeout(() => {
                    setUpdateStatus((prev) => ({
                        ...prev,
                        [userId]: { ...prev[userId], success: undefined },
                    }));
                }, 3000);
            } else {
                throw new Error(`Failed to update role to ${newRole}`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Update failed';
            setUpdateStatus((prev) => ({
                ...prev,
                [userId]: { loading: false, error: message },
            }));
            setTimeout(() => {
                setUpdateStatus((prev) => ({
                    ...prev,
                    [userId]: { ...prev[userId], error: undefined },
                }));
            }, 5000);
        }
    };

    const confirmAndChangeRole = (userId: string, userName: string, currentRole: 'user' | 'admin') => {
        const newRole = currentRole === 'user' ? 'admin' : 'user';
        if (window.confirm(`Are you sure you want to change ${userName}'s role to "${newRole}"?`)) {
            executeRoleChange(userId, currentRole);
        }
    };

    const handleManageSubscription = (userId: string) => {
        navigate(`/admin/users/${userId}/manage-subscription`);
    };

    const handleResendPin = async (userId: string, userName: string) => {
        setResendLoadingId(userId);
        setError(null);
        try {
            const result = await resendLoginPinForUser(userId);
            setUpdateStatus((prev) => ({
                ...prev,
                [userId]: { loading: false, success: result.message || `PIN emailed for ${userName}` },
            }));
            setTimeout(() => {
                setUpdateStatus((prev) => ({
                    ...prev,
                    [userId]: { ...prev[userId], success: undefined },
                }));
            }, 4000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to resend PIN';
            setUpdateStatus((prev) => ({
                ...prev,
                [userId]: { loading: false, error: message },
            }));
        } finally {
            setResendLoadingId(null);
        }
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
            await fetchUsers();
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete user.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const listTitle =
        debouncedSearch.length > 0
            ? `Search results (${users.length})`
            : activeTab === 'free'
              ? 'Last 50 — Free Foundation'
              : 'Last 50 — Premium';

    const renderUserTable = () => (
        <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 720 }} aria-label="users table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Plan</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 }}>Joined</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1, textAlign: 'center' }}>
                            Actions
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => {
                        const statusUpdateInfo = updateStatus[user._id] || { loading: false };
                        const isAdminUser = user.role === 'admin';
                        const isCurrentUser = user._id === currentAdmin?._id;
                        const { planName, statusColor } = getUserPlanDisplay(user);
                        const busy = resendLoadingId === user._id;

                        return (
                            <TableRow
                                key={user._id}
                                sx={{
                                    backgroundColor: isCurrentUser ? '#e3f2fd' : 'transparent',
                                    '&:hover': { backgroundColor: '#f1f1f1' },
                                }}
                            >
                                <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>
                                    <Tooltip title={user.email} placement="top-start">
                                        <span>
                                            {user.name}
                                            {isCurrentUser ? ' (You)' : ''}
                                        </span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>{getUserPhone(user)}</TableCell>
                                <TableCell sx={{ padding: '6px 8px' }}>
                                    <Chip
                                        label={user.role.toUpperCase()}
                                        color={isAdminUser ? 'secondary' : 'primary'}
                                        size="small"
                                        sx={{ fontSize: '0.7rem', height: '22px' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ padding: '6px 8px' }}>
                                    <Chip
                                        label={planName}
                                        color={statusColor}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: '22px' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ padding: '6px 8px', fontSize: '0.8rem' }}>
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell sx={{ padding: '6px 8px', textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {!isCurrentUser && (
                                            <MuiButton
                                                variant="outlined"
                                                size="small"
                                                startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
                                                onClick={() =>
                                                    confirmAndChangeRole(user._id, user.name, user.role as 'user' | 'admin')
                                                }
                                                disabled={statusUpdateInfo.loading}
                                                sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5 }}
                                            >
                                                {statusUpdateInfo.loading ? (
                                                    <CircularProgress size={14} />
                                                ) : isAdminUser ? (
                                                    'Make User'
                                                ) : (
                                                    'Make Admin'
                                                )}
                                            </MuiButton>
                                        )}
                                        <MuiButton
                                            variant="outlined"
                                            size="small"
                                            color="warning"
                                            startIcon={<MailOutlineIcon sx={{ fontSize: '0.9rem' }} />}
                                            onClick={() => handleResendPin(user._id, user.name)}
                                            disabled={busy}
                                            sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5 }}
                                        >
                                            {busy ? <CircularProgress size={14} /> : 'Resend PIN'}
                                        </MuiButton>
                                        <MuiButton
                                            variant="outlined"
                                            size="small"
                                            color="info"
                                            startIcon={<SubscriptionsIcon sx={{ fontSize: '0.9rem' }} />}
                                            onClick={() => handleManageSubscription(user._id)}
                                            sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5 }}
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
                                                sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', px: 1, py: 0.5 }}
                                            >
                                                Delete
                                            </MuiButton>
                                        )}
                                    </Box>
                                    {statusUpdateInfo.error && (
                                        <Typography color="error" variant="caption" display="block" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                                            {statusUpdateInfo.error}
                                        </Typography>
                                    )}
                                    {statusUpdateInfo.success && (
                                        <Typography color="success.main" variant="caption" display="block" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                                            {statusUpdateInfo.success}
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (isLoading && users.length === 0) {
        return (
            <AdminLayout title="Users">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading users...</Typography>
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management">
            <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
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

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, email, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2, maxWidth: 480 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                {!debouncedSearch && (
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v as UserListTab)}
                        sx={{ mb: 2, minHeight: 40 }}
                    >
                        <Tab label="Last 50 — Free Foundation" value="free" sx={{ textTransform: 'none', minHeight: 40 }} />
                        <Tab label="Last 50 — Premium" value="premium" sx={{ textTransform: 'none', minHeight: 40 }} />
                    </Tabs>
                )}

                {error && <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.75rem', py: 0.5 }}>{error}</Alert>}

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {listTitle}
                </Typography>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : users.length === 0 ? (
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            No users found.
                        </Typography>
                    </Paper>
                ) : (
                    renderUserTable()
                )}

                <CreateUserDialog
                    open={createUserDialogOpen}
                    onClose={() => setCreateUserDialogOpen(false)}
                    onSuccess={() => fetchUsers()}
                />

                <Dialog open={deleteDialogOpen} onClose={() => !deleteLoading && setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirm Delete User</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                            <br />
                            <br />
                            <strong>This action cannot be undone.</strong>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <MuiButton onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
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
