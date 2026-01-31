// src/pages/static/ContactUsPage.tsx
import React, { useState } from 'react';
import {
    Container, Box, Typography, Grid, Paper, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';

// A reusable component for contact information items
const ContactInfoItem = ({ icon, title, text, href }: { icon: React.ReactNode, title: string, text: string, href?: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{
            mr: 2,
            p: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '50%',
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
                sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
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
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Get in Touch
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1, maxWidth: '600px', mx: 'auto' }}>
                        We're here to help and answer any question you might have. We look forward to hearing from you.
                    </Typography>
                </Box>

                <Grid container spacing={5}>
                    <Grid sx={{width: {xs: '100%', sm: '50%', md: '32%'}}} >
                        <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
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
                        </Paper>
                        
                        {/* --- Embedded Map --- */}
                        <Box sx={{ mt: 4, borderRadius: '12px', overflow: 'hidden', height: { xs: 250, md: 300 } }}>
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
                    <Grid sx={{width: {xs: '100%', md: '64%'}}}>
                        <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '12px' }}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Send us a Message
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2}>
                                    <Grid sx={{width: {xs: '100%'}}} >
                                        <TextField name="name" label="Your Name" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{width: {xs: '100%'}}}>
                                        <TextField name="email" label="Your Email" type="email" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{width: {xs: '100%'}}}>
                                        <TextField name="subject" label="Subject" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{width: {xs: '100%'}}}>
                                        <TextField name="message" label="Your Message" required multiline rows={6} fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    {formStatus && (
                                        <Grid sx={{width: {xs: '100%'}}}>
                                            <Alert severity={formStatus.type} sx={{ mt: 1 }}>{formStatus.message}</Alert>
                                        </Grid>
                                    )}
                                    <Grid sx={{width: {xs: '100%'}}}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            fullWidth
                                            disabled={isSubmitting}
                                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                            sx={{ py: 1.5 }}
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
