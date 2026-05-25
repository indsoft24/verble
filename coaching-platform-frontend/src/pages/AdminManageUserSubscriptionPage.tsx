// File: src/pages/admin/AdminManageUserSubscriptionPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Grid,
    Select, MenuItem, InputLabel, FormControl, FormHelperText,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Chip,
    Dialog, DialogTitle as MuiDialogTitle, DialogContent as MuiDialogContent, 
    DialogContentText as MuiDialogContentText, DialogActions as MuiDialogActions,
    Tooltip, TextField,
    type SelectChangeEvent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { isValid, formatISO, parseISO } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

import { 
    getUserByIdAdmin, 
    adminAddSubscriptionToUserService,
    adminRemoveSubscriptionFromUserService,
    updateUserInfo,
    type AdminDetailedUser, 
    type AdminAddUserSubscriptionPayload,
    type UserSubscriptionInstance,
    type UpdateUserInfoPayload
} from '../services/adminService'; 
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { formatPlanDurationLabel } from '../utils/adminUserDisplay';

const subscriptionStatuses: AdminAddUserSubscriptionPayload['status'][] = ['active', 'pending_cancellation', 'cancelled', 'expired', 'trial', 'future_active', 'none'];

const AdminManageUserSubscriptionPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();

    const [user, setUser] = useState<AdminDetailedUser | null>(null);
    const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
    
    const [newSubPlanId, setNewSubPlanId] = useState<string>(''); 
    const [newSubStatus, setNewSubStatus] = useState<AdminAddUserSubscriptionPayload['status']>('active');
    const [newSubStartDate, setNewSubStartDate] = useState<Date | null>(new Date());
    const [newSubEndDate, setNewSubEndDate] = useState<Date | null>(null);

    const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // This is the state variable in question
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [subInstanceToDelete, setSubInstanceToDelete] = useState<UserSubscriptionInstance | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);

    // User info edit state
    const [isEditingUserInfo, setIsEditingUserInfo] = useState<boolean>(false);
    const [editedUserName, setEditedUserName] = useState<string>('');
    const [editedUserPhone, setEditedUserPhone] = useState<string>('');
    const [isUpdatingUserInfo, setIsUpdatingUserInfo] = useState<boolean>(false);

    const calculateEndDate = (startDate: Date, duration: SubscriptionPlan['duration']): Date => { 
        const date = new Date(startDate);
        if (!duration || !duration.unit || typeof duration.value !== 'number') {
            date.setFullYear(date.getFullYear() + 1); return date;
        }
        switch (duration.unit) {
            case 'day': date.setDate(date.getDate() + duration.value); break;
            case 'week': date.setDate(date.getDate() + duration.value * 7); break;
            case 'month': date.setMonth(date.getMonth() + duration.value); break;
            case 'year': date.setFullYear(date.getFullYear() + duration.value); break;
            default: date.setFullYear(date.getFullYear() + 1); break;
        }
        return date;
    };

    const fetchInitialData = useCallback(async () => { 
        if (!userId) { setError("User ID is missing."); setIsLoadingPage(false); return; }
        setIsLoadingPage(true); setError(null); setSuccess(null);
        try {
            const [userData, plansData] = await Promise.all([ getUserByIdAdmin(userId), getAllSubscriptionPlansAdmin() ]);
            setUser(userData);
            setAllPlans(plansData.filter(plan => plan.isActive));
            // Initialize edit form with current user data
            setEditedUserName(userData.name || '');
            setEditedUserPhone(userData.phoneNumber || '');
        } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to load user or plan data.'); } 
        finally { setIsLoadingPage(false); }
    }, [userId]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const handleAddSubscription = async () => { 
        if (!userId || !newSubPlanId) { setError("User ID and Plan selection are required."); return; }
        setIsSubmitting(true); setError(null); setSuccess(null);
        const selectedPlanForEndDateCalc = allPlans.find(p => p._id === newSubPlanId);
        const payload: AdminAddUserSubscriptionPayload = { planId: newSubPlanId, status: newSubStatus };
        if (newSubStartDate && isValid(newSubStartDate)) payload.startDate = formatISO(newSubStartDate, { representation: 'date' });
        else payload.startDate = formatISO(new Date(), { representation: 'date' });
        if (newSubEndDate && isValid(newSubEndDate)) payload.endDate = formatISO(newSubEndDate, { representation: 'date' });
        else if (selectedPlanForEndDateCalc && payload.startDate) {
            const sDate = parseISO(payload.startDate);
            if (isValid(sDate)) payload.endDate = formatISO(calculateEndDate(sDate, selectedPlanForEndDateCalc.duration), { representation: 'date' });
            else { setError("Invalid start date."); setIsSubmitting(false); return; }
        }
        if (payload.startDate && payload.endDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
            setError("End date must be after start date."); setIsSubmitting(false); return;
        }
        try {
            const updatedUser = await adminAddSubscriptionToUserService(userId, payload);
            setUser(updatedUser); setSuccess('New subscription added successfully!');
            setNewSubPlanId(''); setNewSubStatus('active'); setNewSubStartDate(new Date()); setNewSubEndDate(null);
        } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to add subscription.'); } 
        finally { setIsSubmitting(false); }
    };
    
    const openDeleteConfirmation = (subInstance: UserSubscriptionInstance) => {
        setSubInstanceToDelete(subInstance);
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDeleteSubscription = async () => {
        if (!userId || !subInstanceToDelete || !subInstanceToDelete._id) {
            setError("User ID or Subscription Instance ID missing for deletion.");
            setOpenDeleteConfirm(false);
            return;
        }
        setIsSubmitting(true); setError(null); setSuccess(null);
        try {
            const updatedUser = await adminRemoveSubscriptionFromUserService(userId, subInstanceToDelete._id);
            setUser(updatedUser);
            setSuccess(`Subscription instance for '${subInstanceToDelete.planName || (typeof subInstanceToDelete.planId === 'object' ? (subInstanceToDelete.planId as SubscriptionPlan)?.name : 'Selected Plan')}' removed successfully.`);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to remove subscription instance.');
        } finally {
            setIsSubmitting(false);
            setOpenDeleteConfirm(false);
            setSubInstanceToDelete(null);
        }
    };

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const handleStartEditUserInfo = () => {
        if (user) {
            setEditedUserName(user.name || '');
            setEditedUserPhone(user.phoneNumber || '');
            setIsEditingUserInfo(true);
        }
    };

    const handleCancelEditUserInfo = () => {
        if (user) {
            setEditedUserName(user.name || '');
            setEditedUserPhone(user.phoneNumber || '');
        }
        setIsEditingUserInfo(false);
    };

    const handleSaveUserInfo = async () => {
        if (!userId) {
            setError("User ID is missing.");
            return;
        }

        // Validation
        if (!editedUserName.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        setIsUpdatingUserInfo(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: UpdateUserInfoPayload = {
                name: editedUserName.trim(),
                phoneNumber: editedUserPhone.trim() || null,
            };

            const updatedUser = await updateUserInfo(userId, payload);
            setUser(updatedUser);
            setIsEditingUserInfo(false);
            setSuccess('User information updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to update user information.');
        } finally {
            setIsUpdatingUserInfo(false);
        }
    };

    if (isLoadingPage) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /><Typography sx={{ml:1}}>Loading data...</Typography></Container>;
    }

    if (error && !user && !isSubmitting) { // Check !isSubmitting to avoid error flash during submit
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button component={RouterLink} to="/admin/users" sx={{mt:2}}>Back to Users List</Button>
            </Container>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
                    Manage User: {user?.name || 'User'}
                </Typography>
                {user && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Phone: {user.phoneNumber || '—'}
                        {user.email ? ` · Email: ${user.email}` : ''}
                    </Typography>
                )}

                {/* User Information Edit Section */}
                <Paper elevation={2} sx={{ p: {xs: 2, sm: 3}, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            User Information
                        </Typography>
                        {!isEditingUserInfo ? (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleStartEditUserInfo}
                                disabled={isSubmitting || isUpdatingUserInfo}
                            >
                                Edit Info
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleCancelEditUserInfo}
                                    disabled={isUpdatingUserInfo}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleSaveUserInfo}
                                    disabled={isUpdatingUserInfo || !editedUserName.trim()}
                                >
                                    {isUpdatingUserInfo ? <CircularProgress size={20} /> : 'Save'}
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {isEditingUserInfo ? (
                        <Grid container spacing={2}>
                            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={editedUserName}
                                    onChange={(e) => setEditedUserName(e.target.value)}
                                    disabled={isUpdatingUserInfo}
                                    required
                                    margin="normal"
                                />
                            </Grid>
                            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={editedUserPhone}
                                    onChange={(e) => setEditedUserPhone(e.target.value)}
                                    disabled={isUpdatingUserInfo}
                                    margin="normal"
                                    helperText="Optional - leave empty to remove phone number"
                                />
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Name
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {user?.name || 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Phone Number
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {user?.phoneNumber || 'Not provided'}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </Paper>

                {/* General page error (not related to form submission) */}
                {error && !isSubmitting && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} 
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Paper elevation={2} sx={{ p: {xs: 1, sm: 2}, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Current & Past Subscriptions</Typography>
                    {(!user?.subscriptions || user.subscriptions.length === 0) ? (
                        <Typography sx={{my: 2, fontStyle: 'italic'}}>No subscriptions found for this user.</Typography>
                    ) : (
                        <List dense>
                            {user.subscriptions.map((sub, index) => {
                                 const planDisplay = typeof sub.planId === 'object' ? sub.planId as SubscriptionPlan : null;
                                 let chipColor: "default" | "success" | "warning" | "error" | "info" = "default";
                                 if (sub.status === 'active') chipColor = 'success';
                                 else if (sub.status === 'expired' || sub.status === 'cancelled') chipColor = 'error';
                                 else if (sub.status === 'pending_cancellation' || sub.status === 'future_active') chipColor = 'warning';

                                 return (
                                    <React.Fragment key={sub._id || `sub-instance-${index}`}>
                                        <ListItem>
                                            <ListItemText 
                                                primary={
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                                                        <Typography variant="subtitle1" component="span" sx={{fontWeight:'medium'}}>
                                                            {sub.planName || planDisplay?.name || 'Unknown Plan'}
                                                        </Typography>
                                                        <Chip label={sub.status?.toUpperCase() || 'N/A'} color={chipColor} size="small"/>
                                                    </Box>
                                                }
                                                secondary={
                                                    (sub.planName === 'Free Foundation'
                                                        ? `Active since ${formatDate(sub.startDate)} — No expiry (Free Foundation)`
                                                        : `Dates: ${formatDate(sub.startDate)} - ${formatDate(sub.endDate)}`) +
                                                    ` (ID: ${sub._id || 'N/A'})`
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Remove this specific subscription instance">
                                                    {/* Ensure isSubmitting is accessible here */}
                                                    <IconButton edge="end" aria-label="delete-subscription-instance" onClick={() => openDeleteConfirmation(sub)} disabled={isSubmitting}>
                                                        <DeleteIcon color="error" />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < user.subscriptions.length -1 && <Divider variant="inset" component="li" />}
                                    </React.Fragment>
                                 );
                            })}
                        </List>
                    )}
                </Paper>

                <Paper elevation={3} sx={{ p: {xs: 2, sm: 3} }}>
                    <Typography variant="h6" component="h2" gutterBottom>Add New Subscription to User</Typography>
                    {/* Form-specific error for adding a subscription */}
                    {isSubmitting && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} 
                    <Grid container spacing={2}>
                        <Grid sx={{ width:{ xs: '100%', sm: '50%' }}}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="add-plan-select-label">Select Plan</InputLabel>
                                <Select
                                    labelId="add-plan-select-label"
                                    value={newSubPlanId}
                                    label="Select Plan"
                                    onChange={(e: SelectChangeEvent<string>) => {
                                        const selectedId = e.target.value;
                                        setNewSubPlanId(selectedId);
                                        const selectedPlan = allPlans.find(p => p._id === selectedId);
                                        if (selectedPlan && newSubStartDate) {
                                            setNewSubEndDate(calculateEndDate(newSubStartDate, selectedPlan.duration));
                                        } else if (!selectedId) { setNewSubEndDate(null); }
                                    }}
                                    disabled={isSubmitting || allPlans.length === 0}
                                >
                                    <MenuItem value=""><em>-- Select a Plan --</em></MenuItem>
                                    {allPlans.map((plan) => (
                                        <MenuItem key={plan._id} value={plan._id}>
                                            {plan.name} — {formatPlanDurationLabel(plan) || `${plan.duration?.value} ${plan.duration?.unit}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {allPlans.length === 0 && <FormHelperText error>No active plans available to assign.</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid sx={{ width:{ xs: '100%', sm: '50%' }}}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="add-status-select-label">Set Status</InputLabel>
                                <Select
                                    labelId="add-status-select-label"
                                    value={newSubStatus}
                                    label="Set Status"
                                    onChange={(e: SelectChangeEvent<typeof newSubStatus>) => setNewSubStatus(e.target.value as typeof newSubStatus)}
                                    disabled={isSubmitting}
                                >
                                    {subscriptionStatuses.map((statusVal) => (
                                        <MenuItem key={statusVal} value={statusVal}>
                                            {statusVal?.charAt(0).toUpperCase() + statusVal!.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid sx={{ width:{ xs: '100%', sm: '50%' }}}>
                            <DatePicker
                                label="Start Date" value={newSubStartDate}
                                onChange={(newValue) => {
                                    setNewSubStartDate(newValue);
                                    const selectedPlan = allPlans.find(p => p._id === newSubPlanId);
                                    if (selectedPlan && newValue && isValid(newValue)) {
                                        setNewSubEndDate(calculateEndDate(newValue, selectedPlan.duration));
                                    } else if (!newValue) { setNewSubEndDate(null); }
                                }}
                                sx={{width: '100%', mt: {xs:1, sm:0}}} disabled={isSubmitting}
                                slotProps={{ textField: { margin: 'normal', helperText:"Defaults to today" } }}
                            />
                        </Grid>
                        <Grid sx={{ width:{ xs: '100%', sm: '50%' }}}>
                             <DatePicker
                                label="End Date" value={newSubEndDate}
                                onChange={(newValue) => setNewSubEndDate(newValue)}
                                sx={{width: '100%', mt: {xs:1, sm:0}}} disabled={isSubmitting}
                                slotProps={{ textField: { margin: 'normal', helperText:"Auto from plan if blank" } }}
                            />
                        </Grid>
                        <Grid sx={{ width:{ xs: '100%' },  mt: 2}}>
                            <Button
                                variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />}
                                onClick={handleAddSubscription}
                                disabled={isSubmitting || !newSubPlanId}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Add This Subscription'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
                 <Button component={RouterLink} to="/admin/users" sx={{mt: 3}}>
                    Back to Users List
                </Button>

                 {/* Delete Confirmation Dialog */}
                <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                    <MuiDialogTitle>Confirm Remove Subscription Instance</MuiDialogTitle>
                    <MuiDialogContent>
                        <MuiDialogContentText>
                            Are you sure you want to remove the subscription instance for plan 
                            <strong> "{subInstanceToDelete?.planName || (typeof subInstanceToDelete?.planId === 'object' ? (subInstanceToDelete?.planId as SubscriptionPlan)?.name : 'Selected Plan')}"</strong>? 
                            This action cannot be undone.
                        </MuiDialogContentText>
                    </MuiDialogContent>
                    <MuiDialogActions>
                        <Button onClick={() => setOpenDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleConfirmDeleteSubscription} color="error" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24}/> : "Remove Instance"}
                        </Button>
                    </MuiDialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default AdminManageUserSubscriptionPage;