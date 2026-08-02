// File: src/pages/admin/AdminManageUserSubscriptionPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Grid,
    Select, MenuItem, InputLabel, FormControl, FormHelperText,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider, Chip,
    Dialog, DialogTitle as MuiDialogTitle, DialogContent as MuiDialogContent, 
    DialogContentText as MuiDialogContentText, DialogActions as MuiDialogActions,
    Tooltip, TextField, Breadcrumbs, Link as MuiLink,
    type SelectChangeEvent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { isValid, formatISO, parseISO } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import RefreshIcon from '@mui/icons-material/Refresh';

import { 
    getUserByIdAdmin, 
    adminAddSubscriptionToUserService,
    adminRemoveSubscriptionFromUserService,
    updateUserInfo,
    resendLoginPinForUser,
    type AdminDetailedUser, 
    type AdminAddUserSubscriptionPayload,
    type UserSubscriptionInstance,
    type UpdateUserInfoPayload
} from '../services/adminService'; 
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { formatPlanDurationLabel } from '../utils/adminUserDisplay';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';
import { getModulesForCourseAdmin, type Module } from '../services/moduleAdminService';
import { postUserLearningReset } from '../services/adminLearningSettingsService';

const subscriptionStatuses: AdminAddUserSubscriptionPayload['status'][] = ['active', 'pending_cancellation', 'cancelled', 'expired', 'trial', 'future_active', 'none'];
const isStandaloneBonusPlanName = (name: string): boolean => name.trim().toLowerCase() === 'bonus';

const InfoField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {label}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
            {value}
        </Typography>
    </Box>
);

const AdminManageUserSubscriptionPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<AdminDetailedUser | null>(null);
    const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);

    useAdminLayoutPage({ title: user?.name ? `Manage User — ${user.name}` : 'Manage User' });

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

    // Learning reset UI state (quiz attempts + video/module progress)
    const [resetScope, setResetScope] = useState<'module' | 'course'>('module');
    const [resetCourses, setResetCourses] = useState<Course[]>([]);
    const [resetModules, setResetModules] = useState<Module[]>([]);
    const [resetCourseId, setResetCourseId] = useState<string>('');
    const [resetModuleId, setResetModuleId] = useState<string>('');
    const [isLoadingResetOptions, setIsLoadingResetOptions] = useState(false);
    const [isResettingLearning, setIsResettingLearning] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);
    const [openLearningResetConfirm, setOpenLearningResetConfirm] = useState(false);

    // User info edit state
    const [isEditingUserInfo, setIsEditingUserInfo] = useState<boolean>(false);
    const [editedUserName, setEditedUserName] = useState<string>('');
    const [editedUserPhone, setEditedUserPhone] = useState<string>('');
    const [isUpdatingUserInfo, setIsUpdatingUserInfo] = useState<boolean>(false);
    const [displayedLoginPin, setDisplayedLoginPin] = useState<string | null>(null);
    const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);
    const [pinCopyHint, setPinCopyHint] = useState<string | null>(null);
    const now = new Date();
    const activePlanIds = new Set(
        (user?.subscriptions || [])
            .filter((sub) => {
                if (sub.status !== 'active' || !sub.startDate || !sub.endDate) return false;
                const start = new Date(sub.startDate);
                const end = new Date(sub.endDate);
                return start <= now && end >= now;
            })
            .map((sub) =>
                typeof sub.planId === 'string' ? sub.planId : (sub.planId as { _id?: string })?._id || ''
            )
            .filter(Boolean)
    );

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
            setAllPlans(plansData.filter((plan) => plan.isActive && !isStandaloneBonusPlanName(plan.name)));
            // Initialize edit form with current user data
            setEditedUserName(userData.name || '');
            setEditedUserPhone(userData.phoneNumber || '');
        } catch (err: any) { setError(err.response?.data?.message || err.message || 'Failed to load user or plan data.'); } 
        finally { setIsLoadingPage(false); }
    }, [userId]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    useEffect(() => {
        const loadResetOptions = async () => {
            setIsLoadingResetOptions(true);
            setResetError(null);
            try {
                const courses = await getAllCoursesAdmin();
                // Only show published courses for a cleaner admin UX.
                const publishedCourses = courses.filter((c) => c.isPublished);
                setResetCourses(publishedCourses);
                if (!resetCourseId && publishedCourses.length > 0) {
                    setResetCourseId(publishedCourses[0]._id);
                }
            } catch (e: any) {
                setResetError(e?.response?.data?.message || e.message || 'Failed to load reset options.');
            } finally {
                setIsLoadingResetOptions(false);
            }
        };
        void loadResetOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadModules = async () => {
            if (resetScope !== 'module') {
                setResetModules([]);
                setResetModuleId('');
                return;
            }
            if (!resetCourseId) {
                setResetModules([]);
                setResetModuleId('');
                return;
            }

            try {
                const mods = await getModulesForCourseAdmin(resetCourseId);
                // Keep selection stable if possible.
                setResetModules(mods);
                if (!resetModuleId && mods.length > 0) setResetModuleId(mods[0]._id);
            } catch (e: any) {
                setResetError(e?.response?.data?.message || e.message || 'Failed to load modules.');
            }
        };

        void loadModules();
    }, [resetScope, resetCourseId]); // resetModuleId intentionally omitted to avoid refetch loop

    const selectedCourseForReset = resetCourses.find((c) => c._id === resetCourseId) || null;
    const selectedModuleForReset = resetModules.find((m) => m._id === resetModuleId) || null;

    const handleConfirmLearningReset = async () => {
        if (!userId) {
            setResetError('User ID is missing.');
            return;
        }
        if (resetScope === 'course' && !resetCourseId) {
            setResetError('Please select a course.');
            return;
        }
        if (resetScope === 'module' && !resetModuleId) {
            setResetError('Please select a module.');
            return;
        }

        setIsResettingLearning(true);
        setResetError(null);
        setResetSuccess(null);
        try {
            await postUserLearningReset(userId, {
                scope: resetScope,
                moduleId: resetScope === 'module' ? resetModuleId : undefined,
                courseId: resetScope === 'course' ? resetCourseId : resetCourseId,
            });
            setResetSuccess(
                resetScope === 'module'
                    ? 'Module progress + quiz attempts reset successfully.'
                    : 'Course progress + quiz attempts reset successfully.'
            );
            setOpenLearningResetConfirm(false);
        } catch (e: any) {
            setResetError(e?.response?.data?.message || e.message || 'Failed to reset learning progress.');
        } finally {
            setIsResettingLearning(false);
        }
    };

    const handleAddSubscription = async () => { 
        if (!userId || !newSubPlanId) { setError("User ID and Plan selection are required."); return; }
        if (activePlanIds.has(newSubPlanId)) {
            setError('This plan is already active for the user.');
            return;
        }
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
            setSuccess(
                `Subscription removed. User has been reset to FREE with 0-day streak (Bronze/Silver locked).`
            );
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

    const formatDateTime = (dateString?: string | Date | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString();
    };

    const handleRegeneratePin = async () => {
        if (!userId) return;
        setIsRegeneratingPin(true);
        setError(null);
        setPinCopyHint(null);
        try {
            const result = await resendLoginPinForUser(userId);
            setDisplayedLoginPin(result.loginPin);
            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          hasLoginPin: true,
                          loginPinIssuedAt: result.loginPinIssuedAt || new Date().toISOString(),
                      }
                    : prev
            );
            setSuccess(result.message);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to regenerate login PIN.';
            setError(message);
        } finally {
            setIsRegeneratingPin(false);
        }
    };

    const handleCopyPin = async () => {
        if (!displayedLoginPin) return;
        try {
            await navigator.clipboard.writeText(displayedLoginPin);
            setPinCopyHint('PIN copied to clipboard.');
        } catch {
            setPinCopyHint('Could not copy — select and copy the PIN manually.');
        }
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
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={28} />
                    <Typography sx={{ ml: 1.5 }}>Loading user…</Typography>
                </Container>
        );
    }

    if (error && !user && !isSubmitting) {
        return (
            <Container sx={{ py: 3 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/users')}
                        sx={{ mb: 2 }}
                    >
                        Back to users
                    </Button>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                </Container>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                            Admin
                        </MuiLink>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/users">
                            Users
                        </MuiLink>
                        <Typography color="text.primary">Manage subscription</Typography>
                    </Breadcrumbs>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/users')}
                    >
                        Back to users
                    </Button>
                </Box>

                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
                    {user?.name || 'User'}
                </Typography>

                {/* User Information Edit Section */}
                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
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
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <InfoField label="Name" value={user?.name || '—'} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <InfoField label="Phone number" value={user?.phoneNumber || 'Not provided'} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <InfoField label="Email" value={user?.email || 'Not provided'} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 0.5 }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                                    Login PIN (phone sign-in)
                                </Typography>
                                <Box
                                    sx={{
                                        mt: 1.5,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'grey.50',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {displayedLoginPin ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                                            <Chip
                                                icon={<VpnKeyIcon />}
                                                label={displayedLoginPin}
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '1.25rem',
                                                    fontWeight: 700,
                                                    letterSpacing: 4,
                                                    height: 44,
                                                    px: 1,
                                                }}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<ContentCopyIcon />}
                                                onClick={handleCopyPin}
                                            >
                                                Copy PIN
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            {user?.hasLoginPin
                                                ? `A PIN was issued${user.loginPinIssuedAt ? ` on ${formatDateTime(user.loginPinIssuedAt)}` : ''}. For security it is not stored in plain text — regenerate to view a new PIN and email it to the user.`
                                                : 'No login PIN on file. Generate one to enable phone PIN sign-in.'}
                                        </Typography>
                                    )}
                                    {pinCopyHint && (
                                        <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                                            {pinCopyHint}
                                        </Typography>
                                    )}
                                    <Button
                                        size="small"
                                        variant="contained"
                                        sx={{ mt: displayedLoginPin ? 1.5 : 0 }}
                                        onClick={handleRegeneratePin}
                                        disabled={isRegeneratingPin || !user?.email}
                                        startIcon={isRegeneratingPin ? <CircularProgress size={18} color="inherit" /> : <VpnKeyIcon />}
                                    >
                                        {isRegeneratingPin
                                            ? 'Generating…'
                                            : displayedLoginPin
                                              ? 'Regenerate PIN'
                                              : user?.hasLoginPin
                                                ? 'Regenerate & show PIN'
                                                : 'Generate PIN'}
                                    </Button>
                                    {!user?.email && (
                                        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                                            User must have an email address to receive the PIN.
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Paper>

                {/* General page error (not related to form submission) */}
                {error && !isSubmitting && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} 
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
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

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Quiz attempts & progress reset
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        When attempts are exhausted, admin can reset quiz attempts (and the user must rewatch module video progress).
                    </Typography>

                    {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
                    {resetSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resetSuccess}</Alert>}

                    <Grid container spacing={2} alignItems="flex-start">
                        <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                            <FormControl fullWidth>
                                <InputLabel id="learning-reset-scope-label">Reset scope</InputLabel>
                                <Select
                                    labelId="learning-reset-scope-label"
                                    value={resetScope}
                                    label="Reset scope"
                                    onChange={(e) => {
                                        const v = e.target.value as 'module' | 'course';
                                        setResetScope(v);
                                        setResetModuleId('');
                                        setResetSuccess(null);
                                        setResetError(null);
                                    }}
                                    disabled={isLoadingResetOptions || isResettingLearning}
                                >
                                    <MenuItem value="module">Module</MenuItem>
                                    <MenuItem value="course">Course</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                            <FormControl fullWidth>
                                <InputLabel id="learning-reset-course-label">Course</InputLabel>
                                <Select
                                    labelId="learning-reset-course-label"
                                    value={resetCourseId}
                                    label="Course"
                                    onChange={(e) => {
                                        setResetCourseId(e.target.value);
                                        setResetModuleId('');
                                        setResetSuccess(null);
                                        setResetError(null);
                                    }}
                                    disabled={isLoadingResetOptions || isResettingLearning}
                                >
                                    {resetCourses.map((c) => (
                                        <MenuItem key={c._id} value={c._id}>
                                            {c.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {resetScope === 'module' && (
                            <Grid sx={{ width: '100%' }}>
                                <FormControl fullWidth>
                                    <InputLabel id="learning-reset-module-label">Module</InputLabel>
                                    <Select
                                        labelId="learning-reset-module-label"
                                        value={resetModuleId}
                                        label="Module"
                                        onChange={(e) => {
                                            setResetModuleId(e.target.value);
                                            setResetSuccess(null);
                                            setResetError(null);
                                        }}
                                        disabled={isLoadingResetOptions || isResettingLearning || resetModules.length === 0}
                                    >
                                        {resetModules.map((m) => (
                                            <MenuItem key={m._id} value={m._id}>
                                                {m.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {resetModules.length === 0 && (
                                        <FormHelperText>Modules will appear after selecting a course.</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>
                        )}

                        <Grid sx={{ width: '100%' }}>
                            <Button
                                variant="contained"
                                color="warning"
                                disabled={
                                    isLoadingResetOptions ||
                                    isResettingLearning ||
                                    (resetScope === 'module' ? !resetModuleId : !resetCourseId)
                                }
                                startIcon={<RefreshIcon />}
                                onClick={() => setOpenLearningResetConfirm(true)}
                            >
                                {isResettingLearning ? 'Resetting…' : 'Reset quiz attempts now'}
                            </Button>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                        {resetScope === 'module' && selectedModuleForReset ? (
                            <>
                                Target: <strong>{selectedCourseForReset?.title}</strong> / <strong>{selectedModuleForReset.title}</strong>
                            </>
                        ) : resetScope === 'course' && selectedCourseForReset ? (
                            <>
                                Target course: <strong>{selectedCourseForReset.title}</strong>
                            </>
                        ) : null}
                    </Box>
                </Paper>

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
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
                                        <MenuItem key={plan._id} value={plan._id} disabled={activePlanIds.has(plan._id)}>
                                            {plan.name} — {formatPlanDurationLabel(plan) || `${plan.duration?.value} ${plan.duration?.unit}`}
                                            {activePlanIds.has(plan._id) ? ' (Already active)' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {allPlans.length === 0 && <FormHelperText error>No active plans available to assign.</FormHelperText>}
                                {allPlans.length > 0 && <FormHelperText>Already active plans are disabled.</FormHelperText>}
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

                <Dialog open={openLearningResetConfirm} onClose={() => setOpenLearningResetConfirm(false)}>
                    <MuiDialogTitle>Confirm learning reset</MuiDialogTitle>
                    <MuiDialogContent>
                        <MuiDialogContentText>
                            This will reset the user’s quiz attempts and progress:
                            {resetScope === 'module' ? (
                                <>
                                    <br />
                                    Module: <strong>{selectedModuleForReset?.title || 'Selected module'}</strong>
                                    <br />
                                    Course: <strong>{selectedCourseForReset?.title || 'Selected course'}</strong>
                                </>
                            ) : (
                                <>
                                    <br />
                                    Course: <strong>{selectedCourseForReset?.title || 'Selected course'}</strong>
                                </>
                            )}
                            <br />
                            User will need to rewatch/reset module videos to unlock again.
                        </MuiDialogContentText>
                    </MuiDialogContent>
                    <MuiDialogActions>
                        <Button onClick={() => setOpenLearningResetConfirm(false)} disabled={isResettingLearning}>
                            Cancel
                        </Button>
                        <Button onClick={() => void handleConfirmLearningReset()} color="warning" variant="contained" disabled={isResettingLearning}>
                            {isResettingLearning ? <CircularProgress size={20} color="inherit" /> : 'Confirm reset'}
                        </Button>
                    </MuiDialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default AdminManageUserSubscriptionPage;