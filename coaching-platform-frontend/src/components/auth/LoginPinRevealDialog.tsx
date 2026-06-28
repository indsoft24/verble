import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface LoginPinRevealDialogProps {
    open: boolean;
    loginPin: string;
    email?: string;
    phoneNumber?: string;
    onClose: () => void;
}

const LoginPinRevealDialog: React.FC<LoginPinRevealDialogProps> = ({
    open,
    loginPin,
    email,
    phoneNumber,
    onClose,
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(loginPin);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = loginPin;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        }
    }, [loginPin]);

    const accent = theme.palette.success.main;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            scroll="body"
            aria-labelledby="login-pin-reveal-title"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        m: isMobile ? 0 : 2,
                    },
                },
            }}
        >
            <Box sx={{ height: 4, width: 1, bgcolor: accent }} />

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: { xs: 2, sm: 3 },
                    pt: { xs: 2.5, sm: 3 },
                    pb: 0,
                }}
            >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.2 : 0.12),
                        }}
                    >
                        <CheckCircleOutlineIcon sx={{ color: accent, fontSize: 28 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            id="login-pin-reveal-title"
                            variant="h6"
                            component="h2"
                            sx={{ fontWeight: 800, lineHeight: 1.3 }}
                        >
                            {t('auth.pinRevealTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                            {t('auth.pinRevealSubtitle')}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    aria-label={t('auth.pinRevealDismiss')}
                    onClick={onClose}
                    size="small"
                    sx={{ mt: -0.5, mr: -0.5 }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1 }}>
                <Box
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 2.5,
                        bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.12 : 0.06),
                        border: '1px solid',
                        borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
                    >
                        {t('auth.loginPin')}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            mt: 1,
                        }}
                    >
                        <Typography
                            component="p"
                            sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                                fontWeight: 800,
                                letterSpacing: { xs: '0.35rem', sm: '0.5rem' },
                                color: 'primary.main',
                                userSelect: 'all',
                                wordBreak: 'break-all',
                            }}
                        >
                            {loginPin}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => void handleCopy()}
                            aria-label={t('auth.copyPin')}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                minWidth: { xs: '100%', sm: 'auto' },
                                mt: { xs: 1, sm: 0 },
                            }}
                        >
                            {copied ? t('auth.pinCopied') : t('auth.copyPin')}
                        </Button>
                    </Box>
                </Box>

                {phoneNumber && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'flex-start',
                            bgcolor: (t) => alpha(t.palette.success.main, t.palette.mode === 'dark' ? 0.12 : 0.08),
                            border: '1px solid',
                            borderColor: (t) => alpha(t.palette.success.main, 0.25),
                        }}
                    >
                        <PhoneOutlinedIcon color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                            {t('auth.pinSignInWithPhone', { phone: phoneNumber })}
                        </Typography>
                    </Box>
                )}

                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        bgcolor: (t) => alpha(t.palette.info.main, t.palette.mode === 'dark' ? 0.12 : 0.08),
                        border: '1px solid',
                        borderColor: (t) => alpha(t.palette.info.main, 0.25),
                    }}
                >
                    <EmailOutlinedIcon color="info" sx={{ mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                        {email ? t('auth.pinAlsoEmailedTo', { email }) : t('auth.pinAlsoEmailed')}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 2, px: 0.5 }}>
                    <LockOutlinedIcon fontSize="small" color="action" sx={{ mt: 0.35, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                        {t('auth.pinKeepSafeHint')}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 2.5 }, pt: 1, flexDirection: 'column', gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
                >
                    {t('auth.pinRevealContinue')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoginPinRevealDialog;
