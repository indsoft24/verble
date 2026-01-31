import mongoose from 'mongoose';
import slugify from 'slugify'; 


const gatedAttachmentSchema = new mongoose.Schema({
    label: {
        type: String,
        required: [true, 'An attachment must have a label (e.g., "Download PDF Notes").'],
        trim: true,
    },
    storagePath: {
        type: String,
        required: true,
        trim: true,
    },
    originalFileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
    }
});

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Blog post title is required.'],
        trim: true,
        unique: true, 
        maxlength: [150, 'Title cannot be more than 150 characters.']
    },
    slug: { 
        type: String,
        unique: true,
        lowercase: true,
        index: true,
    },
    description: { 
        type: String,
        required: [true, 'Short description/excerpt is required.'],
        trim: true,
        maxlength: [300, 'Description cannot be more than 300 characters.']
    },
    content: { 
        type: String,
        required: [true, 'Blog post content is required.'],
    },
    featureImage: { 
        type: String, 
        default: '',
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        trim: true,
        default: 'Uncategorized',
    },
    tags: [{
        type: String,
        trim: true,
    }],
    isPublished: {
        type: Boolean,
        default: false,
        index: true,
    },
    publishedAt: { 
        type: Date,
    },
    views: { 
        type: Number,
        default: 0,
    },
    gatedAttachments: {
        type: [gatedAttachmentSchema],
        default: []
    }
}, {
    timestamps: true 
});

blogPostSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    } else if (this.isModified('isPublished') && !this.isPublished) {
        this.publishedAt = undefined; 
    }
    next();
});


const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;