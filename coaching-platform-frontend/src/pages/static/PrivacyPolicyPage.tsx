// src/pages/static/PrivacyPolicyPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, Link as MuiLink, List, ListItem, ListItemText, Divider } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';

const PolicySection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mr: 1.5, color: 'primary.main' }}>{icon}</Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
        </Box>
        <Box sx={{ color: 'text.secondary', pl: { xs: 2, md: 6 }, '& p': { mb: 1.5 } }}>
            {children}
        </Box>
    </Box>
);

const PrivacyPolicyPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <SecurityIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Privacy Policy
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Verbal-English Learning at Ed-Tech Company.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective date: April 2025
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <MuiLink href="https://verble.in/privacy-policy" target="_blank" rel="noopener noreferrer">
                            https://verble.in/privacy-policy
                        </MuiLink>
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic', mb: 4 }}>
                        At Verble, your privacy is our responsibility. We are committed to protecting the personal data of our learners in compliance with relevant data protection laws, including the General Data Protection Regulation (GDPR), the Information Technology Act, 2000 (India), and the Children’s Online Privacy Protection Act (COPPA). This Privacy Policy describes how we collect, use, and safeguard your information when you visit our website, join our webinars, or use our learning tools.
                    </Typography>

                    <PolicySection icon={<GavelIcon />} title="1. Definitions">
                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="Personal Data"
                                    secondary="Any information that identifies you as a learner."
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Processing"
                                    secondary="How we handle your data, including collecting, storing, or using it to improve your lessons."
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Data Subject" secondary="The student or user whose data we collect." />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Child"
                                    secondary="Any user under the age of 13 (COPPA) or 16 (GDPR, in specific regions)."
                                />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="2. What We Collect">
                        <Typography>We collect and process data specifically to support your English learning journey:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Identity Data: Name, date of birth, and profile photo." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Contact Data: Email address and phone number for lesson updates." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Educational Data: Enrolled English courses, learning progress, quiz scores, and speech or writing practice submissions." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Technical Data: IP address, device type, and how you interact with our learning modules." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Financial Data: Secure billing information for course enrollments (processed via third-party gateways)." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Communication Data: Feedback, chat messages during live sessions, and support interactions." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="3. Legal Basis for Processing">
                        <Typography>We process your data under the following legal grounds:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Consent: When you sign up for a course or newsletter." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Contractual Necessity: To provide the lessons and account access you’ve purchased." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Legal Obligation: To meet regulatory requirements." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Legitimate Interests: To enhance our teaching methods and platform security." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="4. How We Use Your Data">
                        <Typography>We use your information to:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Manage your student profile and course access." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Deliver personalized learning experiences and vocabulary recommendations." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Track your fluency progress and provide certificates of completion." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Communicate assignments, webinar links, and feedback." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Improve our curriculum through anonymized usage analytics." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="5. Data Sharing & Disclosure">
                        <Typography>We do not sell your data. It is only shared:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="With Verble instructors to help guide your academic growth." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="With trusted service providers (e.g., video hosting or payment tools) under strict protection." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="To comply with legal obligations or law enforcement." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="6. Children's Privacy">
                        <Typography>
                            We prioritize the safety of younger learners. We do not knowingly collect data from children under 13 without verified parental consent. Parents can manage or delete their child’s learning account at any time by contacting{' '}
                            <MuiLink href="mailto:privacy@verble.co.in">privacy@verble.co.in</MuiLink>.
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="7. International Data Transfers">
                        <Typography>
                            As Verble serves a global community, your data may be processed in India or other jurisdictions. We ensure all transfers follow GDPR-compliant safeguards.
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="8. Data Security">
                        <Typography>We protect your learning environment using:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="SSL encryption and HTTPS-secured browsing." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Two-factor authentication and secure access controls." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Regular audits to ensure your progress and data remain private." />
                            </ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="9. Your Rights">
                        <Typography>You have the right to:</Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="Access or update your student information." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary='Request the "Right to be Forgotten" (deletion of your account).' />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Withdraw consent for marketing emails." />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Receive a portable copy of your learning records." />
                            </ListItem>
                        </List>
                        <Typography sx={{ mt: 1.5 }}>
                            To exercise these rights, contact us at:{' '}
                            <MuiLink href="mailto:privacy@verble.co.in">privacy@verble.co.in</MuiLink>
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="10. Cookies & Learning Tools">
                        <Typography>
                            We use cookies to remember your preferences, keep you logged in, and suggest relevant English lessons based on your past activity.
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="11. Data Retention">
                        <Typography>
                            We keep your data as long as your account is active to maintain your learning history. We may retain records for up to 3 years after deactivation for legal compliance before permanent deletion.
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="12. Updates to This Policy">
                        <Typography>
                            We may update this policy to reflect new learning features or legal changes. We will notify you of significant changes via email.
                        </Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="13. Contact Us">
                        <Typography>
                            For any questions regarding your privacy at Verble, please reach out to our team at{' '}
                            <MuiLink href="mailto:privacy@verble.co.in">privacy@verble.co.in</MuiLink>.
                        </Typography>
                    </PolicySection>

                    <Divider sx={{ my: 4 }} />

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Verble – Empowering Communication, Ethically and Transparently.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default PrivacyPolicyPage;
