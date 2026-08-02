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
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const VerifyWhatsAppPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyAndLogin, resendOtp } = useAuth();

    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(30);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!phone) {
            navigate('/register', { replace: true });
        }
    }, [phone, navigate]);

    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0) {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    const goToLoginAfterVerify = (verifiedPhone?: string) => {
        const phoneForLogin = verifiedPhone || phone || '';
        addNotification(t('auth.pinEmailedGoLogin'), 'success');
        navigate('/login', {
            replace: true,
            state: {
                phoneNumber: phoneForLogin,
                email: email || undefined,
                justVerified: true,
            },
        });
    };

    const handleVerificationSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!phone || isLoading) return;
        if (!otp || otp.length !== 6) {
            addNotification(t('auth.invalidOtp'), 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyAndLogin({
                phoneNumber: phone,
                otp,
                email: email ?? undefined,
            });

            // Verification succeeded (PIN was emailed). Always take the user to login.
            goToLoginAfterVerify(result.phoneNumber || phone);
        } catch (err: unknown) {
            const error = err as { message?: string; code?: string };
            const message = error.message || t('auth.verificationFailed');

            // Account already verified — PIN was already sent earlier; send them to login.
            if (
                error.code === 'ALREADY_VERIFIED' ||
                /already verified/i.test(message) ||
                /login pin/i.test(message)
            ) {
                goToLoginAfterVerify(phone);
                return;
            }

            addNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !phone || isLoading) return;

        try {
            const responseMessage = await resendOtp(phone);
            addNotification(responseMessage, 'info');
            setResendCooldown(30);
        } catch (err: unknown) {
            const error = err as { cooldownRemaining?: number; message?: string; code?: string };
            if (error.cooldownRemaining) {
                setResendCooldown(error.cooldownRemaining);
            }

            if (error.code === 'ALREADY_VERIFIED' || (error.message && /already verified/i.test(error.message))) {
                goToLoginAfterVerify(phone);
                return;
            }

            addNotification(error.message || t('auth.resendFailed'), 'error');
        }
    };

    const maskedPhone = phone?.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3') ?? '';

    if (!phone) {
        return null;
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
            <CssBaseline />
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                    }}
                >
                    <WhatsAppIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography component="h1" variant="h5" gutterBottom textAlign="center">
                    {t('auth.verifyWhatsApp')}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    {t('auth.verifyWhatsAppSubtitle', { phone: maskedPhone })}
                </Typography>

                <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
                    {t('auth.afterVerifyGoLogin')}
                </Alert>

                <Box component="form" onSubmit={handleVerificationSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        autoFocus
                        label={t('auth.verificationCode')}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={isLoading}
                        inputProps={{
                            maxLength: 6,
                            inputMode: 'numeric',
                            autoComplete: 'one-time-code',
                            style: {
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                letterSpacing: '0.5rem',
                            },
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 1 }}
                        disabled={isLoading || otp.length !== 6}
                    >
                        {isLoading ? <CircularProgress size={24} /> : t('auth.verifyAndContinue')}
                    </Button>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => void handleResendOtp()}
                        disabled={resendCooldown > 0 || isLoading}
                    >
                        {resendCooldown > 0
                            ? t('auth.resendIn', { seconds: resendCooldown })
                            : t('auth.resendWhatsAppCode')}
                    </Button>
                </Box>

                <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                    {t('auth.backToLogin')}
                </MuiLink>
            </Box>
        </Container>
    );
};

export default VerifyWhatsAppPage;
