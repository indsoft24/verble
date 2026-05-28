// src/components/layout/PromoBanner.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton, InputAdornment } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getPromoBanner, type PromoBanner as PromoBannerType } from '../../services/promoBannerService';
import { submitChatbotLead } from '../../services/leadService';

function formatCountdown(secondsLeft: number): string {
    if (secondsLeft <= 0) return '00:00';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PromoBanner: React.FC = () => {
    const [banner, setBanner] = useState<PromoBannerType | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [openLeadDialog, setOpenLeadDialog] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [webinarLink, setWebinarLink] = useState<string>('');

    useEffect(() => {
        let mounted = true;
        getPromoBanner().then((data) => {
            if (mounted && data) {
                setBanner(data);
                const minutes = Math.max(1, data.countdownMinutes || 5);
                const end = Date.now() + minutes * 60 * 1000;
                setEndTime(end);
                setCountdownSeconds(minutes * 60);
            }
        });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!banner || endTime <= 0) return;
        const tick = () => {
            const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setCountdownSeconds(left);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [banner, endTime]);

    if (!banner || !banner.isEnabled) return null;

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
        } catch (error: any) {
            setSubmitError(error?.message || 'Failed to register. Please try again.');
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
        <Box
            component="section"
            sx={{
                width: '100%',
                bgcolor: '#0d0d0d',
                color: '#fff',
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1.5, sm: 2.5 },
                borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <Box
                sx={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 1.25, sm: 1.5 },
                    borderRadius: 2,
                    background: 'linear-gradient(120deg, rgba(15,23,42,0.9), rgba(2,6,23,0.95))',
                    border: '1px solid rgba(148,163,184,0.2)',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: { xs: 'center', sm: 'space-between' },
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                        textAlign: { xs: 'center', sm: 'left' },
                        gap: { xs: 1, sm: 2 },
                        flex: { sm: 1 },
                        minWidth: 0,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '0.9375rem', sm: '1.15rem' },
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            lineHeight: 1.3,
                        }}
                    >
                        {banner.title || 'Offer'}
                    </Typography>
                    {banner.batchText && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem' }}>
                            {banner.batchText}
                        </Typography>
                    )}
                    {banner.urgencyText && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8125rem' }}>
                            {banner.urgencyText}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        flexWrap: 'wrap',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: { xs: 'center', sm: 'flex-end' },
                        gap: 1.5,
                        flexShrink: 0,
                        minWidth: 0,
                        textAlign: { xs: 'center', sm: 'left' },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: { xs: 'center', sm: 'flex-end' },
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: 'rgba(0,0,0,0.35)',
                                border: '1px solid rgba(254,240,138,0.35)',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}
                            >
                                Limited time · ends in
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '1.25rem',
                                    color: '#fef08a',
                                    textAlign: 'center',
                                    letterSpacing: 1,
                                }}
                            >
                                {formatCountdown(countdownSeconds)}
                            </Typography>
                        </Box>
                        {(banner.originalPrice || banner.offerPrice) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {banner.originalPrice && (
                                    <Typography
                                        component="span"
                                        sx={{
                                            textDecoration: 'line-through',
                                            color: 'rgba(255,255,255,0.55)',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        {banner.originalPrice}
                                    </Typography>
                                )}
                                {banner.offerPrice && (
                                    <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                        {banner.offerPrice}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                    <Button
                        onClick={() => setOpenLeadDialog(true)}
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: '#84cc16',
                            color: '#0f172a',
                            fontWeight: 800,
                            px: 3,
                            py: 1.25,
                            alignSelf: { xs: 'stretch', sm: 'center' },
                            boxShadow: '0 4px 14px rgba(132,204,22,0.45)',
                            '&:hover': { bgcolor: '#a3e635' },
                        }}
                    >
                        {banner.ctaText || 'Enroll Now'}
                    </Button>
                </Box>
            </Box>
            <Dialog open={openLeadDialog} onClose={resetDialog} fullWidth maxWidth="sm">
                <DialogTitle>Register for Webinar</DialogTitle>
                <DialogContent>
                    {!submitted ? (
                        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                            {submitError && <Alert severity="error">{submitError}</Alert>}
                            <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" fullWidth />
                            <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
                        </Box>
                    ) : (
                        <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
                            <Alert severity="success">Successfully registered. Please join at the scheduled webinar time.</Alert>
                            <TextField
                                label="Webinar Link"
                                value={webinarLink}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Copy webinar link"
                                                onClick={() => navigator.clipboard.writeText(webinarLink)}
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
                            <Button onClick={handleSubmitLead} variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Register Now'}
                            </Button>
                        </>
                    ) : (
                        <>
                            {webinarLink && (
                                <Button component="a" href={webinarLink} target="_blank" rel="noopener noreferrer" variant="contained">
                                    Open Webinar Link
                                </Button>
                            )}
                            <Button onClick={resetDialog}>Close</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PromoBanner;
