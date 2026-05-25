/**
 * Seed sample GOLD professional conversations (library, not tied to a single calendar day).
 * Run: node scripts/seed-professional-conversations.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DailyContent from '../src/models/DailyContent.js';

dotenv.config();

const samples = [
    {
        type: 'CONVERSATION',
        level: 'GOLD',
        title: '#1112 Professional — Job interview',
        metadata: {
            isProfessionalLibrary: true,
            participant1: 'Interviewer',
            participant2: 'Candidate',
            dialogue: [
                { speaker: 'Interviewer', text_en: 'Tell me about yourself.', text_hi: 'अपने बारे में बताइए।' },
                { speaker: 'Candidate', text_en: 'I am a software engineer with five years of experience.', text_hi: 'मैं पाँच साल के अनुभव वाला सॉफ्टवेयर इंजीनियर हूँ।' },
            ],
        },
        date: new Date(),
        isActive: true,
        sequenceNumber: 1,
    },
    {
        type: 'CONVERSATION',
        level: 'GOLD',
        title: '#1113 Professional — Client call',
        metadata: {
            isProfessionalLibrary: true,
            participant1: 'Account Manager',
            participant2: 'Client',
            dialogue: [
                { speaker: 'Account Manager', text_en: 'Thank you for joining today’s review.', text_hi: 'आज की समीक्षा में शामिल होने के लिए धन्यवाद।' },
                { speaker: 'Client', text_en: 'We are happy with the progress so far.', text_hi: 'हम अब तक की प्रगति से खुश हैं।' },
            ],
        },
        date: new Date(),
        isActive: true,
        sequenceNumber: 2,
    },
];

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('Set MONGO_URI or MONGODB_URI');
        process.exit(1);
    }
    await mongoose.connect(uri);
    for (const doc of samples) {
        const exists = await DailyContent.findOne({
            type: 'CONVERSATION',
            level: 'GOLD',
            'metadata.isProfessionalLibrary': true,
            title: doc.title,
        });
        if (!exists) {
            await DailyContent.create(doc);
            console.log('Created', doc.title);
        } else {
            console.log('Skip existing', doc.title);
        }
    }
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
