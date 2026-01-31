// src/pages/static/PartnershipPage.tsx
import React, {useState} from 'react';
import { Container, Box, Typography, Grid, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import SendIcon from '@mui/icons-material/Send';

// Reusable component for benefit cards
const BenefitCard = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'transparent' }}>
        <Box sx={{
            mb: 2,
            display: 'inline-block',
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '50%',
        }}>
            {icon}
        </Box>
        <Typography variant="h6" component="h3" sx={{ fontWeight: '600', mb: 1 }}>{title}</Typography>
        <Typography color="text.secondary">{text}</Typography>
    </Paper>
);

const PartnershipPage: React.FC = () => {
    // A simple placeholder for form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormStatus(null);
        try {
            // Simulate an API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setFormStatus({ type: 'success', message: "Your partnership inquiry has been sent. Our team will contact you shortly!" });
        } catch (error) {
            setFormStatus({ type: 'error', message: "Something went wrong. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            {/* --- HERO SECTION --- */}
            <Box sx={{
                py: { xs: 6, md: 10 },
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                textAlign: 'center'
            }}>
                <Container maxWidth="md">
                    <HandshakeIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        Partner With Us
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 2, opacity: 0.9 }}>
                        Join forces with Verble to revolutionize online education and unlock new opportunities for growth.
                    </Typography>
                </Container>
            </Box>

            {/* --- BENEFITS SECTION --- */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h4" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 6 }}>
                        Why Partner With Verble?
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                            <BenefitCard
                                icon={<RocketLaunchIcon />}
                                title="Expand Your Reach"
                                text="Access our growing community of dedicated learners and educators from around the globe."
                            />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                            <BenefitCard
                                icon={<GroupIcon />}
                                title="Collaborate on Content"
                                text="Work with our expert team to co-create high-quality courses, workshops, and learning materials."
                            />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                            <BenefitCard
                                icon={<InsightsIcon />}
                                title="Leverage Our Platform"
                                text="Utilize our secure, high-performance streaming technology and robust platform features."
                            />
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                            <BenefitCard
                                icon={<HandshakeIcon />}
                                title="Build a Stronger Brand"
                                text="Align your brand with a trusted name in online education and enhance your market presence."
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* --- CONTACT FORM SECTION --- */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'grey.100' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                        Become a Partner
                    </Typography>
                    <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
                        Have an idea for a partnership? Fill out the form below, and let's start a conversation.
                    </Typography>

                    <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '12px' }}>
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Grid container spacing={2}>
                                <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                    <TextField name="companyName" label="Your Company Name" required fullWidth disabled={isSubmitting} />
                                </Grid>
                                <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                    <TextField name="contactName" label="Your Name" required fullWidth disabled={isSubmitting} />
                                </Grid>
                                <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                    <TextField name="email" label="Work Email" type="email" required fullWidth disabled={isSubmitting} />
                                </Grid>
                                <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                                    <TextField name="phone" label="Phone Number" fullWidth disabled={isSubmitting} />
                                </Grid>
                                <Grid sx={{ width: '100%' }}>
                                    <TextField name="proposal" label="Partnership Proposal / Idea" required multiline rows={6} fullWidth disabled={isSubmitting} />
                                </Grid>
                                {formStatus && (
                                    <Grid sx={{ width: '100%' }}>
                                        <Alert severity={formStatus.type}>{formStatus.message}</Alert>
                                    </Grid>
                                )}
                                <Grid sx={{ width: '100%' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                        sx={{ py: 1.5, mt: 1 }}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default PartnershipPage;
