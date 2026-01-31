import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUserContext } = useAuth();
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

                // Set the token and redirect to dashboard
                setUserContext(null, token);
                
                // Redirect to dashboard after successful authentication
                navigate('/dashboard');
            } catch (err: any) {
                setError(err.message || 'An error occurred during Google authentication');
                setIsLoading(false);
            }
        };

        handleGoogleCallback();
    }, [searchParams, navigate, setUserContext]);

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
