// src/pages/static/AboutUsPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Icon Imports
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TranslateIcon from '@mui/icons-material/Translate';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MicIcon from '@mui/icons-material/Mic';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Paper
        elevation={2}
        sx={{
            p: 3,
            borderRadius: '16px',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: 'primary.main', mr: 1.5, fontSize: '2.5rem' }}>{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {description}
        </Typography>
    </Paper>
);

const AboutUsPage: React.FC = () => {
    const whyVerbleWorks = [
        "Proven for Indians: Hinglish support, short sessions (5 mins/day)",
        "Lifetime Access of Full Course once purchased",
        "Results-Driven: 10k+ learners; real testimonials"
    ];

    const coreFeatures = [
        {
            icon: <MicIcon />,
            title: "Pronunciation Polish",
            description: "Master clear pronunciation with AI-powered feedback and practice tools."
        },
        {
            icon: <PsychologyIcon />,
            title: "Grammar Intuition",
            description: "Learn grammar naturally through practical examples, not complex rules."
        },
        {
            icon: <TranslateIcon />,
            title: "Cultural Fluency",
            description: "Understand context and cultural nuances for real-world conversations."
        },
        {
            icon: <TrendingUpIcon />,
            title: "Progress Tracking",
            description: "Monitor your improvement with detailed analytics and milestones."
        },
        {
            icon: <RecordVoiceOverIcon />,
            title: "Voice Recording",
            description: "Practice speaking and get instant feedback on your pronunciation."
        },
        {
            icon: <AutoAwesomeIcon />,
            title: "AI Tips",
            description: "Personalized learning suggestions powered by artificial intelligence."
        }
    ];

    const practicalScenarios = [
        "Bargaining at markets",
        "Acing job interviews",
        "Chatting at family events",
        "Office conversations",
        "Wedding celebrations",
        "Daily street interactions"
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box sx={{
                py: { xs: 6, md: 8 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Container maxWidth="md">
                    <RecordVoiceOverIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        About Verble
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, opacity: 0.95 }}>
                        "Speak English. Live Freely."
                    </Typography>
                    <Typography variant="h6" sx={{ maxWidth: '800px', mx: 'auto', opacity: 0.9, lineHeight: 1.8 }}>
                        Verble exists to break the English barrier for millions of non-native speakers in India.
                        We deliver simple, survival English that works in streets, offices, and weddings –
                        turning hesitation into confidence.
                    </Typography>
                    <Box sx={{ mt: 4 }}>
                        <Chip
                            label="No Complex Grammar"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '1rem',
                                p: 2,
                                height: 'auto',
                                fontWeight: 'bold'
                            }}
                        />
                        <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                            Just speak fluently in 30 days.
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* What is Verble Section */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                                What is Verble?
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, fontSize: '1.1rem' }}>
                                Verble is your <strong>mobile-first web app</strong> for bite-sized English mastery.
                                Free tier for basics; Bronze/Silver/Gold for advanced practice.
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem', color: 'text.secondary' }}>
                                Built by a <strong>15 years MNC professional</strong> passionate about EdTech –
                                blending AI, daily habits, and cultural scenarios.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
                                <Chip icon={<SmartphoneIcon />} label="Mobile-First" color="primary" />
                                <Chip icon={<AccessTimeIcon />} label="5 Mins/Day" color="primary" />
                                <Chip icon={<WorkspacePremiumIcon />} label="15 Years Experience" color="primary" />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={3} sx={{ p: 4, borderRadius: '20px', bgcolor: 'white' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                    Our Mission
                                </Typography>
                                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
                                    To empower millions of Indians to speak English confidently in real-life situations,
                                    breaking down language barriers that hold them back.
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                                    <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                            10,000+
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Active Learners
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Core Content & How It Helps */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                            Core Content & How It Helps
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto', lineHeight: 1.8 }}>
                            Verble creates daily, actionable content tailored for beginners.
                            Users gain pronunciation polish, grammar intuition, and cultural fluency –
                            transforming shy speakers into pros.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {coreFeatures.map((feature, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <FeatureCard
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Practical Scenarios Section */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: 'white' }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <TranslateIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Practical Phrases for Real Indian Life
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                            Hinglish support ensures every learner succeeds.
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {practicalScenarios.map((scenario, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <CheckCircleIcon sx={{ mb: 1, fontSize: 30 }} />
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {scenario}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Why Verble Works Section */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <StarIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                            Why Verble Works
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 8 }} sx={{ mx: 'auto' }}>
                            <Paper elevation={3} sx={{ p: 4, borderRadius: '20px' }}>
                                <List>
                                    {whyVerbleWorks.map((item, index) => (
                                        <ListItem key={index} sx={{ py: 2 }}>
                                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                                <CheckCircleIcon color="success" sx={{ fontSize: 30 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item}
                                                primaryTypographyProps={{
                                                    variant: 'h6',
                                                    sx: { fontWeight: 'medium', lineHeight: 1.6 }
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Call to Action Section */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="md">
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 4, md: 6 },
                            borderRadius: '24px',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Join the Fluency Revolution
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                            Start free today and transform your English speaking confidence in just 30 days.
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: 'grey.100',
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            Get Started Free
                        </Button>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default AboutUsPage;
