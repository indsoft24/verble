// src/pages/static/MissionAndVisionPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Button, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Reusable component for a list of points (Mission/Vision goals)
const PointList = ({ items }: { items: { primary: string, secondary: string }[] }) => (
    <List sx={{ p: 0 }}>
        {items.map((item, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', p: 0, mb: 2 }}>
                <ListItemIcon sx={{ minWidth: '36px', mt: '5px', color: 'primary.main' }}>
                    <ArrowForwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                    primary={item.primary}
                    secondary={item.secondary}
                    primaryTypographyProps={{ fontWeight: '600' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                />
            </ListItem>
        ))}
    </List>
);

const MissionAndVisionPage: React.FC = () => {

    const missionGoals = [
        { primary: "Deliver Quality Education at Minimum Fees", secondary: "Make high-quality online education affordable and accessible to all sections of society, especially the underprivileged. Offer courses at minimal cost without compromising on teaching standards or content quality." },
        { primary: "Empower Students Across India", secondary: "Bridge the education gap between urban and rural areas by providing equal access to top educators via digital platforms. Enable students to pursue academic and professional excellence regardless of their background." },
        { primary: "Leverage the Power of Technology in Education", secondary: "Use advanced Ed-Tech tools like live classes, AI-based analytics, and interactive modules to make learning engaging and effective. Create a flexible and inclusive learning environment suitable for every type of learner." },
        { primary: "Connect Learners with India’s Best Educators", secondary: "Build a platform that brings together the top teaching talents from across India to guide, mentor, and educate learners. Ensure students receive accurate, updated, and exam-relevant knowledge from true experts in each domain." },
        { primary: "Contribute to National Development", secondary: "Shape a generation of skilled, knowledgeable, and ethical individuals who will drive the progress of the nation. Support lifelong learning and skill development to strengthen India’s human capital and global competitiveness." },
    ];

    const visionGoals = [
        { primary: "Education Without Barriers", secondary: "Eliminate limitations of location, income, and infrastructure through scalable and inclusive online education models." },
        { primary: "India’s Most Trusted Learning Platform", secondary: "Be recognized as the most reliable, impactful, and student-first Ed-Tech brand in the country." },
        { primary: "Cultivating Excellence at Scale", secondary: "Enable millions of students to excel in academics, competitive exams, and career-building programs with the guidance of top mentors." },
        { primary: "Nation Building Through Education", secondary: "Be a driving force in building a knowledge-driven society that upholds values, innovation, and social responsibility. Contribute to a stronger, smarter, and self-reliant India by investing in its most valuable resource — education." },
        { primary: "Lifelong Learning Ecosystem", secondary: "Create a dynamic educational ecosystem where learning never stops, and students, professionals, and educators thrive together." },
    ];

    return (
        <Box sx={{ bgcolor: 'background.default'}}>
            {/* --- 1. HERO SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 4 }, textAlign: 'center', bgcolor: '#f4f6f8' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        🎯 Mission & Vision
                    </Typography>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: '600', mt: 1 }}>
                        Verble – India’s No.1 Ed-Tech Company
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: '800px', mx: 'auto' }}>
                        At Verble, our mission drives everything we do. We are committed to building a future where quality education is not a luxury but a basic right.
                    </Typography>
                </Container>
            </Box>

            {/* --- 2. MISSION SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 4 } }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{xs: 3, md: 5}} alignItems="center">
                        <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                            <Box
                                component="img"
                                src="https://placehold.co/600x700/2196f3/ffffff?text=Our+Mission"
                                alt="Illustration representing Verble's mission"
                                sx={{ width: '100%', borderRadius: '16px', objectFit: 'cover' }}
                            />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>✅ Our Mission</Typography>
                            <PointList items={missionGoals} />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Divider />

            {/* --- 3. VISION SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 7 } }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{xs: 3, md: 5}} alignItems="center">
                        <Grid sx={{ width: { xs: '100%', md: '47%' }, order: { xs: 2, md: 1 } }}>
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>👁️‍🗨️ Our Vision</Typography>
                            <PointList items={visionGoals} />
                        </Grid>
                         <Grid sx={{ width: { xs: '100%', md: '47%' }, order: { xs: 1, md: 2 } }}>
                            <Box
                                component="img"
                                src="https://placehold.co/600x700/ffafcc/ffffff?text=Our+Vision"
                                alt="Illustration representing Verble's vision for the future"
                                sx={{ width: '100%', borderRadius: '16px', objectFit: 'cover' }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            
            {/* --- 4. CLOSING SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'grey.100', textAlign: 'center' }}>
                <Container maxWidth="md">
                     <Typography variant="h5" sx={{fontWeight: 600}}>
                        At Verble, education is not just a service — it's a social mission.
                    </Typography>
                    <Typography color="text.secondary" sx={{my:2}}>
                        Join us in our journey to educate, empower, and elevate the learners of India.
                    </Typography>
                     <Button component={RouterLink} to="/register" variant="contained" size="large">
                        Join Us Today
                    </Button>
                </Container>
            </Box>
        </Box>
    );
};

export default MissionAndVisionPage;
