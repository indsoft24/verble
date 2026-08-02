import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { getCertificatePdfForMe, getMyCertificates, type MyCertificateCredential } from '../services/courseCertificateService';
import { useUserLayoutPage } from '../contexts/UserLayoutConfigContext';

const MyCertificatesPage: React.FC = () => {
    useUserLayoutPage({ title: 'My Certificates' });
    const [items, setItems] = useState<MyCertificateCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMyCertificates().then(setItems).catch((err: unknown) => {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Could not load your certificates.');
        }).finally(() => setLoading(false));
    }, []);

    const openPdf = async (item: MyCertificateCredential, download: boolean) => {
        try {
            const blob = await getCertificatePdfForMe(item._id, download);
            const url = URL.createObjectURL(blob);
            if (download) {
                const link = document.createElement('a');
                link.href = url;
                link.download = `${item.certificateNumber}.pdf`;
                link.click();
            } else window.open(url, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch {
            setError('The certificate PDF could not be opened.');
        }
    };

    if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;
    const groups = [
        { type: 'course' as const, title: 'Course credentials' },
        { type: 'module' as const, title: 'Module credentials' },
    ];
    return (
        <Stack spacing={3}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Box>
                <Typography variant="h4" fontWeight={800}>My certificates</Typography>
                <Typography color="text.secondary">View, download, or share verification links for credentials you have earned.</Typography>
            </Box>
            {!items.length && <Alert severity="info">No certificates have been issued yet. Complete your learning requirements to earn one.</Alert>}
            {groups.map((group) => {
                const credentials = items.filter((item) => item.type === group.type);
                if (!credentials.length) return null;
                return (
                    <Box key={group.type}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>{group.title}</Typography>
                        <Grid container spacing={2}>
                            {credentials.map((item) => (
                                <Grid key={item._id} size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" gap={2}>
                                                <WorkspacePremiumIcon color={item.status === 'revoked' ? 'disabled' : 'primary'} />
                                                <Chip size="small" color={item.status === 'revoked' ? 'error' : 'success'} label={item.status} />
                                            </Stack>
                                            <Typography variant="h6" sx={{ mt: 1 }}>{item.moduleTitle || item.courseTitle}</Typography>
                                            {item.moduleTitle && <Typography variant="body2" color="text.secondary">{item.courseTitle}</Typography>}
                                            <Typography variant="body2" sx={{ mt: 1 }}>{item.certificateNumber}</Typography>
                                            <Typography variant="caption" color="text.secondary">Issued {new Date(item.issuedAt).toLocaleDateString()}</Typography>
                                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                                                <Button size="small" disabled={item.status === 'revoked'} onClick={() => void openPdf(item, false)}>View</Button>
                                                <Button size="small" disabled={item.status === 'revoked'} onClick={() => void openPdf(item, true)}>Download</Button>
                                                <Button size="small" href={`/verify-certificate/${item.verificationCode}`} target="_blank">Verify</Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            })}
        </Stack>
    );
};

export default MyCertificatesPage;
