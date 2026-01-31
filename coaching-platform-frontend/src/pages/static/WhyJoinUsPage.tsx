// src/pages/static/WhyJoinUsPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// --- Icon Imports for a Professional Look ---
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SchoolIcon from '@mui/icons-material/School';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DevicesIcon from '@mui/icons-material/Devices';
import ForumIcon from '@mui/icons-material/Forum';
import PsychologyIcon from '@mui/icons-material/Psychology';
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

    const whyJoinPoints = [
        { icon: <SchoolIcon />, title: "1. Learn from India's Best Educators", text: "We bring together a nationwide pool of top-tier educators — from IITians, doctors, IAS mentors, subject toppers, and seasoned professionals. You learn directly from experienced mentors who've walked the path." },
        { icon: <PriceCheckIcon />, title: "2. Affordable Learning Without Compromise", text: "Quality education shouldn't come at a high cost. We provide premium courses at the lowest possible fees, making learning accessible and inclusive, not commercialized and exclusive." },
        { icon: <MenuBookIcon />, title: "3. Wide Course Catalogue for Every Stage", text: "Covering school academics, competitive exams (JEE, NEET, UPSC, etc.), skill-building, and new-age courses to keep you ahead." },
        { icon: <OndemandVideoIcon />, title: "4. Live & Recorded Classes with Flexibility", text: "Join interactive live sessions or revisit lessons anytime with HD recorded lectures. Learn at your own pace, on your schedule." },
        { icon: <PersonSearchIcon />, title: "5. Personalized Learning for Maximum Impact", text: "Use our smart analytics to track strengths and weaknesses, and get study plans tailored to your learning style. Our goal is to help you learn smarter, not harder." },
        { icon: <DevicesIcon />, title: "6. Tech-Enabled, Student-Centric Platform", text: "Built on modern Ed-Tech infrastructure with AI tools, digital whiteboards, and smart assessment modules, ensuring zero distraction and maximum productivity." },
        { icon: <ForumIcon />, title: "7. Community Support & Peer Learning", text: "Join a vibrant community of motivated learners, mentors, and achievers. Learning at Verble goes beyond textbooks—it builds confidence and collaboration." },
        { icon: <PsychologyIcon />, title: "8. Mentorship That Goes Beyond the Classroom", text: "We don't just prepare you for exams—we prepare you for life. Get access to career counseling, mental wellness support, and life skills coaching." },
        { icon: <EmojiEventsIcon />, title: "9. Real Success Stories, Real Impact", text: "Thousands of students have cracked exams and gained admission to top colleges through Verble. You're not just joining a platform—you're joining a movement." },
        { icon: <FlagIcon />, title: "10. Driven by Purpose, Not Profit", text: "Our core purpose is nation-building through education, not just business growth. Every course you take contributes to a larger goal of societal upliftment." },
    ];
    
    const summaryPoints = [
        "Top educators, real results",
        "Affordable pricing with no compromise on quality",
        "Flexible, tech-savvy learning at your pace",
        "Supportive, student-first environment",
        "Holistic growth — academic, personal, and professional",
        "Part of a larger vision to uplift India through education",
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
                     <Button component={RouterLink} to="/register" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                        Get Started Now
                    </Button>
                </Container>
            </Box>
        </Box>
    );
};

export default WhyJoinUsPage;
