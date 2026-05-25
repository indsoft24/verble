import mongoose from 'mongoose';

const dailyContentSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },
        level: {
            type: String,
            enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE', 'BONUS'],
            required: true,
        },
        type: { type: String, required: true },
        sequenceNumber: { type: Number, min: 1 },
        title: { type: String, trim: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

dailyContentSchema.index({ date: 1, level: 1, type: 1 });
dailyContentSchema.index({ type: 1, level: 1, sequenceNumber: 1 });

const DailyContent = mongoose.model('DailyContent', dailyContentSchema);
export default DailyContent;
