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

const emptyForm: CreateUserPayload = {
    name: '',
    email: '',
    phoneNumber: '',
    role: 'user',
};

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<CreateUserPayload>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else {
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(formData.phoneNumber.trim().replace(/[\s-]/g, ''))) {
                newErrors.phoneNumber = 'Please enter a valid phone number with country code';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof CreateUserPayload) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
        setErrorMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            await createUser({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phoneNumber: formData.phoneNumber.trim(),
                role: formData.role,
            });

            setFormData(emptyForm);
            setErrors({});
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const err = error as { message?: string; data?: { message?: string } };
            setErrorMessage(err?.message || err?.data?.message || 'Failed to create user.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData(emptyForm);
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
                        <Alert severity="info">
                            A 6-digit login PIN will be emailed to the user. They sign in with phone + PIN.
                        </Alert>

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
                            required
                            fullWidth
                            placeholder="+919876543210"
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber || 'Include country code'}
                            disabled={loading}
                        />
                        <TextField
                            label="Role"
                            select
                            value={formData.role}
                            onChange={handleChange('role')}
                            fullWidth
                            disabled={loading}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={22} /> : 'Create User'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateUserDialog;
