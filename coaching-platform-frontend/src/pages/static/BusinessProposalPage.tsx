// src/pages/static/BusinessProposalPage.tsx
import React, {useState} from 'react';
import { Container, Box, Typography, Grid, Paper, TextField, Button, CircularProgress, Alert, styled } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GavelIcon from '@mui/icons-material/Gavel';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

// Custom styled button for the file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Reusable component for criteria cards
const CriteriaCard = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
        <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: '600' }}>{title}</Typography>
            <Typography color="text.secondary">{text}</Typography>
        </Box>
    </Box>
);

const BusinessProposalPage: React.FC = () => {
    // A simple placeholder for form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }else {
            setSelectedFile(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormStatus(null);
        const formElement = e.currentTarget;
        const formData = new FormData(formElement);
        formData.append('formType', 'Business Proposal');

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const apiEndpoint = `${apiBaseUrl}/forms/submit`;

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok) {
                setFormStatus({ type: 'success', message: result.message || "Thank you! Your proposal has been received." });
                formElement.reset(); 
                setSelectedFile(null); 
            } else {
                setFormStatus({ type: 'error', message: result.message || "An error occurred while submitting. Please try again." });
            }

        } catch (error) {
            setFormStatus({ type: 'error', message: "A network error occurred. Please check your connection and try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ bgcolor: 'grey.100' }}>
            <Box sx={{
                py: { xs: 6, md: 10 },
                bgcolor: 'primary.dark',
                color: '#fff',
                textAlign: 'center'
            }}>
                <Container maxWidth="md">
                    <LightbulbIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        Submit a Business Proposal
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 2, opacity: 0.9, maxWidth: '750px', mx: 'auto' }}>
                        We are actively seeking innovative ideas and strategic proposals that align with our mission to make quality education accessible to all.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                <Grid container spacing={6} alignItems="center">
                    {/* Left Column: Criteria */}
                    <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 4 }}>
                            What We Look For
                        </Typography>
                        <CriteriaCard
                            icon={<AssessmentIcon fontSize="large" />}
                            title="Market Opportunity & Viability"
                            text="Clear analysis of the target market, problem statement, and a viable business model."
                        />
                        <CriteriaCard
                            icon={<GavelIcon fontSize="large" />}
                            title="Strategic Alignment"
                            text="Proposals that complement our existing services and long-term vision for educational technology."
                        />
                         <CriteriaCard
                            icon={<RocketLaunchIcon fontSize="large" />}
                            title="Innovation & Scalability"
                            text="Unique solutions with a clear path to grow and adapt in a dynamic market environment."
                        />
                    </Grid>

                    {/* Right Column: Submission Form */}
                    <Grid sx={{ width: { xs: '100%', md: '47%' } }}>
                        <Paper elevation={4} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '12px' }}>
                             <Typography variant="h5" component="h3" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 3 }}>
                                Proposal Details
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2}>
                                    <Grid sx={{ width: '100%' }}>
                                        <TextField name="subject" label="Proposal Title" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{ width: '100%' }}>
                                        <TextField name="name" label="Your Full Name" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{ width: '100%' }}>
                                        <TextField name="companyName" label="Company / Organization Name" fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{ width: '100%' }}>
                                        <TextField name="email" label="Contact Email" type="email" required fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{ width: '100%' }}>
                                        <TextField name="message" label="Executive Summary" required multiline rows={5} fullWidth disabled={isSubmitting} />
                                    </Grid>
                                    <Grid sx={{ width: '100%', textAlign: 'center', my: 1 }}>
                                        <Button
                                            component="label"
                                            role={undefined}
                                            variant="outlined"
                                            tabIndex={-1}
                                            startIcon={<UploadFileIcon />}
                                            disabled={isSubmitting}
                                        >
                                            Upload Proposal Document
                                            <VisuallyHiddenInput name="attachmentFile" type="file"  onChange={handleFileChange} />
                                        </Button>
                                        {selectedFile && <Typography variant="caption" display="block" sx={{mt: 1}}>{selectedFile.name}</Typography>}
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
                                            {isSubmitting ? 'Submitting...' : 'Submit Business Proposal'}
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

export default BusinessProposalPage;
