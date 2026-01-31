// src/pages/static/PrivacyPolicyPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, Link as MuiLink, List, ListItem, ListItemText, Divider } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';

// Reusable component for a policy section
const PolicySection = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
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
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <SecurityIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        🔒 Privacy Policy
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Verble – India’s No.1 Ed-Tech Company
                    </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective Date: 1st Feb 2012
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic', mb: 4 }}>
                        At Verble, your privacy is our responsibility. We are committed to protecting the personal data of our users in compliance with relevant data protection laws, including the General Data Protection Regulation (GDPR) of the European Union, the Information Technology Act, 2000 (India) and associated IT Rules, 2011, and the Children’s Online Privacy Protection Act (COPPA) of the United States. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile app, or access any of our services.
                    </Typography>

                    <PolicySection icon={<GavelIcon />} title="1. Definitions">
                        <List dense>
                            <ListItem><ListItemText primary="Personal Data" secondary="means any information that identifies or could be used to identify a natural person." /></ListItem>
                            <ListItem><ListItemText primary="Processing" secondary="includes collecting, storing, using, sharing, or deleting data." /></ListItem>
                            <ListItem><ListItemText primary="Data Subject" secondary="refers to users whose personal data we collect." /></ListItem>
                            <ListItem><ListItemText primary="Child" secondary="refers to any user under the age of 13 (for COPPA) or 16 (for GDPR, in certain EU countries)." /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="2. What We Collect">
                         <Typography>We may collect and process the following categories of personal data:</Typography>
                         <List dense>
                            <ListItem><ListItemText primary="Identity Data: Name, date of birth, gender, profile photo, student ID" /></ListItem>
                            <ListItem><ListItemText primary="Contact Data: Email address, phone number, postal address" /></ListItem>
                            <ListItem><ListItemText primary="Educational Data: Class, courses enrolled, performance scores, test results" /></ListItem>
                            <ListItem><ListItemText primary="Technical Data: IP address, device type, browser info, location data, cookies" /></ListItem>
                            <ListItem><ListItemText primary="Financial Data: Billing information, UPI, credit/debit card (processed securely via third-party payment gateways)" /></ListItem>
                            <ListItem><ListItemText primary="Communication Data: Emails, chat messages, support interactions" /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="3. Legal Basis for Processing (GDPR Compliance)">
                         <Typography>We process your personal data under the following legal bases (as applicable):</Typography>
                         <List dense>
                            <ListItem><ListItemText primary="Consent – when you voluntarily provide data during sign-up or marketing preferences." /></ListItem>
                            <ListItem><ListItemText primary="Contractual Necessity – to deliver services, content, and user accounts." /></ListItem>
                            <ListItem><ListItemText primary="Legal Obligation – to comply with applicable laws and regulations." /></ListItem>
                            <ListItem><ListItemText primary="Legitimate Interests – to improve our platform and protect against fraud." /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="4. How We Use Your Data">
                        <Typography>We use the collected data to:</Typography>
                        <List dense>
                            <ListItem><ListItemText primary="Create and manage your account" /></ListItem>
                            <ListItem><ListItemText primary="Deliver educational content and personalized learning experiences" /></ListItem>
                            <ListItem><ListItemText primary="Process transactions securely" /></ListItem>
                            <ListItem><ListItemText primary="Communicate with you (updates, assignments, support)" /></ListItem>
                            <ListItem><ListItemText primary="Improve platform functionality via analytics" /></ListItem>
                            <ListItem><ListItemText primary="Comply with regulatory and legal obligations" /></ListItem>
                            <ListItem><ListItemText primary="Ensure safety, security, and fraud prevention" /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="5. Data Sharing & Disclosure">
                        <Typography>We do not sell or rent your data. Your information may be shared:</Typography>
                        <List dense>
                            <ListItem><ListItemText primary="With educators and course instructors for academic purposes" /></ListItem>
                            <ListItem><ListItemText primary="With trusted service providers (e.g., payment gateways, analytics tools) under strict data protection agreements" /></ListItem>
                            <ListItem><ListItemText primary="To comply with legal obligations, law enforcement requests, or court orders" /></ListItem>
                            <ListItem><ListItemText primary="During a merger, acquisition, or asset transfer — with user notification" /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="6. Children's Privacy (COPPA Compliance)">
                        <List dense>
                            <ListItem><ListItemText primary="We do not knowingly collect personal data from children under 13 without verified parental consent." /></ListItem>
                            <ListItem><ListItemText primary="For children aged 13 to 18, parental or guardian consent may be required based on jurisdiction." /></ListItem>
                            <ListItem><ListItemText primary='Parents may request deletion of a child’s account by emailing privacy@verble.co.in' /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="7. International Data Transfers">
                        <Typography>If you are located outside India, your data may be processed in India or other jurisdictions. We ensure appropriate safeguards (e.g., standard contractual clauses) for international data transfers, as per GDPR guidelines.</Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="8. Data Security (IT Act Compliance)">
                        <Typography>We implement strong technical and organizational measures:</Typography>
                        <List dense>
                            <ListItem><ListItemText primary="SSL encryption and HTTPS-secured browsing" /></ListItem>
                            <ListItem><ListItemText primary="Role-based access and two-factor authentication" /></ListItem>
                            <ListItem><ListItemText primary="Regular system audits, firewalls, and intrusion detection" /></ListItem>
                            <ListItem><ListItemText primary="Backups and disaster recovery procedures" /></ListItem>
                        </List>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="9. User Rights">
                         <Typography>As per GDPR and IT Rules, you have the right to:</Typography>
                         <List dense>
                            <ListItem><ListItemText primary="Access your personal data" /></ListItem>
                            <ListItem><ListItemText primary="Correct or update inaccurate data" /></ListItem>
                            <ListItem><ListItemText primary='Request deletion ("Right to be Forgotten")' /></ListItem>
                            <ListItem><ListItemText primary="Withdraw consent at any time" /></ListItem>
                            <ListItem><ListItemText primary="Object to or restrict data processing" /></ListItem>
                            <ListItem><ListItemText primary="Receive a copy of your data (data portability)" /></ListItem>
                        </List>
                         <Typography sx={{mt: 1.5}}>To exercise your rights, contact us at: <MuiLink href="mailto:privacy@verble.co.in">privacy@verble.co.in</MuiLink></Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="10. Cookies & Tracking Tools">
                        <Typography>We use cookies and similar technologies for:</Typography>
                         <List dense>
                            <ListItem><ListItemText primary="Session management and login" /></ListItem>
                            <ListItem><ListItemText primary="Personalizing your dashboard and recommendations" /></ListItem>
                            <ListItem><ListItemText primary="Tracking usage for platform improvement" /></ListItem>
                        </List>
                        <Typography sx={{mt: 1.5}}>You may disable cookies in your browser settings, but this may affect user experience.</Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="11. Data Retention">
                         <Typography>We retain your data:</Typography>
                         <List dense>
                            <ListItem><ListItemText primary="As long as your account is active or needed for service delivery" /></ListItem>
                            <ListItem><ListItemText primary="As required by applicable laws (e.g., financial records)" /></ListItem>
                            <ListItem><ListItemText primary="For up to 3 years after account deactivation, unless deletion is requested earlier" /></ListItem>
                        </List>
                    </PolicySection>

                     <PolicySection icon={<GavelIcon />} title="12. Updates to This Policy">
                         <Typography>We may update this policy from time to time to reflect legal or platform changes. You will be notified via email or platform notification. Continued use of our services implies consent to the updated policy.</Typography>
                    </PolicySection>

                    <PolicySection icon={<GavelIcon />} title="13. Contact Us">
                        <Typography>For questions, complaints, or to exercise your privacy rights:</Typography>
                        <Box sx={{mt: 1}}>
                            <Typography>📧 Email: <MuiLink href="mailto:privacy@verble.co.in">privacy@verble.co.in</MuiLink></Typography>
                            <Typography>📞 Phone: +91-XXXXXXXXXX</Typography>
                            <Typography>🌐 Website: <MuiLink href="https://www.verble.co.in">https://www.verble.co.in</MuiLink></Typography>
                        </Box>
                    </PolicySection>
                    
                    <Divider sx={{ my: 4 }} />
                    
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Verble – Educating with Trust, Transparency, and Responsibility.</Typography>
                        <Typography variant="body1" color="text.secondary">Your data is safe with us.</Typography>
                    </Box>

                </Paper>
            </Container>
        </Box>
    );
};

export default PrivacyPolicyPage;
