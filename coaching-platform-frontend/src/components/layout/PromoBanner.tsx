import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { getPromoBanner, type PromoBanner as PromoBannerType } from '../../services/promoBannerService';
import { submitChatbotLead } from '../../services/leadService';

const BANNER_HEIGHT_PX = 76;

function formatCountdown(secondsLeft: number): string {
    if (secondsLeft <= 0) return '00:00';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PromoBanner: React.FC = () => {
    const [banner, setBanner] = useState<PromoBannerType | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [openLeadDialog, setOpenLeadDialog] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [webinarLink, setWebinarLink] = useState('');

    useEffect(() => {
        let mounted = true;
        getPromoBanner().then((data) => {
            if (!mounted || !data) return;
            setBanner(data);
            const minutes = Math.max(1, data.countdownMinutes || 5);
            const end = Date.now() + minutes * 60 * 1000;
            setEndTime(end);
            setCountdownSeconds(minutes * 60);
        });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!banner || endTime <= 0) return;
        const tick = () => {
            setCountdownSeconds(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [banner, endTime]);

    const visible = Boolean(banner?.isEnabled) && !dismissed;

    useEffect(() => {
        if (!visible) {
            document.documentElement.style.removeProperty('--verble-promo-banner-height');
            return;
        }
        document.documentElement.style.setProperty('--verble-promo-banner-height', `${BANNER_HEIGHT_PX}px`);
        return () => {
            document.documentElement.style.removeProperty('--verble-promo-banner-height');
        };
    }, [visible]);

    if (!visible || !banner) return null;

    const ctaUrl = banner.ctaUrl?.trim() || '';

    const handleSubmitLead = async () => {
        if (!name.trim() || !email.trim() || !phoneNumber.trim()) {
            setSubmitError('Name, email, and phone number are required.');
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const response = await submitChatbotLead({
                name: name.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                interestedCourses: [],
                sourceUrl: window.location.href,
                sourceType: 'webinar_footer_banner',
                webinarUrl: ctaUrl || undefined,
            });
            setSubmitted(true);
            setWebinarLink(response.webinarLink || ctaUrl);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setSubmitError(err?.message || 'Failed to register. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetDialog = () => {
        setOpenLeadDialog(false);
        setName('');
        setEmail('');
        setPhoneNumber('');
        setSubmitError(null);
        setSubmitted(false);
        setWebinarLink('');
    };

    return (
        <>
            <Box
                component="aside"
                role="region"
                aria-label="Limited time offer"
                sx={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1200,
                    bgcolor: '#0b1220',
                    color: '#fff',
                    borderTop: '1px solid rgba(148,163,184,0.25)',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
                    py: { xs: 1, sm: 1.25 },
                    px: { xs: 1.5, sm: 2 },
                    pb: 'max(8px, env(safe-area-inset-bottom))',
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1200,
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 1, sm: 2 },
                        flexWrap: { xs: 'wrap', md: 'nowrap' },
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0, pr: 4 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                lineHeight: 1.3,
                                whiteSpace: { xs: 'normal', md: 'nowrap' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {banner.title || 'Live English Webinar'}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,0.75)',
                                display: { xs: 'none', sm: 'block' },
                            }}
                        >
                            {[banner.batchText, banner.urgencyText].filter(Boolean).join(' · ') ||
                                'Enroll now — limited-time validity'}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1, sm: 1.5 },
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            sx={{
                                px: 1.25,
                                py: 0.35,
                                borderRadius: 1.5,
                                bgcolor: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(254,240,138,0.4)',
                                textAlign: 'center',
                                minWidth: 72,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem' }}>
                                Ends in
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: { xs: '1rem', sm: '1.15rem' },
                                    color: '#fef08a',
                                    lineHeight: 1.2,
                                }}
                            >
                                {formatCountdown(countdownSeconds)}
                            </Typography>
                        </Box>

                        {(banner.originalPrice || banner.offerPrice) && (
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                                {banner.originalPrice && (
                                    <Typography
                                        component="span"
                                        sx={{
                                            textDecoration: 'line-through',
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {banner.originalPrice}
                                    </Typography>
                                )}
                                {banner.offerPrice && (
                                    <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                        {banner.offerPrice}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Button
                            onClick={() => setOpenLeadDialog(true)}
                            variant="contained"
                            size="small"
                            sx={{
                                bgcolor: '#84cc16',
                                color: '#0f172a',
                                fontWeight: 800,
                                px: { xs: 2, sm: 2.5 },
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(132,204,22,0.4)',
                                '&:hover': { bgcolor: '#a3e635' },
                            }}
                        >
                            {banner.ctaText || 'Enroll Now'}
                        </Button>
                    </Box>

                    <IconButton
                        size="small"
                        aria-label="Dismiss offer bar"
                        onClick={() => setDismissed(true)}
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            color: 'rgba(255,255,255,0.6)',
                            '&:hover': { color: '#fff' },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Dialog open={openLeadDialog} onClose={resetDialog} fullWidth maxWidth="sm">
                <DialogTitle>Register for webinar</DialogTitle>
                <DialogContent>
                    {!submitted ? (
                        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                            {submitError && <Alert severity="error">{submitError}</Alert>}
                            <TextField
                                label="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                fullWidth
                                required
                            />
                            <TextField
                                label="Phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                fullWidth
                                required
                            />
                        </Box>
                    ) : (
                        <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
                            <Alert severity="success">
                                You&apos;re registered. Join at the scheduled webinar time.
                            </Alert>
                            <TextField
                                label="Webinar link"
                                value={webinarLink}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Copy webinar link"
                                                onClick={() => void navigator.clipboard.writeText(webinarLink)}
                                            >
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!submitted ? (
                        <>
                            <Button onClick={resetDialog}>Cancel</Button>
                            <Button onClick={() => void handleSubmitLead()} variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting…' : 'Register now'}
                            </Button>
                        </>
                    ) : (
                        <>
                            {webinarLink && (
                                <Button
                                    component="a"
                                    href={webinarLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="contained"
                                >
                                    Open link
                                </Button>
                            )}
                            <Button onClick={resetDialog}>Close</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PromoBanner;
