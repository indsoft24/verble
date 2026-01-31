// src/pages/static/DisclaimerPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';

// Reusable component for a policy section
const PolicySection = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mr: 1.5, color: 'text.secondary' }}>{icon}</Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
        </Box>
        <Box sx={{ color: 'text.secondary', pl: { xs: 2, md: 6 } }}>
            {children}
        </Box>
    </Box>
);

const DisclaimerPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <ReportProblemIcon sx={{ fontSize: 60, mb: 2, color: 'warning.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Disclaimer
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                        Verble – India’s No.1 Ed-Tech Company
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective Date: 1st Feb 2007
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        This disclaimer governs your use of the website, mobile application, and services provided by Verble Ed-Tech (“Verble”, “we”, “our”, or “us”). By accessing or using our platform, you acknowledge and agree to the terms outlined below.
                    </Typography>

                    <PolicySection icon={<GavelIcon />} title="1. General Educational Purpose Only">
                        <List dense>
                            <ListItem><ListItemText primary="All content, classes, and resources on Verble are intended solely for educational and informational purposes." /></ListItem>
                            <ListItem><ListItemText primary="We do not provide any guarantees regarding the accuracy, completeness, or reliability of the information shared." /></ListItem>
                            <ListItem><ListItemText primary="Users are advised to use their discretion and consult official curriculum guidelines, educators, or examination boards where necessary." /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="2. No Guarantee of Academic or Career Outcomes">
                        <List dense>
                            <ListItem><ListItemText primary="Verble does not make any promises or representations regarding exam success, school admissions, job placement, or academic ranking." /></ListItem>
                            <ListItem><ListItemText primary="While we strive to deliver high-quality learning, individual results may vary based on effort, aptitude, environment, and external factors beyond our control." /></ListItem>
                        </List>
                    </PolicySection>
                    
                    <PolicySection icon={<GavelIcon />} title="3. Content & Instructor Availability">
                        <List dense>
                            <ListItem><ListItemText primary="The availability of specific instructors, live sessions, course content, or batches is subject to change at any time without prior notice." /></ListItem>
                            <ListItem><ListItemText primary="We do not guarantee that any particular teacher or class will be available at a given time." /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="4. Limitation of Liability">
                        <Typography>
                           Verble, its educators, partners, or staff shall not be held liable for any direct, indirect, incidental, or consequential loss or damage, including but not limited to:
                        </Typography>
                         <List dense sx={{ pl: 2 }}>
                            <ListItem><ListItemText primary="Technical issues on the user’s end (internet failure, device compatibility)" /></ListItem>
                            <ListItem><ListItemText primary="Data loss or breach due to user negligence" /></ListItem>
                            <ListItem><ListItemText primary="Misinterpretation of educational content" /></ListItem>
                             <ListItem><ListItemText primary="Psychological stress or anxiety resulting from exam preparation" /></ListItem>
                        </List>
                        <Typography sx={{mt: 1.5}}>Users access our services at their own risk.</Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="5. Use of Third-Party Services">
                         <List dense>
                            <ListItem><ListItemText primary="We may integrate third-party tools and platforms (e.g., payment gateways, video streaming services, analytics)." /></ListItem>
                            <ListItem><ListItemText primary="Verble is not liable for any service failure, data misuse, or policy violation by such third-party providers." /></ListItem>
                            <ListItem><ListItemText primary="Users are encouraged to review the privacy and terms of third-party tools separately." /></ListItem>
                        </List>
                    </PolicySection>
                    
                     <PolicySection icon={<GavelIcon />} title="6. No Professional or Legal Advice">
                         <List dense>
                            <ListItem><ListItemText primary="The platform does not provide legal, financial, psychological, or medical advice under any circumstances." /></ListItem>
                            <ListItem><ListItemText primary="All academic guidance is general in nature and should not replace official consultation with teachers, institutions, or certified professionals." /></ListItem>
                        </List>
                    </PolicySection>
                    
                    <PolicySection icon={<GavelIcon />} title="7. Non-Refundable Services">
                         <List dense>
                            <ListItem><ListItemText primary="All payments made to Verble are final and non-refundable under any circumstances, as clearly stated in our Terms & Conditions." /></ListItem>
                            <ListItem><ListItemText primary="We shall not entertain refund requests related to personal dissatisfaction, technical limitations, or scheduling conflicts." /></ListItem>
                        </List>
                    </PolicySection>
                    
                     <PolicySection icon={<GavelIcon />} title="8. User Responsibility">
                         <Typography>Users are responsible for:</Typography>
                         <List dense sx={{ pl: 2 }}>
                            <ListItem><ListItemText primary="Ensuring the compatibility of their devices and internet connection" /></ListItem>
                            <ListItem><ListItemText primary="Keeping login credentials secure" /></ListItem>
                            <ListItem><ListItemText primary="Attending sessions and completing course materials in a timely manner" /></ListItem>
                             <ListItem><ListItemText primary="Understanding that self-discipline and regular practice are essential for success" /></ListItem>
                        </List>
                    </PolicySection>
                    
                     <PolicySection icon={<GavelIcon />} title="9. Copyright & Fair Use Notice">
                         <List dense>
                            <ListItem><ListItemText primary="All course materials, videos, and content are protected by copyright laws and are the intellectual property of Verble." /></ListItem>
                            <ListItem><ListItemText primary="Unauthorized reproduction, recording, or distribution is strictly prohibited and may result in legal action." /></ListItem>
                        </List>
                    </PolicySection>
                    
                     <PolicySection icon={<GavelIcon />} title="10. Jurisdiction & Legal Protection">
                         <List dense>
                            <ListItem><ListItemText primary="This disclaimer shall be governed by the laws of India, and any disputes shall be resolved under the exclusive jurisdiction of courts in New Delhi, India." /></ListItem>
                            <ListItem><ListItemText primary="This disclaimer is part of our overall legal protection and shall be read in conjunction with our Privacy Policy and Terms & Conditions." /></ListItem>
                        </List>
                    </PolicySection>

                    <Box sx={{ mt: 5, p: 3, bgcolor: 'grey.200', borderRadius: '8px', textAlign: 'center' }}>
                         <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>📌 Final Note</Typography>
                         <Typography color="text.primary" sx={{mt: 1}}>By continuing to use Verble, you confirm that you:</Typography>
                          <List dense sx={{display: 'inline-block', textAlign: 'left', mt: 1}}>
                            <ListItem><ListItemText primary="Understand and accept the above disclaimers" /></ListItem>
                            <ListItem><ListItemText primary="Use our services at your own discretion and responsibility" /></ListItem>
                            <ListItem><ListItemText primary="Waive any claims, demands, or legal proceedings against the company arising from your use of the platform" /></ListItem>
                        </List>
                    </Box>

                     <Box sx={{ mt: 4, textAlign: 'center' }}>
                         <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Verble – Empowering Minds, Ethically and Transparently.</Typography>
                         <Typography variant="body2" color="text.secondary">Your trust matters, and so does clarity.</Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default DisclaimerPage;
