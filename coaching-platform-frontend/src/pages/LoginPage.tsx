import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Box, Container, CssBaseline } from '@mui/material';
import PhonePinLoginForm from '../components/auth/PhonePinLoginForm';
import * as authService from '../services/authService';

type LoginLocationState = {
    from?: { pathname?: string };
    phoneNumber?: string;
    email?: string;
    justVerified?: boolean;
} | null;

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithPhonePin } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const locationState = location.state as LoginLocationState;
    const redirectParam = searchParams.get('redirect');
    const safeRedirect =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : null;
    const from = safeRedirect || locationState?.from?.pathname || '/dashboard';
    const prefillPhone = locationState?.phoneNumber || '';
    const justVerified = Boolean(locationState?.justVerified);

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
                    initialPhoneNumber={prefillPhone}
                    justVerified={justVerified}
                />
            </Box>
        </Container>
    );
};

export default LoginPage;
