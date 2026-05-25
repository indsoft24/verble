// scripts/seedData.js
// Comprehensive seed script for Verble English Learning App
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import models
import User from '../src/models/User.js';
import DailyContent from '../src/models/DailyContent.js';
import SubscriptionPlan from '../src/models/SubscriptionPlan.js';
import Course from '../src/models/Course.js';
import Module from '../src/models/Module.js';
import ExamCategory from '../src/models/ExamCategory.js';
import AIPrompt from '../src/models/AIPrompt.js';
import Offer from '../src/models/Offer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Helper function to get dates
const getDate = (daysFromNow = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 0, 0, 0);
    return date;
};

const seedData = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.DOCKER_ENV 
            ? (process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI)
            : (process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER);
        
        if (!mongoURI) {
            throw new Error('MongoDB URI not found. Please set MONGODB_URI in your .env file.');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Always reset core catalog data for production-consistent seeding
        console.log('🗑️  Resetting existing catalog data (courses, modules, subscription plans, offers)...');
        await SubscriptionPlan.deleteMany({});
        await Module.deleteMany({});
        await Course.deleteMany({});
        await Offer.deleteMany({});
        console.log('✅ Core catalog data reset complete\n');

        // Get admin user for createdBy fields
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('⚠️  No admin user found. Please run: node scripts/createAdmin.js');
            process.exit(1);
        }

        // 1. Seed Exam Categories
        console.log('📚 Seeding Exam Categories...');
        const examCategory = await ExamCategory.findOneAndUpdate(
            { name: 'English Learning' },
            {
                name: 'English Learning',
                description: 'Comprehensive English learning courses',
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Created Exam Category: ${examCategory.name}`);

        // 2. Seed Course
        console.log('\n📖 Seeding Courses...');
        const course = await Course.create({
            title: 'Verble English Mastery - Zero to Hero',
            description: '200-hour practical English transformation program with 100 videos, 08 modules, 80 quizzes, AI-assisted practice, and real-life communication training.',
            image: '/images/courses/verble-zero-to-hero.jpg',
            examCategory: examCategory._id,
            isPublished: true
        });
        console.log(`✅ Created Course: ${course.title}`);

        // 3. Seed Subscription Plans
        console.log('\n💳 Seeding Subscription Plans...');
        const plans = [
            {
                name: 'Free Foundation',
                description: 'Daily foundational practice with words and phrase building.',
                price: 0,
                currency: 'INR',
                duration: { value: 999, unit: 'day' },
                features: [
                    'Daily Word (1000+ words so far)',
                    'Phrase Building (500+ phrases)'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Free',
                marketValue: 1999,
                displayOrder: 1,
                badge: 'Foundation'
            },
            {
                name: 'Bronze Content',
                description: 'Reading fluency and essential vocabulary progression.',
                price: 1499,
                currency: 'INR',
                duration: { value: 1, unit: 'month' },
                features: [
                    'Daily One Minute Article (300+ stories)',
                    'Essential Vocabulary'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Bronze',
                marketValue: 1999,
                displayOrder: 2
            },
            {
                name: 'Silver Content',
                description: 'Real-life communication and grammar puzzle practice.',
                price: 2999,
                currency: 'INR',
                duration: { value: 1, unit: 'month' },
                features: [
                    'Practical conversations',
                    'Daily Puzzle: Spot the Correct Sentence',
                    'Daily Puzzle: Correct Use of Grammar'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Silver',
                marketValue: 4999,
                displayOrder: 3
            },
            {
                name: 'Gold Professional',
                description: 'Professional communication tracks and AI prompts.',
                price: 4999,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: [
                    'Explain Scene/Situation with key words',
                    'Professional Conversations (Airport Immigration, Job Interviews, Client Meetings)',
                    'Ready-to-Use AI Prompts'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Gold',
                marketValue: 9999,
                displayOrder: 4
            },
            {
                name: 'Full Course',
                description: 'Zero to Hero complete curriculum with quizzes and long-form lectures.',
                price: 9999,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: [
                    'Zero to Hero 200 hours of lectures',
                    '100 Videos, 08 Modules, 80 Quiz, 200 hours of video',
                    'Phonetics to nouns, pronouns, tenses and advanced modals',
                    'Module-specific quizzes',
                    'Life Time Access'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Full Course',
                marketValue: 20999,
                displayOrder: 5,
                badge: 'Best Value'
            },
            {
                name: 'AI Learning Companion',
                description: 'Multilingual AI-guided speaking and typing support.',
                price: 0,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: [
                    'Learn in English, Hindi, Hinglish',
                    'Speak or Type to learn'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'AI Learning',
                marketValue: 5999,
                displayOrder: 6
            },
            {
                name: 'Bonus Extras',
                description: 'Supplemental practice bundle included with paid modules.',
                price: 0,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: [
                    'Famous Speeches (Priyanka Chopra, APJ Kalam analysis)',
                    'Song Lyrics (Ed Sheeran lyrics + vocabulary)',
                    'Curated Instagram Learning Feeds'
                ],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Bonus',
                displayOrder: 7,
                badge: 'Free with bundle'
            }
        ];

        const createdPlans = [];
        for (const planData of plans) {
            const plan = await SubscriptionPlan.findOneAndUpdate(
                { name: planData.name, course: course._id },
                planData,
                { upsert: true, new: true }
            );
            createdPlans.push(plan);
            console.log(`✅ Created Plan: ${plan.name} - ₹${plan.price}`);
        }

        // 4. Seed Modules
        console.log('\n📦 Seeding Modules...');
        const modules = [
            {
                title: 'Module 00',
                description: 'Course onboarding and orientation.',
                chapters: ['Introductions', 'Why English?', 'Meet your coach', 'Who this course is for?', 'Our Mission'],
                course: course._id,
                subscriptionPlans: [createdPlans[0]._id, createdPlans[1]._id, createdPlans[2]._id, createdPlans[3]._id, createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 1
            },
            {
                title: 'Module 01',
                timeline: 'Week 01 to 03',
                description: 'Foundational phonetics and number systems.',
                chapters: ['Alphabets and phonetics and sounds', 'Bara-khadi (in English)', 'Counting', 'Sequencing / Ranking', 'Fractions and multiples'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 2
            },
            {
                title: 'Module 01',
                timeline: 'Week 04 to 05',
                description: 'Advanced pronunciation and sound patterns.',
                chapters: ['Multiple sounds of consonants - C, G, S, T, etc.', 'Silent letters - K, L, B, N, P, etc.', 'Sounds of vowels - A, E, I, O, U'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 3
            },
            {
                title: 'Module 02',
                timeline: 'Week 06',
                description: 'Core grammar classification and lexical understanding.',
                chapters: [
                    'Genders in humans',
                    'Genders in professions',
                    'Genders in animals',
                    'Babies of everyone',
                    'Singular and Plural (simple and complex)',
                    'Opposite of verbs',
                    'Opposite of nouns and pronouns',
                    'Opposite of adjectives',
                    'Confusing words: Homophones, Homographs, Homonyms'
                ],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 4
            },
            {
                title: 'Module 03',
                description: 'Parts of speech: nouns, pronouns, and verbs.',
                chapters: ['Noun', 'Pronoun', 'Verb'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 5
            },
            {
                title: 'Module 04',
                description: 'Descriptive and modifying language elements.',
                chapters: ['Adjective', 'Adverb'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 6
            },
            {
                title: 'Module 05',
                description: 'Sentence connectors and expressive words.',
                chapters: ['Conjunctions', 'Interjections', 'Prepositions'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 7
            },
            {
                title: 'Module 06',
                description: 'Sentence framing and article usage.',
                chapters: ['Punctuations', 'Article (A, An, The)', 'Part of Sentences', 'Form of Sentences'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 8
            },
            {
                title: 'Module 07',
                description: 'Tense mastery and practical usage.',
                chapters: ['Present tense', 'Past Tense', 'Future Tense'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 9
            },
            {
                title: 'Module 08',
                description: 'Modals and advanced application patterns.',
                chapters: ['Modals - Can, May, Must, Could, Might, Should, Would, etc.'],
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 10
            },
            {
                title: 'Bonus',
                description: 'Additional vocabulary and fluency accelerators.',
                chapters: ['3 letter words', '4 letter words', 'How to say time in English', 'Common Vocabulary - Kitchen, Living, Transport, Body Parts, Dining, Birds, Animals and 50+ more'],
                course: course._id,
                subscriptionPlans: [createdPlans[3]._id, createdPlans[4]._id, createdPlans[5]._id, createdPlans[6]._id],
                order: 11
            }
        ];

        const createdModules = [];
        for (const moduleData of modules) {
            const module = await Module.findOneAndUpdate(
                { title: moduleData.title, course: course._id },
                moduleData,
                { upsert: true, new: true }
            );
            createdModules.push(module);
            console.log(`✅ Created Module: ${module.title}`);
        }

        // 5. Seed Daily Content - Words (Free Content curriculum: 10 days, one word per day)
        console.log('\n📝 Seeding Daily Content - Words...');
        const freeWordRows = [
            { num: 1, text: 'grateful', pronunciation_ipa: "/'greɪtfʊl/", pronunciation_devanagari: 'ग्रेट-फुल', partOfSpeech: 'adjective', meaning_en: 'Feeling or showing thanks', meaning_hi: 'कृतज्ञ, आभारी', example_en: 'I am grateful for your help.', example_hi: 'मैं आपकी मदद के लिए कृतज्ञ हूँ।', synonyms: ['thankful', 'appreciative'], antonyms: ['ungrateful', 'unthankful'] },
            { num: 2, text: 'curious', pronunciation_ipa: "/'kjʊəriəs/", pronunciation_devanagari: 'क्यूरि-अस', partOfSpeech: 'adjective', meaning_en: 'Eager to know or learn something', meaning_hi: 'जिज्ञासु', example_en: 'Children are naturally curious.', example_hi: 'बच्चे स्वभाव से जिज्ञासु होते हैं।', synonyms: ['inquisitive', 'interested'], antonyms: ['indifferent', 'uninterested'] },
            { num: 3, text: 'attempt', pronunciation_ipa: '/əˈtempt/ (v), /əˈtempt/ (n)', pronunciation_devanagari: 'अट्टेम्प्ट', partOfSpeech: 'noun / verb', meaning_en: 'An act of trying to do something; to try to do something', meaning_hi: 'प्रयास करना / प्रयास', example_en: 'She will attempt the exam again.', example_hi: 'वह परीक्षा दोबारा देने का प्रयास करेगी।', synonyms: ['try', 'effort'], antonyms: ['refusal', 'avoidance'] },
            { num: 4, text: 'silent', pronunciation_ipa: "/'saɪlənt/", pronunciation_devanagari: 'साइलन्ट', partOfSpeech: 'adjective', meaning_en: 'Not making any sound', meaning_hi: 'शांत, मौन', example_en: 'The library is a silent place.', example_hi: 'पुस्तकालय एक शांत जगह है।', synonyms: ['quiet', 'mute'], antonyms: ['loud', 'noisy'] },
            { num: 5, text: 'improve', pronunciation_ipa: '/ɪmˈpruːv/', pronunciation_devanagari: 'इम्प्रूव', partOfSpeech: 'verb', meaning_en: 'To make something better', meaning_hi: 'सुधार करना', example_en: 'You should read daily to improve your English.', example_hi: 'अपनी अंग्रेज़ी सुधारने के लिए तुम्हें रोज़ पढ़ना चाहिए।', synonyms: ['develop', 'enhance'], antonyms: ['worsen', 'decline'] },
            { num: 6, text: 'honest', pronunciation_ipa: '/ˈɒnɪst/ or /ˈɑːnɪst/', pronunciation_devanagari: 'ऑनिस्ट', partOfSpeech: 'adjective', meaning_en: 'Telling the truth, not cheating or stealing', meaning_hi: 'ईमानदार', example_en: 'An honest person is trusted by everyone.', example_hi: 'एक ईमानदार व्यक्ति पर सभी भरोसा करते हैं।', synonyms: ['truthful', 'sincere'], antonyms: ['dishonest', 'corrupt'] },
            { num: 7, text: 'delay', pronunciation_ipa: '/dɪˈleɪ/', pronunciation_devanagari: 'डिले', partOfSpeech: 'noun / verb', meaning_en: 'A period of waiting before something happens; to make something late', meaning_hi: 'देरी / देर करना', example_en: 'The train arrived after a short delay.', example_hi: 'ट्रेन थोड़ी देरी के बाद पहुँची।', synonyms: ['postpone', 'defer'], antonyms: ['advance', 'hasten'] },
            { num: 8, text: 'polite', pronunciation_ipa: '/pəˈlaɪt/', pronunciation_devanagari: 'पलाइट', partOfSpeech: 'adjective', meaning_en: 'Having good manners, speaking respectfully', meaning_hi: 'विनम्र, शिष्ट', example_en: 'Always be polite to your teachers.', example_hi: 'अपने शिक्षकों के प्रति हमेशा विनम्र रहो।', synonyms: ['courteous', 'respectful'], antonyms: ['rude', 'impolite'] },
            { num: 9, text: 'borrow', pronunciation_ipa: '/ˈbɒrəʊ/ or /ˈbɑːroʊ/', pronunciation_devanagari: 'बॉरो', partOfSpeech: 'verb', meaning_en: 'To take something from someone with the intention of returning it', meaning_hi: 'उधार लेना', example_en: 'Can I borrow your pen for a minute?', example_hi: 'क्या मैं आपका पेन एक मिनट के लिए उधार ले सकता हूँ?', synonyms: ['take', 'obtain'], antonyms: ['lend', 'return'] },
            { num: 10, text: 'protect', pronunciation_ipa: '/prəˈtekt/', pronunciation_devanagari: 'प्रोटेक्ट', partOfSpeech: 'verb', meaning_en: 'To keep someone or something safe', meaning_hi: 'रक्षा करना, बचाना', example_en: 'Parents protect their children from danger.', example_hi: 'माता-पिता अपने बच्चों को ख़तरे से बचाते हैं।', synonyms: ['guard', 'defend'], antonyms: ['attack', 'harm'] },
        ];
        const words = freeWordRows.map((row) => ({
            type: 'WORD',
            date: getDate(row.num - 1),
            level: 'FREE',
            title: `Word of the Day — ${row.text}`,
            metadata: {
                wordNumber: row.num,
                text: row.text,
                pronunciation_ipa: row.pronunciation_ipa,
                pronunciation_devanagari: row.pronunciation_devanagari,
                partOfSpeech: row.partOfSpeech,
                meaning_en: row.meaning_en,
                meaning_hi: row.meaning_hi,
                examples: [{ en: row.example_en, hi: row.example_hi }],
                synonyms: row.synonyms,
                antonyms: row.antonyms,
            },
            isActive: true,
            createdBy: adminUser._id,
        }));

        for (const word of words) {
            await DailyContent.findOneAndUpdate(
                { type: 'WORD', date: word.date, level: word.level },
                word,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${words.length} words (Free Content set)`);

        // 6. Seed Daily Content - Phrases (same 10 days as words)
        console.log('\n💬 Seeding Daily Content - Phrases...');
        const freePhraseRows = [
            { num: 1, text: 'How are you?', pronunciation_devanagari: 'हाउ आर यू?', meaning_en: "Asking about someone's well-being", meaning_hi: 'आप कैसे हैं?', example_en: 'How are you today?', example_hi: 'आज आप कैसे हैं?' },
            { num: 2, text: 'Thank you', pronunciation_devanagari: 'थैंक यू', meaning_en: 'Expression of gratitude', meaning_hi: 'धन्यवाद / शुक्रिया', example_en: 'Thank you for your help.', example_hi: 'आपकी मदद के लिए धन्यवाद।' },
            { num: 3, text: 'Excuse me', pronunciation_devanagari: 'एक्सक्यूज़ मी', meaning_en: 'Polite way to get attention or pass by', meaning_hi: 'माफ़ कीजिए', example_en: 'Excuse me, where is the washroom?', example_hi: 'माफ़ कीजिए, वॉशरूम कहाँ है?' },
            { num: 4, text: 'I am sorry', pronunciation_devanagari: 'आइ एम सॉरी', meaning_en: 'Saying you feel bad for a mistake', meaning_hi: 'मुझे माफ़ कीजिए', example_en: 'I am sorry for being late.', example_hi: 'देर से आने के लिए मुझे माफ़ कीजिए।' },
            { num: 5, text: 'Please wait', pronunciation_devanagari: 'प्लीज़ वेट', meaning_en: 'Requesting someone to wait', meaning_hi: 'कृपया इंतज़ार कीजिए', example_en: 'Please wait for two minutes.', example_hi: 'कृपया दो मिनट इंतज़ार कीजिए।' },
            { num: 6, text: 'What is your name?', pronunciation_devanagari: 'व्हॉट इज़ योर नेम?', meaning_en: "Asking someone's name", meaning_hi: 'आपका नाम क्या है?', example_en: 'What is your name?', example_hi: 'आपका नाम क्या है?' },
            { num: 7, text: 'Nice to meet you', pronunciation_devanagari: 'नाइस टू मीट यू', meaning_en: 'A polite phrase when meeting someone', meaning_hi: 'आपसे मिलकर अच्छा लगा', example_en: 'Nice to meet you, Rahul.', example_hi: 'राहुल, आपसे मिलकर अच्छा लगा।' },
            { num: 8, text: "I don't understand", pronunciation_devanagari: 'आइ डोन्ट अंडरस्टैन्ड', meaning_en: 'Saying you are not able to understand', meaning_hi: 'मुझे समझ नहीं आया', example_en: "I'm sorry, I don't understand.", example_hi: 'माफ़ कीजिए, मुझे समझ नहीं आया।' },
            { num: 9, text: 'Please speak slowly', pronunciation_devanagari: 'प्लीज़ स्पीक स्लोली', meaning_en: 'Requesting someone to talk more slowly', meaning_hi: 'कृपया धीरे बोलिए', example_en: 'Please speak slowly, I am learning English.', example_hi: 'कृपया धीरे बोलिए, मैं अंग्रेज़ी सीख रहा हूँ।' },
            { num: 10, text: 'Can you help me?', pronunciation_devanagari: 'कैन यू हेल्प मी?', meaning_en: 'Asking for help', meaning_hi: 'क्या आप मेरी मदद कर सकते हैं?', example_en: 'Can you help me with this form?', example_hi: 'क्या आप इस फ़ॉर्म में मेरी मदद कर सकते हैं?' },
        ];
        const phrases = freePhraseRows.map((row) => ({
            type: 'PHRASE',
            date: getDate(row.num - 1),
            level: 'FREE',
            title: `Phrase of the Day — ${row.text}`,
            metadata: {
                phraseNumber: row.num,
                text: row.text,
                pronunciation_devanagari: row.pronunciation_devanagari,
                meaning_en: row.meaning_en,
                meaning_hi: row.meaning_hi,
                examples: [{ en: row.example_en, hi: row.example_hi }],
            },
            isActive: true,
            createdBy: adminUser._id,
        }));

        for (const phrase of phrases) {
            await DailyContent.findOneAndUpdate(
                { type: 'PHRASE', date: phrase.date, level: phrase.level },
                phrase,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${phrases.length} phrases (Free Content set)`);

        // 7. Seed Daily Content - Stories
        console.log('\n📖 Seeding Daily Content - Stories...');
        const stories = [
            {
                type: 'STORY',
                date: getDate(0),
                level: 'BRONZE',
                title: 'The Ant and the Grasshopper',
                metadata: {
                    title: 'The Ant and the Grasshopper',
                    audio: '/audio/stories/ant-grasshopper.mp3',
                    text_content: 'Once upon a time, there was an ant who worked hard all summer collecting food for winter. Meanwhile, a grasshopper spent the summer singing and playing. When winter came, the ant had plenty of food, but the grasshopper was hungry and learned the importance of hard work.',
                    moral_en: 'Hard work and preparation are important for future success.',
                    moral_hi: 'कड़ी मेहनत और तैयारी भविष्य की सफलता के लिए महत्वपूर्ण हैं।',
                    keywords: [
                        { word: 'ant', meaning_hi: 'चींटी' },
                        { word: 'grasshopper', meaning_hi: 'टिड्डा' },
                        { word: 'winter', meaning_hi: 'सर्दी' },
                        { word: 'collecting', meaning_hi: 'इकट्ठा करना' },
                        { word: 'preparation', meaning_hi: 'तैयारी' }
                    ],
                    sentence_translations: [
                        'एक बार एक चींटी थी जो पूरी गर्मी कड़ी मेहनत करके सर्दी के लिए भोजन इकट्ठा करती थी।',
                        'इस बीच, एक टिड्डा गर्मी गाना गाकर और खेलकर बिताता था।',
                        'जब सर्दी आई, तो चींटी के पास बहुत सारा भोजन था, लेकिन टिड्डा भूखा था और कड़ी मेहनत के महत्व को सीखा।'
                    ]
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const story of stories) {
            await DailyContent.findOneAndUpdate(
                { type: 'STORY', date: story.date, level: story.level },
                story,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${stories.length} stories`);

        // 8. Seed Daily Content - Conversations
        console.log('\n🗣️  Seeding Daily Content - Conversations...');
        const conversations = [
            {
                type: 'CONVERSATION',
                date: getDate(0),
                level: 'SILVER',
                title: 'At the Restaurant',
                metadata: {
                    participants: ['Waiter', 'Customer'],
                    dialogue: [
                        {
                            speaker: 'Waiter',
                            text_en: 'Good evening! Welcome to our restaurant. Do you have a reservation?',
                            text_hi: 'शुभ संध्या! हमारे रेस्तरां में आपका स्वागत है। क्या आपने आरक्षण किया है?',
                            audio: '/audio/conversations/waiter1.mp3'
                        },
                        {
                            speaker: 'Customer',
                            text_en: 'Yes, I have a reservation under the name Smith.',
                            text_hi: 'हाँ, मेरा नाम स्मिथ के तहत आरक्षण है।',
                            audio: '/audio/conversations/customer1.mp3'
                        },
                        {
                            speaker: 'Waiter',
                            text_en: 'Perfect! Please follow me to your table.',
                            text_hi: 'बिल्कुल! कृपया अपनी मेज पर मेरे साथ आएं।',
                            audio: '/audio/conversations/waiter2.mp3'
                        }
                    ]
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const conversation of conversations) {
            await DailyContent.findOneAndUpdate(
                { type: 'CONVERSATION', date: conversation.date, level: conversation.level },
                conversation,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${conversations.length} conversations`);

        // 9. Seed Daily Content - Puzzles
        console.log('\n🧩 Seeding Daily Content - Puzzles...');
        const puzzles = [
            {
                type: 'PUZZLE',
                date: getDate(0),
                level: 'FREE',
                title: 'Spot the Correct Sentence - 1',
                metadata: {
                    question: 'Which sentence is grammatically correct?',
                    options: [
                        'I have went to the store yesterday.',
                        'I went to the store yesterday.',
                        'I have go to the store yesterday.',
                        'I go to the store yesterday.'
                    ],
                    correct_idx: 1,
                    explanation: 'The correct sentence uses the simple past tense "went" for an action completed in the past with a specific time (yesterday).'
                },
                isActive: true,
                createdBy: adminUser._id
            },
            {
                type: 'PUZZLE',
                date: getDate(0),
                level: 'FREE',
                title: 'Correct Use of Grammar - 1',
                metadata: {
                    question: 'Choose the correct form: "She _____ to the library every day."',
                    options: ['go', 'goes', 'going', 'gone'],
                    correct_idx: 1,
                    explanation: 'The correct answer is "goes" because the subject "She" is third person singular, requiring the verb form with "es".'
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const puzzle of puzzles) {
            await DailyContent.findOneAndUpdate(
                { type: 'PUZZLE', date: puzzle.date, level: puzzle.level, title: puzzle.title },
                puzzle,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${puzzles.length} puzzles (FREE samples + curriculum)`);

        const silverGrammarPuzzles = [
            {
                type: 'PUZZLE',
                date: getDate(0),
                level: 'SILVER',
                title: 'Correct Use of Grammar - Day 1',
                metadata: {
                    questions: [
                        { question: 'She ___ to school every day. (choose the correct word)', options: ['go', 'goes', 'going'], correct_idx: 1, explanation: '' },
                        { question: 'Yesterday we ___ football.', options: ['play', 'played', 'playing'], correct_idx: 1, explanation: '' },
                        { question: 'They ___ TV right now.', options: ['watch', 'watches', 'watching'], correct_idx: 2, explanation: '' },
                        { question: 'He ___ this book before.', options: ['read', 'reads', 'has read'], correct_idx: 2, explanation: '' },
                        { question: 'If it ___ , we will stay home.', options: ['rain', 'rains', 'rained'], correct_idx: 1, explanation: '' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'PUZZLE',
                date: getDate(1),
                level: 'SILVER',
                title: 'Correct Use of Grammar - Day 2',
                metadata: {
                    questions: [
                        { question: 'My brother ___ engineer.', options: ['is', 'are', 'am'], correct_idx: 0, explanation: '' },
                        { question: 'She ___ coffee every morning.', options: ['drink', 'drinks', 'drinking'], correct_idx: 1, explanation: '' },
                        { question: 'We ___ this movie last week.', options: ['see', 'saw', 'seen'], correct_idx: 1, explanation: '' },
                        { question: 'They ___ working since 9 AM.', options: ['are', 'have been', 'has'], correct_idx: 1, explanation: '' },
                        { question: 'Tomorrow I ___ you at 5 PM.', options: ['meet', 'will meet', 'met'], correct_idx: 1, explanation: '' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'PUZZLE',
                date: getDate(2),
                level: 'SILVER',
                title: 'Correct Use of Grammar - Day 3',
                metadata: {
                    questions: [
                        { question: 'The children ___ in the park.', options: ['play', 'plays', 'playing'], correct_idx: 0, explanation: '' },
                        { question: 'He ___ his homework yet.', options: ['finish', 'finishes', "hasn't finished"], correct_idx: 2, explanation: '' },
                        { question: 'She ___ me a gift yesterday.', options: ['give', 'gave', 'gives'], correct_idx: 1, explanation: '' },
                        { question: 'We ___ to Delhi next month.', options: ['go', 'goes', 'will go'], correct_idx: 2, explanation: '' },
                        { question: 'This is the ___ cake I ever ate.', options: ['good', 'better', 'best'], correct_idx: 2, explanation: '' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'PUZZLE',
                date: getDate(3),
                level: 'SILVER',
                title: 'Correct Use of Grammar - Day 4',
                metadata: {
                    questions: [
                        { question: '___ you like tea or coffee?', options: ['Do', 'Does', 'Did'], correct_idx: 0, explanation: '' },
                        { question: 'They ___ late for the meeting.', options: ['was', 'were', 'are'], correct_idx: 1, explanation: '' },
                        { question: 'She ___ singing since childhood.', options: ['is', 'has been', 'have'], correct_idx: 1, explanation: '' },
                        { question: 'He ___ the newspaper every day.', options: ['read', 'reads', 'reading'], correct_idx: 1, explanation: '' },
                        { question: 'By next year, I ___ this course.', options: ['complete', 'will complete', 'completed'], correct_idx: 1, explanation: '' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'PUZZLE',
                date: getDate(4),
                level: 'SILVER',
                title: 'Correct Use of Grammar - Day 5',
                metadata: {
                    questions: [
                        { question: 'The cat ___ on the mat.', options: ['sit', 'sits', 'sitting'], correct_idx: 1, explanation: '' },
                        { question: 'We ___ this song before.', options: ['hear', 'heard', 'have heard'], correct_idx: 2, explanation: '' },
                        { question: 'She ___ her keys yesterday.', options: ['lose', 'lost', 'loses'], correct_idx: 1, explanation: '' },
                        { question: 'They ___ to the party now.', options: ['go', 'goes', 'are going'], correct_idx: 2, explanation: '' },
                        { question: 'He ___ harder than anyone else.', options: ['work', 'works', 'working'], correct_idx: 1, explanation: '' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        for (const sp of silverGrammarPuzzles) {
            await DailyContent.findOneAndUpdate(
                { type: 'PUZZLE', date: sp.date, level: sp.level, title: sp.title },
                sp,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${silverGrammarPuzzles.length} Silver grammar puzzle sets (5 questions each)`);

        // 10. Seed Daily Content - Vocabulary Sets (Bronze: Essential Vocabulary — 4 themes × 10 words)
        console.log('\n📚 Seeding Daily Content - Vocabulary Sets...');
        const vocabSets = [
            {
                type: 'VOCAB_SET',
                date: getDate(0),
                level: 'BRONZE',
                title: 'Kitchen vocabulary',
                metadata: {
                    theme: 'Kitchen',
                    vocabSetNumber: 1,
                    themeImageDescription: 'A modern kitchen with utensils, stove, and fridge',
                    vocabItems: [
                        { word: 'knife', pronunciation_hi: 'नाइफ़', meaning_hi: 'चाकू' },
                        { word: 'spoon', pronunciation_hi: 'स्पून', meaning_hi: 'चम्मच' },
                        { word: 'plate', pronunciation_hi: 'प्लेट', meaning_hi: 'थाली' },
                        { word: 'stove', pronunciation_hi: 'स्टोव', meaning_hi: 'चूल्हा' },
                        { word: 'fridge', pronunciation_hi: 'फ्रिज', meaning_hi: 'फ्रिज' },
                        { word: 'cup', pronunciation_hi: 'कप', meaning_hi: 'कप' },
                        { word: 'fork', pronunciation_hi: 'फोर्क', meaning_hi: 'कांटा' },
                        { word: 'pan', pronunciation_hi: 'पैन', meaning_hi: 'कढ़ाई' },
                        { word: 'bowl', pronunciation_hi: 'बोल', meaning_hi: 'कटोरी' },
                        { word: 'sink', pronunciation_hi: 'सिंक', meaning_hi: 'सिंक' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'VOCAB_SET',
                date: getDate(1),
                level: 'BRONZE',
                title: 'Dining vocabulary',
                metadata: {
                    theme: 'Dining',
                    vocabSetNumber: 2,
                    themeImageDescription: 'Family dining table with food and chairs',
                    vocabItems: [
                        { word: 'table', pronunciation_hi: 'टेबल', meaning_hi: 'मेज' },
                        { word: 'chair', pronunciation_hi: 'चेयर', meaning_hi: 'कुर्सी' },
                        { word: 'napkin', pronunciation_hi: 'नैपकिन', meaning_hi: 'नेपकिन' },
                        { word: 'menu', pronunciation_hi: 'मेन्यू', meaning_hi: 'मेन्यू' },
                        { word: 'waiter', pronunciation_hi: 'वेटर', meaning_hi: 'वेटर' },
                        { word: 'bill', pronunciation_hi: 'बिल', meaning_hi: 'बिल' },
                        { word: 'salt', pronunciation_hi: 'सॉल्ट', meaning_hi: 'नमक' },
                        { word: 'pepper', pronunciation_hi: 'पेपर', meaning_hi: 'काली मिर्च' },
                        { word: 'glass', pronunciation_hi: 'ग्लास', meaning_hi: 'गिलास' },
                        { word: 'restaurant', pronunciation_hi: 'रेस्टोरेंट', meaning_hi: 'रेस्तरां' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'VOCAB_SET',
                date: getDate(2),
                level: 'BRONZE',
                title: 'Travel vocabulary',
                metadata: {
                    theme: 'Travel',
                    vocabSetNumber: 3,
                    themeImageDescription: 'Airplane and suitcase at airport',
                    vocabItems: [
                        { word: 'ticket', pronunciation_hi: 'टिकट', meaning_hi: 'टिकट' },
                        { word: 'bag', pronunciation_hi: 'बैग', meaning_hi: 'बैग' },
                        { word: 'train', pronunciation_hi: 'ट्रेन', meaning_hi: 'ट्रेन' },
                        { word: 'bus', pronunciation_hi: 'बस', meaning_hi: 'बस' },
                        { word: 'map', pronunciation_hi: 'मैप', meaning_hi: 'नक्शा' },
                        { word: 'hotel', pronunciation_hi: 'होटल', meaning_hi: 'होटल' },
                        { word: 'passport', pronunciation_hi: 'पासपोर्ट', meaning_hi: 'पासपोर्ट' },
                        { word: 'taxi', pronunciation_hi: 'टैक्सी', meaning_hi: 'टैक्सी' },
                        { word: 'airport', pronunciation_hi: 'एयरपोर्ट', meaning_hi: 'हवाई अड्डा' },
                        { word: 'luggage', pronunciation_hi: 'लगेज', meaning_hi: 'सामान' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'VOCAB_SET',
                date: getDate(3),
                level: 'BRONZE',
                title: 'Family vocabulary',
                metadata: {
                    theme: 'Family',
                    vocabSetNumber: 4,
                    themeImageDescription: 'Happy family sitting together at home',
                    vocabItems: [
                        { word: 'mother', pronunciation_hi: 'मदर', meaning_hi: 'माँ' },
                        { word: 'father', pronunciation_hi: 'फादर', meaning_hi: 'पिता' },
                        { word: 'brother', pronunciation_hi: 'ब्रदर', meaning_hi: 'भाई' },
                        { word: 'sister', pronunciation_hi: 'सिस्टर', meaning_hi: 'बहन' },
                        { word: 'son', pronunciation_hi: 'सन', meaning_hi: 'बेटा' },
                        { word: 'daughter', pronunciation_hi: 'डॉटर', meaning_hi: 'बेटी' },
                        { word: 'uncle', pronunciation_hi: 'अंकल', meaning_hi: 'चाचा' },
                        { word: 'aunt', pronunciation_hi: 'आंट', meaning_hi: 'चाची' },
                        { word: 'home', pronunciation_hi: 'होम', meaning_hi: 'घर' },
                        { word: 'baby', pronunciation_hi: 'बेबी', meaning_hi: 'बच्चा' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        for (const vocabSet of vocabSets) {
            await DailyContent.findOneAndUpdate(
                { type: 'VOCAB_SET', date: vocabSet.date, level: vocabSet.level },
                vocabSet,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${vocabSets.length} Bronze vocabulary sets (Essential Vocabulary)`);

        // Bonus: Curated Instagram-style feed (GOLD)
        console.log('\n📱 Seeding Daily Content - Bonus feed...');
        const bonusFeeds = [
            {
                type: 'FEED',
                date: getDate(0),
                level: 'GOLD',
                title: 'Curated Instagram Feeds',
                metadata: {
                    feedNumber: 1,
                    posts: [
                        {
                            imageUrl: '',
                            credit: '@englishwithlucy',
                            postLink: 'https://instagram.com/p/Cxyz123',
                            caption: 'EMPOWERED ≠ Enabled. Empowered = Having power/authority. She felt EMPOWERED to make decisions. #EnglishVocabulary #WordOfTheDay',
                        },
                        {
                            imageUrl: '',
                            credit: '@BBC_Learning_English',
                            postLink: 'https://instagram.com/p/Cabc456',
                            caption: "5 Idioms You NEED: 1. Piece of cake = Easy, 2. Hit the nail = Exactly right, 3. Under the weather = Sick #DailyEnglish",
                        },
                        {
                            imageUrl: '',
                            credit: '@englishclass101',
                            postLink: 'https://instagram.com/p/Cdef789',
                            caption: 'Phrasal Verbs Hack: GET UP = Wake & leave bed, GET OVER = Recover from, GET THROUGH = Complete. Practice daily! #LearnEnglish',
                        },
                        {
                            imageUrl: '',
                            credit: '@business_english_pod',
                            postLink: 'https://instagram.com/p/Cghi012',
                            caption: "Negotiate Politely: ✗ 'Too expensive', ✓ 'Could you do ₹3500?', ✗ 'No discount?', ✓ 'Any flexibility on price?' #BusinessEnglish",
                        },
                        {
                            imageUrl: '',
                            credit: '@grammarly',
                            postLink: 'https://instagram.com/p/Cjkl345',
                            caption: "Email Gold: 1. 'I appreciate your time', 2. 'Looking forward to hearing', 3. 'Thank you for your consideration'. Copy-paste ready! #EmailEnglish",
                        },
                        {
                            imageUrl: '',
                            credit: '@engvid_official',
                            postLink: 'https://instagram.com/p/Cmno678',
                            caption: "Networking Icebreaker: 'What brings you here?', 'How do you know the host?', 'What's exciting in your world?'. Never 'What do you do?'. #SmallTalk",
                        },
                        {
                            imageUrl: '',
                            credit: '@rachels_english',
                            postLink: 'https://instagram.com/p/Cpqr901',
                            caption: "TH Sound Masterclass: 'Think' = Tongue between teeth, 'This' = Voiced TH. Practice: Thank you → This Thursday. #Pronunciation",
                        },
                        {
                            imageUrl: '',
                            credit: '@mmmenglish_',
                            postLink: 'https://instagram.com/p/Cstu234',
                            caption: 'R vs L Challenge: Rice vs Lice, Right vs Light. Practice 5 mins daily. #EnglishPronunciation',
                        },
                        {
                            imageUrl: '',
                            credit: '@english_speak_like_native',
                            postLink: 'https://instagram.com/p/Cvwx567',
                            caption: 'Tongue Twisters Level Up: 1. She sells seashells, 2. Peter Piper picked, 3. Unique New York. Say 3× fast! #Fluency',
                        },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        for (const feed of bonusFeeds) {
            await DailyContent.findOneAndUpdate(
                { type: 'FEED', date: feed.date, level: feed.level, title: feed.title },
                feed,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${bonusFeeds.length} bonus feed (${bonusFeeds[0]?.metadata?.posts?.length || 0} posts)`);

        // Bonus module: Famous Speeches, Song Lyrics, One-minute reads (all GOLD; paired by day 0–4, +1 story day 5)
        console.log('\n🎤 Seeding Bonus — speeches, stories, lyrics...');
        const bonusSpeeches = [
            {
                type: 'SPEECH',
                date: getDate(0),
                level: 'GOLD',
                title: 'Priyanka Chopra — UNICEF Speech',
                metadata: {
                    speechNumber: 1,
                    speaker: 'Priyanka Chopra',
                    youtubeUrl: '',
                    transcript:
                        "Good evening everyone. Today I stand before you as a proud UNICEF Goodwill Ambassador. I come from a country where millions of children still don't have access to clean water or education. Every child deserves a childhood, not a battlefield. When I was 13, I saw poverty up close in my grandmother's village. That image never left me. We must act now. Education is not a luxury, it's a right. Let's build a world where every child can dream.",
                    keywords: [
                        { word: 'Goodwill Ambassador', meaning_hi: 'सद्भावना दूत' },
                        { word: 'childhood', meaning_hi: 'बचपन' },
                        { word: 'poverty', meaning_hi: 'गरीबी' },
                        { word: 'education', meaning_hi: 'शिक्षा' },
                        { word: 'battlefield', meaning_hi: 'युद्धक्षेत्र' },
                    ],
                    phrases: [
                        { phrase: 'Every child deserves a childhood', meaning_hi: 'हर बच्चे को बचपन का हक है' },
                        { phrase: 'Education is not a luxury', meaning_hi: 'शिक्षा कोई विलासिता नहीं' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'SPEECH',
                date: getDate(1),
                level: 'GOLD',
                title: 'APJ Abdul Kalam — Dream Dream Dream',
                metadata: {
                    speechNumber: 2,
                    speaker: 'APJ Abdul Kalam',
                    youtubeUrl: '',
                    transcript:
                        "Dreams are not those which come while we are sleeping. Dreams are those which don't let you sleep. My dear children, you are the future of India. Dream big! When I was young, I sold newspapers to support my family. But I dreamed of flying. Today India has missiles because someone dared to dream. You must have a vision. Work hard. Never give up. India needs you!",
                    keywords: [
                        { word: 'vision', meaning_hi: 'दृष्टि' },
                        { word: 'missiles', meaning_hi: 'मिसाइलें' },
                        { word: 'newspapers', meaning_hi: 'अखबार' },
                        { word: 'future', meaning_hi: 'भविष्य' },
                        { word: 'dared', meaning_hi: 'साहस किया' },
                    ],
                    phrases: [
                        { phrase: "Dreams don't let you sleep", meaning_hi: 'सपने नींद नहीं आने देते' },
                        { phrase: 'You are the future of India', meaning_hi: 'तुम भारत के भविष्य हो' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'SPEECH',
                date: getDate(2),
                level: 'GOLD',
                title: 'Malala Yousafzai — UN Speech',
                metadata: {
                    speechNumber: 3,
                    speaker: 'Malala Yousafzai',
                    youtubeUrl: '',
                    transcript:
                        "Dear brothers and sisters, one child, one teacher, one book can change the world. They thought bullets would silence us, but they failed. Today I am here, stronger. Education is the most powerful weapon. No one can stop us. We want schools for every child, not bombs. Let's fight for peace through knowledge. This is the future we deserve.",
                    keywords: [
                        { word: 'bullets', meaning_hi: 'गोलियाँ' },
                        { word: 'weapon', meaning_hi: 'हथियार' },
                        { word: 'schools', meaning_hi: 'स्कूल' },
                        { word: 'knowledge', meaning_hi: 'ज्ञान' },
                        { word: 'silence', meaning_hi: 'चुप कराना' },
                    ],
                    phrases: [
                        { phrase: 'One child, one teacher, one book', meaning_hi: 'एक बच्चा, एक शिक्षक, एक किताब' },
                        { phrase: 'Education is the most powerful weapon', meaning_hi: 'शिक्षा सबसे शक्तिशाली हथियार है' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'SPEECH',
                date: getDate(3),
                level: 'GOLD',
                title: 'Barack Obama — Yes We Can',
                metadata: {
                    speechNumber: 4,
                    speaker: 'Barack Obama',
                    youtubeUrl: '',
                    transcript:
                        "If there is anyone out there who still doubts that America is a place where all things are possible, who still wonders if the dream of our founders is alive, tonight is your answer. It's the answer spoken by young people, by workers, by mothers and fathers. Yes we can! Audacity of hope. Together we will change this country. The time has come.",
                    keywords: [
                        { word: 'founders', meaning_hi: 'संस्थापक' },
                        { word: 'audacity', meaning_hi: 'साहस' },
                        { word: 'workers', meaning_hi: 'मज़दूर' },
                        { word: 'hope', meaning_hi: 'आशा' },
                        { word: 'doubts', meaning_hi: 'संदेह' },
                    ],
                    phrases: [
                        { phrase: 'Yes we can!', meaning_hi: 'हाँ हम कर सकते हैं!' },
                        { phrase: 'Audacity of hope', meaning_hi: 'आशा का साहस' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'SPEECH',
                date: getDate(4),
                level: 'GOLD',
                title: 'Sadhguru — Youth and Truth',
                metadata: {
                    speechNumber: 5,
                    speaker: 'Sadhguru',
                    youtubeUrl: '',
                    transcript:
                        "Dear youth, success is not the goal. Joyful living is the goal. Don't chase money, chase competence. Today you want to be influencers, but first become influencers of your own life. Plant a tree. Meditate daily. Life is not about certificates, it's about clarity. Wake up to responsibility. This planet needs you.",
                    keywords: [
                        { word: 'competence', meaning_hi: 'योग्यता' },
                        { word: 'influencers', meaning_hi: 'प्रभावशाली' },
                        { word: 'meditate', meaning_hi: 'ध्यान करना' },
                        { word: 'clarity', meaning_hi: 'स्पष्टता' },
                        { word: 'joyful', meaning_hi: 'आनंदमय' },
                    ],
                    phrases: [
                        { phrase: 'Joyful living is the goal', meaning_hi: 'आनंदमय जीवन ही लक्ष्य है' },
                        { phrase: 'Chase competence, not money', meaning_hi: 'योग्यता का पीछा करो, पैसे का नहीं' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        const bonusStoriesGold = [
            {
                type: 'STORY',
                date: getDate(0),
                level: 'GOLD',
                title: 'The Boy and the Lost Rupee',
                metadata: {
                    title: 'The Boy and the Lost Rupee',
                    audio: '',
                    text_content:
                        'Rohan found a one-rupee coin on the road while walking to school. Rohan picked it up and looked around to see if anyone had dropped it. An old man nearby was checking his pocket with a worried face. Rohan walked to him and asked, "Did you lose a coin?" The old man smiled with relief and said, "Yes, beta, I did." Rohan gave him the coin and the old man blessed him. Rohan reached school a little late, but he felt proud and happy.',
                    moral_en: 'Doing the right thing makes you feel truly happy.',
                    moral_hi: 'सही काम करने से मन में सच्ची खुशी मिलती है।',
                    keywords: [
                        { word: 'coin', meaning_hi: 'सिक्का' },
                        { word: 'worried', meaning_hi: 'चिंतित' },
                        { word: 'relief', meaning_hi: 'राहत' },
                        { word: 'proud', meaning_hi: 'गर्वित' },
                        { word: 'blessed', meaning_hi: 'आशीर्वाद दिया' },
                    ],
                    sentence_translations: [
                        'रोहन को स्कूल जाते समय रास्ते में एक रुपये का सिक्का मिला।',
                        'उसने सिक्का उठाया और चारों तरफ देखा कि कहीं किसी का तो नहीं गिरा।',
                        'पास ही एक बूढ़े आदमी को चिंतित चेहरे के साथ अपनी जेब टटोलते हुए देखा।',
                        'रोहन उसके पास गया और पूछा, "क्या आपका सिक्का खो गया है?"',
                        'बूढ़े आदमी ने राहत की मुस्कान के साथ कहा, "हाँ बेटा, मैंने ही खोया था।"',
                        'रोहन ने उन्हें सिक्का दे दिया और बूढ़े आदमी ने उसे आशीर्वाद दिया।',
                        'रोहन स्कूल थोड़ी देर से पहुँचा, लेकिन वह गर्व और खुशी महसूस कर रहा था।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'STORY',
                date: getDate(1),
                level: 'GOLD',
                title: "Meera's First Presentation",
                metadata: {
                    title: "Meera's First Presentation",
                    audio: '',
                    text_content:
                        'Meera had to give her first English presentation in class. She was very nervous and her hands were shaking. The night before, she practiced in front of a mirror many times. In the morning, she took a deep breath and went to school early. When her turn came, she spoke slowly and clearly, just like she practiced. Her friends listened carefully and clapped loudly at the end. Meera realized that practice reduced her fear and increased her confidence.',
                    moral_en: 'Practice turns fear into confidence.',
                    moral_hi: 'अभ्यास डर को आत्मविश्वास में बदल देता है।',
                    keywords: [
                        { word: 'nervous', meaning_hi: 'घबराया हुआ / घबराई हुई' },
                        { word: 'shaking', meaning_hi: 'काँपना' },
                        { word: 'practice', meaning_hi: 'अभ्यास' },
                        { word: 'confidence', meaning_hi: 'आत्मविश्वास' },
                        { word: 'presentation', meaning_hi: 'प्रस्तुतीकरण' },
                    ],
                    sentence_translations: [
                        'मीरा को कक्षा में अपना पहला अंग्रेज़ी प्रस्तुतीकरण देना था।',
                        'वह बहुत घबराई हुई थी और उसके हाथ काँप रहे थे।',
                        'पिछली रात उसने कई बार आईने के सामने अभ्यास किया।',
                        'सुबह उसने गहरी साँस ली और जल्दी स्कूल चली गई।',
                        'जब उसकी बारी आई, तो उसने अभ्यास की तरह धीरे और साफ़ बोलना शुरू किया।',
                        'उसके दोस्त ध्यान से सुनते रहे और अंत में ज़ोर से तालियाँ बजाईं।',
                        'मीरा ने महसूस किया कि अभ्यास से उसका डर कम हुआ और उसका आत्मविश्वास बढ़ गया।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'STORY',
                date: getDate(2),
                level: 'GOLD',
                title: 'The Honest Shopkeeper',
                metadata: {
                    title: 'The Honest Shopkeeper',
                    audio: '',
                    text_content:
                        'Raju bought vegetables from a small shop. The shopkeeper gave him extra change by mistake. Raju noticed it immediately and returned the money. The shopkeeper was surprised and thanked him warmly. From that day, Raju became his regular customer. Everyone in the market praised Raju’s honesty.',
                    moral_en: 'Honesty brings trust and respect.',
                    moral_hi: 'ईमानदारी विश्वास और सम्मान लाती है।',
                    keywords: [
                        { word: 'extra', meaning_hi: 'अतिरिक्त' },
                        { word: 'mistake', meaning_hi: 'गलती' },
                        { word: 'surprised', meaning_hi: 'आश्चर्यचकित' },
                        { word: 'thanked', meaning_hi: 'धन्यवाद दिया' },
                        { word: 'praised', meaning_hi: 'तारीफ़ की' },
                    ],
                    sentence_translations: [
                        'राजू ने एक छोटी दुकान से सब्ज़ियाँ खरीदीं।',
                        'दुकानदार ने गलती से उसे अतिरिक्त छुट्टा दे दिया।',
                        'राजू ने तुरंत नोटिस किया और पैसे लौटा दिए।',
                        'दुकानदार आश्चर्यचकित हो गया और उसे गर्मजोशी से धन्यवाद दिया।',
                        'उस दिन से, राजू उसका नियमित ग्राहक बन गया।',
                        'बाज़ार में सभी ने राजू की ईमानदारी की तारीफ़ की।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'STORY',
                date: getDate(3),
                level: 'GOLD',
                title: 'Late to the Bus Stop',
                metadata: {
                    title: 'Late to the Bus Stop',
                    audio: '',
                    text_content:
                        'Priya woke up late on Monday morning. She rushed to the bus stop without breakfast. The bus was just leaving when she arrived. Priya ran and waved her hand. The driver saw her and stopped the bus. Priya thanked him and sat down safely. She learned to set an alarm next time.',
                    moral_en: 'A little planning saves a lot of trouble.',
                    moral_hi: 'थोड़ी योजना बहुत परेशानी बचाती है।',
                    keywords: [
                        { word: 'rushed', meaning_hi: 'जल्दी में दौड़ा' },
                        { word: 'waved', meaning_hi: 'हाथ हिलाया' },
                        { word: 'stopped', meaning_hi: 'रोका' },
                        { word: 'thanked', meaning_hi: 'धन्यवाद दिया' },
                        { word: 'learned', meaning_hi: 'सीखा' },
                    ],
                    sentence_translations: [
                        'प्रिया सोमवार सुबह देर से जागी।',
                        'वह नाश्ता किए बिना बस स्टॉप की ओर दौड़ी।',
                        'बस जा ही रही थी जब वह पहुँची।',
                        'प्रिया दौड़कर हाथ हिलाया।',
                        'ड्राइवर ने उसे देखा और बस रोक दी।',
                        'प्रिया ने उसका धन्यवाद किया और सुरक्षित बैठ गई।',
                        'उसने अगली बार अलार्म लगाने का सबक सीखा।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'STORY',
                date: getDate(4),
                level: 'GOLD',
                title: 'Sharing the Last Biscuit',
                metadata: {
                    title: 'Sharing the Last Biscuit',
                    audio: '',
                    text_content:
                        'Amit and his friend Sunil were hungry after playing football. Amit had one biscuit left in his bag. Sunil looked sad with no food. Amit broke the biscuit into two pieces. They both ate happily together. Their friendship grew stronger that day.',
                    moral_en: 'Sharing makes everyone happy.',
                    moral_hi: 'बाँटने से सब खुश होते हैं।',
                    keywords: [
                        { word: 'hungry', meaning_hi: 'भूखा' },
                        { word: 'broke', meaning_hi: 'तोड़ा' },
                        { word: 'pieces', meaning_hi: 'टुकड़े' },
                        { word: 'happily', meaning_hi: 'खुशी से' },
                        { word: 'stronger', meaning_hi: 'मज़बूत' },
                    ],
                    sentence_translations: [
                        'अमित और उसके दोस्त सुनील ने फुटबॉल खेलने के बाद भूख लगी।',
                        'अमित के बैग में एक बिस्किट बची थी।',
                        'सुनील के पास कोई खाना नहीं था और वह उदास लग रहा था।',
                        'अमित ने बिस्किट को दो टुकड़ों में तोड़ा।',
                        'दोनों ने खुशी से साथ खाया।',
                        'उनकी दोस्ती उस दिन और मज़बूत हो गई।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'STORY',
                date: getDate(5),
                level: 'GOLD',
                title: 'The Clean Park Helper',
                metadata: {
                    title: 'The Clean Park Helper',
                    audio: '',
                    text_content:
                        'The park was full of plastic bottles and papers. Little Sara saw this and felt bad. She picked up five bottles and threw them in the dustbin. Soon, other children joined her. The park became clean and beautiful again. Everyone smiled at Sara’s good work.',
                    moral_en: 'Small actions create big change.',
                    moral_hi: 'छोटे काम बड़े बदलाव लाते हैं।',
                    keywords: [
                        { word: 'full', meaning_hi: 'भरा हुआ' },
                        { word: 'picked up', meaning_hi: 'उठाया' },
                        { word: 'dustbin', meaning_hi: 'कूड़ेदान' },
                        { word: 'joined', meaning_hi: 'शामिल हुए' },
                        { word: 'beautiful', meaning_hi: 'सुंदर' },
                    ],
                    sentence_translations: [
                        'पार्क प्लास्टिक की बोतलें और कागज़ों से भरा था।',
                        'छोटी सारा ने यह देखा और बुरा लगा।',
                        'उसने पाँच बोतलें उठाईं और कूड़ेदान में डाल दीं।',
                        'जल्द ही अन्य बच्चे भी उसके साथ आ गए।',
                        'पार्क फिर साफ़ और सुंदर हो गया।',
                        'सभी ने सारा के अच्छे काम की मुस्कान दी।',
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        const bonusLyrics = [
            {
                type: 'LYRICS',
                date: getDate(0),
                level: 'GOLD',
                title: 'Imagine',
                metadata: {
                    lyricsNumber: 1,
                    artist: 'John Lennon',
                    lyrics:
                        "Imagine there's no heaven\nIt's easy if you try\nNo hell below us\nAbove us only sky\nImagine all the people\nLiving for today\nImagine there's no countries\nIt isn't hard to do\nNothing to kill or die for\nAnd no religion too\nImagine all the people\nLiving life in peace",
                    audio: '',
                    words: [
                        { word: 'heaven', meaning_hi: 'स्वर्ग' },
                        { word: 'hell', meaning_hi: 'नरक' },
                        { word: 'countries', meaning_hi: 'देश' },
                        { word: 'religion', meaning_hi: 'धर्म' },
                        { word: 'peace', meaning_hi: 'शांति' },
                    ],
                    phrases: [
                        { phrase: 'Living for today', meaning_hi: 'आज के लिए जीना' },
                        { phrase: 'Life in peace', meaning_hi: 'शांतिपूर्ण जीवन' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'LYRICS',
                date: getDate(1),
                level: 'GOLD',
                title: 'Let It Be',
                metadata: {
                    lyricsNumber: 2,
                    artist: 'The Beatles',
                    lyrics:
                        "When I find myself in times of trouble\nMother Mary comes to me\nSpeaking words of wisdom\nLet it be\nWhen the night is cloudy\nAnd I can see no light\nSpeaking words of wisdom\nLet it be",
                    audio: '',
                    words: [
                        { word: 'trouble', meaning_hi: 'परेशानी' },
                        { word: 'wisdom', meaning_hi: 'बुद्धिमत्ता' },
                        { word: 'cloudy', meaning_hi: 'बादलयुक्त' },
                        { word: 'accept', meaning_hi: 'स्वीकारना' },
                        { word: 'comfort', meaning_hi: 'सांत्वना' },
                    ],
                    phrases: [
                        { phrase: 'Words of wisdom', meaning_hi: 'बुद्धिमान शब्द' },
                        { phrase: 'Let it be', meaning_hi: 'जैसा है वैसा रहने दो' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'LYRICS',
                date: getDate(2),
                level: 'GOLD',
                title: 'Shape of You',
                metadata: {
                    lyricsNumber: 3,
                    artist: 'Ed Sheeran',
                    lyrics:
                        "The club isn't the best place to find a lover\nSo the bar is where I go\nMe and my friends at the table doing shots\nFeeling the rhythm of the night\nGirl you know I want your love\nYour love was handmade for somebody like me\nCome on now follow my lead",
                    audio: '',
                    words: [
                        { word: 'rhythm', meaning_hi: 'लय' },
                        { word: 'lover', meaning_hi: 'प्रेमी' },
                        { word: 'shots', meaning_hi: 'शॉट्स (पेय)' },
                        { word: 'handmade', meaning_hi: 'हस्तनिर्मित' },
                        { word: 'lead', meaning_hi: 'नेतृत्व' },
                    ],
                    phrases: [
                        { phrase: 'Follow my lead', meaning_hi: 'मेरा अनुसरण करो' },
                        { phrase: 'Handmade for somebody', meaning_hi: 'किसी के लिए खास बनाया गया' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'LYRICS',
                date: getDate(3),
                level: 'GOLD',
                title: 'Someone Like You',
                metadata: {
                    lyricsNumber: 4,
                    artist: 'Adele',
                    lyrics:
                        "I heard that you're settled down\nThat you found a girl and you're married now\nI heard that your dreams came true\nGuess she gave you things I didn't give to you\nNever mind, I'll find someone like you\nI wish nothing but the best for you",
                    audio: '',
                    words: [
                        { word: 'settled', meaning_hi: 'बस गया' },
                        { word: 'married', meaning_hi: 'शादीशुदा' },
                        { word: 'dreams', meaning_hi: 'सपने' },
                        { word: 'regret', meaning_hi: 'पछतावा' },
                        { word: 'wish', meaning_hi: 'शुभकामना' },
                    ],
                    phrases: [
                        { phrase: 'Dreams came true', meaning_hi: 'सपने सच हो गए' },
                        { phrase: 'Nothing but the best', meaning_hi: 'सबसे अच्छा ही' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                type: 'LYRICS',
                date: getDate(4),
                level: 'GOLD',
                title: 'Perfect',
                metadata: {
                    lyricsNumber: 5,
                    artist: 'Ed Sheeran',
                    lyrics:
                        "I found a love for me\nDarling just dive right in and follow my lead\nWell I found a girl, beautiful and sweet\nI never knew you were the someone waiting for me\n'Cause we were just kids when we fell in love\nNot knowing what it was",
                    audio: '',
                    words: [
                        { word: 'darling', meaning_hi: 'प्रिय' },
                        { word: 'dive', meaning_hi: 'गोता लगाना' },
                        { word: 'sweet', meaning_hi: 'मीठा / प्यारा' },
                        { word: 'fell', meaning_hi: 'गिरना (प्रेम में)' },
                        { word: 'waiting', meaning_hi: 'इंतज़ार' },
                    ],
                    phrases: [
                        { phrase: 'Just dive right in', meaning_hi: 'सीधे कूद पड़ो' },
                        { phrase: 'Fell in love', meaning_hi: 'प्रेम में पड़ गए' },
                    ],
                },
                isActive: true,
                createdBy: adminUser._id,
            },
        ];

        for (const s of bonusSpeeches) {
            await DailyContent.findOneAndUpdate(
                { type: 'SPEECH', date: s.date, level: 'GOLD', title: s.title },
                s,
                { upsert: true }
            );
        }
        for (const st of bonusStoriesGold) {
            await DailyContent.findOneAndUpdate(
                { type: 'STORY', date: st.date, level: 'GOLD', title: st.title },
                st,
                { upsert: true }
            );
        }
        for (const ly of bonusLyrics) {
            await DailyContent.findOneAndUpdate(
                { type: 'LYRICS', date: ly.date, level: 'GOLD', title: ly.title },
                ly,
                { upsert: true }
            );
        }
        console.log(
            `✅ Bonus pack: ${bonusSpeeches.length} speeches, ${bonusStoriesGold.length} stories, ${bonusLyrics.length} lyrics`
        );

        // 11. Seed AI Prompts
        console.log('\n🤖 Seeding AI Prompts...');
        const aiPrompts = [
            {
                topic: 'Conversation Practice',
                category: 'Speaking',
                title: 'Practice Job Interview',
                prompt: 'You are conducting a job interview. Ask me questions about my experience, skills, and why I want this position. I will answer in English.',
                description: 'Practice answering common job interview questions',
                tags: ['interview', 'job', 'professional'],
                level: 'GOLD',
                isActive: true,
                createdBy: adminUser._id
            },
            {
                topic: 'Writing Practice',
                category: 'Writing',
                title: 'Write a Story',
                prompt: 'Help me write a short story. Give me prompts and suggestions to improve my writing in English.',
                description: 'Get help writing creative stories',
                tags: ['writing', 'creative', 'story'],
                level: 'SILVER',
                isActive: true,
                createdBy: adminUser._id
            },
            {
                topic: 'Grammar Help',
                category: 'Grammar',
                title: 'Grammar Checker',
                prompt: 'Check my English grammar and suggest corrections. Explain why the corrections are needed.',
                description: 'Get grammar corrections and explanations',
                tags: ['grammar', 'correction', 'learning'],
                level: 'BRONZE',
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const prompt of aiPrompts) {
            await AIPrompt.findOneAndUpdate(
                { topic: prompt.topic, title: prompt.title },
                prompt,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${aiPrompts.length} AI prompts`);

        // 12. Seed Test Users
        console.log('\n👥 Seeding Test Users...');
        const testUsers = [
            {
                name: 'Test User 1',
                email: 'test1@verble.app',
                password: 'Test123!',
                role: 'user',
                isEmailVerified: true,
                membershipLevel: 'FREE',
                unlockedLevels: ['FREE'],
                points: 50,
                coins: 10
            },
            {
                name: 'Test User 2',
                email: 'test2@verble.app',
                password: 'Test123!',
                role: 'user',
                isEmailVerified: true,
                membershipLevel: 'BRONZE',
                unlockedLevels: ['FREE', 'BRONZE'],
                points: 150,
                coins: 30
            },
            {
                name: 'Test User 3',
                email: 'test3@verble.app',
                password: 'Test123!',
                role: 'user',
                isEmailVerified: true,
                membershipLevel: 'GOLD',
                unlockedLevels: ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'BONUS'],
                points: 500,
                coins: 100
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created Test User: ${user.email} (${user.membershipLevel})`);
            } else {
                console.log(`⏭️  Skipped existing user: ${userData.email}`);
            }
        }

        // 13. Seed Offers
        console.log('\n🎁 Seeding Offers...');
        const offers = [
            {
                title: 'Limited Time Launch Offer',
                description: 'New Year offer: ₹3999 only (55% off) on all paid modules plus bonus content.',
                type: 'OFFER',
                imageUrl: '/images/offers/launch-offer.jpg',
                linkUrl: '/subscription-plans?plan=full-course',
                startDate: getDate(0),
                endDate: getDate(45),
                isActive: true,
                priority: 1,
                createdBy: adminUser._id
            },
            {
                title: '7-Day Money Back Guarantee',
                description: '100% risk free: no-questions-asked refund + lifetime free updates.',
                type: 'OFFER',
                imageUrl: '/images/offers/money-back.jpg',
                linkUrl: '/subscription-plans',
                startDate: getDate(0),
                endDate: getDate(180),
                isActive: true,
                priority: 2,
                createdBy: adminUser._id
            }
        ];

        for (const offer of offers) {
            await Offer.findOneAndUpdate(
                { title: offer.title },
                offer,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${offers.length} offers`);

        console.log('\n✅ Seed data completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Exam Categories: 1`);
        console.log(`   - Courses: 1`);
        console.log(`   - Subscription Plans: ${createdPlans.length}`);
        console.log(`   - Modules: ${createdModules.length}`);
        const dailyContentTotal =
            words.length +
            phrases.length +
            stories.length +
            conversations.length +
            puzzles.length +
            silverGrammarPuzzles.length +
            vocabSets.length +
            bonusFeeds.length +
            bonusSpeeches.length +
            bonusStoriesGold.length +
            bonusLyrics.length;
        console.log(`   - Daily Content: ${dailyContentTotal} (free words/phrases + bronze vocab + silver grammar + bonus feed + …)`);
        console.log(`   - AI Prompts: ${aiPrompts.length}`);
        console.log(`   - Test Users: ${testUsers.length}`);
        console.log(`   - Offers: ${offers.length}`);
        console.log('\n🔗 Test User Credentials:');
        testUsers.forEach(user => {
            console.log(`   ${user.email} / Test123! (${user.membershipLevel})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

seedData();
