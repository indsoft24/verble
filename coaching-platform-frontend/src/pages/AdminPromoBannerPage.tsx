// src/pages/AdminPromoBannerPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Grid,
    Divider,
    Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    getPromoBannerAdmin,
    updatePromoBanner,
    type PromoBanner,
} from '../services/promoBannerService';

function formatCountdownPreview(secondsLeft: number): string {
    if (secondsLeft <= 0) return '00:00';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const DEFAULT_BANNER: PromoBanner = {
    isEnabled: false,
    title: 'Live English Webinar — Limited Seats',
    batchText: 'Batch #21 · Weekend intensive',
    urgencyText: 'Enroll now — limited-time validity',
    ctaText: 'Enroll Now',
    ctaUrl: '/register',
    originalPrice: '₹24,999',
    offerPrice: 'Free seat',
    countdownMinutes: 5,
};

const AdminPromoBannerPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Promo Banner' });
    const [banner, setBanner] = useState<PromoBanner | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [previewSeconds, setPreviewSeconds] = useState(5 * 60);

    const fetchBanner = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getPromoBannerAdmin();
            setBanner(data);
            setPreviewSeconds(Math.max(60, (data.countdownMinutes || 5) * 60));
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(
                axiosErr.response?.data?.message ||
                    axiosErr.message ||
                    'Failed to load promo banner settings.'
            );
            setBanner({ ...DEFAULT_BANNER });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanner();
    }, [fetchBanner]);

    useEffect(() => {
        if (!banner?.isEnabled) return;
        const id = setInterval(() => {
            setPreviewSeconds((s) => (s <= 0 ? (banner.countdownMinutes || 5) * 60 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [banner?.isEnabled, banner?.countdownMinutes]);

    const handleChange = (field: keyof PromoBanner, value: string | number | boolean) => {
        setBanner((prev) => (prev ? { ...prev, [field]: value } : null));
        if (field === 'countdownMinutes' && typeof value === 'number') {
            setPreviewSeconds(Math.max(60, value * 60));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!banner) return;
        setIsSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const saved = await updatePromoBanner({
                isEnabled: banner.isEnabled,
                title: banner.title,
                batchText: banner.batchText,
                urgencyText: banner.urgencyText,
                ctaText: banner.ctaText || 'Enroll Now',
                ctaUrl: banner.ctaUrl,
                originalPrice: banner.originalPrice,
                offerPrice: banner.offerPrice,
                countdownMinutes: banner.countdownMinutes,
            });
            setBanner(saved);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to save promo banner.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
        );
    }

    if (!banner) {
        return (
            <>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Could not load promo banner settings.
                </Alert>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => void fetchBanner()}>
                    Retry
                </Button>
            </>
        );
    }

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
                Schedule webinars or seminars as a sticky promo bar above the footer on public pages. The{' '}
                <strong>5-minute countdown</strong> restarts when a visitor loads the page — use urgency copy like
                &quot;Enroll now — limited-time validity&quot;.
            </Typography>

            {error && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff',
                    border: '1px solid rgba(148,163,184,0.25)',
                }}
            >
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2 }}>
                    Live preview
                </Typography>
                <Box
                    sx={{
                        mt: 2,
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800}>
                            {banner.title || 'Webinar title'}
                        </Typography>
                        {banner.batchText && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                                {banner.batchText}
                            </Typography>
                        )}
                        {banner.urgencyText && (
                            <Chip
                                label={banner.urgencyText}
                                size="small"
                                sx={{ mt: 1, bgcolor: 'rgba(239,68,68,0.2)', color: '#fecaca', fontWeight: 700 }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                            label={`⏱ ${formatCountdownPreview(previewSeconds)}`}
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '1rem',
                                bgcolor: 'rgba(0,0,0,0.35)',
                                color: '#fef08a',
                            }}
                        />
                        {(banner.originalPrice || banner.offerPrice) && (
                            <Typography variant="body2">
                                {banner.originalPrice && (
                                    <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.65, mr: 1 }}>
                                        {banner.originalPrice}
                                    </Box>
                                )}
                                {banner.offerPrice && (
                                    <Box component="span" sx={{ fontWeight: 800 }}>
                                        {banner.offerPrice}
                                    </Box>
                                )}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            disabled
                            sx={{ bgcolor: '#84cc16', color: '#0f172a', fontWeight: 800, px: 3 }}
                        >
                            {banner.ctaText || 'Enroll Now'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Promo banner saved. Public pages will show it when enabled.
                        </Alert>
                    )}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={banner.isEnabled}
                                onChange={(e) => handleChange('isEnabled', e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Show promo banner on public site"
                    />
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                                fullWidth
                                label="Event / webinar title"
                                value={banner.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g. 2-Day English Learning Webinar"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Batch / schedule line"
                                value={banner.batchText}
                                onChange={(e) => handleChange('batchText', e.target.value)}
                                placeholder="e.g. Sat–Sun · 6–8 PM IST"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Urgency message"
                                value={banner.urgencyText}
                                onChange={(e) => handleChange('urgencyText', e.target.value)}
                                placeholder="e.g. Enroll now — limited-time validity · Only 25 seats left"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Button text"
                                value={banner.ctaText}
                                onChange={(e) => handleChange('ctaText', e.target.value)}
                                placeholder="Enroll Now"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Registration / meeting link"
                                value={banner.ctaUrl}
                                onChange={(e) => handleChange('ctaUrl', e.target.value)}
                                placeholder="/register or https://meet.google.com/..."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Original price (strikethrough)"
                                value={banner.originalPrice}
                                onChange={(e) => handleChange('originalPrice', e.target.value)}
                                placeholder="e.g. ₹24,999"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Offer price"
                                value={banner.offerPrice}
                                onChange={(e) => handleChange('offerPrice', e.target.value)}
                                placeholder="e.g. Free seat"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Countdown (minutes)"
                                value={banner.countdownMinutes}
                                onChange={(e) =>
                                    handleChange('countdownMinutes', parseInt(e.target.value, 10) || 5)
                                }
                                inputProps={{ min: 1, max: 1440 }}
                                helperText="Default: 5 minutes — shown as MM:SS on the banner"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving…' : 'Save promo banner'}
                        </Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchBanner()}>
                            Reload
                        </Button>
                    </Box>
                </form>
            </Paper>
        </>
    );
};

export default AdminPromoBannerPage;
