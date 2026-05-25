import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button,
    CircularProgress, Paper
} from '@mui/material';
import { resetPassword } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';
import PasswordTextField from '../components/common/PasswordTextField';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    
    const { addNotification } = useNotification();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            addNotification("Reset token is missing from the URL.", 'error');
            return;
        }
        if (password !== passwordConfirm) {
            addNotification("Passwords do not match.", 'error');
            return;
        }
        if (password.length < 6) { 
            addNotification("Password must be at least 6 characters long.", 'error');
            return;
        }

        setIsLoading(true);
        try {
            const message = await resetPassword(token, password);
            addNotification(message, 'success');
            setTimeout(() => {
                navigate('/login');
            }, 2000); 
        } catch (err: any) {
            addNotification(err.message || "An unknown error occurred.", 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Reset Your Password
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <PasswordTextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="New Password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <PasswordTextField
                        margin="normal"
                        required
                        fullWidth
                        name="passwordConfirm"
                        label="Confirm New Password"
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        disabled={isLoading}
                    />


                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;