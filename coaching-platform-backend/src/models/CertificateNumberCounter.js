import mongoose from 'mongoose';

const certificateNumberCounterSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        sequence: { type: Number, required: true, default: 0, min: 0 },
    },
    { timestamps: true }
);

export default mongoose.model('CertificateNumberCounter', certificateNumberCounterSchema);
