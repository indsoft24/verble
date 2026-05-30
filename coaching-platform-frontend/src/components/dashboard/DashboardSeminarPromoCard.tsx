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
    Stack,
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

/** Normalize admin-entered prices so "5000" + "2999" don't visually merge. */
function formatPromoPrice(value: string | undefined): string {
    const v = (value || '').trim();
    if (!v) return '';
    if (/[₹$€£]|free/i.test(v)) return v;
    const digits = v.replace(/,/g, '');
    if (/^\d+(\.\d+)?$/.test(digits)) {
        const n = Number(digits);
        if (Number.isFinite(n)) {
            return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        }
    }
    return v;
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
    const originalPrice = formatPromoPrice(banner?.originalPrice);
    const offerPrice = formatPromoPrice(banner?.offerPrice);
    const showPricing = Boolean(originalPrice || offerPrice);
    const metaLine =
        banner &&
        [banner.batchText, banner.urgencyText].filter(Boolean).join(' · ');

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    height: '100%',
                    minHeight: { xs: 'auto', md: 200 },
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: banner ? 'rgba(129,140,248,0.4)' : 'divider',
                    background: banner
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)'
                        : 'background.paper',
                    color: banner ? '#fff' : 'text.primary',
                    boxShadow: banner ? '0 8px 24px rgba(15,23,42,0.25)' : undefined,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: banner ? 'rgba(99,102,241,0.25)' : 'action.hover',
                        }}
                    >
                        <EventAvailableIcon sx={{ color: banner ? '#c7d2fe' : 'primary.main', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="overline" sx={{ lineHeight: 1.2, letterSpacing: 1, opacity: 0.85, fontSize: '0.65rem' }}>
                            Limited time
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                            Live webinar
                        </Typography>
                    </Box>
                </Stack>

                {showSpinner ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={28} sx={{ color: banner ? '#a5b4fc' : undefined }} />
                    </Box>
                ) : !banner ? (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flex: 1 }}>
                        No live session scheduled right now. Check back soon or explore subscription plans.
                    </Typography>
                ) : (
                    <Stack spacing={2} sx={{ flex: 1, justifyContent: 'space-between' }}>
                        <Box>
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                sx={{
                                    lineHeight: 1.35,
                                    mb: 0.75,
                                    fontSize: { xs: '1rem', sm: '1.05rem' },
                                }}
                            >
                                {banner.title || 'English learning webinar'}
                            </Typography>
                            {metaLine && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'rgba(255,255,255,0.78)',
                                        lineHeight: 1.45,
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {metaLine}
                                </Typography>
                            )}
                        </Box>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            spacing={1.5}
                            sx={{
                                pt: 0.5,
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 1.5,
                                    bgcolor: 'rgba(0,0,0,0.35)',
                                    border: '1px solid rgba(254,240,138,0.45)',
                                    textAlign: 'center',
                                    minWidth: 76,
                                    alignSelf: { xs: 'flex-start', sm: 'center' },
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', display: 'block' }}
                                >
                                    Ends in
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'ui-monospace, monospace',
                                        fontWeight: 800,
                                        fontSize: '1.25rem',
                                        color: '#fef08a',
                                        lineHeight: 1.2,
                                        letterSpacing: 1,
                                    }}
                                >
                                    {formatCountdown(countdownSeconds)}
                                </Typography>
                            </Box>

                            {showPricing && (
                                <Stack
                                    direction="row"
                                    alignItems="baseline"
                                    spacing={1}
                                    sx={{
                                        px: 1,
                                        flex: { sm: 1 },
                                        minWidth: 0,
                                    }}
                                >
                                    {originalPrice && (
                                        <Typography
                                            component="span"
                                            sx={{
                                                textDecoration: 'line-through',
                                                color: 'rgba(255,255,255,0.45)',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {originalPrice}
                                        </Typography>
                                    )}
                                    {offerPrice && (
                                        <Typography
                                            component="span"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '1rem',
                                                color: '#bbf7d0',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {offerPrice}
                                        </Typography>
                                    )}
                                </Stack>
                            )}

                            <Button
                                variant="contained"
                                size="medium"
                                fullWidth={false}
                                onClick={() => setDialogOpen(true)}
                                sx={{
                                    bgcolor: '#84cc16',
                                    color: '#0f172a',
                                    fontWeight: 800,
                                    px: 3,
                                    py: 1,
                                    minHeight: 44,
                                    whiteSpace: 'nowrap',
                                    alignSelf: { xs: 'stretch', sm: 'center' },
                                    ml: { sm: 'auto' },
                                    boxShadow: '0 4px 14px rgba(132,204,22,0.45)',
                                    '&:hover': { bgcolor: '#a3e635' },
                                }}
                            >
                                {banner.ctaText || 'Join now'}
                            </Button>
                        </Stack>
                    </Stack>
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
