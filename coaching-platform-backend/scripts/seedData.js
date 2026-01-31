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

        // Clear existing data (optional - comment out if you want to keep existing data)
        const clearData = process.argv[2] === '--clear';
        if (clearData) {
            console.log('🗑️  Clearing existing seed data...');
            await DailyContent.deleteMany({});
            await SubscriptionPlan.deleteMany({});
            await Module.deleteMany({});
            await Course.deleteMany({});
            await ExamCategory.deleteMany({});
            await AIPrompt.deleteMany({});
            await Offer.deleteMany({});
            // Don't delete admin users
            await User.deleteMany({ role: { $ne: 'admin' } });
            console.log('✅ Cleared existing data\n');
        }

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
        const course = await Course.findOneAndUpdate(
            { title: 'Complete English Mastery' },
            {
                title: 'Complete English Mastery',
                description: 'A comprehensive course to master English language skills including vocabulary, grammar, conversation, and writing.',
                image: '/images/courses/english-mastery.jpg',
                examCategory: examCategory._id,
                isPublished: true
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Created Course: ${course.title}`);

        // 3. Seed Subscription Plans
        console.log('\n💳 Seeding Subscription Plans...');
        const plans = [
            {
                name: 'Free Plan',
                description: 'Access to free content and basic features',
                price: 0,
                currency: 'INR',
                duration: { value: 999, unit: 'day' },
                features: ['Daily word of the day', 'Basic vocabulary', 'Free level content'],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Free'
            },
            {
                name: 'Bronze Plan',
                description: 'Unlock bronze level content',
                price: 299,
                currency: 'INR',
                duration: { value: 1, unit: 'month' },
                features: ['All free content', 'Bronze level stories', 'Basic conversations', 'Vocabulary sets'],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Bronze'
            },
            {
                name: 'Silver Plan',
                description: 'Unlock silver level content',
                price: 599,
                currency: 'INR',
                duration: { value: 1, unit: 'month' },
                features: ['All bronze content', 'Silver level conversations', 'Advanced stories', 'Scene descriptions'],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Silver'
            },
            {
                name: 'Gold Plan',
                description: 'Unlock all premium content for 1 year',
                price: 4999,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: ['All silver content', 'Gold level content', 'Famous speeches', 'Song lyrics', 'AI prompts', 'Full course access'],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Gold'
            },
            {
                name: 'Full Course',
                description: 'Complete course with all modules and assessments',
                price: 9999,
                currency: 'INR',
                duration: { value: 1, unit: 'year' },
                features: ['All gold content', 'Full course modules', 'Module quizzes', 'Certificate assessment', 'E-certificate'],
                course: course._id,
                isActive: true,
                topic: 'English Learning',
                subTopic: 'Full Course'
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
                title: 'Introduction to English',
                description: 'Learn the basics of English language',
                course: course._id,
                subscriptionPlans: [createdPlans[0]._id, createdPlans[1]._id, createdPlans[2]._id, createdPlans[3]._id, createdPlans[4]._id],
                order: 1
            },
            {
                title: 'Vocabulary Building',
                description: 'Expand your vocabulary with daily words and phrases',
                course: course._id,
                subscriptionPlans: [createdPlans[1]._id, createdPlans[2]._id, createdPlans[3]._id, createdPlans[4]._id],
                order: 2
            },
            {
                title: 'Grammar Fundamentals',
                description: 'Master English grammar rules and usage',
                course: course._id,
                subscriptionPlans: [createdPlans[2]._id, createdPlans[3]._id, createdPlans[4]._id],
                order: 3
            },
            {
                title: 'Conversation Skills',
                description: 'Improve your speaking and conversation abilities',
                course: course._id,
                subscriptionPlans: [createdPlans[3]._id, createdPlans[4]._id],
                order: 4
            },
            {
                title: 'Advanced Writing',
                description: 'Learn to write effectively in English',
                course: course._id,
                subscriptionPlans: [createdPlans[4]._id],
                order: 5
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

        // 5. Seed Daily Content - Words
        console.log('\n📝 Seeding Daily Content - Words...');
        const words = [
            {
                type: 'WORD',
                date: getDate(0),
                level: 'FREE',
                title: 'Word of the Day - Perseverance',
                metadata: {
                    text: 'perseverance',
                    meaning_en: 'persistence in doing something despite difficulty or delay in achieving success',
                    meaning_hi: 'कठिनाई या देरी के बावजूद कुछ करने में दृढ़ता',
                    audio: '/audio/words/perseverance.mp3',
                    partOfSpeech: 'noun',
                    examples: [
                        {
                            en: 'Her perseverance helped her achieve her goals.',
                            hi: 'उसकी दृढ़ता ने उसे अपने लक्ष्यों को प्राप्त करने में मदद की।',
                            audio: '/audio/examples/perseverance1.mp3'
                        },
                        {
                            en: 'Success requires perseverance and hard work.',
                            hi: 'सफलता के लिए दृढ़ता और कड़ी मेहनत की आवश्यकता होती है।',
                            audio: '/audio/examples/perseverance2.mp3'
                        }
                    ],
                    synonyms: ['persistence', 'determination', 'tenacity'],
                    antonyms: ['giving up', 'quitting', 'surrender']
                },
                isActive: true,
                createdBy: adminUser._id
            },
            {
                type: 'WORD',
                date: getDate(-1),
                level: 'FREE',
                title: 'Word of the Day - Eloquent',
                metadata: {
                    text: 'eloquent',
                    meaning_en: 'fluent or persuasive in speaking or writing',
                    meaning_hi: 'बोलने या लिखने में धाराप्रवाह या प्रभावशाली',
                    audio: '/audio/words/eloquent.mp3',
                    partOfSpeech: 'adjective',
                    examples: [
                        {
                            en: 'She gave an eloquent speech at the conference.',
                            hi: 'उसने सम्मेलन में एक प्रभावशाली भाषण दिया।',
                            audio: '/audio/examples/eloquent1.mp3'
                        }
                    ],
                    synonyms: ['articulate', 'fluent', 'expressive'],
                    antonyms: ['inarticulate', 'tongue-tied', 'mute']
                },
                isActive: true,
                createdBy: adminUser._id
            },
            {
                type: 'WORD',
                date: getDate(1),
                level: 'FREE',
                title: 'Word of the Day - Diligent',
                metadata: {
                    text: 'diligent',
                    meaning_en: 'having or showing care and conscientiousness in one\'s work or duties',
                    meaning_hi: 'अपने काम या कर्तव्यों में सावधानी और ईमानदारी रखना या दिखाना',
                    audio: '/audio/words/diligent.mp3',
                    partOfSpeech: 'adjective',
                    examples: [
                        {
                            en: 'He is a diligent student who always completes his homework.',
                            hi: 'वह एक मेहनती छात्र है जो हमेशा अपना होमवर्क पूरा करता है।',
                            audio: '/audio/examples/diligent1.mp3'
                        }
                    ],
                    synonyms: ['hardworking', 'industrious', 'assiduous'],
                    antonyms: ['lazy', 'negligent', 'careless']
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const word of words) {
            await DailyContent.findOneAndUpdate(
                { type: 'WORD', date: word.date, level: word.level },
                word,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${words.length} words`);

        // 6. Seed Daily Content - Phrases
        console.log('\n💬 Seeding Daily Content - Phrases...');
        const phrases = [
            {
                type: 'PHRASE',
                date: getDate(0),
                level: 'FREE',
                title: 'Phrase of the Day - Break the ice',
                metadata: {
                    text: 'break the ice',
                    meaning_en: 'to initiate conversation in a social setting; to make people feel more comfortable',
                    meaning_hi: 'सामाजिक माहौल में बातचीत शुरू करना; लोगों को अधिक सहज महसूस कराना',
                    audio: '/audio/phrases/break-the-ice.mp3',
                    examples: [
                        {
                            en: 'He told a joke to break the ice at the meeting.',
                            hi: 'उसने बैठक में बर्फ तोड़ने के लिए एक चुटकुला सुनाया।',
                            audio: '/audio/examples/break-ice1.mp3'
                        }
                    ],
                    synonyms: ['start conversation', 'initiate contact'],
                    antonyms: ['maintain silence', 'stay quiet']
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const phrase of phrases) {
            await DailyContent.findOneAndUpdate(
                { type: 'PHRASE', date: phrase.date, level: phrase.level },
                phrase,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${phrases.length} phrases`);

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
        console.log(`✅ Created ${puzzles.length} puzzles`);

        // 10. Seed Daily Content - Vocabulary Sets
        console.log('\n📚 Seeding Daily Content - Vocabulary Sets...');
        const vocabSets = [
            {
                type: 'VOCAB_SET',
                date: getDate(0),
                level: 'BRONZE',
                title: 'Kitchen Vocabulary',
                metadata: {
                    theme: 'Kitchen',
                    items: [
                        { word: 'spoon', pronunciation: 'स्पून', meaning_hi: 'चम्मच' },
                        { word: 'fork', pronunciation: 'फोर्क', meaning_hi: 'कांटा' },
                        { word: 'knife', pronunciation: 'नाइफ', meaning_hi: 'चाकू' },
                        { word: 'plate', pronunciation: 'प्लेट', meaning_hi: 'प्लेट' },
                        { word: 'bowl', pronunciation: 'बोल', meaning_hi: 'कटोरा' }
                    ]
                },
                isActive: true,
                createdBy: adminUser._id
            }
        ];

        for (const vocabSet of vocabSets) {
            await DailyContent.findOneAndUpdate(
                { type: 'VOCAB_SET', date: vocabSet.date, level: vocabSet.level },
                vocabSet,
                { upsert: true }
            );
        }
        console.log(`✅ Created ${vocabSets.length} vocabulary sets`);

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
                unlockedLevels: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
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
                title: 'New Year Special',
                description: 'Get 50% off on Gold Plan for the first month',
                type: 'OFFER',
                imageUrl: '/images/offers/new-year-special.jpg',
                linkUrl: '/subscription-plans',
                startDate: getDate(0),
                endDate: getDate(30),
                isActive: true,
                priority: 1,
                createdBy: adminUser._id
            },
            {
                title: 'Free Webinar: English Mastery Tips',
                description: 'Join our free webinar to learn English mastery tips from experts',
                type: 'WEBINAR',
                imageUrl: '/images/offers/webinar.jpg',
                linkUrl: '/webinar/english-mastery',
                startDate: getDate(0),
                endDate: getDate(7),
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
        console.log(`   - Daily Content: ${words.length + phrases.length + stories.length + conversations.length + puzzles.length + vocabSets.length}`);
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
