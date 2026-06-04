// src/pages/static/CareersPage.tsx
import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button, List, ListItem, ListItemIcon, ListItemText, Link as MuiLink, Chip } from '@mui/material';

// --- Icon Imports for a Professional Look ---
import WorkIcon from '@mui/icons-material/Work';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PublicIcon from '@mui/icons-material/Public';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DevicesIcon from '@mui/icons-material/Devices';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import CodeIcon from '@mui/icons-material/Code';
import CreateIcon from '@mui/icons-material/Create';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { SITE_CONTACT, siteContactMailto, siteContactPhoneDisplay, siteContactTel } from '../../config/siteContact';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';

// Reusable component for "Why Work With Us" feature points
const WhyWorkItem = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{title}</Typography>
            <Typography color="text.secondary">{text}</Typography>
        </Box>
    </Grid>
);

const CareersPage: React.FC = () => {
    const whyWorkPoints = [
        { icon: <RocketLaunchIcon fontSize="large" />, title: "Purpose-Driven Work", text: "Be part of a team that’s solving real-world problems in education. Your work directly impacts millions of students." },
        { icon: <PublicIcon fontSize="large" />, title: "Nationwide Impact", text: "Contribute to a platform that’s reshaping India’s education landscape and helping reduce inequality." },
        { icon: <GroupWorkIcon fontSize="large" />, title: "Collaborate with the Best", text: "Work alongside India’s top educators, tech experts, and creative thinkers in a culture that thrives on innovation." },
        { icon: <TrendingUpIcon fontSize="large" />, title: "Career Growth", text: "At Verble, you grow with the organization. Get access to continuous learning opportunities and leadership programs." },
        { icon: <DevicesIcon fontSize="large" />, title: "Flexible & Hybrid Work", text: "Enjoy a healthy work-life balance with remote and hybrid options. We value productivity, not just hours clocked." },
        { icon: <PriceCheckIcon fontSize="large" />, title: "Competitive Pay, Social Purpose", text: "Receive industry-competitive compensation while knowing your efforts contribute to a larger societal good." }
    ];
    
    const whoCanJoinItems = [
        { icon: <SchoolIcon />, title: "Educators & Subject Matter Experts", text: "Experienced teachers, exam mentors, or academic creators." },
        { icon: <CodeIcon />, title: "Tech Professionals", text: "Developers, UI/UX designers, data analysts, and AI/ML engineers." },
        { icon: <CreateIcon />, title: "Content Creators & Designers", text: "Curriculum designers, academic writers, and e-learning specialists." },
        { icon: <SupportAgentIcon />, title: "Sales, Marketing & Operations", text: "Professionals in Ed-Tech sales, digital marketing, and student support." },
        { icon: <BadgeIcon />, title: "Interns & Fresh Graduates", text: "Young, curious minds looking for meaningful early-career experience." }
    ];
    
    const openPositions = [
        "Teaching & Academic Support",
        "Product Development",
        "Content & Curriculum",
        "Tech & Engineering",
        "Marketing & Communications",
        "Sales & Customer Success",
        "Admin & HR"
    ];

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            {/* --- 1. HERO SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 7 }, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Container maxWidth="md">
                    <WorkIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        Careers
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: '600', mt: 1 }}>
                        Join Verble – Build the Future of Education with Us
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: '800px', mx: 'auto' }}>
                        At Verble, we’re not just building a company — we’re building a movement to transform the way India learns. We are on a mission to make high-quality education accessible and affordable for every learner, and we need visionary minds to help us make it happen.
                    </Typography>
                </Container>
            </Box>

            {/* --- 2. WHY WORK WITH US SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 7 } }}>
                <Container maxWidth="lg">
                     <Typography variant="h4" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
                        🌟 Why Work with Verble?
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                        {whyWorkPoints.map((point) => (
                            <WhyWorkItem key={point.title} icon={point.icon} title={point.title} text={point.text} />
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* --- 3. WHO CAN JOIN SECTION --- */}
            <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'grey.100' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>👩‍🏫 Who Can Join Us?</Typography>
                            <Typography color="text.secondary" sx={{mb: 2}}>
                                We’re hiring across various roles — both academic and non-academic. If you are one of the following, we'd love to hear from you:
                            </Typography>
                            <List>
                                {whoCanJoinItems.map(item => (
                                    <ListItem key={item.title} disableGutters>
                                        <ListItemIcon sx={{minWidth: 40, color: 'primary.main'}}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.title} secondary={item.text} primaryTypographyProps={{fontWeight: '600'}} />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                         <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                             <Paper elevation={3} sx={{p: 3, borderRadius: '12px'}}>
                                <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>🚀 Current Openings</Typography>
                                <Typography color="text.secondary" sx={{mb: 2}}>
                                    We regularly update our open positions in the following categories:
                                </Typography>
                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                                    {openPositions.map(pos => (
                                        <Chip key={pos} label={pos} variant="outlined" />
                                    ))}
                                </Box>
                             </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

             {/* --- 4. CALL TO ACTION & MISSION --- */}
             <Box sx={{ py: { xs: 5, md: 7 }, textAlign: 'center' }}>
                 <Container maxWidth="md">
                    <Typography variant="h4" sx={{fontWeight: 600}}>
                        🤝 Join Our Mission
                    </Typography>
                    <Typography color="text.secondary" sx={{my:2, fontSize: '1.1rem'}}>
                        When you join Verble, you're not just building a career — you’re shaping lives, driving change, and helping build a better India through education. If you believe in the power of education, the strength of technology, and the purpose of nation-building, Verble is the place for you.
                    </Typography>
                     <Box>
                        <Typography variant="h6" sx={{fontWeight: 'bold'}}>📩 Apply Now</Typography>
                        <Button component={MuiLink} href={siteContactMailto} size="large" sx={{textTransform: 'none', fontSize: '1.1rem'}}>
                            Send your resume to {SITE_CONTACT.email}
                        </Button>
                         <Typography variant="body2" color="text.secondary">
                            For queries, contact our HR team at{' '}
                            <MuiLink href={siteContactTel} underline="hover">{siteContactPhoneDisplay}</MuiLink>
                         </Typography>
                     </Box>
                </Container>
            </Box>
        </Box>
    );
};



export default CareersPage;

