// src/pages/LandingPage.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Box,
    Typography,
    Grid,
    Button,
    Card,
    Paper,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Divider,
    Stack,
    Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TranslateIcon from '@mui/icons-material/Translate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

const LandingPage: React.FC = () => {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const handleCheckboxChange = (index: number) => {
        setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleStartFreeModule = () => {
        if (isAuthenticated && user) {
            // User is logged in, redirect to dashboard
            const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
            navigate(dashboardPath);
        } else {
            // User is not logged in, redirect to registration
            navigate('/register');
        }
    };

    const whoIsThisFor = [
        "I speak Hindi fluently but struggle with English conversations",
        "I want Survival English for daily life (market, auto, office, travel)",
        "I'm a complete beginner needing simple, practical English",
        "I freeze during job interviews or client meetings",
        "I enjoy Hollywood dubbed movies but can't understand in English audio",
        "I want to speak confidently without grammar mistakes",
        "I want to master Office English, airport English, restaurant English needed NOW",
        "I want job interview or travel English but don't know where to start",
        "I am a complete beginner overwhelmed by grammar books",
        "I am a student who would start the career soon",
        "I am a small business owner but want to grow my business by learning English confidently",
        "I want to apply for foreigner visa for study / job in some time",
        "I am housewife and want to grow my confidence and create impact in the social platform like Instagram"
    ];

    const provenResults = [
        { icon: <SchoolIcon />, title: "Word of the Day", desc: "Daily Vocabulary", color: "#4CAF50" },
        { icon: <TranslateIcon />, title: "Phrase of the Day", desc: "Ready Conversations", color: "#2196F3" },
        { icon: <VideoLibraryIcon />, title: "One Minute Reads", desc: "Reading Fluency", color: "#FF9800" },
        { icon: <QuizIcon />, title: "Spot Correct Sentence", desc: "Grammar Mastery", color: "#9C27B0" },
        { icon: <AutoAwesomeIcon />, title: "Verb Fill Blanks", desc: "Tense Perfection", color: "#F44336" },
        { icon: <RecordVoiceOverIcon />, title: "Voice Practice", desc: "Speaking Confidence", color: "#00BCD4" }
    ];

    const courseValueBreakdown = [
        { module: "FREE", features: "1000+ Daily Word and 500+ Phrase of Day", value: "₹1,999" },
        { module: "Bronze", features: "Daily One Minute read with key words and Essential Vocabulary", value: "₹1,999" },
        { module: "SILVER", features: "Practical life Conversations, Daily Grammar Puzzles", value: "₹4,999" },
        { module: "GOLD", features: "Scene Explanations, Professional Dialogues, AI Prompts", value: "₹9,999" },
        { module: "FULL COURSE", features: "Zero to Hero, 100 Videos, 08 Modules, 80 Quiz, 200 hours of video", value: "₹20,999" },
        { module: "AI Learning", features: "Learn in English, Hindi, Hinglish. Speak or Type to learn.", value: "₹5,999" },
        { module: "BONUS", features: "Famous Speeches, Song Lyrics, IG Learning Feeds", value: "FREE with bundle" }
    ];

    const testimonials = [
        { name: "Rakesh S.", location: "Delhi", text: "From zero conversations to leading team meetings in 3 months. Job promotion! Nobody teaches English this practically.", rating: 5 },
        { name: "Priya M.", location: "Pune", text: "Used airport conversations module before USA trip. Handled immigration perfectly. Silver module worth 10x price!", rating: 5 },
        { name: "Amit K.", location: "Bengaluru", text: "Daily puzzles fixed my grammar. Now I negotiate with clients confidently. Best ever investment on self development.", rating: 5 },
        { name: "Raj", location: "Delhi", text: "Verble made English easy – now I negotiate salaries confidently!", rating: 5 },
        { name: "Priya", location: "Haryana", text: "Gold prompts are gold! Practiced wedding speeches perfectly.", rating: 5 },
        { name: "Amit", location: "Small Business Owner", text: "Best for beginners. Hinglish magic!", rating: 5 },
        { name: "Sneha R.", location: "Mumbai", text: "As a housewife, I wanted to build confidence. Verble's daily practice helped me speak confidently at social events!", rating: 5 },
        { name: "Vikram P.", location: "Hyderabad", text: "Preparing for US visa interview. Airport English module was a lifesaver. Got the visa!", rating: 5 },
        { name: "Anjali K.", location: "Chennai", text: "From struggling with basic sentences to giving presentations at work. Verble transformed my career!", rating: 5 }
    ];

    const faqs = [
        {
            question: "Is this for complete beginners?",
            answer: "YES! Zero English? No problem. Hindi explanations everywhere."
        },
        {
            question: "How long it will take to become confident?",
            answer: "Daily Practice as learning any language is a journey not a destination. One year subscription will make you learn the way you want."
        },
        {
            question: "Mobile app or laptop?",
            answer: "Both! Verble Web App works perfectly on laptop/ desktop/ Android phone or Apple phone"
        },
        {
            question: "How do I practice daily?",
            answer: "Daily practice activities and use AI as much as possible."
        },
        {
            question: "Hindi support available?",
            answer: "Complete Hindi translations for all content."
        }
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', overflow: 'hidden' }}>
            {/* Hero Banner - Redesigned Two-Column Layout */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                pt: { xs: 8, md: 12 },
                pb: { xs: 6, md: 10 },
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative background elements */}
                <Box sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                }} />

                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Chip
                                    label="Next-Gen AI English Learning"
                                    sx={{
                                        mb: 3,
                                        bgcolor: 'rgba(99, 102, 241, 0.2)',
                                        color: '#818cf8',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        px: 2,
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}
                                />
                                <Typography
                                    variant="h2"
                                    component="h1"
                                    sx={{
                                        fontWeight: 900,
                                        mb: 2,
                                        fontSize: { xs: '2.2rem', sm: '3rem', md: '4rem' },
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.02em',
                                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}
                                >
                                    Speak English fluently with AI.
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        mb: 4,
                                        fontWeight: 400,
                                        fontSize: { xs: '1.1rem', md: '1.35rem' },
                                        color: '#94a3b8',
                                        lineHeight: 1.6,
                                        maxWidth: '600px',
                                        mx: { xs: 'auto', md: 0 }
                                    }}
                                >
                                    Master real-life conversations with our AI Companion.
                                    Zero grammar stress. Just pure, confident speaking in 30 days.
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    sx={{ mb: 5, justifyContent: { xs: 'center', md: 'flex-start' } }}
                                >
                                    <Button
                                        onClick={handleStartFreeModule}
                                        variant="contained"
                                        size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#6366f1',
                                            color: 'white',
                                            px: 4,
                                            py: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                            '&:hover': {
                                                bgcolor: '#4f46e5',
                                                transform: 'translateY(-2px)',
                                            },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Start Free Module
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/courses"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            borderColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            px: 4,
                                            py: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            '&:hover': {
                                                borderColor: 'white',
                                                bgcolor: 'rgba(255,255,255,0.05)',
                                            }
                                        }}
                                    >
                                        Explore Courses
                                    </Button>
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={3}
                                    sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
                                >
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>10k+</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Learners</Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>4.9/5</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Rating</Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>AI-First</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Learning</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Box
                                component="img"
                                src="/hero-ai-avatar.png"
                                alt="AI English Learning"
                                sx={{
                                    width: '100%',
                                    maxWidth: '500px',
                                    height: 'auto',
                                    borderRadius: '24px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    transform: 'perspective(1000px) rotateY(-5deg)',
                                    transition: 'transform 0.5s ease',
                                    '&:hover': {
                                        transform: 'perspective(1000px) rotateY(0deg)',
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Trust Indicators - Minimal & Premium */}
            <Box sx={{ py: 4, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: '#64748b',
                            mb: 4,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        Trusted by Learners from Top Industries
                    </Typography>
                    <Grid container spacing={4} justifyContent="center" alignItems="center" sx={{ opacity: 0.6, filter: 'grayscale(100%)' }}>
                        {/* Placeholder for industry icons/logos */}
                        <Grid size={{ xs: 4, sm: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>GOOGLE</Typography></Grid>
                        <Grid size={{ xs: 4, sm: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>AMAZON</Typography></Grid>
                        <Grid size={{ xs: 4, sm: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>TCS</Typography></Grid>
                        <Grid size={{ xs: 4, sm: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>WIPRO</Typography></Grid>
                        <Grid size={{ xs: 4, sm: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>INFOSYS</Typography></Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Proven Results - Modern Featured Section */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: '#0f172a',
                                fontSize: { xs: '2rem', md: '2.5rem' }
                            }}
                        >
                            Practical Tools for Rapid Learning
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: '700px', mx: 'auto' }}>
                            Our platform is built on proven pedagogical methods, enhanced by cutting-edge AI to make learning English natural and fast.
                        </Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {provenResults.map((result, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        borderRadius: '24px',
                                        height: '100%',
                                        border: '1px solid #f1f5f9',
                                        bgcolor: '#f8fafc',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            bgcolor: 'white',
                                            borderColor: result.color,
                                            '& .icon-box': {
                                                bgcolor: result.color,
                                                color: 'white',
                                                transform: 'scale(1.1) rotate(5deg)',
                                            }
                                        }
                                    }}
                                >
                                    <Box
                                        className="icon-box"
                                        sx={{
                                            color: result.color,
                                            mb: 3,
                                            width: 64,
                                            height: 64,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '16px',
                                            bgcolor: 'white',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '2rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {result.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
                                        {result.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                                        {result.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Membership Tiers - Strategic Learning Path */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f1f5f9' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: '#0f172a',
                                fontSize: { xs: '2rem', md: '2.5rem' }
                            }}
                        >
                            Your Path to English Mastery
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
                            Choose a plan that fits your current level and goals.
                        </Typography>
                    </Box>
                    <Grid container spacing={4} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 5,
                                    borderRadius: '32px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #e2e8f0',
                                    bgcolor: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', mr: 2 }}>
                                        <CheckCircleIcon sx={{ fontSize: 32 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                            Foundation Path
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>Perfect for absolute beginners</Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={3} sx={{ flex: 1 }}>
                                    {[
                                        { level: "Free Content", desc: "Basic vocabulary & daily word of the day" },
                                        { level: "Bronze Access", desc: "Essentials & reading fluency practice" },
                                        { level: "Silver Upgrade", desc: "Real-life conversations & advanced puzzles" }
                                    ].map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mt: 0.5, mr: 2, color: '#22c55e' }}>
                                                <VerifiedUserIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.level}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b' }}>{item.desc}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                                <Button
                                    variant="outlined"
                                    onClick={handleStartFreeModule}
                                    sx={{
                                        mt: 5,
                                        py: 1.5,
                                        borderRadius: '12px',
                                        color: '#0f172a',
                                        borderColor: '#e2e8f0',
                                        fontWeight: 700,
                                        '&:hover': { borderColor: '#0f172a', bgcolor: 'transparent' }
                                    }}
                                >
                                    Start Free Foundation
                                </Button>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 5,
                                    borderRadius: '32px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: '#0f172a',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)'
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', mr: 2 }}>
                                        <AutoAwesomeIcon sx={{ fontSize: 32 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            Professional Path
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Accelerate your career growth</Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
                                    {[
                                        { level: "Gold Membership", desc: "AI Prompts, Scene Explanations, & Professional Dialogues" },
                                        { level: "Full Course Mastery", desc: "200+ hours of video modules & assessment quizzes" },
                                        { level: "AI Learning Buddy", desc: "Speak or type to learn with personalized feedback" }
                                    ].map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mt: 0.5, mr: 2, color: '#818cf8' }}>
                                                <VerifiedUserIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.level}</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{item.desc}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                                <Button
                                    component={RouterLink}
                                    to="/subscription-plans"
                                    variant="contained"
                                    sx={{
                                        mt: 5,
                                        py: 2,
                                        borderRadius: '12px',
                                        bgcolor: '#6366f1',
                                        fontWeight: 700,
                                        '&:hover': { bgcolor: '#4f46e5' }
                                    }}
                                >
                                    Unlock Professional Plans
                                </Button>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Who's This App For - Compact 2 Column */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Who's This App For?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ✓ Check all that apply
                        </Typography>
                    </Box>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            {whoIsThisFor.map((item, index) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.5 }}>
                                        <Checkbox
                                            checked={checkedItems[index] || false}
                                            onChange={() => handleCheckboxChange(index)}
                                            color="primary"
                                            size="small"
                                            sx={{ mt: -0.5 }}
                                        />
                                        <Typography variant="body2" sx={{ pt: 0.5 }}>
                                            {item}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                                If any of the above applies to you, Verble is PERFECT for you!
                            </Typography>
                            <Button
                                onClick={handleStartFreeModule}
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ px: 4, py: 1.5, borderRadius: '50px' }}
                            >
                                Start Your Free Module Today
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </Box>

            {/* Everything You Will Master - Full Width Equal Height 3 Column */}
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="xl">
                    <Box sx={{ textAlign: 'center', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', width: '100%' }}>
                            Everything You Will Master
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Comprehensive learning modules for complete English mastery
                        </Typography>
                    </Box>
                    <Grid container spacing={3} sx={{ width: '100%' }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card
                                elevation={2}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    height: '100%',
                                    minHeight: '420px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'white'
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'success.main' }}>
                                    Free Foundation
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Daily Word</Typography>
                                            <Typography variant="body2" color="text.secondary">1000+ words with meanings & examples</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Phrase Building</Typography>
                                            <Typography variant="body2" color="text.secondary">500+ practical phrases for daily use</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'warning.main' }}>
                                    Bronze Content
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="warning" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>One Minute Reads</Typography>
                                            <Typography variant="body2" color="text.secondary">300+ stories with key words & translations</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="warning" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Essential Vocabulary</Typography>
                                            <Typography variant="body2" color="text.secondary">Themed vocabulary sets (Kitchen, Travel, etc.)</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: 'info.main' }}>
                                    Silver Content
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="info" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Practical Conversations</Typography>
                                            <Typography variant="body2" color="text.secondary">Real-life dialogue practice with audio</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="info" sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Daily Grammar Puzzles</Typography>
                                            <Typography variant="body2" color="text.secondary">Spot correct sentence & fill blanks</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card
                                elevation={4}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    height: '100%',
                                    minHeight: '420px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                                        Gold Professional
                                    </Typography>
                                    <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Scene Explanations</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Describe situations with key vocabulary</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Professional Conversations</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Airport, Interviews, Client Meetings</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>AI Prompts</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Ready-to-use prompts for practice</Typography>
                                            </Box>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                                        Full Course
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>200 Hours Content</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Comprehensive video lectures</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>100 Videos, 08 Modules</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>80 Quizzes for assessment</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Complete Grammar</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Phonetics to Advanced Modals</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Lifetime Access</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Learn at your own pace forever</Typography>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card
                                elevation={2}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    height: '100%',
                                    minHeight: '420px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'success.main',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                                        Bonus Extras
                                    </Typography>
                                    <Stack spacing={1.5} sx={{ mb: 2.5, flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Famous Speeches</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Priyanka Chopra, APJ Kalam analysis</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Song Lyrics</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Ed Sheeran lyrics with vocabulary</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <CheckCircleIcon sx={{ fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Instagram Feeds</Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Curated learning content</Typography>
                                            </Box>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: '12px' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            🎁 Free with Bundle
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                            All bonus content included with Gold & Full Course plans
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Course Value Breakdown - Modern Pricing Section */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                            Incredible Value, Unbeatable Price
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
                            Invest in your future with our comprehensive learning modules.
                        </Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3, fontSize: '1rem' }}>Learning Module</TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3, fontSize: '1rem' }}>Key Features Included</TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontWeight: 800, py: 3, fontSize: '1rem' }} align="right">Market Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {courseValueBreakdown.map((row, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#1e293b' }}>{row.module}</TableCell>
                                        <TableCell sx={{ py: 2.5, color: '#64748b' }}>{row.features}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a', py: 2.5 }}>{row.value}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 800, py: 3, fontSize: '1.1rem', color: '#0f172a' }}>Total Combined Value</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, py: 3, fontSize: '1.1rem', color: '#0f172a' }}>₹45,994/-</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: '#ecfdf5' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 800, py: 3, fontSize: '1.2rem', color: '#059669' }}>Standard Bundle Price (78% Off)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, py: 3, fontSize: '1.2rem', color: '#059669' }}>₹9,999/-</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                    <TableCell colSpan={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <LocalFireDepartmentIcon sx={{ color: '#ef4444', mr: 1 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444' }}>Limited Time Special Offer</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900, py: 3, fontSize: '1.5rem', color: '#ef4444' }}>₹3,999/-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 6, textAlign: 'center' }}>
                        <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
                            {[
                                { icon: <SecurityIcon />, text: "7-Day Refund" },
                                { icon: <VerifiedUserIcon />, text: "Verified Content" },
                                { icon: <TrendingUpIcon />, text: "Lifetime Updates" }
                            ].map((item, idx) => (
                                <Grid size="auto" key={idx}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#64748b' }}>
                                        <Box sx={{ color: '#22c55e' }}>{item.icon}</Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.text}</Typography>
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                        <Button
                            onClick={handleStartFreeModule}
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: '#6366f1',
                                px: 6,
                                py: 2,
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                '&:hover': { bgcolor: '#4f46e5' }
                            }}
                        >
                            Start Learning for Free
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Testimonials - Premium Social Proof */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f8fafc' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                            Real Stories, Real Results
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
                            Join 10,000+ learners who have transformed their lives with Verble.
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {testimonials.map((testimonial, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        borderRadius: '24px',
                                        height: '100%',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Avatar sx={{ bgcolor: '#6366f1', width: 56, height: 56, fontWeight: 700 }}>
                                            {testimonial.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ ml: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{testimonial.name}</Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b' }}>{testimonial.location}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', mb: 2 }}>
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <StarIcon key={i} sx={{ color: '#f59e0b', fontSize: 20 }} />
                                        ))}
                                    </Box>
                                    <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                                        "{testimonial.text}"
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Course Syllabus - Modern Interactive Accordion */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff' }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                            Full Course Syllabus
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
                            A step-by-step roadmap to English fluency.
                        </Typography>
                    </Box>
                    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden' }}>
                        {[
                            { title: "Module 00: Introductions", items: ["Why English?", "Meet your coach", "Our Mission"] },
                            { title: "Module 01: Foundations (Week 01-05)", items: ["Alphabets & Phonetics", "Consonant Sounds", "Silent Letters", "Vowel Sounds"] },
                            { title: "Module 02: Language Basics (Week 06)", items: ["Genders", "Singular/Plural", "Opposites", "Confusing Words"] },
                            { title: "Module 03-05: Parts of Speech", items: ["Nouns & Pronouns", "Verbs & Adverbs", "Conjunctions & Prepositions"] },
                            { title: "Module 06-08: Advanced Structures", items: ["Punctuation Mastery", "Article Usage", "Tenses & Modals"] },
                            { title: "Bonus Resources", items: ["situational Vocabulary (50+ categories)", "Famous Speech Analysis", "PDF Downloads"] }
                        ].map((module, index) => (
                            <Accordion key={index} elevation={0} sx={{
                                '&:not(:last-child)': { borderBottom: '1px solid #e2e8f0' },
                                '&:before': { display: 'none' },
                                bgcolor: 'transparent'
                            }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}
                                    sx={{ py: 2, '&:hover': { bgcolor: '#f8fafc' } }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>{module.title}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pb: 3, pt: 0, bgcolor: '#f8fafc' }}>
                                    <Grid container spacing={2}>
                                        {module.items.map((item, idx) => (
                                            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18, mr: 1.5 }} />
                                                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{item}</Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Meet Your Guide - Executive Profile */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#0f172a' }}>
                <Container maxWidth="lg">
                    <Card elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: '40px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }} />
                        <Grid container spacing={6} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                                <Avatar
                                    src="/coach-image.jpg" // Note: Need actual coach image or fallback
                                    sx={{
                                        width: 240,
                                        height: 240,
                                        mx: 'auto',
                                        border: '8px solid rgba(99, 102, 241, 0.2)',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                    }}
                                />
                                <Typography variant="h4" sx={{ mt: 3, fontWeight: 800, color: 'white' }}>Narendra Singh</Typography>
                                <Typography variant="h6" sx={{ color: '#818cf8', fontWeight: 600 }}>Lead English Coach</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, mb: 3, color: 'white', lineHeight: 1.2 }}>
                                    "I believe everyone has the potential to speak English confidently."
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400, lineHeight: 1.8, mb: 4 }}>
                                    With over 15 years of experience in language coaching, I've developed a methodology that focuses on natural acquisition rather than rote memorization. My goal is to help you break the barrier of hesitation and speak with authority.
                                </Typography>
                                <Stack direction="row" spacing={3}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>15+</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>Years Experience</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>50k+</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>Students Mentored</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Card>
                </Container>
            </Box>

            {/* FAQ - Modern Clean Design */}
            < Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff' }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
                            Everything you need to know about starting your journey with Verble.
                        </Typography>
                    </Box>
                    <Stack spacing={2}>
                        {faqs.map((faq, index) => (
                            <Accordion
                                key={index}
                                elevation={0}
                                sx={{
                                    borderRadius: '16px !important',
                                    border: '1px solid #e2e8f0',
                                    '&:before': { display: 'none' },
                                    '&.Mui-expanded': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}
                                    sx={{ px: 3, py: 1 }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 3, pb: 2 }}>
                                    <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#475569' }}>{faq.answer}</Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Container>
            </Box >

            {/* Final CTA - High Conversion Section */}
            < Box sx={{
                py: { xs: 10, md: 12 },
                bgcolor: '#0f172a',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: 64, mb: 3, color: '#f87171' }} />
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            mb: 3,
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            background: 'linear-gradient(to right, #fff, #94a3b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Ready to Transform Your English?
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 6, fontWeight: 400, color: '#94a3b8', maxWidth: '600px', mx: 'auto' }}>
                        Join 10,000+ others who are already mastering fluent English with AI. Your journey to confidence starts here.
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                    >
                        <Button
                            onClick={handleStartFreeModule}
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: '#6366f1',
                                color: 'white',
                                px: 6,
                                py: 2,
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                borderRadius: '16px',
                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                '&:hover': { bgcolor: '#4f46e5', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            Start Free Module
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/subscription-plans"
                            variant="outlined"
                            size="large"
                            sx={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                px: 6,
                                py: 2,
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                borderRadius: '16px',
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            View All Plans
                        </Button>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 4, color: '#64748b', fontWeight: 600 }}>
                        7-Day Money Back Guarantee • No Credit Card Required for Free Trial
                    </Typography>
                </Container>
            </Box >
        </Box >
    );
};

export default LandingPage;
