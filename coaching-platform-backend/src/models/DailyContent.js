// src/models/DailyContent.js
import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
    en: { type: String, required: true },
    hi: { type: String, required: true },
    audio: { type: String }
}, { _id: false });

const keywordSchema = new mongoose.Schema({
    word: { type: String, required: true },
    meaning_hi: { type: String, required: true }
}, { _id: false });

const dialogueSchema = new mongoose.Schema({
    speaker: { type: String, required: true },
    text_en: { type: String, required: true },
    text_hi: { type: String, required: true },
    audio: { type: String }
}, { _id: false });

const dailyContentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['WORD', 'PHRASE', 'STORY', 'VOCAB_SET', 'CONVERSATION', 'PUZZLE', 'SCENE', 'SPEECH', 'LYRICS', 'FEED'],
        required: [true, 'Content type is required'],
        index: true,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
    },
    level: {
        type: String,
        enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
        required: [true, 'Level is required'],
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        // Structure varies by type:
        // WORD/PHRASE: { text, meaning_en, meaning_hi, audio, examples: [{en, hi, audio}], synonyms, antonyms, partOfSpeech (WORD only) }
        // STORY: { title, audio, text_content, moral_en, moral_hi, keywords: [{word, meaning_hi}], sentence_translations: [String] }
        // CONVERSATION: { participants: [String], dialogue: [{speaker, text_en, text_hi, audio}] }
        // PUZZLE: { question, options, correct_idx, explanation }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

// Compound index for efficient queries by date and level
dailyContentSchema.index({ date: 1, level: 1 });
dailyContentSchema.index({ type: 1, date: 1 });

const DailyContent = mongoose.model('DailyContent', dailyContentSchema);

export default DailyContent;
