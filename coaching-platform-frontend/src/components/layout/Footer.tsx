// src/components/layout/Footer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Grid, Link as MuiLink, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import { brandAssets } from '../../assets/brandAssets';
import {
    SITE_CONTACT,
    siteContactMailto,
    siteContactPhoneDisplay,
    siteContactTel,
} from '../../config/siteContact';

const FOOTER_BG = '#020617';

const FooterLinkColumn = ({ title, links }: { title: string; links: { label: string; path: string }[] }) => (
    <>
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
                            transition: 'color 0.2s ease, padding 0.2s ease',
                            '&:hover': { color: '#FFFFFF', pl: 0.5 },
                        }}
                    >
                        {link.label}
                    </MuiLink>
                </Box>
            ))}
        </Box>
    </>
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
                bgcolor: FOOTER_BG,
                color: 'white',
                pt: { xs: 4, md: 5 },
                pb: 'calc(var(--verble-promo-banner-height, 0px) + 24px)',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box
                            component="img"
                            src={brandAssets.primaryLogo}
                            alt="Verble — learn English with confidence"
                            sx={{
                                width: 130,
                                maxWidth: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'contain',
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                mb: 0.75,
                                fontSize: { xs: '1.25rem', md: '1.5rem' },
                                lineHeight: 1.2,
                            }}
                        >
                            Verble
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(226,232,240,0.82)',
                                fontSize: { xs: '0.875rem', md: '0.9375rem' },
                                lineHeight: 1.5,
                                mb: 1.5,
                            }}
                        >
                            {t('footer.tagline')}
                        </Typography>
                        <Box sx={{ mb: 1.5 }}>
                            <MuiLink
                                href={siteContactMailto}
                                variant="body2"
                                underline="hover"
                                sx={{
                                    display: 'block',
                                    color: 'rgba(226,232,240,0.82)',
                                    mb: 0.5,
                                    '&:hover': { color: '#FFFFFF' },
                                }}
                            >
                                {SITE_CONTACT.email}
                            </MuiLink>
                            <MuiLink
                                href={siteContactTel}
                                variant="body2"
                                underline="hover"
                                sx={{
                                    display: 'block',
                                    color: 'rgba(226,232,240,0.82)',
                                    '&:hover': { color: '#FFFFFF' },
                                }}
                            >
                                {siteContactPhoneDisplay}
                            </MuiLink>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                                href="https://youtube.com/@verble"
                                aria-label="Youtube"
                                size="small"
                                sx={{
                                    color: '#F8FAFC',
                                    bgcolor: 'rgba(239,68,68,0.16)',
                                    border: '1px solid rgba(239,68,68,0.38)',
                                    '&:hover': { bgcolor: 'rgba(239,68,68,0.25)' },
                                }}
                            >
                                <YouTubeIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                href="https://www.instagram.com/verble_official"
                                aria-label="Instagram"
                                size="small"
                                sx={{
                                    color: '#F8FAFC',
                                    bgcolor: 'rgba(236,72,153,0.16)',
                                    border: '1px solid rgba(236,72,153,0.38)',
                                    '&:hover': { bgcolor: 'rgba(236,72,153,0.25)' },
                                }}
                            >
                                <InstagramIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                        <FooterLinkColumn title={t('footer.company')} links={companyLinks} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                        <FooterLinkColumn title={t('footer.connect')} links={connectLinks} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FooterLinkColumn title={t('footer.legal')} links={legalLinks} />
                    </Grid>
                </Grid>

                <Box
                    sx={{
                        mt: { xs: 3.5, md: 4.5 },
                        pt: { xs: 2, md: 2.5 },
                        borderTop: '1px solid rgba(148,163,184,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                    }}
                >
                    <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.82)', textAlign: { xs: 'center', sm: 'left' } }}>
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
                    <Typography
                        variant="caption"
                        sx={{ color: 'rgba(148,163,184,0.75)', textAlign: { xs: 'center', sm: 'right' } }}
                    >
                        Built with care for modern learners
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
