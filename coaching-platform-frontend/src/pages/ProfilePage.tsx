// src/pages/ProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import UserLayout from '../components/layout/UserLayout';
import {
    Container, Typography, CircularProgress, Alert, Box, Paper, Grid,
    TextField, Button, Divider, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import {
    getCurrentUserProfile, updateCurrentUserProfile, updateCurrentUserPassword,
    type UpdateProfileData, type UpdatePasswordData
} from '../services/userService';
import type { User as AuthUser } from '../services/authService';

// --- Icons ---
import SaveIcon from '@mui/icons-material/Save';
import PasswordIcon from '@mui/icons-material/Password';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockResetIcon from '@mui/icons-material/LockReset';

const ProfilePage: React.FC = () => {
    const { user: authUser, setUserContext, token, refreshUser } = useAuth();

    const [profileData, setProfileData] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for profile update form
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProfileUpdating, setIsProfileUpdating] = useState(false);
    const [profileUpdateMessage, setProfileUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // State for password update form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
    const [passwordUpdateMessage, setPasswordUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // --- NEW: State to control the visibility of the password form ---
    const [isPasswordSectionVisible, setIsPasswordSectionVisible] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userProfileData = await getCurrentUserProfile();
            if (userProfileData) {
                setProfileData(userProfileData);
                setName(userProfileData.name || '');
                setPhoneNumber(userProfileData.phoneNumber || '');
            } else {
                throw new Error("User profile data not found.");
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load profile data.');
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
        if (phoneNumber !== (profileData?.phoneNumber || '')) updateData.phoneNumber = phoneNumber;

        if (Object.keys(updateData).length === 0) {
            setProfileUpdateMessage({ type: 'error', text: "No changes to update." });
            setIsProfileUpdating(false);
            return;
        }

        try {
            const updatedUserProfile = await updateCurrentUserProfile(updateData);
            if (updatedUserProfile) {
                setProfileData(updatedUserProfile);
                setName(updatedUserProfile.name || '');
                setPhoneNumber(updatedUserProfile.phoneNumber || '');

                // Use the more reliable refreshUser if available, otherwise update context manually
                if (refreshUser) {
                    await refreshUser();
                } else if (setUserContext && token && authUser) {
                    const newAuthUser: AuthUser = { ...authUser, name: updatedUserProfile.name, phoneNumber: updatedUserProfile.phoneNumber };
                    setUserContext(newAuthUser, token);
                }

                setProfileUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                throw new Error("Profile update did not return user data.");
            }
        } catch (err: any) {
            setProfileUpdateMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
        } finally {
            setIsProfileUpdating(false);
        }
    };

    const handlePasswordUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordUpdateMessage({ type: 'error', text: "New passwords do not match." });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordUpdateMessage({ type: 'error', text: "New password must be at least 6 characters long." });
            return;
        }

        setIsPasswordUpdating(true);
        setPasswordUpdateMessage(null);

        const passwordData: UpdatePasswordData = { currentPassword, newPassword, confirmPassword };

        try {
            const response = await updateCurrentUserPassword(passwordData);
            setPasswordUpdateMessage({ type: 'success', text: response.message || 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsPasswordSectionVisible(false); // Hide form on success
        } catch (err: any) {
            setPasswordUpdateMessage({ type: 'error', text: err.message || 'Failed to update password.' });
        } finally {
            setIsPasswordUpdating(false);
        }
    };

    const handleCancelPasswordUpdate = () => {
        setIsPasswordSectionVisible(false);
        setPasswordUpdateMessage(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    if (isLoading) {
        return (
            <UserLayout title="Profile">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading Profile...</Typography>
                </Container>
            </UserLayout>
        );
    }

    if (error || !profileData) {
        return (
            <UserLayout title="Profile">
                <Container sx={{ mt: 4 }}>
                    <Alert severity="error">{error || 'Could not load profile data. Please try again.'}</Alert>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Profile Settings">
            <Container maxWidth="md">
                <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Account Settings
                </Typography>

            <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                {/* --- PROFILE DETAILS SECTION --- */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccountCircleIcon color="primary" sx={{ mr: 1.5 }} />
                        <Typography variant="h6" component="h2">Account Details</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Edit your name and phone number. Your email address cannot be changed.
                    </Typography>

                    <Box component="form" onSubmit={handleProfileUpdateSubmit} noValidate>
                        <Grid container spacing={2}>
                            {profileUpdateMessage && (
                                <Grid sx={{ width: { sm: '100%' } }}>
                                    <Alert severity={profileUpdateMessage.type} onClose={() => setProfileUpdateMessage(null)} sx={{ mb: 1 }}>{profileUpdateMessage.text}</Alert>
                                </Grid>
                            )}
                            <Grid sx={{ width: { sm: '100%', xs: '50%' } }}>
                                <TextField label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required variant="outlined" disabled={isProfileUpdating} />
                            </Grid>
                            <Grid sx={{ width: { sm: '100%', xs: '50%' } }}>
                                <TextField label="Phone Number" name="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth variant="outlined" disabled={isProfileUpdating} />
                            </Grid>
                            <Grid sx={{ width: { sm: '100%' }, textAlign: 'right' }}>
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
                                        )
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid sx={{ width: { sm: '100%' }, textAlign: 'right' }}>
                                <Button type="submit" variant="contained" color="primary" disabled={isProfileUpdating} startIcon={<SaveIcon />} sx={{ mt: 2 }}>
                                    {isProfileUpdating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* --- PASSWORD / SECURITY SECTION --- */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LockResetIcon color="action" sx={{ mr: 1.5 }} />
                        <Typography variant="h6" component="h2">Security</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Manage your account password.
                    </Typography>

                    {/* --- UPDATED: Conditionally render the password form --- */}
                    {isPasswordSectionVisible ? (
                        <Box component="form" onSubmit={handlePasswordUpdateSubmit} noValidate>
                            <Grid container spacing={2}>
                                {passwordUpdateMessage && (
                                    <Grid sx={{ width: { sm: '100%' } }}>
                                        <Alert severity={passwordUpdateMessage.type} onClose={() => setPasswordUpdateMessage(null)} sx={{ mb: 1 }}>{passwordUpdateMessage.text}</Alert>
                                    </Grid>
                                )}
                                <Grid sx={{ width: { sm: '100%' } }}>
                                    <TextField type="password" label="Current Password" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth required variant="outlined" disabled={isPasswordUpdating} />
                                </Grid>
                                <Grid sx={{ width: { sm: '100%', xs: '50%' } }}>
                                    <TextField type="password" label="New Password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required variant="outlined" disabled={isPasswordUpdating} />
                                </Grid>
                                <Grid sx={{ width: { sm: '100%', xs: '50%' } }}>
                                    <TextField type="password" label="Confirm New Password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required variant="outlined" disabled={isPasswordUpdating} />
                                </Grid>
                                <Grid sx={{ width: { sm: '100%' }, mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button variant="text" color="secondary" onClick={handleCancelPasswordUpdate} disabled={isPasswordUpdating}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="contained" color="secondary" disabled={isPasswordUpdating} startIcon={<PasswordIcon />}>
                                        {isPasswordUpdating ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Button variant="outlined" color="secondary" onClick={() => setIsPasswordSectionVisible(true)}>
                            Change Password
                        </Button>
                    )}
                </Box>
            </Paper>
            </Container>
        </UserLayout>
    );
};

export default ProfilePage;