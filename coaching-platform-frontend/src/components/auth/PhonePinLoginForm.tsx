import React, { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Fade,
    FormControlLabel,
    Link as MuiLink,
    Slide,
    TextField,
    Typography,
} from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { brandAssets } from '../../assets/brandAssets';
import { normalizeAndValidatePhone } from '../../utils/phoneUtils';

const PIN_LENGTH = 6;

interface PhonePinLoginFormProps {
    onSubmit: (phoneNumber: string, pin: string, agreedToTerms: boolean) => Promise<void>;
    onForgotPin: (phoneNumber: string) => Promise<void>;
    isLoading?: boolean;
}

const PhonePinLoginForm: React.FC<PhonePinLoginFormProps> = ({
    onSubmit,
    onForgotPin,
    isLoading = false,
}) => {
    const { t } = useTranslation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pinDigits, setPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const tId = window.setTimeout(() => setShowForm(true), 80);
        return () => window.clearTimeout(tId);
    }, []);

    const pin = pinDigits.join('');
    const phoneCheck = normalizeAndValidatePhone(phoneNumber);
    const canSubmit =
        phoneCheck.valid &&
        pin.length === PIN_LENGTH &&
        agreedToTerms &&
        !isLoading;

    const handlePinChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...pinDigits];
        next[index] = digit;
        setPinDigits(next);
        if (digit && index < PIN_LENGTH - 1) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index: number, e: KeyboardEvent) => {
        if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handlePinPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
        if (!pasted) return;
        const next = Array(PIN_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
        setPinDigits(next);
        const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
        pinRefs.current[focusIdx]?.focus();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit || !phoneCheck.formatted) return;
        await onSubmit(phoneCheck.formatted, pin, agreedToTerms);
    };

    const handleForgotPin = useCallback(async () => {
        const { formatted, valid } = normalizeAndValidatePhone(phoneNumber);
        if (!valid || !formatted) return;
        setForgotLoading(true);
        try {
            await onForgotPin(formatted);
        } finally {
            setForgotLoading(false);
        }
    }, [onForgotPin, phoneNumber]);

    return (
        <Slide in={showForm} direction="up" timeout={500}>
            <Box
                component="form"
                onSubmit={handleSubmit}
                className="phone-pin-login-form"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 400,
                    mx: 'auto',
                    px: { xs: 1, sm: 0 },
                    boxSizing: 'border-box',
                }}
            >
                <Fade in={showForm} timeout={700}>
                    <Box
                        component="img"
                        src={brandAssets.primaryLogo}
                        alt="Verble"
                        sx={{ width: 120, height: 'auto', mb: 2, objectFit: 'contain' }}
                    />
                </Fade>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        animation: 'phonePinPulse 2s ease-in-out infinite',
                    }}
                >
                    <PhoneAndroidIcon color="primary" />
                    <Typography component="h1" variant="h5" fontWeight={700}>
                        {t('auth.phonePinSignIn')}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    {t('auth.phonePinSubtitle')}
                </Typography>

                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="phoneNumber"
                    label={t('auth.phoneNumber')}
                    name="phoneNumber"
                    placeholder="+919876543210"
                    autoComplete="tel"
                    autoFocus
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    helperText={t('auth.phoneHint')}
                />

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, alignSelf: 'flex-start' }}>
                    {t('auth.loginPin')}
                </Typography>

                <Box
                    className="pin-digit-row"
                    onPaste={handlePinPaste}
                    sx={{
                        display: 'flex',
                        gap: { xs: 0.5, sm: 1 },
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: 360,
                        mb: 2,
                    }}
                >
                    {pinDigits.map((digit, index) => (
                        <TextField
                            key={index}
                            inputRef={(el) => {
                                pinRefs.current[index] = el;
                            }}
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(index, e)}
                            disabled={isLoading}
                            inputProps={{
                                maxLength: 1,
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                style: {
                                    textAlign: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    padding: '12px 0',
                                },
                                'aria-label': `${t('auth.loginPin')} ${index + 1}`,
                            }}
                            sx={{
                                flex: '1 1 0',
                                minWidth: 0,
                                maxWidth: 48,
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    animation: digit ? 'pinPop 0.2s ease-out' : 'none',
                                },
                            }}
                        />
                    ))}
                </Box>

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
                            {' '}{t('auth.and')}{' '}
                            <MuiLink component={RouterLink} to="/terms-and-conditions" target="_blank" rel="noopener">
                                {t('footer.termsAndConditions')}
                            </MuiLink>
                        </Typography>
                    }
                    sx={{ alignSelf: 'flex-start', mb: 1 }}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!canSubmit}
                    sx={{ mt: 2, mb: 1, py: 1.25, position: 'relative' }}
                >
                    {isLoading ? (
                        <CircularProgress size={24} sx={{ color: 'primary.contrastText' }} />
                    ) : (
                        t('common.login')
                    )}
                </Button>

                <Button
                    type="button"
                    variant="text"
                    size="small"
                    disabled={isLoading || forgotLoading || phoneNumber.trim().length < 10}
                    onClick={() => void handleForgotPin()}
                    sx={{
                        mb: 1,
                        textAlign: 'center',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                    }}
                >
                    {forgotLoading ? <CircularProgress size={20} /> : t('auth.forgotPin')}
                </Button>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    {t('auth.noAccount')}{' '}
                    <MuiLink component={RouterLink} to="/register" fontWeight={600}>
                        {t('auth.signUpNow')}
                    </MuiLink>
                </Typography>
            </Box>
        </Slide>
    );
};

export default PhonePinLoginForm;
