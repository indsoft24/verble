import mongoose from 'mongoose';
import slugify from 'slugify'; 

const examCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'An exam category must have a name.'],
        unique: true,
        trim: true,
        maxlength: [100, 'Category name cannot be more than 100 characters.'],
    },
    slug: {
        type: String,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters.'],
    },
    imageUrl: {
        type: String, 
    },
    isPublished: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true
});

examCategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

const ExamCategory = mongoose.model('ExamCategory', examCategorySchema);

export default ExamCategory;
