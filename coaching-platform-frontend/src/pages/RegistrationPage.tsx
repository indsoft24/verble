import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import {
    Avatar,
    Button,
    CssBaseline,
    TextField,
    Link as MuiLink,
    Box,
    Typography,
    Container,
    CircularProgress,
    Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const RegistrationPage: React.FC = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { addNotification } = useNotification();
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegistrationSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
            addNotification(t('auth.phoneRequired'), 'error');
            return;
        }

        setIsLoading(true);
        try {
            await register({ name, email, phoneNumber: phoneNumber.trim() });
            addNotification(t('auth.registrationOtpSent'), 'success');
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err: unknown) {
            const error = err as { message?: string };
            addNotification(error.message || t('auth.registrationFailed'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
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
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isLoading}
                        helperText={t('auth.phoneHint')}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ mt: 3, mb: 2, py: 1.25 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : t('auth.sendVerificationCode')}
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
