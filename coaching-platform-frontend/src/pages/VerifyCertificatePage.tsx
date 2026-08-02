import React, { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Chip, Stack, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import { useParams } from 'react-router-dom';
import { verifyCertificatePublic, type PublicCertificateVerification } from '../services/courseCertificateService';

const VerifyCertificatePage: React.FC = () => {
    const { verificationCode } = useParams<{ verificationCode: string }>();
    const [data, setData] = useState<PublicCertificateVerification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Verify Certificate | Verble';
        let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = 'Verify the status and public details of a Verble learning credential.';
        if (!verificationCode) { setLoading(false); return; }
        verifyCertificatePublic(verificationCode)
            .then(setData)
            .catch(() => setData({ valid: false, status: 'invalid' }))
            .finally(() => setLoading(false));
    }, [verificationCode]);

    if (loading) return <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>;
    const active = data?.valid && data.status === 'active';
    const revoked = data?.status === 'revoked';
    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 8 }}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
                    {active ? <VerifiedIcon color="success" sx={{ fontSize: 64 }} /> : <GppBadIcon color="error" sx={{ fontSize: 64 }} />}
                    <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
                        {active ? 'Valid credential' : revoked ? 'Credential revoked' : 'Certificate not found'}
                    </Typography>
                    {!data?.certificate ? (
                        <Alert severity="warning" sx={{ mt: 3 }}>This verification code does not match a public credential.</Alert>
                    ) : (
                        <Stack spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
                            <Chip color={active ? 'success' : 'error'} label={data.status.toUpperCase()} />
                            <Typography variant="h5">{data.certificate.learnerName}</Typography>
                            <Typography>{data.certificate.moduleTitle || data.certificate.courseTitle}</Typography>
                            {data.certificate.moduleTitle && <Typography color="text.secondary">{data.certificate.courseTitle}</Typography>}
                            <Typography variant="body2">Certificate {data.certificate.certificateNumber}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Issued {new Date(data.certificate.issuedAt).toLocaleDateString()}
                            </Typography>
                            {revoked && data.certificate.revokedAt && (
                                <Typography variant="body2" color="error">Revoked {new Date(data.certificate.revokedAt).toLocaleDateString()}</Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                Issuer: {data.certificate.issuerName || 'Verble'}
                            </Typography>
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default VerifyCertificatePage;
