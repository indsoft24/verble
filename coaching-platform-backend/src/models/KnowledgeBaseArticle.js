import mongoose from 'mongoose';

const knowledgeBaseArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'An article must have a title for easy identification.'],
        trim: true,
        unique: true,
    },
    content: {
        type: String,
        required: [true, 'An article must have content for the AI to learn from.'],
        trim: true,
    },
    // Keywords help the AI quickly find the most relevant article for a user's query.
    keywords: {
        type: [String],
        default: [],
        index: true, // Indexing keywords for faster searching
    },
    // Category for organizing articles (e.g., "Getting Started", "Account", "Features", "Troubleshooting")
    category: {
        type: String,
        trim: true,
        index: true,
    },
    // You can use this to enable or disable certain information without deleting it.
    isEnabled: {
        type: Boolean,
        default: true,
        index: true,
    },
    // This helps track who last updated the information.
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const KnowledgeBaseArticle = mongoose.model('KnowledgeBaseArticle', knowledgeBaseArticleSchema);

export default KnowledgeBaseArticle;
