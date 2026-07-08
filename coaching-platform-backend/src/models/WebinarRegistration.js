import mongoose from 'mongoose';

const webinarRegistrationSchema = new mongoose.Schema(
    {
        webinarId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Webinar',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_DONE', 'CANCELLED'],
            default: 'REGISTERED',
            index: true,
        },
        accessGrantedBySubscription: {
            type: Boolean,
            default: false,
        },
        payment: {
            amount: { type: Number, default: 0 },
            currency: { type: String, default: 'INR' },
            orderId: { type: String, default: '' },
            paymentId: { type: String, default: '' },
            signature: { type: String, default: '' },
            paidAt: { type: Date },
        },
        notes: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { timestamps: true }
);

webinarRegistrationSchema.index({ webinarId: 1, userId: 1 }, { unique: true });

const WebinarRegistration = mongoose.model('WebinarRegistration', webinarRegistrationSchema);
export default WebinarRegistration;

