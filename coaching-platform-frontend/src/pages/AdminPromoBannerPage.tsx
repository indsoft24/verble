// src/pages/AdminPromoBannerPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
    getPromoBannerAdmin,
    updatePromoBanner,
    type PromoBanner,
} from '../services/promoBannerService';

const AdminPromoBannerPage: React.FC = () => {
    const [banner, setBanner] = useState<PromoBanner | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fetchBanner = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getPromoBannerAdmin();
            setBanner(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load promo banner.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanner();
    }, [fetchBanner]);

    const handleChange = (field: keyof PromoBanner, value: string | number | boolean) => {
        setBanner((prev) => (prev ? { ...prev, [field]: value } : null));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!banner) return;
        setIsSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await updatePromoBanner({
                isEnabled: banner.isEnabled,
                title: banner.title,
                batchText: banner.batchText,
                urgencyText: banner.urgencyText,
                ctaText: banner.ctaText,
                ctaUrl: banner.ctaUrl,
                originalPrice: banner.originalPrice,
                offerPrice: banner.offerPrice,
                countdownMinutes: banner.countdownMinutes,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save promo banner.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout title="Promo Banner">
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    if (!banner) {
        return (
            <AdminLayout title="Promo Banner">
                <Alert severity="error">Could not load promo banner settings.</Alert>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Promo Banner">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This banner appears at the bottom of all public pages (above the footer). Enable it and fill in the fields below. The countdown timer restarts each time a visitor loads a page.
            </Typography>
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Promo banner saved successfully.
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
                        label="Show promo banner on site"
                    />
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                                fullWidth
                                label="Banner title"
                                value={banner.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g. 2 Days English Learning Webinar"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Batch / subtitle"
                                value={banner.batchText}
                                onChange={(e) => handleChange('batchText', e.target.value)}
                                placeholder="e.g. Batch #21"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Urgency message"
                                value={banner.urgencyText}
                                onChange={(e) => handleChange('urgencyText', e.target.value)}
                                placeholder="e.g. Final Call: Only 25 Slots Left!"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Button text"
                                value={banner.ctaText}
                                onChange={(e) => handleChange('ctaText', e.target.value)}
                                placeholder="e.g. Join the Webinar"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Button link (URL)"
                                value={banner.ctaUrl}
                                onChange={(e) => handleChange('ctaUrl', e.target.value)}
                                placeholder="e.g. /webinar/english-batch-21 or https://..."
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
                                placeholder="e.g. Free"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Countdown (minutes)"
                                value={banner.countdownMinutes}
                                onChange={(e) => handleChange('countdownMinutes', parseInt(e.target.value, 10) || 5)}
                                inputProps={{ min: 1, max: 1440 }}
                                helperText="Timer duration in minutes (e.g. 5 for 5 min countdown)"
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save promo banner'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </AdminLayout>
    );
};

export default AdminPromoBannerPage;
