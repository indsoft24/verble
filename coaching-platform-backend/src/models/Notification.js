import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'A notification must have a title.'],
        trim: true,
    },
    message: {
        type: String,
        required: [true, 'A notification must have a message.'],
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    link: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['announcement', 'new_content', 'subscription', 'default'],
        default: 'default',
    },
    categoryKey: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'general',
        index: true,
    },
    categoryLabel: {
        type: String,
        trim: true,
    },
    examCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamCategory',
        index: true,
    },
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;