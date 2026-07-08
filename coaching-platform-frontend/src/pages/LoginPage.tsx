import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Box, Container, CssBaseline } from '@mui/material';
import PhonePinLoginForm from '../components/auth/PhonePinLoginForm';
import * as authService from '../services/authService';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithPhonePin } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as { from?: { pathname?: string } } | null;
    const from = locationState?.from?.pathname || '/dashboard';

    const handleSubmit = async (phoneNumber: string, pin: string) => {
        setIsLoading(true);
        try {
            await loginWithPhonePin({ phoneNumber, pin });
            navigate(from, { replace: true });
        } catch (err: unknown) {
            const error = err as {
                code?: string;
                message?: string;
                data?: { email?: string; phoneNumber?: string };
            };
            if (error.code === 'EMAIL_NOT_VERIFIED' && error.data) {
                addNotification(t('auth.pleaseVerifyWhatsApp'), 'info');
                const params = new URLSearchParams();
                if (error.data.email) params.set('email', error.data.email);
                if (error.data.phoneNumber) params.set('phone', error.data.phoneNumber);
                navigate(`/verify-whatsapp?${params.toString()}`);
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
