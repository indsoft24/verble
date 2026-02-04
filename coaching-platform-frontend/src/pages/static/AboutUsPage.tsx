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

// Feature Card Component (compact)
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Paper
        elevation={2}
        sx={{
            p: 2,
            borderRadius: '12px',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ color: 'primary.main', mr: 1.25, fontSize: '2rem' }}>{icon}</Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
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
                py: { xs: 4, md: 5 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Container maxWidth="md">
                    <RecordVoiceOverIcon sx={{ fontSize: 56, mb: 1.5, opacity: 0.9 }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                        About Verble
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, opacity: 0.95 }}>
                        "Speak English. Live Freely."
                    </Typography>
                    <Typography variant="body1" sx={{ maxWidth: '720px', mx: 'auto', opacity: 0.9, lineHeight: 1.6 }}>
                        Verble exists to break the English barrier for millions of non-native speakers in India.
                        We deliver simple, survival English that works in streets, offices, and weddings –
                        turning hesitation into confidence.
                    </Typography>
                    <Box sx={{ mt: 2.5 }}>
                        <Chip
                            label="No Complex Grammar"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '0.9rem',
                                py: 1,
                                px: 1.5,
                                height: 'auto',
                                fontWeight: 'bold'
                            }}
                        />
                        <Typography variant="subtitle1" sx={{ mt: 1.5, fontWeight: 'bold' }}>
                            Just speak fluently in 30 days.
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* What is Verble Section */}
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                What is Verble?
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                                Verble is your <strong>mobile-first web app</strong> for bite-sized English mastery.
                                Free tier for basics; Bronze/Silver/Gold for advanced practice.
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                                Built by a <strong>15 years MNC professional</strong> passionate about EdTech –
                                blending AI, daily habits, and cultural scenarios.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                <Chip icon={<SmartphoneIcon />} label="Mobile-First" color="primary" size="small" />
                                <Chip icon={<AccessTimeIcon />} label="5 Mins/Day" color="primary" size="small" />
                                <Chip icon={<WorkspacePremiumIcon />} label="15 Years Experience" color="primary" size="small" />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={3} sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'white' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main' }}>
                                    Our Mission
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                                    To empower millions of Indians to speak English confidently in real-life situations,
                                    breaking down language barriers that hold them back.
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                                    <PeopleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                            10,000+
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
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
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main' }}>
                            Core Content & How It Helps
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '640px', mx: 'auto', lineHeight: 1.6 }}>
                            Verble creates daily, actionable content tailored for beginners.
                            Users gain pronunciation polish, grammar intuition, and cultural fluency –
                            transforming shy speakers into pros.
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
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
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'primary.main', color: 'white' }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <TranslateIcon sx={{ fontSize: 44, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Practical Phrases for Real Indian Life
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                            Hinglish support ensures every learner succeeds.
                        </Typography>
                    </Box>
                    <Grid container spacing={1.5}>
                        {practicalScenarios.map((scenario, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        textAlign: 'center',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <CheckCircleIcon sx={{ mb: 0.5, fontSize: 24 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {scenario}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Why Verble Works Section */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <StarIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                            Why Verble Works
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }} sx={{ mx: 'auto' }}>
                            <Paper elevation={3} sx={{ p: 2.5, borderRadius: '16px' }}>
                                <List dense disablePadding>
                                    {whyVerbleWorks.map((item, index) => (
                                        <ListItem key={index} sx={{ py: 1 }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckCircleIcon color="success" sx={{ fontSize: 24 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item}
                                                primaryTypographyProps={{
                                                    variant: 'body1',
                                                    sx: { fontWeight: 'medium', lineHeight: 1.5 }
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
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="md">
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: '20px',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                            Join the Fluency Revolution
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                            Start free today and transform your English speaking confidence in just 30 days.
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            size="medium"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 3,
                                py: 1.25,
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: 'grey.100',
                                    transform: 'scale(1.03)'
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
