import React from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { FULL_COURSE_SYLLABUS } from '../../data/fullCourseSyllabus';
import { useStartFreeNavigation } from '../../hooks/useStartFreeNavigation';

const sectionTitleSx = {
    fontWeight: 800,
    mb: { xs: 1, md: 2 },
    color: '#0f172a',
    fontSize: { xs: '1.375rem', sm: '1.625rem', md: '2.25rem' },
    lineHeight: { xs: 1.3, md: 1.2 },
    px: { xs: 0.5, sm: 0 },
} as const;

const cardPadding = {
    xs: '20px 18px',
    sm: '24px 22px',
    md: '28px 24px',
} as const;

const FullCourseSyllabusSection: React.FC = () => {
    const handleStartFreeModule = useStartFreeNavigation();
    const visibleSyllabusModules = FULL_COURSE_SYLLABUS.filter((module) => module.id !== 'bonus');

    return (
    <Box sx={{ py: { xs: 3, sm: 5, md: 10 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 3, md: 6 } }}>
                <Chip
                    icon={<MenuBookIcon sx={{ fontSize: { xs: 16, md: 18 } }} />}
                    label="Structured curriculum"
                    sx={{
                        mb: { xs: 1.5, md: 2 },
                        fontWeight: 700,
                        bgcolor: 'rgba(99,102,241,0.1)',
                        color: '#4f46e5',
                        height: 'auto',
                        '& .MuiChip-label': { px: 1.25, py: 0.5, fontSize: { xs: '0.72rem', md: '0.8125rem' } },
                    }}
                />
                <Typography variant="h3" sx={sectionTitleSx}>
                    Full Course Syllabus
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#64748b',
                        fontWeight: 400,
                        maxWidth: 640,
                        mx: 'auto',
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                        lineHeight: 1.55,
                        px: { xs: 0.5, sm: 0 },
                    }}
                >
                    A two-track roadmap from first sounds to fluent conversation — every module with clear outcomes.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: { xs: '24px', sm: '26px', md: '28px' },
                    width: '100%',
                }}
            >
                {visibleSyllabusModules.map((module) => (
                    <Paper
                        key={module.id}
                        elevation={0}
                        sx={{
                            height: '100%',
                            p: cardPadding,
                            borderRadius: { xs: '12px', md: '16px' },
                            border: '1px solid #e2e8f0',
                            bgcolor: '#fff',
                            boxSizing: 'border-box',
                            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                            '@media (hover: hover)': {
                                '&:hover': {
                                    boxShadow: '0 12px 40px -12px rgba(15,23,42,0.15)',
                                    transform: 'translateY(-2px)',
                                },
                            },
                        }}
                    >
                        <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1, mb: 2 }}>
                            <Chip
                                label={module.duration}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                    height: 'auto',
                                    '& .MuiChip-label': {
                                        px: 1.25,
                                        py: 0.5,
                                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                                        whiteSpace: 'normal',
                                        lineHeight: 1.3,
                                    },
                                }}
                            />
                            <Chip
                                label={module.phase}
                                size="small"
                                sx={{
                                    fontWeight: 600,
                                    height: 'auto',
                                    '& .MuiChip-label': {
                                        px: 1.25,
                                        py: 0.5,
                                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                                        whiteSpace: 'normal',
                                        lineHeight: 1.3,
                                    },
                                }}
                            />
                        </Stack>

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                color: '#0f172a',
                                mb: 1,
                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                                lineHeight: 1.35,
                            }}
                        >
                            {module.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748b',
                                mb: 2,
                                lineHeight: 1.65,
                                fontSize: { xs: '0.8rem', sm: '0.825rem', md: '0.875rem' },
                            }}
                        >
                            {module.summary}
                        </Typography>

                        <Stack
                            component="ul"
                            spacing={0}
                            sx={{
                                m: 0,
                                p: 0,
                                listStyle: 'none',
                                borderTop: '1px solid #f1f5f9',
                            }}
                        >
                            {module.topics.map((topic, topicIndex) => (
                                <Box
                                    key={topic.title}
                                    component="li"
                                    sx={{
                                        display: 'flex',
                                        gap: 1.25,
                                        alignItems: 'flex-start',
                                        py: 1.25,
                                        borderBottom:
                                            topicIndex < module.topics.length - 1
                                                ? '1px solid #f1f5f9'
                                                : 'none',
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            color: '#22c55e',
                                            fontSize: { xs: 18, md: 20 },
                                            mt: 0.2,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                fontSize: { xs: '0.8rem', sm: '0.825rem', md: '0.875rem' },
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {topic.title}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#64748b',
                                                lineHeight: 1.5,
                                                display: 'block',
                                                mt: 0.35,
                                                fontSize: { xs: '0.7rem', sm: '0.72rem', md: '0.75rem' },
                                            }}
                                        >
                                            {topic.detail}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                ))}
            </Box>

            <Box
                sx={{
                    mt: { xs: 3, md: 5 },
                    mx: 'auto',
                    textAlign: 'center',
                    p: { xs: 2, sm: 2.5, md: 3 },
                    borderRadius: { xs: '14px', md: '18px' },
                    border: '1px solid #dbeafe',
                    bgcolor: '#eff6ff',
                    maxWidth: 860,
                }}
            >
                <Typography
                    variant="body1"
                    sx={{
                        color: '#1e3a8a',
                        fontWeight: 600,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
                        mb: 2,
                    }}
                >
                    Start learning today for FREE and go for full course at price whenever you plan to boost your learning.
                </Typography>
                <Button
                    onClick={handleStartFreeModule}
                    variant="contained"
                    size="large"
                    sx={{
                        px: { xs: 3, sm: 4 },
                        py: 1.35,
                        borderRadius: '999px',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        bgcolor: '#4f46e5',
                        boxShadow: '0 12px 30px -10px rgba(79,70,229,0.6)',
                        '&:hover': { bgcolor: '#4338ca' },
                    }}
                >
                    Start learning
                </Button>
            </Box>
        </Container>
    </Box>
    );
};

export default FullCourseSyllabusSection;
