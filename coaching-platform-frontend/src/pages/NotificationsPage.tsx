import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Badge,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    getUserNotifications,
    type NotificationCategoryStat,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    type Notification,
} from '../services/notificationService';
import { useNotification } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import UserLayout from '../components/layout/UserLayout';

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [filteredUnreadCount, setFilteredUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState<boolean>(false);
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categoryStats, setCategoryStats] = useState<NotificationCategoryStat[]>([]);

    const navigate = useNavigate();
    const { addNotification } = useNotification();

    const normalizedCategoryKey = selectedCategory === 'all' ? undefined : selectedCategory;

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserNotifications(selectedCategory === 'all' ? undefined : selectedCategory);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setFilteredUnreadCount(data.filteredUnreadCount);
            setCategoryStats(data.categories);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load notifications.';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification, selectedCategory]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notificationId: string) => {
        const targetNotification = notifications.find((n) => n._id === notificationId);
        if (!targetNotification || targetNotification.isRead || isProcessing) return;

        setIsProcessing(true);
        try {
            const updatedNotification = await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? updatedNotification : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (!targetNotification.isRead && (!normalizedCategoryKey || targetNotification.categoryKey === normalizedCategoryKey)) {
                setFilteredUnreadCount(prev => Math.max(0, prev - 1));
            }
            setCategoryStats(prev =>
                prev.map(stat =>
                    stat.key === (targetNotification.categoryKey || 'general')
                        ? { ...stat, unread: Math.max(0, stat.unread - 1) }
                        : stat
                )
            );
            addNotification('Notification marked as read', 'success');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to mark notification as read.';
            addNotification(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        try {
            await markAllNotificationsAsRead(normalizedCategoryKey);
            await fetchNotifications();
            addNotification(
                normalizedCategoryKey
                    ? `All ${selectedCategory.toUpperCase()} notifications marked as read`
                    : 'All notifications marked as read',
                'success'
            );
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to mark all notifications as read.';
            addNotification(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteClick = (notificationId: string) => {
        setNotificationToDelete(notificationId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!notificationToDelete || isProcessing) return;
        
        setIsProcessing(true);
        try {
            await deleteNotification(notificationToDelete);
            await fetchNotifications();
            addNotification('Notification deleted successfully', 'success');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete notification.';
            addNotification(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
            setDeleteDialogOpen(false);
            setNotificationToDelete(null);
        }
    };

    const handleDeleteAllClick = () => {
        setDeleteAllDialogOpen(true);
    };

    const handleDeleteAllConfirm = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        try {
            const deletedCount = await deleteAllNotifications(normalizedCategoryKey);
            await fetchNotifications();
            addNotification(
                normalizedCategoryKey
                    ? `Deleted ${deletedCount} ${selectedCategory.toUpperCase()} notification(s)`
                    : `Successfully deleted ${deletedCount} notification(s)`,
                'success'
            );
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete all notifications.';
            addNotification(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
            setDeleteAllDialogOpen(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }
        
        // Navigate to link if available
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case 'announcement':
                return 'info';
            case 'new_content':
                return 'success';
            case 'subscription':
                return 'warning';
            default:
                return 'default';
        }
    };

    const selectedCategoryLabel = useMemo(() => {
        if (selectedCategory === 'all') return 'All Notifications';
        return categoryStats.find((stat) => stat.key === selectedCategory)?.label || 'Selected Category';
    }, [selectedCategory, categoryStats]);

    if (isLoading) {
        return (
            <UserLayout title="Notifications">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                    <CircularProgress />
                </Box>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Notifications">
        <Container maxWidth="md" disableGutters sx={{ px: { xs: 0, sm: 2 } }}>
            {/* Header with Actions */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', mb: 2, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => navigate(-1)} aria-label="go back">
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        )}
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="notification-category-filter">Filter by Category</InputLabel>
                        <Select
                            labelId="notification-category-filter"
                            label="Filter by Category"
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                        >
                            <MenuItem value="all">All Notifications</MenuItem>
                            {categoryStats.map((stat) => (
                                <MenuItem key={stat.key} value={stat.key}>
                                    {`${stat.label} (${stat.total})`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Action Buttons */}
                {notifications.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<MarkEmailReadIcon />}
                            onClick={handleMarkAllAsRead}
                            disabled={isProcessing || filteredUnreadCount === 0}
                            color="primary"
                        >
                            {selectedCategory === 'all' ? 'Mark All as Read' : `Mark ${selectedCategoryLabel} as Read`}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleDeleteAllClick}
                            disabled={isProcessing}
                            color="error"
                        >
                            {selectedCategory === 'all' ? 'Delete All' : `Delete All ${selectedCategoryLabel}`}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No notifications yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        You'll see your notifications here when they arrive.
                    </Typography>
                </Paper>
            ) : (
                <Paper>
                    <List>
                        {notifications.map((notification, index) => (
                            <React.Fragment key={notification._id}>
                                <ListItem
                                    sx={{
                                        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                                        '&:hover': {
                                            backgroundColor: 'action.selected',
                                        },
                                        cursor: notification.link ? 'pointer' : 'default',
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: notification.isRead ? 400 : 600,
                                                    }}
                                                >
                                                    {notification.title}
                                                </Typography>
                                                {!notification.isRead && (
                                                    <Chip
                                                        label="New"
                                                        size="small"
                                                        color="primary"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                                <Chip
                                                    label={notification.type}
                                                    size="small"
                                                    color={getNotificationTypeColor(notification.type) as any}
                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(notification._id);
                                            }}
                                            disabled={isProcessing}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Delete Single Notification Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => {
                    if (!isProcessing) {
                        setDeleteDialogOpen(false);
                        setNotificationToDelete(null);
                    }
                }}
            >
                <DialogTitle>Delete Notification</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this notification? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogOpen(false);
                            setNotificationToDelete(null);
                        }}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={isProcessing}
                        startIcon={isProcessing ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete All Notifications Dialog */}
            <Dialog
                open={deleteAllDialogOpen}
                onClose={() => {
                    if (!isProcessing) {
                        setDeleteAllDialogOpen(false);
                    }
                }}
            >
                <DialogTitle>Delete All Notifications</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete all {selectedCategoryLabel.toLowerCase()}? This action cannot be undone and will
                        permanently remove them for this account.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteAllDialogOpen(false)}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteAllConfirm}
                        color="error"
                        variant="contained"
                        disabled={isProcessing}
                        startIcon={isProcessing ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
                    >
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
        </UserLayout>
    );
};

export default NotificationsPage;

