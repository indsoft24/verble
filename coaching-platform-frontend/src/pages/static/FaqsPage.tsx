import React from 'react';
import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails, Paper, Link as MuiLink, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

// --- Mock Data for FAQs ---
const faqData = [
    {
        category: 'General Questions',
        questions: [
            {
                q: 'What is Verble?',
                a: 'Verble is a premier online learning platform providing high-quality coaching and resources for a wide range of competitive entrance exams, including Law, Government Exams, Engineering, and Medical.'
            },
            {
                q: 'Who are the instructors?',
                a: 'Our courses are designed and taught by a team of experienced educators, subject matter experts, and professionals who have a deep understanding of the exam patterns and a passion for teaching.'
            }
        ]
    },
    {
        category: 'Courses & Content',
        questions: [
            {
                q: 'How can I access the course materials?',
                a: 'Once you subscribe to a plan, you will get immediate access to all the video lectures, e-books, practice questions, and downloadable materials associated with your course through your student dashboard.'
            },
            {
                q: 'Are the video lectures live or pre-recorded?',
                a: 'Most of our courses consist of high-quality, pre-recorded video lectures that you can watch anytime, anywhere, and at your own pace. We also conduct regular live doubt-solving sessions and webinars.'
            },
            {
                q: 'Can I watch the videos on my mobile device?',
                a: 'Yes! Our platform is fully responsive and optimized for all devices, including desktops, tablets, and mobile phones. You can learn on the go.'
            }
        ]
    },
    {
        category: 'Subscription & Payment',
        questions: [
            {
                q: 'What payment methods do you accept?',
                a: 'We accept a wide range of payment methods, including all major credit cards, debit cards, UPI, and net banking through our secure payment gateway.'
            },
            {
                q: 'Is there a free trial available?',
                a: 'We occasionally offer free trial periods for certain courses. Please check the specific course page or our subscription plans page for the latest offers.'
            },
            {
                q: 'What is your refund policy?',
                a: 'Due to the digital nature of our content, we generally do not offer refunds once a subscription is purchased. We encourage you to review all course details and free resources before making a purchase. Please see our Terms of Service for more details.'
            }
        ]
    }
];

const FaqsPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: 'grey.100', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Frequently Asked Questions
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        Have questions? We're here to help.
                    </Typography>
                </Box>

                {faqData.map((categoryItem) => (
                    <Box key={categoryItem.category} sx={{ mb: 4 }}>
                        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                            {categoryItem.category}
                        </Typography>
                        {categoryItem.questions.map((faq, index) => (
                            <Accordion key={index} elevation={2} sx={{ mb: 1 }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`panel${index}-content`}
                                    id={`panel${index}-header`}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>{faq.q}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography color="text.secondary">
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                ))}

                <Paper elevation={3} sx={{ mt: 6, p: 4, textAlign: 'center', borderRadius: '16px' }}>
                     <ContactSupportIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h5" component="h3" gutterBottom>
                        Still have questions?
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Our support team is ready to assist you. Feel free to reach out to us.
                    </Typography>
                    <Button variant="contained" component={MuiLink} href="/contact-us">
                        Contact Us
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default FaqsPage;
