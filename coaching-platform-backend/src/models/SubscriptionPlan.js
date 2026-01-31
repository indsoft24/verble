// src/models/SubscriptionPlan.js
import mongoose from 'mongoose'; 

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subscription plan must have a name.'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    price: {
        type: Number, 
        required: [true, 'Subscription plan must have a price.'],
        min: [0, 'Price cannot be negative.']
    },
    currency: { 
        type: String,
        required: [true, 'Currency is required.'],
        uppercase: true,
        trim: true,
        default: 'INR', 
    },
    duration: { 
        value: { type: Number, required: true }, 
        unit: { type: String, enum: ['day', 'week', 'month', 'year'], required: true },
    },
    features: { 
        type: [String],
        default: [],
    },
    stripePriceId: {
        type: String,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'A subscription plan must be associated with a course.'],
        index: true,
    },
    isActive: { 
        type: Boolean,
        default: true,
    },
    topic: {
        type: String,
        trim: true,
        index: true,
        // This will be used for main categories like 'UPSC', 'Law', 'Government', etc.
    },
    subTopic: {
        type: String,
        trim: true,
        index: true,
        // This will be used for subcategories like 'Full UPSC course', 'Only G.S', 'Only CSAT', 'Optional', etc.
    },
}, {
    timestamps: true 
});

// Indexes for faster queries
subscriptionPlanSchema.index({ name: 1, course: 1 }, { unique: true });
subscriptionPlanSchema.index({ isActive: 1, price: 1 }); // For sorted active plans
subscriptionPlanSchema.index({ topic: 1, subTopic: 1 });
subscriptionPlanSchema.index({ topic: 1, isActive: 1 });
subscriptionPlanSchema.index({ course: 1, isActive: 1, price: 1 }); // For course-specific plans

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;