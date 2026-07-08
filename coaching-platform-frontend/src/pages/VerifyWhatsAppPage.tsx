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
    Paper,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoginPinRevealDialog from '../components/auth/LoginPinRevealDialog';

type VerifyStep = 'enter_otp' | 'verified';

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
    const [step, setStep] = useState<VerifyStep>('enter_otp');
    const [revealedPin, setRevealedPin] = useState<string | null>(null);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!phone) {
            navigate('/register', { replace: true });
        }
    }, [phone, navigate]);

    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0 && step === 'enter_otp') {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [resendCooldown, step]);

    const handlePinDialogClose = () => {
        setPinDialogOpen(false);
        navigate('/login', { replace: true });
    };

    const showVerifiedState = (loginPin: string) => {
        setRevealedPin(loginPin);
        setStep('verified');
        setOtp('');
        setPinDialogOpen(true);
    };

    const handleVerificationSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!phone || step === 'verified') return;
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
            addNotification(result.message, 'success');

            if (result.loginPin) {
                showVerifiedState(result.loginPin);
                return;
            }

            addNotification(t('auth.pinEmailedAfterVerify'), 'info');
            navigate('/login', { replace: true });
        } catch (err: unknown) {
            const error = err as { message?: string; code?: string };
            const message = error.message || t('auth.verificationFailed');

            if (error.code === 'ALREADY_VERIFIED' || /already verified/i.test(message)) {
                addNotification(t('auth.alreadyVerifiedGoLogin'), 'info');
                navigate('/login', { replace: true });
                return;
            }

            addNotification(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !phone || step === 'verified') return;

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
                addNotification(t('auth.alreadyVerifiedGoLogin'), 'info');
                navigate('/login', { replace: true });
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
        <>
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
                        {step === 'verified' ? (
                            <CheckCircleOutlineIcon sx={{ color: 'white', fontSize: 32 }} />
                        ) : (
                            <WhatsAppIcon sx={{ color: 'white', fontSize: 32 }} />
                        )}
                    </Box>

                    <Typography component="h1" variant="h5" gutterBottom textAlign="center">
                        {step === 'verified' ? t('auth.verifyWhatsAppSuccess') : t('auth.verifyWhatsApp')}
                    </Typography>

                    {step === 'enter_otp' ? (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                {t('auth.verifyWhatsAppSubtitle', { phone: maskedPhone })}
                            </Typography>

                            <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
                                {t('auth.afterVerifyPinShown')}
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
                                    {isLoading ? <CircularProgress size={24} /> : t('auth.verifyAndGetPin')}
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
                        </>
                    ) : (
                        <Box sx={{ width: '100%' }}>
                            <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                                {t('auth.verifyWhatsAppSuccessSubtitle', { phone: maskedPhone })}
                            </Alert>

                            {revealedPin && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        mb: 2,
                                        width: '100%',
                                        textAlign: 'center',
                                        border: '1px solid',
                                        borderColor: 'success.light',
                                        bgcolor: (theme) =>
                                            theme.palette.mode === 'dark'
                                                ? 'rgba(46, 125, 50, 0.15)'
                                                : 'rgba(232, 245, 233, 0.8)',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
                                    >
                                        {t('auth.loginPin')}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            mt: 1,
                                            fontFamily:
                                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                            fontSize: '2rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.5rem',
                                            color: 'primary.main',
                                            userSelect: 'all',
                                        }}
                                    >
                                        {revealedPin}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        {email
                                            ? t('auth.pinAlsoEmailedTo', { email })
                                            : t('auth.pinAlsoEmailed')}
                                    </Typography>
                                </Paper>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/login', { replace: true })}
                                sx={{ mb: 1 }}
                            >
                                {t('auth.pinRevealContinue')}
                            </Button>
                        </Box>
                    )}

                    {step === 'enter_otp' && (
                        <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                            {t('auth.backToLogin')}
                        </MuiLink>
                    )}
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

export default VerifyWhatsAppPage;
