import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Alert, Box, Container, CssBaseline } from '@mui/material';
import PhonePinLoginForm from '../components/auth/PhonePinLoginForm';
import * as authService from '../services/authService';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithPhonePin } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as { from?: { pathname?: string }; pinSent?: boolean } | null;
    const from = locationState?.from?.pathname || '/dashboard';
    const pinSent = locationState?.pinSent;

    const handleSubmit = async (phoneNumber: string, pin: string, agreedToTerms: boolean) => {
        setIsLoading(true);
        try {
            await loginWithPhonePin({ phoneNumber, pin, agreedToTerms });
            navigate(from, { replace: true });
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string; data?: { email?: string } };
            if (error.code === 'EMAIL_NOT_VERIFIED' && error.data?.email) {
                addNotification(t('auth.pleaseVerifyEmail'), 'info');
                navigate(`/verify-email?email=${encodeURIComponent(error.data.email)}`);
            } else {
                addNotification(error.message || t('auth.failedLogin'), 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPin = async (phoneNumber: string) => {
        try {
            const msg = await authService.forgotLoginPin(phoneNumber);
            addNotification(msg, 'success');
        } catch (err: unknown) {
            const error = err as { message?: string };
            addNotification(error.message || t('auth.forgotPinFailed'), 'error');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    px: 2,
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(160deg, #f0f4ff 0%, #ffffff 45%, #e8f5e9 100%)',
                }}
            >
                {pinSent && (
                    <Alert severity="success" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
                        {t('auth.pinEmailedAfterVerify')}
                    </Alert>
                )}
                <PhonePinLoginForm
                    onSubmit={handleSubmit}
                    onForgotPin={handleForgotPin}
                    isLoading={isLoading}
                />
            </Box>
        </Container>
    );
};

export default LoginPage;
