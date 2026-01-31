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
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { createUser, type CreateUserPayload } from '../../services/adminService';

interface CreateUserDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<CreateUserPayload>({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'user',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.phoneNumber && formData.phoneNumber.trim()) {
            // Basic phone validation (can be enhanced)
            const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
            if (!phoneRegex.test(formData.phoneNumber.trim())) {
                newErrors.phoneNumber = 'Please enter a valid phone number';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof CreateUserPayload) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
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
            const payload: CreateUserPayload = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
                ...(formData.phoneNumber?.trim() && { phoneNumber: formData.phoneNumber.trim() }),
            };

            await createUser(payload);
            
            // Reset form
            setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 'user',
            });
            setErrors({});
            setErrorMessage(null);
            
            onSuccess();
            onClose();
        } catch (error: any) {
            const message = error?.message || error?.data?.message || 'Failed to create user. Please try again.';
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 'user',
            });
            setErrors({});
            setErrorMessage(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {errorMessage && (
                            <Alert severity="error" onClose={() => setErrorMessage(null)}>
                                {errorMessage}
                            </Alert>
                        )}

                        <TextField
                            label="Name"
                            value={formData.name}
                            onChange={handleChange('name')}
                            required
                            fullWidth
                            error={!!errors.name}
                            helperText={errors.name}
                            disabled={loading}
                            autoFocus
                        />

                        <TextField
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            required
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={loading}
                        />

                        <TextField
                            label="Phone Number"
                            value={formData.phoneNumber}
                            onChange={handleChange('phoneNumber')}
                            fullWidth
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber || 'Optional'}
                            disabled={loading}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            required
                            fullWidth
                            error={!!errors.password}
                            helperText={errors.password || 'Minimum 6 characters'}
                            disabled={loading}
                        />

                        <TextField
                            label="Role"
                            select
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                            fullWidth
                            disabled={loading}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateUserDialog;

