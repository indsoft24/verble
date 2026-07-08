import mongoose from 'mongoose';

const webinarSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Webinar title is required'],
            trim: true,
            maxlength: 180,
        },
        slug: {
            type: String,
            required: [true, 'Webinar slug is required'],
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        descriptionHtml: {
            type: String,
            default: '',
        },
        imageUrl: {
            type: String,
            trim: true,
            default: '',
        },
        meetingLink: {
            type: String,
            required: [true, 'Meeting link is required'],
            trim: true,
            select: false,
        },
        mode: {
            type: String,
            enum: ['FREE', 'PAID'],
            default: 'FREE',
            required: true,
        },
        price: {
            type: Number,
            min: 0,
            default: 0,
        },
        audience: {
            type: String,
            enum: ['ALL', 'FREE_ONLY', 'PAID_SUBSCRIBERS'],
            default: 'ALL',
            required: true,
        },
        topics: {
            type: [String],
            default: [],
        },
        startsAt: {
            type: Date,
            required: [true, 'Start date/time is required'],
            index: true,
        },
        endsAt: {
            type: Date,
            required: [true, 'End date/time is required'],
            index: true,
        },
        joinWindowBeforeMinutes: {
            type: Number,
            default: 15,
            min: 0,
            max: 240,
        },
        joinWindowAfterMinutes: {
            type: Number,
            default: 30,
            min: 0,
            max: 240,
        },
        isPublished: {
            type: Boolean,
            default: false,
            index: true,
        },
        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
        sortPriority: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

webinarSchema.index({ isPublished: 1, isArchived: 1, startsAt: 1, sortPriority: -1 });
webinarSchema.index({ startsAt: 1, endsAt: 1 });

const Webinar = mongoose.model('Webinar', webinarSchema);
export default Webinar;

