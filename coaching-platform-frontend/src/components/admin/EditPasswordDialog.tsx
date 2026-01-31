import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
    Typography,
} from '@mui/material';
import { updateUserPassword } from '../../services/adminService';

interface EditPasswordDialogProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    onSuccess: () => void;
}

const EditPasswordDialog: React.FC<EditPasswordDialogProps> = ({
    open,
    onClose,
    userId,
    userName,
    onSuccess,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const newErrors: { password?: string; confirmPassword?: string } = {};

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm the password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (errors.password) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.password;
                return newErrors;
            });
        }
        setErrorMessage(null);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (errors.confirmPassword) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.confirmPassword;
                return newErrors;
            });
        }
        setErrorMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            await updateUserPassword(userId, { password });
            
            // Reset form
            setPassword('');
            setConfirmPassword('');
            setErrors({});
            setErrorMessage(null);
            
            onSuccess();
            onClose();
        } catch (error: any) {
            const message = error?.message || error?.data?.message || 'Failed to update password. Please try again.';
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setPassword('');
            setConfirmPassword('');
            setErrors({});
            setErrorMessage(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Change Password for {userName}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {errorMessage && (
                            <Alert severity="error" onClose={() => setErrorMessage(null)}>
                                {errorMessage}
                            </Alert>
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Enter a new password for this user. The password must be at least 6 characters long.
                        </Typography>

                        <TextField
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            fullWidth
                            error={!!errors.password}
                            helperText={errors.password || 'Minimum 6 characters'}
                            disabled={loading}
                            autoFocus
                        />

                        <TextField
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                            fullWidth
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            disabled={loading}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditPasswordDialog;

