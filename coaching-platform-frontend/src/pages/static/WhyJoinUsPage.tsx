// src/pages/static/WhyJoinUsPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useStartFreeNavigation } from '../../hooks/useStartFreeNavigation';

// --- Icon Imports for a Professional Look ---
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Reusable component for the main feature points
const FeaturePoint = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 2 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ color: 'primary.main', mr: 1.5, display: 'flex' }}>{icon}</Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            </Box>
            <Typography color="text.secondary">{text}</Typography>
        </Paper>
    </Grid>
);

const WhyJoinUsPage: React.FC = () => {
    const handleStartFree = useStartFreeNavigation();

    const whyJoinPoints = [
        {
            icon: <BusinessCenterIcon />,
            title: '1. Learn from an Ex-Corporate Professional with 15 Years of Experience',
            text: 'You learn directly from an industry veteran with over 15 years of corporate experience. Get insights from a professional who understands exactly what global employers look for, bringing real-world business communication, corporate etiquette, and practical workplace fluency directly into your lessons.',
        },
        {
            icon: <PriceCheckIcon />,
            title: '2. Affordable Learning Without Compromise',
            text: "High-quality English education shouldn't carry a premium price tag. We provide impactful language training at the lowest possible fees, making structured fluency accessible and inclusive for everyone—not just a privileged few.",
        },
        {
            icon: <MenuBookIcon />,
            title: '3. Comprehensive English Tracks for Every Level',
            text: 'From foundational grammar and daily conversational practice to advanced professional communication and public speaking, our structured tiers cater to all learning levels. Whether you are a student, a job seeker, or a working professional, we have a track for you.',
        },
        {
            icon: <OndemandVideoIcon />,
            title: '4. Live & Recorded Classes with Flexibility',
            text: 'Join interactive live practice sessions or revisit foundational lessons anytime with HD recorded lectures. Master language concepts at your own pace and practice speaking on your own schedule.',
        },
        {
            icon: <DashboardIcon />,
            title: '5. Personalized Dashboard for Maximum Impact',
            text: 'Track your vocabulary progress, monitor your lesson completion, and access your custom learning materials all in one clean, structured space. Your personalized dashboard removes the guesswork, showing you exactly what to review next to build confidence faster.',
        },
        {
            icon: <WbSunnyIcon />,
            title: '6. Daily Learning Dose and Participation',
            text: 'Consistency is key to mastering a language. Receive daily curated bite-sized vocabulary activities, speaking challenges, or grammar tips, and build your confidence through active, daily micro-learning habits that easily fit into a busy routine.',
        },
        {
            icon: <FactCheckIcon />,
            title: '7. Real Evaluation',
            text: 'Skip generic automated percentages and multiple-choice guesswork. Benefit from genuine assessment framework checkpoints that pinpoint exact pronunciation errors, grammar slips, and sentence formulation gaps, giving you clear milestones to target for authentic fluency.',
        },
        {
            icon: <SmartToyIcon />,
            title: '8. Learn Through AI for Maximum Benefit',
            text: 'Accelerate your growth by interacting with advanced AI learning tools and smart interactive modules. Get instant vocabulary recommendations, tailored conversational simulations, and intuitive feedback designed to make language absorption seamless and fast.',
        },
        {
            icon: <EmojiEventsIcon />,
            title: '9. Real Success Stories, Real Impact',
            text: "Thousands of learners have broken through their language barriers, cleared job interviews, and elevated their careers through Verble. You aren't just taking an English course; you are unlocking your full potential.",
        },
        {
            icon: <FlagIcon />,
            title: '10. Driven by Purpose, Not Profit',
            text: "Our core mission is empowerment through communication. We believe mastering English is a vital tool for career growth and societal upliftment, ensuring that a language barrier never stands in the way of anyone's dreams.",
        },
    ];

    const summaryPoints = [
        'Corporate-led mentorship with real workplace fluency',
        'Affordable English training without compromising quality',
        'Structured tracks from basics to professional communication',
        'Flexible live and recorded learning on your schedule',
        'Daily practice, real evaluation, and AI-powered support',
        'A mission-driven platform built to unlock your potential',
    ];

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            {/* --- 1. HERO SECTION --- */}
            <Box sx={{ py: { xs: 2, md: 3 }, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
                <Container maxWidth="md">
                    <WorkspacePremiumIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        🌟 Why Join Verble
                    </Typography>
                    <Typography variant="h6" color="primary.light" sx={{ fontWeight: '600', mt: 1 }}>
                        Verble – India's No.1 Ed-Tech Company
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2, opacity: 0.9, maxWidth: '800px', mx: 'auto' }}>
                        At Verble, we do more than just teach — we empower students to transform their future. With a unique blend of affordability, academic excellence, and societal purpose, we've become the go-to choice for learners across India.
                    </Typography>
                </Container>
            </Box>

            {/* --- 2. CORE REASONS SECTION --- */}
            <Box sx={{ py: { xs: 2, md: 3 }}}>
                <Container maxWidth="lg">
                    <Grid container spacing={2} justifyContent="center">
                        {whyJoinPoints.map((point) => (
                            <FeaturePoint key={point.title} icon={point.icon} title={point.title} text={point.text} />
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* --- 3. SUMMARY SECTION --- */}
            <Box sx={{ py: { xs: 2, md: 3 }, bgcolor: 'grey.100' }}>
                <Container maxWidth="md">
                    <Typography variant="h5" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                        💬 In Summary – Why Verble?
                    </Typography>
                    <List>
                        {summaryPoints.map((point, index) => (
                             <ListItem key={index}>
                                <ListItemIcon sx={{minWidth: '36px', color: 'success.main'}}><CheckCircleIcon /></ListItemIcon>
                                <ListItemText primary={point} primaryTypographyProps={{fontSize: '0.9rem'}}/>
                            </ListItem>
                        ))}
                    </List>
                </Container>
            </Box>
            
            {/* --- 4. CALL TO ACTION SECTION --- */}
            <Box sx={{ py: { xs: 2, md: 3 }, textAlign: 'center' }}>
                 <Container maxWidth="md">
                    <Typography variant="h5" sx={{fontWeight: 600}}>
                        🚀 Start Your Journey with Verble Today!
                    </Typography>
                    <Typography color="text.secondary" sx={{my:2, fontSize: '0.9rem'}}>
                        Empower yourself with the right knowledge, the right mentors, and the right mission. Join Verble — where education is not just a service, but a powerful tool for personal and national transformation.
                    </Typography>
                     <Button onClick={handleStartFree} variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                        Get Started Now
                    </Button>
                </Container>
            </Box>
        </Box>
    );
};

export default WhyJoinUsPage;
