import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Link as MuiLink,
} from '@mui/material';
import LoginPinRevealDialog from '../components/auth/LoginPinRevealDialog';

const VerifyEmailPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyAndLogin, resendOtp } = useAuth();

    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(30);
    const [revealedPin, setRevealedPin] = useState<string | null>(null);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0) {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    const handlePinDialogClose = () => {
        setPinDialogOpen(false);
        navigate('/login', { replace: true });
    };

    const handleVerificationSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email) return;
        if (!otp || otp.length !== 6) {
            addNotification(t('auth.invalidOtp'), 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyAndLogin({ email, otp });
            addNotification(result.message, 'success');

            if (result.loginPin) {
                setRevealedPin(result.loginPin);
                setPinDialogOpen(true);
            } else {
                navigate('/login', { replace: true });
            }
        } catch (err: unknown) {
            const error = err as { message?: string };
            addNotification(error.message || t('auth.verificationFailed'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !email) return;

        try {
            const responseMessage = await resendOtp(email);
            addNotification(responseMessage, 'info');
            setResendCooldown(30);
        } catch (err: unknown) {
            const error = err as { cooldownRemaining?: number; message?: string };
            if (error.cooldownRemaining) {
                setResendCooldown(error.cooldownRemaining);
            }
            addNotification(error.message || t('auth.resendFailed'), 'error');
        }
    };

    return (
        <>
            <Container component="main" maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
                <CssBaseline />
                <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h5" gutterBottom>
                        {t('auth.verifyEmail')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        {t('auth.verifyEmailSubtitle', { email })}
                    </Typography>

                    <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
                        {t('auth.afterVerifyPinShown')}
                    </Alert>

                    <Box component="form" onSubmit={handleVerificationSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('auth.verificationCode')}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={isLoading || pinDialogOpen}
                            inputProps={{
                                maxLength: 6,
                                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 2, mb: 1 }}
                            disabled={isLoading || otp.length !== 6 || pinDialogOpen}
                        >
                            {isLoading ? <CircularProgress size={24} /> : t('auth.verifyAndGetPin')}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => void handleResendOtp()}
                            disabled={resendCooldown > 0 || isLoading || pinDialogOpen}
                        >
                            {resendCooldown > 0
                                ? t('auth.resendIn', { seconds: resendCooldown })
                                : t('auth.resendCode')}
                        </Button>
                    </Box>

                    <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                        {t('auth.backToLogin')}
                    </MuiLink>
                </Box>
            </Container>

            {revealedPin && (
                <LoginPinRevealDialog
                    open={pinDialogOpen}
                    loginPin={revealedPin}
                    email={email ?? undefined}
                    phoneNumber={phone ?? undefined}
                    onClose={handlePinDialogClose}
                />
            )}
        </>
    );
};

export default VerifyEmailPage;
