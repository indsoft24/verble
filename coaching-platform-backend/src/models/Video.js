import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    label: {
        type: String,
        required: [true, 'Each material must have a label.'],
        trim: true,
    },
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    storageUrl: {
        type: String,
        required: true,
        trim: true,
    },
    storagePath: {
        type: String,
        required: true,
        trim: true,
    },
    fileSize: {
        type: Number,
    },
    fileType: {
        type: String, 
    }
}, {
    timestamps: true 
});


const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Video must have a title.'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters.'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters.'],
    },
    bunnyVideoLibraryId: { 
        type: String, 
        required: [true, "Bunny Stream Video Library ID is required."],
    },
    bunnyVideoId: { 
        type: String, 
        required: [true, "Bunny Stream Video ID is required."],
        unique: true, 
        index: true,
    },
    bunnyStreamUrl: { type: String, trim: true },
    bunnyThumbnailUrl: { type: String, trim: true },
    durationSeconds: { type: Number, min: 0, default: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    videoStatus: {
        type: String,
        enum: [
            'METADATA_CREATED', 'PENDING_UPLOAD', 'UPLOADING', 
            'UPLOADED', 'PROCESSING', 'AVAILABLE', 'FAILED',
        ],
        default: 'METADATA_CREATED',
        required: true,
        index: true,
    },
    bunnyProcessingProgress: { type: Number, default: 0, min: 0, max: 100 },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    order: { type: Number, default: 0 },
    requiredPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    isPublished: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    associatedMaterials: {
        type: [materialSchema],
        default: []
    }

}, {
    timestamps: true
});

// Indexes for faster queries
videoSchema.index({ courses: 1 });
videoSchema.index({ modules: 1 });
videoSchema.index({ requiredPlans: 1 });
videoSchema.index({ isPublished: 1, order: 1, createdAt: -1 }); // Compound index for list queries
videoSchema.index({ isPublished: 1, modules: 1, order: 1 }); // For module videos
videoSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search index

const Video = mongoose.model('Video', videoSchema);
export default Video;
