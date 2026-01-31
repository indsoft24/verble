import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button,
    CircularProgress, Alert, Paper, Link as MuiLink
} from '@mui/material';
import { forgotPassword } from '../services/authService'; // Import our new service function

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            const message = await forgotPassword(email);
            setSuccessMessage(message);
        } catch (err: any) {
            // Display the success message even on failure for security
            setSuccessMessage('If an account with that email exists, a reset link has been sent.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Forgot Password
                </Typography>

                {successMessage ? (
                    <Alert severity="success" sx={{ width: '100%' }}>
                        {successMessage}
                    </Alert>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                            Enter your email address and we will send you a link to reset your password.
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />

                            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={isLoading}
                            >
                                {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                            </Button>
                        </Box>
                    </>
                )}
                 <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                    Back to Sign In
                </MuiLink>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;