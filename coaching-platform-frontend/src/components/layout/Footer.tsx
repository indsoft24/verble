// src/components/layout/Footer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Grid, Link as MuiLink, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import { appStoreListingUrl, brandAssets } from '../../assets/brandAssets';

const FooterLinkColumn = ({ title, links }: { title: string; links: { label: string; path: string }[] }) => (
    <Grid size={{ xs: 6, md: 3 }}>
        <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.01em', mb: 1.25 }}
        >
            {title}
        </Typography>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {links.map((link) => (
                <Box component="li" key={link.path} sx={{ py: 0.35 }}>
                    <MuiLink
                        component={RouterLink}
                        to={link.path}
                        variant="body2"
                        underline="none"
                        sx={{
                            color: 'rgba(226,232,240,0.8)',
                            transition: 'all 0.2s ease',
                            '&:hover': { color: '#FFFFFF', pl: 0.5 },
                        }}
                    >
                        {link.label}
                    </MuiLink>
                </Box>
            ))}
        </Box>
    </Grid>
);

const Footer: React.FC = () => {
    const { t } = useTranslation();

    const companyLinks = [
        { label: t('footer.aboutUs'), path: '/about-us' },
        { label: t('footer.missionVision'), path: '/mission-vision' },
        { label: t('footer.whyJoinUs'), path: '/why-join-us' },
        { label: t('footer.testimonials'), path: '/testimonials' },
    ];

    const legalLinks = [
        { label: t('footer.privacyPolicy'), path: '/privacy-policy' },
        { label: t('footer.termsAndConditions'), path: '/terms-and-conditions' },
        { label: t('footer.disclaimer'), path: '/disclaimer' },
        { label: t('footer.faqs'), path: '/faqs' },
        { label: t('footer.helpCenter'), path: '/help' },
    ];

    const connectLinks = [
        { label: t('footer.contactUs'), path: '/contact-us' },
        { label: t('footer.businessProposals'), path: '/business-proposal' },
        { label: t('footer.siteMap'), path: '/sitemap' },
    ];

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#020617',
                backgroundImage:
                    'radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18), transparent 40%), radial-gradient(circle at 85% 10%, rgba(14,165,233,0.15), transparent 35%)',
                color: 'white',
                py: { xs: 3.5, md: 4.5 },
                mt: 'auto',
                borderTop: '1px solid rgba(148,163,184,0.18)',
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        borderRadius: 3,
                        border: '1px solid rgba(148,163,184,0.2)',
                        bgcolor: 'rgba(15,23,42,0.72)',
                        backdropFilter: 'blur(8px)',
                        p: { xs: 2, sm: 2.25, md: 2.75 },
                    }}
                >
                    <Grid container spacing={{ xs: 2.4, md: 3 }} alignItems="flex-start">
                        <Grid size={{ xs: 12, md: 3.4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                Verble
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.82)', maxWidth: 320 }}>
                                {t('footer.tagline')}
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <IconButton
                                    href="https://youtube.com/@verble"
                                    aria-label="Youtube"
                                    sx={{
                                        color: '#F8FAFC',
                                        bgcolor: 'rgba(239,68,68,0.16)',
                                        border: '1px solid rgba(239,68,68,0.38)',
                                        '&:hover': { bgcolor: 'rgba(239,68,68,0.25)' },
                                    }}
                                >
                                    <YouTubeIcon />
                                </IconButton>
                                <IconButton
                                    href="https://www.instagram.com/verble_official"
                                    aria-label="Instagram"
                                    sx={{
                                        color: '#F8FAFC',
                                        bgcolor: 'rgba(236,72,153,0.16)',
                                        border: '1px solid rgba(236,72,153,0.38)',
                                        '&:hover': { bgcolor: 'rgba(236,72,153,0.25)' },
                                    }}
                                >
                                    <InstagramIcon />
                                </IconButton>
                            </Box>
                            <MuiLink
                                href={appStoreListingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    mt: 2,
                                    display: 'inline-block',
                                    lineHeight: 0,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    opacity: 0.95,
                                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                                    '&:hover': { opacity: 1, transform: 'translateY(-1px)' },
                                }}
                                aria-label="Download on the App Store"
                            >
                                <Box
                                    component="img"
                                    src={brandAssets.appStoreIcon}
                                    alt=""
                                    sx={{ height: 44, width: 'auto', display: 'block', maxWidth: '100%' }}
                                />
                            </MuiLink>
                        </Grid>

                        <Grid size={{ xs: 12, md: 8.6 }}>
                            <Grid
                                container
                                spacing={{ xs: 2.5, md: 1.5, lg: 2.5 }}
                                justifyContent={{ xs: 'flex-start', md: 'space-around' }}
                            >
                                <FooterLinkColumn title={t('footer.company')} links={companyLinks} />
                                <FooterLinkColumn title={t('footer.connect')} links={connectLinks} />
                                <FooterLinkColumn title={t('footer.legal')} links={legalLinks} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Box
                        sx={{
                            mt: { xs: 2.4, md: 3 },
                            pt: { xs: 1.6, md: 2 },
                            borderTop: '1px solid rgba(148,163,184,0.16)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.2,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.82)', textAlign: 'center' }}>
                            {t('footer.copyrightBefore')}
                            <MuiLink
                                color="inherit"
                                component={RouterLink}
                                to="/"
                                underline="hover"
                                sx={{ mx: 0.35, fontWeight: 600 }}
                            >
                                Verble
                            </MuiLink>
                            {t('footer.copyrightAfter', { year: new Date().getFullYear() })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.9)', textAlign: 'center' }}>
                            Built with care for modern learners
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
