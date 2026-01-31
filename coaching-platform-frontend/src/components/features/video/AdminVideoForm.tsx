import React, { useState, useEffect } from 'react';
import {
    Grid, TextField, FormControlLabel, Switch, Box, Autocomplete, Chip,
    FormControl, InputLabel, Select, OutlinedInput, MenuItem, Button, CircularProgress, Typography
} from '@mui/material';

// Assuming these types are available from your services
import { type SubscriptionPlan } from '../../../services/subscriptionPlanAdminService';
import { type Course } from '../../../services/courseAdminService';
import { type Module } from '../../../services/moduleAdminService';

export interface VideoFormState {
    title: string;
    description: string;
    isPublished: boolean;
    order: number;
    tags: string[];
    courseIds: string[];
    moduleIds: string[];
    requiredPlanIds: string[];
}

interface AdminVideoFormProps {
    isEditMode: boolean;
    initialData: Partial<VideoFormState>;
    onSubmit: (formData: VideoFormState) => void;
    isLoading: boolean;
    availableSubscriptionPlans: SubscriptionPlan[];
    availableCourses: Course[];
    availableModules: Module[];
    formTitle: string;
    submitButtonText: string;
}

const AdminVideoForm: React.FC<AdminVideoFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    availableSubscriptionPlans,
    availableCourses,
    availableModules,
    formTitle,
    submitButtonText
}) => {
    const [formData, setFormData] = useState<VideoFormState>({
        title: '',
        description: '',
        isPublished: false,
        order: 0,
        tags: [],
        courseIds: [],
        moduleIds: [],
        requiredPlanIds: [],
        ...initialData
    });

    useEffect(() => {
        // Update form state if initialData changes (e.g., after a re-fetch)
        setFormData(prev => ({ ...prev, ...initialData }));
    }, [initialData]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = event.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleMultiSelectChange = (event: any) => {
        const { target: { name, value } } = event;
        setFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" component="h3" gutterBottom>
                {formTitle}
            </Typography>
            <Grid container spacing={2}>
                <Grid sx={{width: {sm:'100%'}}}>
                    <TextField name="title" label="Video Title" fullWidth required value={formData.title} onChange={handleChange} disabled={isLoading} />
                </Grid>
                <Grid sx={{width: {sm:'100%'}}}>
                    <TextField name="description" label="Description" fullWidth multiline rows={4} value={formData.description} onChange={handleChange} disabled={isLoading} />
                </Grid>

                {/* Course Selection */}
                <Grid sx={{width: {sm:'100%', md:'50%'}}}>
                     <FormControl fullWidth>
                        <InputLabel id="courses-select-label">Courses</InputLabel>
                        <Select
                            labelId="courses-select-label"
                            name="courseIds"
                            multiple
                            value={formData.courseIds || []}
                            onChange={handleMultiSelectChange}
                            input={<OutlinedInput label="Courses" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const course = availableCourses.find(c => c._id === value);
                                        return <Chip key={value} label={course?.title || value} />;
                                    })}
                                </Box>
                            )}
                        >
                            {availableCourses.map((course) => (
                                <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Module Selection */}
                <Grid sx={{width: {sm:'100%', md:'50%'}}}>
                     <FormControl fullWidth>
                        <InputLabel id="modules-select-label">Modules</InputLabel>
                        <Select
                            labelId="modules-select-label"
                            name="moduleIds"
                            multiple
                            value={formData.moduleIds || []}
                            onChange={handleMultiSelectChange}
                            input={<OutlinedInput label="Modules" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const module = availableModules.find(m => m._id === value);
                                        return <Chip key={value} label={module?.title || value} />;
                                    })}
                                </Box>
                            )}
                        >
                            {availableModules.map((module) => (
                                <MenuItem key={module._id} value={module._id}>{module.title}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Subscription Plan Selection - THE FIX */}
                <Grid sx={{width: {sm:'100%'}}}>
                    <FormControl fullWidth>
                        <InputLabel id="plans-select-label">Required Subscription Plans</InputLabel>
                        <Select
                            labelId="plans-select-label"
                            name="requiredPlanIds"
                            multiple
                            // This ensures the value is always an array, allowing deselection to an empty state
                            value={formData.requiredPlanIds || []} 
                            onChange={handleMultiSelectChange}
                            input={<OutlinedInput label="Required Subscription Plans" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const plan = availableSubscriptionPlans.find(p => p._id === value);
                                        return <Chip key={value} label={plan?.name || value} />;
                                    })}
                                </Box>
                            )}
                        >
                            {availableSubscriptionPlans.map((plan) => (
                                <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid sx={{width: {sm:'100%', md:'50%'}}}>
                    <TextField name="order" label="Order" type="number" fullWidth value={formData.order} onChange={handleChange} disabled={isLoading} />
                </Grid>
                <Grid sx={{width: {sm:'100%', md:'50%'}}}>
                     <FormControlLabel
                        control={<Switch checked={formData.isPublished} onChange={handleChange} name="isPublished" />}
                        label="Is Published"
                        disabled={isLoading}
                    />
                </Grid>
                 <Grid sx={{width: {sm:'100%'}}}>
                    <Autocomplete
                        multiple freeSolo
                        options={[]}
                        value={formData.tags}
                        onChange={(_, newValue) => setFormData(prev => ({...prev, tags: newValue}))}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return <Chip variant="outlined" label={option} key={key} {...tagProps} />;
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Tags" helperText="Press Enter to add." />}
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} /> : submitButtonText}
                </Button>
            </Box>
        </Box>
    );
};

export default AdminVideoForm;