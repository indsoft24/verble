// src/pages/static/ContactUsPage.tsx
import React, { useState } from 'react';
import {
    Container, Box, Typography, Grid, Paper, TextField, Button, CircularProgress, Alert, Stack, Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

// A reusable component for contact information items
const ContactInfoItem = ({ icon, title, text, href }: { icon: React.ReactNode, title: string, text: string, href?: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
        <Box sx={{
            mr: 2,
            p: 1.2,
            bgcolor: alpha('#2563EB', 0.12),
            color: 'primary.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h6" sx={{ fontWeight: '600' }}>{title}</Typography>
            <Typography
                variant="body1"
                color="text.secondary"
                component={href ? 'a' : 'p'}
                href={href}
                sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' }, lineHeight: 1.6 }}
            >
                {text}
            </Typography>
        </Box>
    </Box>
);

const ContactUsPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormStatus(null);
        
        const formElement = e.currentTarget;
        const formData = new FormData(formElement);

        // Add the 'formType' for the backend controller to identify this form
        formData.append('formType', 'Contact Us Inquiry');

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const apiEndpoint = `${apiBaseUrl}/forms/submit`;

        try {
            // Send the data to the same backend endpoint
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setFormStatus({ type: 'success', message: result.message || "Thank you for your message! We'll get back to you shortly." });
                formElement.reset(); // Reset form fields on success
            } else {
                setFormStatus({ type: 'error', message: result.message || "Failed to send message. Please try again later." });
            }

        } catch (error: any) {
            setFormStatus({ type: 'error', message: "A network error occurred. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ bgcolor: '#F7FAFF', py: { xs: 4, md: 7 } }}>
            <Container maxWidth="lg">
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Get in Touch
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '650px', mx: 'auto', lineHeight: 1.55 }}>
                        We're here to help and answer any question you might have. We look forward to hearing from you.
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 2, rowGap: 1 }}>
                        <Chip icon={<ChatBubbleOutlineIcon />} label="Fast support" size="small" />
                        <Chip icon={<AccessTimeIcon />} label="Response within 24 hours" size="small" />
                    </Stack>
                </Box>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }} >
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: 3,
                                border: '1px solid #E2E8F0',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
                            }}
                        >
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Contact Information
                            </Typography>
                            <ContactInfoItem
                                icon={<LocationOnIcon />}
                                title="Our Office"
                                text="New Delhi, Delhi, India"
                            />
                             <ContactInfoItem
                                icon={<EmailIcon />}
                                title="Email Us"
                                text="support@verble.co.in"
                                href="mailto:support@verble.co.in"
                            />
                            <ContactInfoItem
                                icon={<PhoneIcon />}
                                title="Call Us"
                                text="+91 (123) 456-7890"
                                href="tel:+911234567890"
                            />
                            <ContactInfoItem
                                icon={<AccessTimeIcon />}
                                title="Support Hours"
                                text="Mon - Sat, 9:00 AM to 7:00 PM"
                            />
                        </Paper>
                        
                        {/* --- Embedded Map --- */}
                        <Box
                            sx={{
                                mt: 2,
                                borderRadius: '12px',
                                overflow: 'hidden',
                                height: { xs: 230, md: 270 },
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
                            }}
                        >
                           <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d448196.526320295!2d76.81307299667618!3d28.64368463321354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1718526563177!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </Box>
                    </Grid>

                    {/* --- Right Column: Contact Form --- */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: '14px',
                                border: '1px solid #E2E8F0',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0 14px 30px rgba(15,23,42,0.07)',
                            }}
                        >
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Send us a Message
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                Fill in the form and our team will connect with you soon.
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }} >
                                        <TextField name="name" label="Your Name" required fullWidth disabled={isSubmitting} size="small" />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField name="email" label="Your Email" type="email" required fullWidth disabled={isSubmitting} size="small" />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField name="subject" label="Subject" required fullWidth disabled={isSubmitting} size="small" />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField name="message" label="Your Message" required multiline rows={6} fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    {formStatus && (
                                        <Grid size={{ xs: 12 }}>
                                            <Alert severity={formStatus.type} sx={{ mt: 1 }}>{formStatus.message}</Alert>
                                        </Grid>
                                    )}
                                    <Grid size={{ xs: 12 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            fullWidth
                                            disabled={isSubmitting}
                                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                            sx={{
                                                py: 1.4,
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                boxShadow: '0 8px 20px rgba(37,99,235,0.28)',
                                            }}
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Message'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ContactUsPage;
