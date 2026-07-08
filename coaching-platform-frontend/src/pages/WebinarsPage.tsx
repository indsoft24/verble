import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Webinar } from '../services/webinarService';
import { listWebinars } from '../services/webinarService';

type TabKey = 'LIVE' | 'UPCOMING' | 'PAST';

const nowDate = () => new Date();

const isLive = (w: Webinar) => {
    const now = nowDate().getTime();
    return now >= new Date(w.startsAt).getTime() && now <= new Date(w.endsAt).getTime();
};

const isUpcoming = (w: Webinar) => new Date(w.startsAt).getTime() > nowDate().getTime();

const WebinarsPage: React.FC = () => {
    const [tab, setTab] = useState<TabKey>('LIVE');
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

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={800}>
                    Live Webinars
                </Typography>
                <Button component={RouterLink} to="/dashboard" variant="outlined">
                    Back to dashboard
                </Button>
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Register for upcoming sessions and join live inside the allowed window.
            </Typography>

            <Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} sx={{ mb: 3 }}>
                <Tab value="LIVE" label="Live now" />
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
                <Alert severity="info">No webinars in this category right now.</Alert>
            ) : (
                <Grid container spacing={2}>
                    {filtered.map((w) => (
                        <Grid key={w._id} size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined" sx={{ height: '100%' }}>
                                <CardContent>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            size="small"
                                            color={isLive(w) ? 'success' : isUpcoming(w) ? 'primary' : 'default'}
                                            label={isLive(w) ? 'LIVE' : isUpcoming(w) ? 'UPCOMING' : 'PAST'}
                                        />
                                        <Chip size="small" label={w.mode === 'PAID' ? `Paid • ₹${w.price}` : 'Free'} />
                                    </Stack>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                        {w.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                        {new Date(w.startsAt).toLocaleString('en-IN')} -{' '}
                                        {new Date(w.endsAt).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Typography>
                                    {w.topics?.length ? (
                                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                                            {w.topics.slice(0, 4).map((t) => (
                                                <Chip key={`${w._id}-${t}`} size="small" variant="outlined" label={t} />
                                            ))}
                                        </Stack>
                                    ) : null}
                                    <Button
                                        component={RouterLink}
                                        to={`/webinar/${encodeURIComponent(w.slug)}`}
                                        variant="contained"
                                        fullWidth
                                    >
                                        View details
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default WebinarsPage;

