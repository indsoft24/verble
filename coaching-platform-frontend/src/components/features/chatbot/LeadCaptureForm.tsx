import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent
} from '@mui/material';
import { submitChatbotLead, type LeadSubmissionData } from '../../../services/leadService';

const courseOptions = {
    "Law": ["CLAT", "AILET", "DULLB/CUET-PG", "Judiciary", "LLM"],
    "Government Exam": ["UPSC-CSE", "State PCS", "SSC", "Banking", "Railway", "Police"],
    "Engineering": ["JEE Mains", "JEE-Advance"],
    "Medical": ["NEET", "Pharmacy", "Nursing"],
};

interface LeadCaptureFormProps {
    onSuccess: (name: string) => void; // Callback to notify the parent widget of success
}

const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ onSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [course, setCourse] = useState('');
    const [otherCourse, setOtherCourse] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name || !email || !phone) {
            setError("Name, Email, and Phone Number are required.");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        const leadData: LeadSubmissionData = {
            name,
            email,
            phoneNumber: phone,
            interestedCourses: course ? [course] : [],
            otherCourseInterest: otherCourse,
            sourceUrl: window.location.href,
        };

        try {
            await submitChatbotLead(leadData);
            onSuccess(name); // Notify parent of success
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Welcome!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide your details to start chatting with our AI assistant.
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={1}>
                <Grid sx={{width: {xs: '100%'}}}>
                    <TextField label="Full Name" fullWidth required value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
                </Grid>
                <Grid sx={{width: {xs: '100%'}}}>
                    <TextField label="Email Address" type="email" fullWidth required value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} />
                </Grid>
                <Grid sx={{width: {xs: '100%'}}}>
                    <TextField label="Phone Number" fullWidth required value={phone} onChange={e => setPhone(e.target.value)} disabled={isSubmitting} />
                </Grid>
                <Grid sx={{width: {xs: '100%'}}}>
                    <FormControl fullWidth>
                        <InputLabel>Course Preference</InputLabel>
                        <Select value={course} onChange={(e: SelectChangeEvent) => setCourse(e.target.value)} label="Course Preference" disabled={isSubmitting}>
                            <MenuItem value=""><em>None / Not Sure</em></MenuItem>
                            {Object.entries(courseOptions).map(([group, options]) => [
                                <Typography key={group} sx={{ fontWeight: 'bold', pl: 2, my: 1, color: 'text.secondary' }}>{group}</Typography>,
                                ...options.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)
                            ])}
                        </Select>
                    </FormControl>
                </Grid>
                 <Grid sx={{width: {xs: '100%'}}}>
                    <TextField label="Other (if not listed)" fullWidth value={otherCourse} onChange={e => setOtherCourse(e.target.value)} disabled={isSubmitting} />
                </Grid>
                <Grid sx={{width: {xs: '100%'}}}>
                    <Button type="submit" fullWidth variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Start Chat'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default LeadCaptureForm;
