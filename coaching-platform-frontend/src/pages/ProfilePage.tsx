import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
    Chip,
    Link as MuiLink,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PinIcon from '@mui/icons-material/Pin';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile, updateCurrentUserProfile, type UpdateProfileData } from '../services/userService';
import { changeLoginPin, regenerateLoginPinAfterVerification } from '../services/authService';
import type { User as AuthUser } from '../services/authService';
import { learnerBrandTheme } from '../components/layout/learnerBrandTheme';

const PIN_LENGTH = 6;

const digitsOnly = (value: string, max = PIN_LENGTH) => value.replace(/\D/g, '').slice(0, max);

const ProfilePage: React.FC = () => {
    const { user: authUser, setUserContext, token, refreshUser } = useAuth();

    const [profileData, setProfileData] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProfileUpdating, setIsProfileUpdating] = useState(false);
    const [profileUpdateMessage, setProfileUpdateMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const [loginPinConfigured, setLoginPinConfigured] = useState(true);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isPinUpdating, setIsPinUpdating] = useState(false);
    const [pinUpdateMessage, setPinUpdateMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [isPinSectionVisible, setIsPinSectionVisible] = useState(false);
    const [isRegeneratePinDialogOpen, setIsRegeneratePinDialogOpen] = useState(false);
    const [regenerateCurrentPin, setRegenerateCurrentPin] = useState('');
    const [isRegeneratePinLoading, setIsRegeneratePinLoading] = useState(false);
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [showGeneratedPin, setShowGeneratedPin] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userProfileData = await getCurrentUserProfile();
            if (userProfileData) {
                setProfileData(userProfileData);
                setName(userProfileData.name || '');
                setPhoneNumber(userProfileData.phoneNumber || userProfileData.mobile || '');
                setLoginPinConfigured(Boolean(userProfileData.loginPinConfigured));
            } else {
                throw new Error('User profile data not found.');
            }
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message || 'Failed to load profile data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsProfileUpdating(true);
        setProfileUpdateMessage(null);

        const updateData: UpdateProfileData = {};
        if (name !== (profileData?.name || '')) updateData.name = name;
        const existingPhone = profileData?.phoneNumber || profileData?.mobile || '';
        if (phoneNumber !== existingPhone) updateData.phoneNumber = phoneNumber;

        if (Object.keys(updateData).length === 0) {
            setProfileUpdateMessage({ type: 'error', text: 'No changes to update.' });
            setIsProfileUpdating(false);
            return;
        }

        try {
            const updatedUserProfile = await updateCurrentUserProfile(updateData);
            if (updatedUserProfile) {
                setProfileData(updatedUserProfile);
                setName(updatedUserProfile.name || '');
                setPhoneNumber(updatedUserProfile.phoneNumber || updatedUserProfile.mobile || '');

                if (refreshUser) {
                    await refreshUser();
                } else if (setUserContext && token && authUser) {
                    setUserContext(
                        {
                            ...authUser,
                            name: updatedUserProfile.name,
                            phoneNumber: updatedUserProfile.phoneNumber,
                            mobile: updatedUserProfile.mobile,
                        },
                        token
                    );
                }

                setProfileUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                throw new Error('Profile update did not return user data.');
            }
        } catch (err: unknown) {
            const e = err as { message?: string };
            setProfileUpdateMessage({ type: 'error', text: e.message || 'Failed to update profile.' });
        } finally {
            setIsProfileUpdating(false);
        }
    };

    const handlePinUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH) {
            setPinUpdateMessage({ type: 'error', text: 'PIN must be exactly 6 digits.' });
            return;
        }
        if (newPin !== confirmPin) {
            setPinUpdateMessage({ type: 'error', text: 'New PIN and confirmation do not match.' });
            return;
        }
        if (loginPinConfigured) {
            if (currentPin.length !== PIN_LENGTH) {
                setPinUpdateMessage({ type: 'error', text: 'Enter your current 6-digit PIN.' });
                return;
            }
            if (currentPin === newPin) {
                setPinUpdateMessage({ type: 'error', text: 'New PIN must be different from your current PIN.' });
                return;
            }
        }

        setIsPinUpdating(true);
        setPinUpdateMessage(null);

        try {
            const message = await changeLoginPin({
                ...(loginPinConfigured ? { currentPin } : {}),
                newPin,
            });
            setPinUpdateMessage({ type: 'success', text: message });
            setLoginPinConfigured(true);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setIsPinSectionVisible(false);
        } catch (err: unknown) {
            const e = err as { message?: string };
            setPinUpdateMessage({ type: 'error', text: e.message || 'Failed to update PIN.' });
        } finally {
            setIsPinUpdating(false);
        }
    };

    const handleCancelPinUpdate = () => {
        setIsPinSectionVisible(false);
        setPinUpdateMessage(null);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
    };

    const handleRegeneratePin = async () => {
        if (regenerateCurrentPin.length !== PIN_LENGTH) {
            setPinUpdateMessage({ type: 'error', text: 'Enter your current 6-digit PIN.' });
            return;
        }
        setIsRegeneratePinLoading(true);
        try {
            const result = await regenerateLoginPinAfterVerification({ currentPin: regenerateCurrentPin });
            setGeneratedPin(result.newPin || null);
            setShowGeneratedPin(false);
            setPinUpdateMessage({ type: 'success', text: result.message });
            setIsRegeneratePinDialogOpen(false);
            setRegenerateCurrentPin('');
        } catch (err: unknown) {
            const e = err as { message?: string };
            setPinUpdateMessage({ type: 'error', text: e.message || 'Could not generate a new PIN.' });
        } finally {
            setIsRegeneratePinLoading(false);
        }
    };

    const pinFieldProps = {
        inputProps: {
            inputMode: 'numeric' as const,
            pattern: '[0-9]*',
            maxLength: PIN_LENGTH,
        },
        placeholder: '••••••',
    };

    if (isLoading) {
        return (
            <UserLayout title="Profile">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading profile…</Typography>
                </Container>
            </UserLayout>
        );
    }

    if (error || !profileData) {
        return (
            <UserLayout title="Profile">
                <Container sx={{ mt: 4 }}>
                    <Alert severity="error">{error || 'Could not load profile data.'}</Alert>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Profile Settings">
            <Container maxWidth="md">
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{ mb: 2, fontWeight: 'bold', color: learnerBrandTheme.textPrimary }}
                >
                    Account Settings
                </Typography>

                <Paper
                    elevation={1}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        border: `1px solid ${learnerBrandTheme.border}`,
                    }}
                >
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Rewards & scoring
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View your leaderboard points, evaluation scores, and activity history.
                        </Typography>
                    </Box>
                    <Button component={RouterLink} to="/my-rewards" variant="outlined" sx={{ textTransform: 'none' }}>
                        Open history
                    </Button>
                </Paper>

                <Paper
                    elevation={1}
                    sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, border: `1px solid ${learnerBrandTheme.border}` }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccountCircleIcon color="primary" sx={{ mr: 1.5 }} />
                            <Typography variant="h6" component="h2">
                                Account Details
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Edit your name and phone number. Your email address cannot be changed.
                        </Typography>

                        <Box component="form" onSubmit={handleProfileUpdateSubmit} noValidate>
                            <Grid container spacing={2}>
                                {profileUpdateMessage && (
                                    <Grid size={{ xs: 12 }}>
                                        <Alert
                                            severity={profileUpdateMessage.type}
                                            onClose={() => setProfileUpdateMessage(null)}
                                        >
                                            {profileUpdateMessage.text}
                                        </Alert>
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Name"
                                        name="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        fullWidth
                                        required
                                        disabled={isProfileUpdating}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Phone number"
                                        name="phoneNumber"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        fullWidth
                                        helperText="Used to sign in with your 6-digit PIN"
                                        disabled={isProfileUpdating}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Email"
                                        value={profileData.email}
                                        fullWidth
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: profileData.isEmailVerified && (
                                                <Chip
                                                    icon={<CheckCircleIcon />}
                                                    label="Verified"
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isProfileUpdating}
                                        startIcon={<SaveIcon />}
                                    >
                                        {isProfileUpdating ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Save changes'
                                        )}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LockResetIcon color="action" sx={{ mr: 1.5 }} />
                            <Typography variant="h6" component="h2">
                                Login PIN
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            You sign in with your phone number and a 6-digit PIN (not a password). Change your PIN
                            here or request a new one by email if you forgot it.
                        </Typography>

                        {!loginPinConfigured && !isPinSectionVisible && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                No login PIN is set yet. Create one below to sign in with phone + PIN.
                            </Alert>
                        )}

                        {pinUpdateMessage && !isPinSectionVisible && (
                            <Alert
                                severity={pinUpdateMessage.type}
                                onClose={() => setPinUpdateMessage(null)}
                                sx={{ mb: 2 }}
                            >
                                {pinUpdateMessage.text}
                            </Alert>
                        )}
                        {generatedPin && !isPinSectionVisible && (
                            <Alert
                                severity="success"
                                sx={{ mb: 2 }}
                                onClose={() => {
                                    setGeneratedPin(null);
                                    setShowGeneratedPin(false);
                                }}
                                action={
                                    <Button
                                        color="inherit"
                                        size="small"
                                        startIcon={<ContentCopyIcon fontSize="small" />}
                                        onClick={() => void navigator.clipboard?.writeText(generatedPin)}
                                    >
                                        Copy
                                    </Button>
                                }
                            >
                                <Typography variant="body2" sx={{ mb: 0.75 }}>
                                    New PIN generated after verification. Save it securely.
                                </Typography>
                                <Box sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip
                                        label={showGeneratedPin ? generatedPin : '••••••'}
                                        color="success"
                                        variant="outlined"
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowGeneratedPin((prev) => !prev)}
                                        aria-label={showGeneratedPin ? 'Hide PIN' : 'Show PIN'}
                                    >
                                        {showGeneratedPin ? (
                                            <VisibilityOffIcon fontSize="small" />
                                        ) : (
                                            <VisibilityIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>
                            </Alert>
                        )}

                        {isPinSectionVisible ? (
                            <Box component="form" onSubmit={handlePinUpdateSubmit} noValidate>
                                <Grid container spacing={2}>
                                    {pinUpdateMessage && (
                                        <Grid size={{ xs: 12 }}>
                                            <Alert
                                                severity={pinUpdateMessage.type}
                                                onClose={() => setPinUpdateMessage(null)}
                                            >
                                                {pinUpdateMessage.text}
                                            </Alert>
                                        </Grid>
                                    )}
                                    {loginPinConfigured && (
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField
                                                label="Current PIN"
                                                value={currentPin}
                                                onChange={(e) => setCurrentPin(digitsOnly(e.target.value))}
                                                fullWidth
                                                required
                                                disabled={isPinUpdating}
                                                {...pinFieldProps}
                                            />
                                        </Grid>
                                    )}
                                    <Grid size={{ xs: 12, sm: loginPinConfigured ? 4 : 6 }}>
                                        <TextField
                                            label={loginPinConfigured ? 'New PIN' : 'Choose PIN'}
                                            value={newPin}
                                            onChange={(e) => setNewPin(digitsOnly(e.target.value))}
                                            fullWidth
                                            required
                                            disabled={isPinUpdating}
                                            helperText="6 digits"
                                            {...pinFieldProps}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: loginPinConfigured ? 4 : 6 }}>
                                        <TextField
                                            label="Confirm PIN"
                                            value={confirmPin}
                                            onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
                                            fullWidth
                                            required
                                            disabled={isPinUpdating}
                                            {...pinFieldProps}
                                        />
                                    </Grid>
                                    <Grid
                                        size={{ xs: 12 }}
                                        sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}
                                    >
                                        <Button
                                            variant="text"
                                            onClick={handleCancelPinUpdate}
                                            disabled={isPinUpdating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            disabled={isPinUpdating}
                                            startIcon={<PinIcon />}
                                        >
                                            {isPinUpdating ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : loginPinConfigured ? (
                                                'Update PIN'
                                            ) : (
                                                'Set PIN'
                                            )}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Button variant="contained" onClick={() => setIsPinSectionVisible(true)}>
                                    {loginPinConfigured ? 'Change PIN' : 'Set PIN'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setPinUpdateMessage(null);
                                        setIsRegeneratePinDialogOpen(true);
                                    }}
                                    disabled={isRegeneratePinLoading}
                                >
                                    {isRegeneratePinLoading ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        'Email me a new PIN'
                                    )}
                                </Button>
                            </Box>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                            Prefer to sign in first?{' '}
                            <MuiLink component={RouterLink} to="/login">
                                Go to login
                            </MuiLink>
                        </Typography>
                    </Box>
                </Paper>
                <Dialog
                    open={isRegeneratePinDialogOpen}
                    onClose={() => {
                        if (isRegeneratePinLoading) return;
                        setIsRegeneratePinDialogOpen(false);
                        setRegenerateCurrentPin('');
                    }}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>Verify current PIN</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            For security, confirm your current PIN to generate and view a new one.
                        </Typography>
                        <TextField
                            label="Current PIN"
                            value={regenerateCurrentPin}
                            onChange={(e) => setRegenerateCurrentPin(digitsOnly(e.target.value))}
                            fullWidth
                            required
                            disabled={isRegeneratePinLoading}
                            {...pinFieldProps}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <PinIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setIsRegeneratePinDialogOpen(false);
                                setRegenerateCurrentPin('');
                            }}
                            disabled={isRegeneratePinLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => void handleRegeneratePin()}
                            disabled={isRegeneratePinLoading}
                        >
                            {isRegeneratePinLoading ? <CircularProgress size={20} color="inherit" /> : 'Generate PIN'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </UserLayout>
    );
};

export default ProfilePage;
