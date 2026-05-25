import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserContext, refreshUser } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                const token = searchParams.get('token');
                const success = searchParams.get('success');
                const error = searchParams.get('error');

                if (error) {
                    setError(`Google authentication failed: ${error}`);
                    setIsLoading(false);
                    return;
                }

                if (!token || success !== 'true') {
                    setError('No authentication token received from Google');
                    setIsLoading(false);
                    return;
                }

                setUserContext(null, token);
                await refreshUser(token);
                if (!localStorage.getItem('authUser')) {
                    setError('Could not load your profile. Please try signing in again.');
                    setIsLoading(false);
                    return;
                }
                navigate('/dashboard');
            } catch (err: any) {
                setError(err.message || 'An error occurred during Google authentication');
                setIsLoading(false);
            }
        };

        handleGoogleCallback();
    }, [searchParams, navigate, setUserContext, refreshUser]);

    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Completing Google authentication...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
                p={3}
            >
                <Alert severity="error" sx={{ maxWidth: 500 }}>
                    {error}
                </Alert>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    You will be redirected to the login page in a few seconds.
                </Typography>
            </Box>
        );
    }

    return null;
};

export default GoogleCallbackPage;
