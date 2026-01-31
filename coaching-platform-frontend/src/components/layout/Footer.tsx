// src/components/layout/Footer.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Link as MuiLink, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';

// A reusable component for a list of footer links
const FooterLinkColumn = ({ title, links }: { title: string, links: { name: string, path: string }[] }) => (
    <Grid sx={{width: {xs:'100%', sm:'33.33%', md: '22%' }}}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {title}
        </Typography>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {links.map((link) => (
                <Box component="li" key={link.name} sx={{ py: 0.5 }}>
                    <MuiLink
                        component={RouterLink}
                        to={link.path}
                        variant="body2"
                        underline="hover"
                        sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}
                    >
                        {link.name}
                    </MuiLink>
                </Box>
            ))}
        </Box>
    </Grid>
);

const Footer: React.FC = () => {
    const companyLinks = [
        { name: 'About Us', path: '/about-us' },
        { name: 'Mission & Vision', path: '/mission-vision' },
        { name: 'Why Join Us', path: '/why-join-us' },
        { name: 'Careers', path: '/careers' },
        { name: 'Testimonials', path: '/testimonials' },
    ];
    
    const legalLinks = [
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms & Conditions', path: '/terms-and-conditions' },
        { name: 'Disclaimer', path: '/disclaimer' },
        { name: "FAQ'S", path: '/faqs' },
        { name: 'Help Center', path: '/help' },
    ];

    const connectLinks = [
        { name: 'Contact Us', path: '/contact-us' },
        { name: 'Partnerships', path: '/partnership' },
        { name: 'Business Proposals', path: '/business-proposal' },
        { name: 'Site Map', path: '/sitemap' },
    ];

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#212121', 
                color: 'white',
                py: { xs: 4, sm: 6 },
                mt: 'auto',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Brand Information */}
                    <Grid sx={{width: {xs:'100%', sm:'33.33%', md: '25%' }}}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Verble</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Empowering the next generation of learners through accessible, high-quality online education.
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <IconButton href="https://youtube.com/@verble" aria-label="Youtube" sx={{ color: '#f83a44' }}><YouTubeIcon /></IconButton>
                            <IconButton href="https://www.instagram.com/verble_official" aria-label="Instagram" sx={{ color: '#f72585' }}><InstagramIcon /></IconButton>
                        </Box>
                    </Grid>

                    {/* Link Columns */}
                    
                    <FooterLinkColumn title="Company" links={companyLinks} />
                    <FooterLinkColumn title="Connect" links={connectLinks} />
                    <FooterLinkColumn title="Legal" links={legalLinks} />

                </Grid>

                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.800', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {'Copyright © '}
                        <MuiLink color="inherit" component={RouterLink} to="/">
                            Verble
                        </MuiLink>{' '}
                        {new Date().getFullYear()}
                        {'. All rights reserved.'}
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
