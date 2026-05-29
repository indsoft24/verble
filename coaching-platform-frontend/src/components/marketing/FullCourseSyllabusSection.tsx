import React from 'react';
import {
    Box,
    Chip,
    Container,
    Grid,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { FULL_COURSE_SYLLABUS } from '../../data/fullCourseSyllabus';

const FullCourseSyllabusSection: React.FC = () => (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
                <Chip
                    icon={<MenuBookIcon />}
                    label="Structured curriculum"
                    sx={{ mb: 2, fontWeight: 700, bgcolor: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}
                />
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>
                    Full Course Syllabus
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: 640, mx: 'auto' }}>
                    A two-track roadmap from first sounds to fluent conversation — every module with clear outcomes.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {FULL_COURSE_SYLLABUS.map((module) => (
                    <Grid key={module.id} size={{ xs: 12, md: 6 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                height: '100%',
                                p: { xs: 2.5, md: 3 },
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#fff',
                                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                '&:hover': {
                                    boxShadow: '0 12px 40px -12px rgba(15,23,42,0.15)',
                                    transform: 'translateY(-2px)',
                                },
                            }}
                        >
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                                <Chip label={module.duration} size="small" color="primary" variant="outlined" />
                                <Chip label={module.phase} size="small" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                                {module.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 2, lineHeight: 1.7 }}>
                                {module.summary}
                            </Typography>
                            <Stack spacing={1.25} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                                {module.topics.map((topic) => (
                                    <Box
                                        key={topic.title}
                                        component="li"
                                        sx={{
                                            display: 'flex',
                                            gap: 1.25,
                                            alignItems: 'flex-start',
                                            py: 0.75,
                                            borderTop: '1px solid #f1f5f9',
                                            '&:first-of-type': { borderTop: 'none', pt: 0 },
                                        }}
                                    >
                                        <CheckCircleIcon
                                            sx={{ color: '#22c55e', fontSize: 20, mt: 0.15, flexShrink: 0 }}
                                        />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                {topic.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                                                {topic.detail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    </Box>
);

export default FullCourseSyllabusSection;
