import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    alpha,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Stack,
    Tab,
    Tabs,
    Typography,
    Breadcrumbs,
    Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DocumentHead from '../components/seo/DocumentHead';
import { resolveBackendMediaUrl, getSplashImageUrl } from '../utils/imageUtils';
import type { Webinar } from '../services/webinarService';
import { formatWebinarPrice, listWebinars } from '../services/webinarService';

type TabKey = 'LIVE' | 'UPCOMING' | 'PAST';

const nowDate = () => new Date();

const isLive = (w: Webinar) => {
    const now = nowDate().getTime();
    return now >= new Date(w.startsAt).getTime() && now <= new Date(w.endsAt).getTime();
};

const isUpcoming = (w: Webinar) => new Date(w.startsAt).getTime() > nowDate().getTime();

const getWebinarImage = (imageUrl?: string) => resolveBackendMediaUrl(imageUrl);

const WebinarsPage: React.FC = () => {
    const [tab, setTab] = useState<TabKey>('UPCOMING');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [webinars, setWebinars] = useState<Webinar[]>([]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        listWebinars()
            .then((items) => {
                if (!mounted) return;
                setWebinars(items || []);
            })
            .catch((e: unknown) => {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : 'Could not load webinars.');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const filtered = useMemo(() => {
        if (tab === 'LIVE') return webinars.filter(isLive);
        if (tab === 'UPCOMING') return webinars.filter(isUpcoming);
        return webinars.filter((w) => !isLive(w) && !isUpcoming(w));
    }, [tab, webinars]);

    const liveCount = useMemo(() => webinars.filter(isLive).length, [webinars]);

    const canonicalUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://verble.in'}/webinars`;

    useEffect(() => {
        if (liveCount > 0) setTab('LIVE');
    }, [liveCount]);

    return (
        <>
            <DocumentHead
                title="Live Webinars | Verble"
                description="Join free and paid English learning webinars. Browse upcoming sessions, view details, and register when you're ready."
                canonicalUrl={canonicalUrl}
            />
            <Box
                sx={{
                    background: 'linear-gradient(165deg, #1e3a8a 0%, #2563eb 45%, #0f766e 100%)',
                    color: '#fff',
                    py: { xs: 4, md: 6 },
                }}
            >
                <Container maxWidth="lg">
                    <Breadcrumbs sx={{ mb: 2, '& a': { color: alpha('#fff', 0.85) }, '& .MuiTypography-root': { color: '#fff' } }}>
                        <MuiLink component={RouterLink} to="/" underline="hover">
                            Home
                        </MuiLink>
                        <Typography>Webinars</Typography>
                    </Breadcrumbs>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <EventAvailableIcon sx={{ fontSize: 36 }} />
                        <Typography variant="h3" component="h1" fontWeight={800}>
                            Live Webinars
                        </Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ maxWidth: 640, color: alpha('#fff', 0.9) }}>
                        Browse sessions publicly — no login needed. Open any webinar for full details; sign in only when you register.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} sx={{ mb: 3 }}>
                    <Tab value="LIVE" label={`Live now${liveCount ? ` (${liveCount})` : ''}`} />
                    <Tab value="UPCOMING" label="Upcoming" />
                    <Tab value="PAST" label="Past" />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : filtered.length === 0 ? (
                    <Alert severity="info">No webinars in this category right now. Check back soon.</Alert>
                ) : (
                    <Grid container spacing={3}>
                        {filtered.map((w) => (
                            <Grid key={w._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardActionArea
                                        component={RouterLink}
                                        to={`/webinar/${encodeURIComponent(w.slug)}`}
                                        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="160"
                                            image={getWebinarImage(w.imageUrl)}
                                            alt={w.title}
                                            sx={{ objectFit: 'cover' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = getSplashImageUrl();
                                            }}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                                                <Chip
                                                    size="small"
                                                    color={isLive(w) ? 'success' : isUpcoming(w) ? 'primary' : 'default'}
                                                    label={isLive(w) ? 'LIVE' : isUpcoming(w) ? 'UPCOMING' : 'PAST'}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={w.mode === 'PAID' ? formatWebinarPrice(w.price) : 'Free'}
                                                    variant="outlined"
                                                />
                                            </Stack>
                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                                {w.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                {new Date(w.startsAt).toLocaleString('en-IN', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </Typography>
                                            {w.topics?.length ? (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {w.topics.slice(0, 3).map((t) => (
                                                        <Chip key={`${w._id}-${t}`} size="small" variant="outlined" label={t} />
                                                    ))}
                                                </Stack>
                                            ) : null}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button component={RouterLink} to="/register" variant="outlined">
                            New here? Create a free account
                        </Button>
                    </Box>
                )}
            </Container>
        </>
    );
};

export default WebinarsPage;
