// src/pages/static/SiteMapPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Paper, Link as MuiLink, List, ListItem, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

// Reusable component for a sitemap category column
const SitemapCategory = ({ title, links }: { title: string, links: { name: string, path: string }[] }) => (
    <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 2 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: '600', mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            {title}
        </Typography>
        <List dense>
            {links.map(link => (
                <ListItem key={link.path} disablePadding>
                     <MuiLink
                        component={RouterLink}
                        to={link.path}
                        underline="hover"
                        color="text.secondary"
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            width: '100%',
                            py: 0.5,
                            '&:hover': {
                                color: 'primary.main',
                                bgcolor: 'action.hover'
                            },
                             borderRadius: 1
                        }}
                    >
                       <ArrowRightIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                       <ListItemText primary={link.name} />
                    </MuiLink>
                </ListItem>
            ))}
        </List>
    </Grid>
);


const SiteMapPage: React.FC = () => {
    // Define the link structure for the site
    const mainLinks = [
        { name: 'Home', path: '/' },
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/register' },
        { name: 'My Dashboard', path: '/dashboard' },
        { name: 'All Courses', path: '/courses' },
        { name: 'All Videos', path: '/videos' },
        { name: 'Blog', path: '/blog' },
    ];

    const companyLinks = [
        { name: 'About Us', path: '/about-us' },
        { name: 'Partnerships', path: '/partnership' },
        { name: 'Business Proposals', path: '/business-proposal' },
        { name: 'Careers', path: '/careers' },
        { name: 'Contact Us', path: '/contact-us' },
    ];

    const legalLinks = [
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms and Conditions', path: '/terms-and-conditions' },
        { name: 'Disclaimer', path: '/disclaimer' },
    ];

    return (
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <MapIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Site Map
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        An overview of all pages on the Verble website.
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                    <Grid container spacing={{ xs: 2, md: 4 }}>
                        <SitemapCategory title="Main Pages" links={mainLinks} />
                        <SitemapCategory title="Company" links={companyLinks} />
                        <SitemapCategory title="Legal" links={legalLinks} />
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default SiteMapPage;
