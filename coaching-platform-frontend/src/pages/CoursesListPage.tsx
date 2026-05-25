import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Stack,
    Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {
    getAllLawCoursesForUser,
    getPublishedCourseWithModulesForUser,
    type CourseListItemUser,
    type ModuleListItemUser
} from '../services/courseUserService';
import { getActiveSubscriptionPlans, type SubscriptionPlanPublic } from '../services/subscriptionPlanService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getSplashImageUrl } from '../utils/imageUtils';
import { extractId } from '../utils/idUtils';

/** Pexels stock images — same CDN pattern as `LandingPage.tsx` */
const COURSES_STOCK_IMAGES = {
    hero: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2',
    whyChoose: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
} as const;

type SectionWrapperProps = {
    children: React.ReactNode;
    id?: string;
    sx?: Record<string, unknown>;
};

const SectionWrapper: React.FC<SectionWrapperProps> = ({ children, id, sx }) => (
    <Box component="section" id={id} sx={{ py: { xs: 6, md: 8 }, ...sx }}>
        {children}
    </Box>
);

type CourseCardProps = {
    course: CourseListItemUser;
    isAuthenticated: boolean;
    handleCardClick: (event: React.MouseEvent, courseId: string) => void;
};

const CourseCard: React.FC<CourseCardProps> = ({ course, isAuthenticated, handleCardClick }) => {
    const courseId = extractId(course) || course._id;
    const [imgLoaded, setImgLoaded] = useState(false);
    if (!courseId) return null;

    const courseImageUrl =
        course.image && course.image.trim() !== '' ? getImageUrl(course.image, 'course') : getSplashImageUrl();
    const showFadeIn = courseImageUrl !== getSplashImageUrl();

    return (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card
                sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: '0 10px 24px rgba(15,23,42,0.1)',
                        transform: 'translateY(-4px)',
                    },
                }}
            >
                <CardActionArea
                    component={RouterLink}
                    to={`/courses/${courseId}`}
                    onClick={(event) => handleCardClick(event, courseId)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                    <Box sx={{ width: '100%', height: { xs: 192, md: 184 }, overflow: 'hidden', bgcolor: '#F3F4F6', position: 'relative' }}>
                        <Box
                            component="img"
                            src={courseImageUrl}
                            alt={course.title || 'Course image'}
                            loading="eager"
                            onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                                const target = event.target as HTMLImageElement;
                                const splashUrl = getSplashImageUrl();
                                if (!target.src.includes('verble-logo') && !target.src.includes('splash') && target.src !== splashUrl) {
                                    target.src = splashUrl;
                                    setImgLoaded(true);
                                }
                            }}
                            onLoad={() => setImgLoaded(true)}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: showFadeIn ? (imgLoaded ? 1 : 0) : 1,
                                transition: 'opacity 0.35s ease-in-out',
                            }}
                        />
                    </Box>
                    <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                                fontWeight: 700,
                                lineHeight: 1.35,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '2.7em',
                            }}
                        >
                            {course.title}
                        </Typography>
                        <Typography
                            sx={{
                                color: '#4B5563',
                                lineHeight: 1.65,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '4.8em',
                            }}
                        >
                            {course.description
                                ? course.description.replace(/<[^>]+>/g, '').trim() || 'Explore this course to unlock your potential.'
                                : 'Explore this course to unlock your potential.'}
                        </Typography>
                        {!isAuthenticated && (
                            <Stack direction="row" justifyContent="flex-end">
                                <LockIcon fontSize="small" color="action" />
                            </Stack>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
};

const CoursesListPage: React.FC = () => {
    const [courses, setCourses] = useState<CourseListItemUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [faqExpanded, setFaqExpanded] = useState<string | false>('panel1');
    const [syllabusExpanded, setSyllabusExpanded] = useState<string | false>('syllabus-0');
    const [courseModules, setCourseModules] = useState<ModuleListItemUser[]>([]);
    const [coursePlans, setCoursePlans] = useState<SubscriptionPlanPublic[]>([]);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedCourses = await getAllLawCoursesForUser();
            setCourses(fetchedCourses || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load courses.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    useEffect(() => {
        const fetchCatalogDetails = async () => {
            try {
                if (!courses.length || !courses[0]?._id) return;
                const courseId = courses[0]._id;
                const [courseDetail, plans] = await Promise.all([
                    getPublishedCourseWithModulesForUser(courseId),
                    getActiveSubscriptionPlans({ courseId }),
                ]);
                setCourseModules(courseDetail.modules || []);
                setCoursePlans(plans || []);
            } catch (_error) {
                setCourseModules([]);
                setCoursePlans([]);
            }
        };
        fetchCatalogDetails();
    }, [courses]);

    const handleCardClick = (event: React.MouseEvent, courseId: string) => {
        if (!isAuthenticated) {
            event.preventDefault();
            alert('Please log in or register to view course details.');
            navigate('/login', { state: { from: `/courses/${courseId}` } });
        }
    };

    const scrollToCourses = () => {
        const el = document.getElementById('courses-grid');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    }
    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth={false} disableGutters>
            <Box
                sx={{
                    maxWidth: '1200px',
                    mx: 'auto',
                    px: { xs: 3, md: 6 },
                    py: { xs: 6, md: 6 },
                    pb: { xs: 8, md: 10 },
                }}
            >
                <SectionWrapper sx={{ pb: { xs: 2, md: 3 }, pt: 0 }}>
                    <Typography
                        component="h1"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: { xs: '2.25rem', md: '3rem' },
                            lineHeight: 1.15,
                            mb: { xs: 3, md: 4 },
                        }}
                    >
                        Our Courses
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            border: '1px solid rgba(226,232,240,0.95)',
                            background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 45%, #e0f2fe 100%)',
                            boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
                            overflow: 'hidden',
                            '@keyframes coursesHeroFadeIn': {
                                from: { opacity: 0, transform: 'translateY(12px)' },
                                to: { opacity: 1, transform: 'translateY(0)' },
                            },
                            animation: 'coursesHeroFadeIn 0.55s ease-out forwards',
                        }}
                    >
                        <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
                                <Typography
                                    sx={{
                                        color: '#1D4ED8',
                                        fontWeight: 700,
                                        letterSpacing: '0.1em',
                                        fontSize: '0.75rem',
                                        mb: 1.5,
                                    }}
                                >
                                    LEARN BETTER, SPEAK BETTER
                                </Typography>
                                <Typography
                                    component="h2"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '2.25rem', md: '3rem' },
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.02em',
                                        color: '#0F172A',
                                        mb: 2,
                                    }}
                                >
                                    Online English Courses to Improve Speaking, Grammar, and Confidence
                                </Typography>
                                <Typography sx={{ color: '#4B5563', lineHeight: 1.7, maxWidth: 520, mb: 2 }}>
                                    Explore Verble&apos;s structured online English speaking courses designed for students, job seekers,
                                    professionals, and anyone who wants fluent communication skills. Each course includes practical lessons,
                                    real conversation practice, and guided learning modules to help you speak English naturally.
                                </Typography>
                                <Typography sx={{ color: '#6B7280', lineHeight: 1.7, maxWidth: 520, mb: 3 }}>
                                    Start with beginner-friendly fundamentals or level up with advanced spoken English training for interviews,
                                    workplace meetings, presentations, and daily life.
                                </Typography>

                                <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ gap: 1, mb: 3 }}>
                                    {['Beginner to Advanced', 'Speaking + Grammar Focus', 'Flexible Online Learning'].map((item) => (
                                        <Box
                                            key={item}
                                            sx={{
                                                px: 1.75,
                                                py: 0.75,
                                                borderRadius: '999px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 600,
                                                color: '#1E40AF',
                                                bgcolor: 'rgba(59,130,246,0.12)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                            }}
                                        >
                                            {item}
                                        </Box>
                                    ))}
                                </Stack>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                                    <Button
                                        component={RouterLink}
                                        to="/register"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            px: 3,
                                            py: 1.25,
                                            borderRadius: 3,
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            bgcolor: '#2563EB',
                                            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                                            '&:hover': {
                                                bgcolor: '#1D4ED8',
                                                boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                                            },
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        Get started
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={scrollToCourses}
                                        sx={{
                                            px: 3,
                                            py: 1.25,
                                            borderRadius: 3,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderColor: '#CBD5E1',
                                            color: '#334155',
                                            '&:hover': {
                                                borderColor: '#94A3B8',
                                                bgcolor: 'rgba(148,163,184,0.08)',
                                            },
                                        }}
                                    >
                                        View courses
                                    </Button>
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
                                <Box
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        boxShadow: '0 12px 40px rgba(15,23,42,0.12)',
                                        border: '1px solid rgba(226,232,240,0.9)',
                                        lineHeight: 0,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={COURSES_STOCK_IMAGES.hero}
                                        alt="Students learning English online"
                                        loading="lazy"
                                        sx={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            aspectRatio: '600 / 400',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </SectionWrapper>

                {courses.length === 0 && !isLoading && (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, mt: 2 }}>
                        <Typography>No courses are available right now.</Typography>
                    </Paper>
                )}

                <SectionWrapper id="courses-grid" sx={{ pt: { xs: 2, md: 4 } }}>
                    <Grid container spacing={3}>
                        {courses.map((course) => (
                            <CourseCard
                                key={extractId(course) || course._id}
                                course={course}
                                isAuthenticated={isAuthenticated}
                                handleCardClick={handleCardClick}
                            />
                        ))}
                    </Grid>
                </SectionWrapper>

                {courseModules.length > 0 && (
                    <SectionWrapper sx={{ pt: { xs: 2, md: 4 } }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, md: 4 },
                                borderRadius: 4,
                                border: '1px solid #E5E7EB',
                                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                            }}
                        >
                            <Typography component="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, fontWeight: 800, mb: 1.5, color: '#0F172A' }}>
                                Full Course Syllabus
                            </Typography>
                            <Typography sx={{ color: '#475569', mb: 3, lineHeight: 1.7 }}>
                                Structured module roadmap sourced from production course data.
                            </Typography>
                            <Grid container spacing={2}>
                                {courseModules
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((module, index) => (
                                        <Grid key={module._id} size={{ xs: 12, md: 6 }}>
                                            <Accordion
                                                expanded={syllabusExpanded === `syllabus-${index}`}
                                                onChange={(_, expanded) => setSyllabusExpanded(expanded ? `syllabus-${index}` : false)}
                                                disableGutters
                                                elevation={0}
                                                sx={{
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '12px !important',
                                                    overflow: 'hidden',
                                                    '&:before': { display: 'none' },
                                                }}
                                            >
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pr: 1, flexWrap: 'wrap', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{module.title}</Typography>
                                                        {module.timeline && (
                                                            <Box
                                                                sx={{
                                                                    px: 1.2,
                                                                    py: 0.3,
                                                                    borderRadius: '999px',
                                                                    bgcolor: 'rgba(99,102,241,0.1)',
                                                                    color: '#4F46E5',
                                                                    border: '1px solid rgba(99,102,241,0.25)',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {module.timeline}
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ pt: 0 }}>
                                                    <Stack component="ul" spacing={0.7} sx={{ m: 0, pl: 2.4 }}>
                                                        {(module.chapters && module.chapters.length ? module.chapters : [module.description || 'Module details available in course']).map((chapter) => (
                                                            <Typography key={chapter} component="li" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                                                {chapter}
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                </AccordionDetails>
                                            </Accordion>
                                        </Grid>
                                    ))}
                            </Grid>
                        </Paper>
                    </SectionWrapper>
                )}

                {coursePlans.length > 0 && (
                    <SectionWrapper sx={{ pt: { xs: 2, md: 4 } }}>
                        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid #E5E7EB', bgcolor: '#FFFFFF' }}>
                            <Typography component="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' }, fontWeight: 800, mb: 2 }}>
                                Course Value Breakdown
                            </Typography>
                            <Grid container spacing={2}>
                                {coursePlans
                                    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                                    .map((plan) => (
                                        <Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                                                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>
                                                <Typography sx={{ color: '#475569', fontSize: '0.9rem', mb: 1 }}>{plan.description}</Typography>
                                                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                    ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                                                </Typography>
                                                {typeof plan.marketValue === 'number' && (
                                                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                                                        Market value: ₹{Number(plan.marketValue).toLocaleString('en-IN')}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Grid>
                                    ))}
                            </Grid>
                        </Paper>
                    </SectionWrapper>
                )}

                <SectionWrapper sx={{ pt: { xs: 4, md: 6 }, mt: { xs: 2, md: 4 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: 4,
                            border: '1px solid #E5E7EB',
                            bgcolor: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                            transition: 'box-shadow 0.2s ease',
                            '&:hover': {
                                boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                            },
                        }}
                    >
                        <Typography
                            component="h2"
                            sx={{
                                fontSize: { xs: '1.5rem', md: '1.875rem' },
                                fontWeight: 700,
                                mb: { xs: 3, md: 4 },
                                color: '#0F172A',
                            }}
                        >
                            Why Choose Verble English Learning Courses
                        </Typography>

                        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        height: '100%',
                                        p: { xs: 3, md: 4 },
                                        borderRadius: 4,
                                        borderColor: '#E5E7EB',
                                        bgcolor: '#FAFAFA',
                                        boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                                        },
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(37,99,235,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#2563EB',
                                            }}
                                        >
                                            <SchoolOutlinedIcon sx={{ fontSize: 28 }} />
                                        </Box>
                                        <Typography component="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                                            Career-focused training
                                        </Typography>
                                    </Stack>

                                    <Box
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            mb: 2.5,
                                            border: '1px solid #E5E7EB',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={COURSES_STOCK_IMAGES.whyChoose}
                                            alt="Online learning"
                                            loading="lazy"
                                            sx={{
                                                width: '100%',
                                                height: 'auto',
                                                display: 'block',
                                                aspectRatio: '400 / 300',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </Box>

                                    <Stack component="ul" spacing={1.5} sx={{ m: 0, pl: 2.5, color: '#4B5563', lineHeight: 1.65 }}>
                                        <Typography component="li" sx={{ display: 'list-item' }}>
                                            Real-world outcomes: fluency, vocabulary, grammar, and confidence.
                                        </Typography>
                                        <Typography component="li" sx={{ display: 'list-item' }}>
                                            Step-by-step lessons you can follow at your own pace.
                                        </Typography>
                                        <Typography component="li" sx={{ display: 'list-item' }}>
                                            Practice for interviews, exams, workplace communication, and daily life.
                                        </Typography>
                                        <Typography component="li" sx={{ display: 'list-item' }}>
                                            Practical examples and guided practice in every module.
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography component="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2, color: '#0F172A' }}>
                                    Frequently Asked Questions
                                </Typography>
                                <Stack spacing={1}>
                                    {[
                                        {
                                            id: 'panel1',
                                            q: 'Who are these courses for?',
                                            a: 'These English communication courses are ideal for beginners, intermediate learners, college students, working professionals, and competitive exam aspirants.',
                                        },
                                        {
                                            id: 'panel2',
                                            q: 'Can I learn spoken English online at my own pace?',
                                            a: 'Yes. You can access course content online and learn anytime based on your schedule, making it easy to balance study, work, and daily commitments.',
                                        },
                                        {
                                            id: 'panel3',
                                            q: 'What skills will I improve?',
                                            a: 'You will improve English speaking confidence, grammar usage, vocabulary range, listening comprehension, and presentation communication skills.',
                                        },
                                    ].map((item) => (
                                        <Accordion
                                            key={item.id}
                                            expanded={faqExpanded === item.id}
                                            onChange={(_, expanded) => setFaqExpanded(expanded ? item.id : false)}
                                            disableGutters
                                            elevation={0}
                                            sx={{
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '12px !important',
                                                overflow: 'hidden',
                                                '&:before': { display: 'none' },
                                                mb: 0,
                                                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                                                '&:hover': {
                                                    borderColor: '#CBD5E1',
                                                    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                                                },
                                            }}
                                        >
                                            <AccordionSummary
                                                expandIcon={<ExpandMoreIcon sx={{ color: '#64748B' }} />}
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    '& .MuiAccordionSummary-content': { my: 1 },
                                                }}
                                            >
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>
                                                    {item.q}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                                                <Typography sx={{ color: '#4B5563', lineHeight: 1.65, fontSize: '0.9375rem' }}>
                                                    {item.a}
                                                </Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                </SectionWrapper>
            </Box>
        </Container>
    );
};

export default CoursesListPage;
