// src/pages/static/TermsAndConditionsPage.tsx
import React from 'react';
import { Container, Box, Typography, Paper, Link as MuiLink, Divider } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { SITE_CONTACT, siteContactMailto, siteContactPhoneDisplay, siteContactTel } from '../../config/siteContact';
import { SITE_REFUND_CREDIT_POLICY, siteOwnerDisplayLine } from '../../config/siteBusiness';

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <GavelIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        Terms & Conditions
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Verbal-English Learning at Ed-Tech Company.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Effective date: April 2025
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <MuiLink href="https://verble.in/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                            https://verble.in/terms-and-conditions
                        </MuiLink>
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '12px' }}>
                    <Typography paragraph color="text.secondary" sx={{ fontStyle: 'italic', mb: 4 }}>
                        Welcome to Verble, an online education platform committed to providing high-quality English language learning at accessible fees. By accessing, browsing, or using our website, mobile application, or services, you agree to comply with and be bound by the following Terms & Conditions (“Terms”).
                    </Typography>

                    <PolicySection title="1. Acceptance of Terms">
                        <ul>
                            <li>
                                These Terms constitute a legally binding agreement between the user (“you”, “student”, “learner”, or “guardian”) and Verble Ed-Tech (“we”, “us”, or “Verble”). By registering for a course, joining a webinar, or accessing our study materials, you acknowledge that you have read and agreed to these Terms.
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="2. Eligibility">
                        <ul>
                            <li>You must be at least 13 years of age to use our services. Learners under 18 must use the platform with the consent and supervision of a parent or guardian. We reserve the right to verify eligibility to ensure a safe learning environment.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="3. Registration and Account Security">
                        <ul>
                            <li>
                                To access our English courses, you must provide accurate information during registration. You are solely responsible for maintaining the confidentiality of your login credentials. Any activity performed under your account is your responsibility.
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="4. Use of the Platform">
                        <Typography>Our services are for your personal, non-commercial, educational use only. To protect our learning community, you agree not to:</Typography>
                        <ul>
                            <li>Share, record, or distribute course content or live session links without authorization.</li>
                            <li>Use automated tools to scrape or access our vocabulary databases or lesson plans.</li>
                            <li>Engage in disruptive or disrespectful behavior toward instructors or fellow students during live classes.</li>
                            <li>Impersonate another student or provide false academic information.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="5. Course Access & Modifications">
                        <ul>
                            <li>
                                To keep our curriculum current with modern English usage, course features, lesson durations, and instructor availability are subject to change. We reserve the right to modify or update any course to ensure academic accuracy and a better learning experience.
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="6. Intellectual Property Rights">
                        <ul>
                            <li>
                                All content on Verble—including instructional videos, PDFs, Graphics, Documents, Images worksheets, quizzes, and logos—is the exclusive intellectual property of Verble. You are granted a limited, non-transferable license for your personal learning. Unauthorized redistribution or recording of lessons is strictly prohibited.
                            </li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="7. Fees, Payments & Refund Policy">
                        <Typography paragraph>
                            All course and webinar fees must be paid in full at the time of enrollment. We aim to ensure total satisfaction with our educational tracks through the following structured refund guidelines:
                        </Typography>
                        <Typography paragraph>
                            <strong>Standard Website Purchases (7-Day Satisfaction Guarantee):</strong> If you purchase any course directly through our website at the standard listed price and find that the content does not align with your learning goals, you are eligible for a full refund within 07 days from the date of purchase. No questions will be asked. To initiate a refund, please contact our support team within this 7-day window.
                        </Typography>
                        <Typography paragraph>
                            <strong>Webinar and Campaign Promotional Purchases:</strong> To make high-impact learning accessible to a wider audience, we periodically offer heavily discounted pricing during special live webinars and marketing campaigns. Because these promotional rates are deeply optimized and incur significant real-time logistical expenses, setup costs, and administrative resources, all purchases made through webinar campaigns or promotional links are strictly final and non-refundable. By enrolling via a promotional campaign, you acknowledge and agree to these terms.
                        </Typography>
                        <Typography paragraph>
                            <strong>Refund Processing Timeline:</strong> {SITE_REFUND_CREDIT_POLICY}
                        </Typography>
                    </PolicySection>

                    <PolicySection title="8. Limitation of Liability">
                        <Typography>Verble strives for excellence in language coaching; however, we do not guarantee specific outcomes like exam success or career placement. We are not responsible for:</Typography>
                        <ul>
                            <li>Technical failures (e.g., student’s internet or device issues).</li>
                            <li>Misapplication of grammar rules or idioms in external settings.</li>
                            <li>Any indirect or incidental damages resulting from the use of our lessons.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="9. Third-Party Tools">
                        <Typography>
                            We may use third-party platforms (e.g., Zoom for webinars, YouTube for hosting, or payment gateways). Verble is not responsible for the policies or functionality of these external services.
                        </Typography>
                    </PolicySection>

                    <PolicySection title="10. Termination of Access">
                        <Typography>We reserve the right to suspend or terminate your access to Verble without a refund if:</Typography>
                        <ul>
                            <li>You breach these Terms.</li>
                            <li>You engage in conduct that is harmful to the Verble brand or its students.</li>
                            <li>You share your account access with unauthorized users.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="11. Privacy & Data Usage">
                        <Typography>
                            Your privacy is important to us. Our collection and use of your data are governed by our Privacy Policy, which is incorporated into these Terms by reference.
                        </Typography>
                    </PolicySection>

                    <PolicySection title="12. Governing Law & Jurisdiction">
                        <ul>
                            <li>These Terms are governed by the laws of India. Any disputes arising from the use of Verble shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="13. Amendments to Terms">
                        <ul>
                            <li>Verble reserves the right to update these Terms at any time to reflect platform improvements. Continued use of our services after such updates implies your acceptance of the new Terms.</li>
                        </ul>
                    </PolicySection>

                    <Divider sx={{ my: 4 }} />

                    <Box>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                            Contact Us
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            For any questions regarding these Terms, please reach out to our support team:
                        </Typography>
                        <Typography color="text.secondary">
                            Email: <MuiLink href={siteContactMailto}>{SITE_CONTACT.email}</MuiLink>
                        </Typography>
                        <Typography color="text.secondary">
                            Phone: <MuiLink href={siteContactTel}>{siteContactPhoneDisplay}</MuiLink>
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.200', borderRadius: '8px', textAlign: 'center' }}>
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

export default TermsAndConditionsPage;
