import mongoose from 'mongoose';

const databaseAuditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userEmail: {
            type: String,
            trim: true,
            index: true,
        },
        action: {
            type: String,
            enum: ['create', 'update', 'delete'],
            required: true,
            index: true,
        },
        collectionName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        documentId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        beforeData: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        afterData: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

databaseAuditLogSchema.index({ collectionName: 1, createdAt: -1 });

const DatabaseAuditLog = mongoose.model('DatabaseAuditLog', databaseAuditLogSchema);

export default DatabaseAuditLog;
