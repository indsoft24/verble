import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom';
import { listWebinars, type Webinar } from '../../services/webinarService';

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
    const navigate = useNavigate();
    const [webinars, setWebinars] = useState<Webinar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        listWebinars()
            .then((data) => {
                if (!mounted) return;
                setWebinars(data || []);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const featured = useMemo(() => {
        const now = Date.now();
        const live = webinars.find((w) => now >= new Date(w.startsAt).getTime() && now <= new Date(w.endsAt).getTime());
        if (live) return live;
        const upcoming = webinars
            .filter((w) => new Date(w.startsAt).getTime() > now)
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        return upcoming[0] || null;
    }, [webinars]);

    const showSpinner = parentLoading || loading;
    const originalPrice = featured?.mode === 'PAID' ? '' : '';
    const offerPrice = featured?.mode === 'PAID' ? formatPromoPrice(String(featured.price || '')) : 'Free';
    const showPricing = Boolean(originalPrice || offerPrice);
    const metaLine = featured
        ? `${new Date(featured.startsAt).toLocaleString('en-IN')} · ${featured.audience}`
        : '';

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
                    borderColor: featured ? 'rgba(129,140,248,0.4)' : 'divider',
                    background: featured
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)'
                        : 'background.paper',
                    color: featured ? '#fff' : 'text.primary',
                    boxShadow: featured ? '0 8px 24px rgba(15,23,42,0.25)' : undefined,
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
                            bgcolor: featured ? 'rgba(99,102,241,0.25)' : 'action.hover',
                        }}
                    >
                        <EventAvailableIcon sx={{ color: featured ? '#c7d2fe' : 'primary.main', fontSize: 20 }} />
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
                        <CircularProgress size={28} sx={{ color: featured ? '#a5b4fc' : undefined }} />
                    </Box>
                ) : !featured ? (
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
                                {featured.title || 'English learning webinar'}
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
                                    {formatCountdown(
                                        Math.max(
                                            0,
                                            Math.floor((new Date(featured.startsAt).getTime() - Date.now()) / 1000)
                                        )
                                    )}
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
                                onClick={() => navigate(`/webinar/${encodeURIComponent(featured.slug)}`)}
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
                                View webinar
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Paper>
        </>
    );
};

export default DashboardSeminarPromoCard;
