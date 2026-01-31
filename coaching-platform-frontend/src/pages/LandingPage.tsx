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
    CardContent,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
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
import PeopleIcon from '@mui/icons-material/People';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import TranslateIcon from '@mui/icons-material/Translate';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QuizIcon from '@mui/icons-material/Quiz';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

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
            {/* Hero Banner - Compact & Professional */}
            <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: { xs: 5, md: 6 },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }
            }}>
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center', maxWidth: '850px', mx: 'auto' }}>
                        <Chip 
                            label="Speak English. Live Freely." 
                            sx={{ 
                                mb: 3, 
                                bgcolor: 'rgba(255,255,255,0.2)', 
                                color: 'white', 
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                px: 2,
                                py: 0.5
                            }} 
                        />
                        <Typography 
                            variant="h2" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 800, 
                                mb: 2, 
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                lineHeight: 1.2
                            }}
                        >
                            Embrace English
                        </Typography>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                mb: 3, 
                                fontWeight: 600, 
                                fontSize: { xs: '1.2rem', md: '1.5rem' },
                                opacity: 0.95,
                                lineHeight: 1.4
                            }}
                        >
                            Master Survival English for Real Life Exposure
                        </Typography>
                        <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            spacing={1.5} 
                            justifyContent="center" 
                            sx={{ mb: 4, flexWrap: 'wrap' }}
                        >
                            <Chip 
                                icon={<AutoAwesomeIcon />} 
                                label="AI Companion (English & Hindi)" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} 
                            />
                            <Chip 
                                icon={<MicIcon />} 
                                label="Bol kar seekhen" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} 
                            />
                            <Chip 
                                icon={<WorkspacePremiumIcon />} 
                                label="15+ Years Expert" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} 
                            />
                        </Stack>
                        <Button
                            onClick={handleStartFreeModule}
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                px: 5,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: '50px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                '&:hover': { 
                                    bgcolor: 'grey.100', 
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Start Free Module Now
                        </Button>
                        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                            No credit card required • 30 days to fluency
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Trust Indicators - Compact */}
            <Box sx={{ py: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3} justifyContent="center" alignItems="center">
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>10,000+</Typography>
                                <Typography variant="body2" color="text.secondary">Active Learners</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>50,000+</Typography>
                                <Typography variant="body2" color="text.secondary">Students Transformed</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>16+</Typography>
                                <Typography variant="body2" color="text.secondary">Years Experience</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>100%</Typography>
                                <Typography variant="body2" color="text.secondary">Risk Free</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Proven Results - Full Width 6 Column Grid */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="xl">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Proven Results
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
                            Daily activities that transform your English in just 5 minutes
                        </Typography>
                    </Box>
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                        {provenResults.map((result, index) => (
                            <Grid item xs={6} sm={4} md={2} key={index}>
                                <Card 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        borderRadius: '12px', 
                                        textAlign: 'center', 
                                        height: '100%',
                                        minHeight: '140px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 3,
                                            borderColor: result.color
                                        }
                                    }}
                                >
                                    <Box sx={{ color: result.color, mb: 1.5, fontSize: '2.5rem', display: 'flex', justifyContent: 'center' }}>{result.icon}</Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
                                        {result.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        {result.desc}
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Membership Tiers - Full Width Equal Height Cards */}
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="xl">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Choose Your Learning Path
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start free and unlock more as you progress
                        </Typography>
                    </Box>
                    <Grid container spacing={3} sx={{ width: '100%' }}>
                        <Grid item xs={12} md={6}>
                            <Card 
                                elevation={2} 
                                sx={{ 
                                    p: 3.5, 
                                    borderRadius: '16px', 
                                    height: '100%',
                                    minHeight: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '2px solid', 
                                    borderColor: 'success.main',
                                    bgcolor: 'white'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                                    <CheckCircleIcon sx={{ color: 'success.main', mr: 1.5, fontSize: 28 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                                        Free Content
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5} sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Free membership</Typography>
                                            <Typography variant="body2" color="text.secondary">30 days commitment progression</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Bronze membership</Typography>
                                            <Typography variant="body2" color="text.secondary">60 days commitment progression</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Silver membership</Typography>
                                            <Typography variant="body2" color="text.secondary">Advanced conversations & puzzles</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card 
                                elevation={4} 
                                sx={{ 
                                    p: 3.5, 
                                    borderRadius: '16px', 
                                    height: '100%',
                                    minHeight: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'primary.main', 
                                    color: 'white', 
                                    position: 'relative', 
                                    overflow: 'hidden' 
                                }}
                            >
                                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, position: 'relative', zIndex: 1 }}>
                                    <StarIcon sx={{ mr: 1.5, fontSize: 28 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        Premium Content
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Gold membership</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>₹9,999/year - All premium features</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>Full Course</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>₹20,999 lifetime - Complete mastery</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <CheckCircleIcon sx={{ fontSize: 22, mr: 1.5, mt: 0.2 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>AI Dost</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>₹54,999/year - AI-powered learning</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
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
                                <Grid item xs={12} sm={6} key={index}>
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
                        <Grid item xs={12} md={4}>
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
                        <Grid item xs={12} md={4}>
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
                        <Grid item xs={12} md={4}>
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

            {/* Course Value Breakdown - Compact Table */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Course Value Breakdown
                        </Typography>
                    </Box>
                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Module</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Features</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }} align="right">Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {courseValueBreakdown.map((row, index) => (
                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{row.module}</TableCell>
                                        <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>{row.features}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main', py: 1.5 }}>{row.value}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ bgcolor: 'primary.dark', color: 'white' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 700, py: 1.5 }}>Total Value - One Year Access + Updates</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>₹45,994/-</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: 'success.main', color: 'white' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 700, py: 1.5, fontSize: '1rem' }}>Your Price - All modules @ 78% off</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, py: 1.5, fontSize: '1rem' }}>₹9,999/-</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: 'error.main', color: 'white' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 700, py: 1.5, fontSize: '1.1rem' }}>🔥 Limited Time: New Year Offer</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, py: 1.5, fontSize: '1.1rem' }}>₹3,999/-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', bgcolor: 'success.light', border: '2px solid', borderColor: 'success.main' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                                <Chip icon={<SecurityIcon />} label="7-Day Money Back" color="success" size="small" />
                                <Chip icon={<VerifiedUserIcon />} label="No Questions Asked" color="success" size="small" />
                                <Chip icon={<TrendingUpIcon />} label="Lifetime Updates" color="success" size="small" />
                            </Stack>
                            <Button
                                component={RouterLink}
                                to="/register"
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardIcon />}
                                sx={{ mt: 1, px: 4, py: 1.5, borderRadius: '50px' }}
                            >
                                Start Free → Upgrade Silver Now
                            </Button>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* Testimonials - Full Width 3 Column Grid */}
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="xl">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Real Transformations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Join thousands who transformed their English confidence
                        </Typography>
                    </Box>
                    <Grid container spacing={1.5} sx={{ width: '100%', justifyContent: 'center' }}>
                        {testimonials.map((testimonial, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card 
                                    elevation={1} 
                                    sx={{ 
                                        p: 1.5, 
                                        borderRadius: '12px', 
                                        height: '100%',
                                        width: '100%',
                                        maxWidth: '320px',
                                        mx: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid', 
                                        borderColor: 'divider',
                                        bgcolor: 'white',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4,
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 40, height: 40, fontSize: '1rem' }}>
                                            {testimonial.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.875rem' }}>{testimonial.name}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem' }}>{testimonial.location}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.25 }}>
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <StarIcon key={i} sx={{ fontSize: 14, color: 'warning.main' }} />
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6, color: 'text.secondary', flex: 1, fontSize: '0.8125rem' }}>
                                        "{testimonial.text}"
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Full Course Syllabus - Compact Accordion */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Full Course Syllabus
                        </Typography>
                    </Box>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                        {[
                            { title: "Module 00: Introductions", items: ["Why English?", "Meet your coach", "Who this course is for?", "Our Mission"] },
                            { title: "Module 01 (week 01-03)", items: ["Alphabets and phonetics", "Bara-khadi (in English)", "Counting", "Sequencing / Ranking", "Fractions and multiples"] },
                            { title: "Module 01 (week 04-05)", items: ["Multiple sounds of consonants", "Silent letters", "Sounds of vowels"] },
                            { title: "Module 02 (week 06)", items: ["Genders", "Singular and Plural", "Opposites", "Confusing words"] },
                            { title: "Module 03-05", items: ["Noun, Pronoun, Verb", "Adjective, Adverb", "Conjunctions, Interjections, Prepositions"] },
                            { title: "Module 06-08", items: ["Punctuations", "Articles", "Tenses", "Modals"] },
                            { title: "Bonus", items: ["3-4 letter words", "Time expressions", "Common Vocabulary (50+ categories)", "Download PDF (Barahkhadi)"] }
                        ].map((module, index) => (
                            <Accordion key={index} sx={{ mb: 1, borderRadius: '8px', '&:before': { display: 'none' } }} elevation={0}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{module.title}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Stack spacing={0.5}>
                                        {module.items.map((item, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CheckCircleIcon color="primary" sx={{ fontSize: 16, mr: 1 }} />
                                                <Typography variant="body2">{item}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Paper>
                </Container>
            </Box>

            {/* Meet Your Guide - Compact */}
            <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: 'grey.50' }}>
                <Container maxWidth="md">
                    <Card elevation={4} sx={{ p: 4, borderRadius: '20px', textAlign: 'center', bgcolor: 'primary.main', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                                <PersonIcon sx={{ fontSize: 50 }} />
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                Meet Your Guide
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 3, opacity: 0.95 }}>
                                English Communication Expert
                            </Typography>
                            <Grid container spacing={1.5} justifyContent="center" sx={{ mt: 2 }}>
                                <Grid item xs={6} sm={3}>
                                    <Chip 
                                        icon={<WorkspacePremiumIcon />} 
                                        label="16+ Years MNC" 
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%' }} 
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Chip 
                                        icon={<PeopleIcon />} 
                                        label="50k+ Students" 
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%' }} 
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Chip 
                                        icon={<SchoolIcon />} 
                                        label="Corporate Trainer" 
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%' }} 
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Chip 
                                        icon={<EmojiEventsIcon />} 
                                        label="Mission-Driven" 
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%' }} 
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>
                </Container>
            </Box>

            {/* FAQ - Compact */}
            <Box sx={{ py: { xs: 4, md: 5 } }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Frequently Asked Questions
                        </Typography>
                    </Box>
                    <Stack spacing={1}>
                        {faqs.map((faq, index) => (
                            <Accordion key={index} elevation={0} sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{faq.answer}</Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Final CTA - Compact & Impactful */}
            <Box sx={{ 
                py: { xs: 5, md: 6 }, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                    background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }} />
                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <LocalFireDepartmentIcon sx={{ fontSize: 50, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
                            Ready to speak English like a pro?
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, fontWeight: 500 }}>
                            Your confident life starts with ONE click...
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                            <Button
                                onClick={handleStartFreeModule}
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    px: 5,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: '50px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    '&:hover': { 
                                        bgcolor: 'grey.100', 
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
                                    }
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
                                    borderColor: 'white',
                                    borderWidth: 2,
                                    color: 'white',
                                    px: 5,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: '50px',
                                    '&:hover': { 
                                        borderColor: 'white', 
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 2
                                    }
                                }}
                            >
                                Silver: ₹2,499/year
                            </Button>
                        </Stack>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 2 }}>
                            ⚡ Limited Seats - Offer Ends Soon
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
