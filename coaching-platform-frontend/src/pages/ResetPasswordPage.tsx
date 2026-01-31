import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button,
    CircularProgress, Paper, IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { resetPassword } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    
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
    
    const handleClickShowPassword = () => setPasswordVisible((show) => !show);
    const handleClickShowConfirmPassword = () => setConfirmPasswordVisible((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Reset Your Password
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="New Password"
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {passwordVisible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="passwordConfirm"
                        label="Confirm New Password"
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {confirmPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
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