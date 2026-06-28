// src/pages/static/DisclaimerPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, List, ListItem, ListItemText, Link as MuiLink } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';
import { SITE_REFUND_CREDIT_POLICY, siteOwnerDisplayLine } from '../../config/siteBusiness';

const PolicySection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
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
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <ReportProblemIcon sx={{ fontSize: 60, mb: 2, color: 'warning.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Disclaimer
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Verbal-English Learning at Ed-Tech Company.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective date: April 2025
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <MuiLink href="https://verble.in/disclaimer" target="_blank" rel="noopener noreferrer">
                            https://verble.in/disclaimer
                        </MuiLink>
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        This disclaimer governs your use of the website, mobile application, and services provided by Verble Ed-Tech (“Verble”, “we”, “our”, or “us”). By accessing our platform and participating in our English learning programs, you acknowledge and agree to the terms outlined below.
                    </Typography>

                    <PolicySection icon={<GavelIcon />} title="1. Educational Purpose Only">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="All lessons, vocabulary guides, and resources on Verble are intended solely for language education and informational purposes. While we strive for excellence, we do not provide absolute guarantees regarding the accuracy or completeness of the linguistic information shared. Learners should use their discretion when applying these skills in formal, academic, or professional settings." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="2. No Guarantee of Fluency or Career Outcomes">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="Verble does not make any promises or representations regarding specific exam scores (such as IELTS/TOEFL), job placements, or promotion outcomes. Language acquisition is a personal journey; individual results will vary based on personal effort, practice frequency, and prior aptitude." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="3. Instructor & Content Availability">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="To provide the best learning experience, the availability of specific instructors, live webinars, or course modules is subject to change. We reserve the right to update our curriculum or reschedule sessions without prior notice to ensure the highest quality of teaching." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="4. Limitation of Liability">
                        <Typography>Verble, its educators, and staff shall not be held liable for any loss or damage arising from your use of the platform, including:</Typography>
                        <List dense sx={{ pl: 2, mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Technical issues (e.g., your internet connection or device compatibility)." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Misinterpretation of educational content or idioms." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Stress or anxiety related to language exams or performance." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Data loss resulting from a user’s failure to secure their account." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="5. Third-Party Services">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="We use trusted third-party tools for video streaming and secure payments. Verble is not responsible for service interruptions or policy violations by these external providers. We encourage you to review their terms separately." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="6. No Professional Advice">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="Verble provides academic guidance in English language learning only. We do not provide legal, financial, or medical advice. Our lessons are meant to improve communication, not to replace professional consultation in other specialized fields." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="7. Refund & Satisfaction Disclaimer">
                        <Typography paragraph>
                            We want your learning journey with Verble to be seamless and fulfilling. Our commitment to transparency guides our registration policy:
                        </Typography>
                        <Typography paragraph>
                            <strong>Standard Enrollment Guarantee:</strong> Any course purchased directly through our website at the standard listed price includes a 07-day satisfaction window. If you find that the program does not meet your current learning needs, you are eligible for a hassle-free, full refund within 07 days of your purchase—no questions asked.
                        </Typography>
                        <Typography paragraph>
                            <strong>Promotional & Webinar Campaign Sales:</strong> To support a broad learning community, we frequently offer specialized programs at exceptionally reduced rates during live webinars and promotional campaigns. Because of the substantial operational resources and real-time logistical infrastructure required to host these large-scale events, all purchases made through webinar campaigns, special discount links, or promotional offers are strictly final and non-refundable. Except as explicitly covered by our 7-day standard guarantee, Verble does not offer refunds or credits for personal scheduling conflicts, changes in individual availability, or personal learning pace preferences. We encourage all students to review course curriculum details prior to finalizing their enrollment.
                        </Typography>
                        <Typography paragraph>
                            <strong>Refund Processing Timeline:</strong> {SITE_REFUND_CREDIT_POLICY}
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="8. Learner Responsibility">
                        <Typography>As a Verble student, you are responsible for:</Typography>
                        <List dense sx={{ pl: 2, mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Ensuring your device and internet are ready for live sessions." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Maintaining the security of your login credentials." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Understanding that consistent practice and self-discipline are the primary drivers of language success." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="9. Intellectual Property & Copyright">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="All course materials, including videos, PDFs, Quiz, Graphics, Documents, and Images, are the intellectual property of Verble. Unauthorized recording, sharing, or reproduction of our content is strictly prohibited and may lead to legal action." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="10. Jurisdiction">
                        <List dense>
                            <ListItem>
                                <ListItemText primary="This disclaimer is governed by the laws of India. Any disputes shall be resolved exclusively under the jurisdiction of the courts in New Delhi, India." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <Box sx={{ mt: 5, p: 3, bgcolor: 'grey.200', borderRadius: '8px' }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Final Note
                        </Typography>
                        <Typography color="text.primary">
                            By continuing your journey with Verble, you confirm that you understand these terms and use our services at your own discretion.
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Verble – Empowering Communication, Ethically and Transparently.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {siteOwnerDisplayLine}
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default DisclaimerPage;
