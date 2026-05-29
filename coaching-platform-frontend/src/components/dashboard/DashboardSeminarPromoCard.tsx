import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { getPromoBanner, type PromoBanner } from '../../services/promoBannerService';
import { submitChatbotLead } from '../../services/leadService';

function formatCountdown(secondsLeft: number): string {
    if (secondsLeft <= 0) return '00:00';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface DashboardSeminarPromoCardProps {
    isLoading?: boolean;
}

const DashboardSeminarPromoCard: React.FC<DashboardSeminarPromoCardProps> = ({ isLoading: parentLoading }) => {
    const [banner, setBanner] = useState<PromoBanner | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getPromoBanner()
            .then((data) => {
                if (!mounted) return;
                setBanner(data);
                if (data) {
                    const minutes = Math.max(1, data.countdownMinutes || 5);
                    const end = Date.now() + minutes * 60 * 1000;
                    setEndTime(end);
                    setCountdownSeconds(minutes * 60);
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!banner || endTime <= 0) return;
        const tick = () => setCountdownSeconds(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [banner, endTime]);

    const handleEnroll = async () => {
        if (!name.trim() || !email.trim() || !phoneNumber.trim()) {
            setSubmitError('Name, email, and phone are required.');
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        try {
            await submitChatbotLead({
                name: name.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                interestedCourses: [],
                sourceUrl: window.location.href,
                sourceType: 'dashboard_seminar_card',
                webinarUrl: banner?.ctaUrl?.trim() || undefined,
            });
            setSubmitted(true);
        } catch (err: unknown) {
            const e = err as { message?: string };
            setSubmitError(e.message || 'Registration failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setName('');
        setEmail('');
        setPhoneNumber('');
        setSubmitError(null);
        setSubmitted(false);
    };

    const showSpinner = parentLoading || loading;

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    height: '100%',
                    border: '1px solid',
                    borderColor: banner ? 'rgba(99,102,241,0.35)' : 'divider',
                    background: banner
                        ? 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)'
                        : 'background.paper',
                    color: banner ? '#fff' : 'text.primary',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <EventAvailableIcon sx={{ color: banner ? '#a5b4fc' : 'primary.main', fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={800}>
                        Live webinar
                    </Typography>
                </Box>

                {showSpinner ? (
                    <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} sx={{ color: banner ? '#a5b4fc' : undefined }} />
                    </Box>
                ) : !banner ? (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        No live session scheduled right now. Check back soon or explore subscription plans.
                    </Typography>
                ) : (
                    <>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.35 }}>
                            {banner.title || 'English learning webinar'}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', color: 'rgba(255,255,255,0.75)', mb: 1.5, lineHeight: 1.4 }}
                        >
                            {[banner.batchText, banner.urgencyText].filter(Boolean).join(' · ') ||
                                'Limited seats · enroll now'}
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Box
                                sx={{
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: 'rgba(0,0,0,0.35)',
                                    border: '1px solid rgba(254,240,138,0.35)',
                                    textAlign: 'center',
                                    minWidth: 64,
                                }}
                            >
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem' }}>
                                    Ends in
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        color: '#fef08a',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {formatCountdown(countdownSeconds)}
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => setDialogOpen(true)}
                                sx={{
                                    bgcolor: '#84cc16',
                                    color: '#0f172a',
                                    fontWeight: 800,
                                    px: 2,
                                    '&:hover': { bgcolor: '#a3e635' },
                                }}
                            >
                                {banner.ctaText || 'Enroll now'}
                            </Button>
                        </Box>

                        {(banner.originalPrice || banner.offerPrice) && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'rgba(255,255,255,0.7)' }}>
                                {banner.originalPrice && (
                                    <Box component="span" sx={{ textDecoration: 'line-through', mr: 0.75 }}>
                                        {banner.originalPrice}
                                    </Box>
                                )}
                                {banner.offerPrice && (
                                    <Box component="span" sx={{ fontWeight: 700 }}>
                                        {banner.offerPrice}
                                    </Box>
                                )}
                            </Typography>
                        )}
                    </>
                )}
            </Paper>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
                <DialogTitle>Register for webinar</DialogTitle>
                <DialogContent>
                    {submitted ? (
                        <Alert severity="success" sx={{ mt: 1 }}>
                            You&apos;re registered. We&apos;ll email you the join details.
                        </Alert>
                    ) : (
                        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                            {submitError && <Alert severity="error">{submitError}</Alert>}
                            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
                            <TextField label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth required />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>{submitted ? 'Close' : 'Cancel'}</Button>
                    {!submitted && (
                        <Button variant="contained" onClick={() => void handleEnroll()} disabled={submitting}>
                            {submitting ? 'Saving…' : 'Confirm'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DashboardSeminarPromoCard;
