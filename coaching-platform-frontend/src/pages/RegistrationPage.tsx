import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import {
    Avatar,
    Button,
    Checkbox,
    CssBaseline,
    FormControlLabel,
    TextField,
    Link as MuiLink,
    Box,
    Typography,
    Container,
    CircularProgress,
    Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { normalizeAndValidatePhone } from '../utils/phoneUtils';

const RegistrationPage: React.FC = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { addNotification } = useNotification();
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegistrationSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const { formatted, valid } = normalizeAndValidatePhone(phoneNumber);
        if (!valid || !formatted) {
            const msg = t('auth.invalidPhoneFormat');
            setFormError(msg);
            addNotification(msg, 'error');
            return;
        }

        if (!agreedToTerms) {
            const msg = t('auth.mustAgreeToTerms');
            setFormError(msg);
            addNotification(msg, 'error');
            return;
        }

        setIsLoading(true);
        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                phoneNumber: formatted,
                agreedToTerms: true,
            });
            addNotification(t('auth.registrationOtpSent'), 'success');
            navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        } catch (err: unknown) {
            const error = err as { message?: string };
            const msg = error.message || t('auth.registrationFailed');
            setFormError(msg);
            addNotification(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <PersonAddIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    {t('auth.createAccount')}
                </Typography>

                <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                    {t('auth.registrationPinInfo')}
                </Alert>

                {formError && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }} onClose={() => setFormError(null)}>
                        {formError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleRegistrationSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label={t('auth.fullName')}
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={t('auth.email')}
                        name="email"
                        autoComplete="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="phoneNumber"
                        label={t('auth.phoneNumber')}
                        name="phoneNumber"
                        placeholder="+919876543210"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            if (formError) setFormError(null);
                        }}
                        disabled={isLoading}
                        helperText={t('auth.phoneHint')}
                        error={Boolean(formError && formError === t('auth.invalidPhoneFormat'))}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                disabled={isLoading}
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2">
                                {t('auth.agreeToTerms')}{' '}
                                <MuiLink component={RouterLink} to="/privacy-policy" target="_blank" rel="noopener">
                                    {t('footer.privacyPolicy')}
                                </MuiLink>
                                {' '}
                                {t('auth.and')}{' '}
                                <MuiLink
                                    component={RouterLink}
                                    to="/terms-and-conditions"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    {t('footer.termsAndConditions')}
                                </MuiLink>
                            </Typography>
                        }
                        sx={{ mt: 1, alignItems: 'flex-start' }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading || !agreedToTerms}
                        sx={{ mt: 3, mb: 2, py: 1.25 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : t('auth.sendEmailVerificationCode')}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <MuiLink component={RouterLink} to="/login" variant="body2">
                            {t('auth.alreadyHaveAccount')}
                        </MuiLink>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default RegistrationPage;
