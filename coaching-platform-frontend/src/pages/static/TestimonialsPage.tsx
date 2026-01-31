import React from 'react';
import { Container, Typography, Box, Grid, Paper, Avatar, Rating } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

// --- Mock Data for Testimonials ---
// You can replace this with data fetched from your backend later.
const testimonials = [
  {
    name: 'Priya Sharma',
    course: 'UPSC - CSE Foundation',
    avatar: '/path/to/priya.jpg', // Placeholder path
    rating: 5,
    quote: "Verble's structured approach and expert faculty were instrumental in my success. The detailed study materials and regular mock tests gave me the confidence I needed to crack the exam."
  },
  {
    name: 'Rohan Mehra',
    course: 'CLAT Crash Course',
    avatar: '/path/to/rohan.jpg',
    rating: 5,
    quote: "The crash course was a game-changer. The faculty focused on exactly the right topics and strategies. I wouldn't have been able to score this well without their guidance. Highly recommended!"
  },
  {
    name: 'Anjali Singh',
    course: 'JEE Mains Advanced',
    avatar: '/path/to/anjali.jpg',
    rating: 4.5,
    quote: "The quality of the video lectures is outstanding. Complex topics were broken down into simple, understandable concepts. The doubt-solving sessions were also incredibly helpful."
  },
  {
    name: 'Vikram Patel',
    course: 'Banking - PO Exam',
    avatar: '/path/to/vikram.jpg',
    rating: 5,
    quote: "From the foundational concepts to advanced problem-solving tricks, everything was covered perfectly. The platform is user-friendly and the support team is always responsive."
  },
    {
    name: 'Sneha Gupta',
    course: 'NEET Preparation',
    avatar: '/path/to/sneha.jpg',
    rating: 5,
    quote: "The personalized mentorship program at Verble is what sets them apart. My mentor guided me at every step, helping me identify my weak areas and improve my scores significantly."
  },
  {
    name: 'Amit Kumar',
    course: 'SSC CGL Tier 1 & 2',
    avatar: '/path/to/amit.jpg',
    rating: 4.5,
    quote: "An incredible resource for government exam aspirants. The content is up-to-date with the latest exam patterns, and the variety of practice questions is immense."
  },
];

const TestimonialCard: React.FC<typeof testimonials[0]> = ({ name, course, rating, quote }) => (
    <Paper
        elevation={4}
        sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            transition: 'all 0.3s',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 8,
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                {name.charAt(0)}
            </Avatar>
            <Box>
                <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                <Typography variant="body2" color="text.secondary">{course}</Typography>
            </Box>
        </Box>
        <Rating value={rating} precision={0.5} readOnly sx={{ mb: 2 }} />
        <Box sx={{ position: 'relative', flexGrow: 1 }}>
             <FormatQuoteIcon sx={{ position: 'absolute', top: -10, left: -10, fontSize: '3rem', color: 'primary.light', opacity: 0.5 }} />
            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                "{quote}"
            </Typography>
        </Box>
    </Paper>
);


const TestimonialsPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 8 } }}>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        What Our Students Say
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1, maxWidth: '700px', mx: 'auto' }}>
                        We are proud to have helped thousands of students achieve their academic and career goals.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {testimonials.map((testimonial, index) => (
                        <Grid sx={{width:{xs:'100%', sm: '47%', md: '31%'}}} key={index}>
                            <TestimonialCard {...testimonial} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default TestimonialsPage;
