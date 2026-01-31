// src/pages/static/TermsAndConditionsPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, Link as MuiLink, Divider, Alert } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

// Reusable component for a policy section
const PolicySection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
        </Typography>
        <Box sx={{ color: 'text.secondary', '& p': { mb: 1.5 }, '& ul': { pl: 2.5 }, '& li': { mb: 1 } }}>
            {children}
        </Box>
    </Box>
);

const TermsAndConditionsPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: 'grey.100', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                {/* --- HEADER --- */}
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <GavelIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        📄 Terms & Conditions
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Verble – India’s No.1 Ed-Tech Company
                    </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective Date: 1st Feb 2007
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic', mb: 4 }}>
                        Welcome to Verble, an online education platform committed to providing quality learning at minimum fees. By accessing, browsing, or using our website, mobile application, or services, you agree to comply with and be bound by the following Terms & Conditions (“Terms”). Please read them carefully. If you do not agree with any part of these Terms, you should not use our services.
                    </Typography>

                    <PolicySection title="1️⃣ Acceptance of Terms">
                        <ul>
                            <li>These Terms constitute a legally binding agreement between the user (“you”, “student”, “parent”, or “guardian”) and Verble Ed-Tech (“we”, “us”, or “Verble”).</li>
                            <li>By registering on our platform, purchasing a course, or accessing content, you acknowledge that you have read, understood, and agreed to be bound by these Terms.</li>
                        </ul>
                    </PolicySection>
                    
                    <PolicySection title="2️⃣ Eligibility">
                        <ul>
                            <li>You must be at least 13 years of age to use our services. Users under 18 must do so with the consent and supervision of a parent or guardian.</li>
                            <li>We reserve the right to verify the age and identity of any user at any time.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="3️⃣ Registration and Account Security">
                        <ul>
                            <li>You agree to provide accurate and complete information during registration and to keep your account information up to date.</li>
                            <li>You are solely responsible for maintaining the confidentiality of your login credentials and all activities under your account.</li>
                        </ul>
                    </PolicySection>
                    
                    <PolicySection title="4️⃣ Use of Platform">
                        <Typography>You may use our services for personal, non-commercial, educational purposes only. You agree not to:</Typography>
                        <ul>
                            <li>Share or distribute course content without authorization.</li>
                            <li>Use any automated tools (e.g., bots, crawlers) to access the platform.</li>
                            <li>Engage in disruptive, abusive, or illegal behavior on the platform or toward educators or staff.</li>
                            <li>Impersonate another individual or provide false information.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="5️⃣ Course Access & Modifications">
                        <ul>
                            <li>Course duration, features, and educator availability are subject to change at any time without prior notice.</li>
                            <li>We reserve the right to modify, suspend, or discontinue any course or feature for improvements, academic accuracy, or regulatory compliance.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="6️⃣ Intellectual Property Rights">
                        <ul>
                            <li>All content available on Verble — including videos, live classes, documents, quizzes, logos, and trademarks — is the exclusive intellectual property of Verble or its licensed partners.</li>
                            <li>You are granted a limited, non-transferable, non-exclusive license to access and use content for your personal learning only.</li>
                            <li>Unauthorized copying, sharing, recording, or redistribution is strictly prohibited and may result in legal action.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="7️⃣ Fees, Payments & Non-Refund Policy">
                        <ul>
                            <li>All course fees must be paid in full as per the pricing displayed at the time of enrollment.</li>
                            <li>All payments are final and strictly non-refundable, regardless of circumstances.</li>
                        </ul>
                        <Alert severity="warning" icon={false} sx={{ mt: 2 }}>
                            <strong>📌 By enrolling in any course, you expressly agree to this non-refundable fee policy.</strong>
                        </Alert>
                    </PolicySection>

                    <PolicySection title="8️⃣ Limitation of Liability">
                        <Typography>While we strive to provide accurate, high-quality content and teaching, Verble does not guarantee any specific learning outcome, exam result, or career success. We are not responsible for:</Typography>
                        <ul>
                            <li>Technical issues beyond our control (e.g., internet downtime)</li>
                            <li>User misunderstandings or misapplication of academic concepts</li>
                            <li>Any incidental, indirect, or consequential damages</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="9️⃣ Third-Party Tools & Services">
                        <Typography>Verble may integrate with third-party platforms (e.g., payment gateways, Zoom, YouTube, etc.). We are not responsible for the content, policies, or functionality of these external services.</Typography>
                    </PolicySection>

                    <PolicySection title="🔟 Termination of Access">
                        <Typography>We reserve the right to suspend or permanently terminate your access to the platform if:</Typography>
                        <ul>
                            <li>You breach these Terms</li>
                            <li>You misuse platform features or content</li>
                            <li>You engage in conduct harmful to other users, educators, or the brand</li>
                        </ul>
                        <Typography sx={{fontWeight: 'bold', mt: 1}}>No refund will be issued in such cases.</Typography>
                    </PolicySection>

                    <PolicySection title="1️⃣1️⃣ Privacy & Data Usage">
                        <ul>
                            <li>We collect and process your data in accordance with our Privacy Policy. By using our services, you consent to such collection and use.</li>
                            <li>You are responsible for maintaining the privacy of your own personal information and device security.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="1️⃣2️⃣ Governing Law & Jurisdiction">
                        <ul>
                            <li>These Terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</li>
                            <li>For international users, use of the platform constitutes consent to Indian laws and jurisdiction.</li>
                        </ul>
                    </PolicySection>
                    
                    <PolicySection title="1️⃣3️⃣ Amendments to Terms">
                        <ul>
                            <li>Verble reserves the right to update or modify these Terms at any time.</li>
                            <li>Updated terms will be posted on the website with the revised “Effective Date.” Continued use after changes implies acceptance.</li>
                        </ul>
                    </PolicySection>
                    
                    <Divider sx={{ my: 4 }} />

                    <Box>
                        <Typography variant="h6" component="h3" sx={{fontWeight: 'bold'}}>📩 Contact Us</Typography>
                        <Typography color="text.secondary">For any queries regarding these Terms, reach out to:</Typography>
                        <Typography color="text.secondary">📧 Email: <MuiLink href="mailto:contact@verble.co.in">contact@verble.co.in</MuiLink></Typography>
                        <Typography color="text.secondary">📞 Phone: +91-XXXXXXXXXX</Typography>
                    </Box>

                     <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.200', borderRadius: '8px', textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                            By using Verble, you acknowledge and agree to all the above Terms & Conditions, including the non-refundable fee clause.
                        </Typography>
                    </Box>

                </Paper>
            </Container>
        </Box>
    );
};

export default TermsAndConditionsPage;
