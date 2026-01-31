import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A name is required.'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'An email is required.'],
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'A phone number is required.'],
        trim: true,
    },
    interestedCourses: {
        type: [String],
        default: [],
    },
    otherCourseInterest: {
        type: String,
        trim: true,
    },
    sourceUrl: {
        type: String,
        required: true,
    },
    
}, {
    timestamps: true 
});

leadSchema.index({ email: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;