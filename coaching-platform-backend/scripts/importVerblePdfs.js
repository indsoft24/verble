/**
 * Import Verble curriculum PDFs from verble-import/Verble into DailyContent (+ optional Course modules).
 * Extracts text via pdf-parse (no PDFs are served to users).
 *
 * Usage:
 *   node scripts/importVerblePdfs.js
 *   VERBLE_IMPORT_START_DATE=2026-04-01 node scripts/importVerblePdfs.js
 *   VERBLE_IMPORT_DIR=/path/to/pdfs node scripts/importVerblePdfs.js
 *
 * Re-run safe: deletes prior rows with metadata.importedFrom === IMPORT_TAG then re-imports.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import DailyContent from '../src/models/DailyContent.js';
import Course from '../src/models/Course.js';
import Module from '../src/models/Module.js';
import SubscriptionPlan from '../src/models/SubscriptionPlan.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const require = createRequire(import.meta.url);
const pdfParse = require(join(__dirname, '../node_modules/pdf-parse/lib/pdf-parse.js'));

const IMPORT_TAG = 'verble-pdf-v1';
const DEFAULT_PDF_DIR = join(__dirname, '../../verble-import/Verble');

/** Concatenated option blobs from Silver grammar PDF → [A, B, C] */
const GRAMMAR_OPTION_BLOBS = {
    gogoesgoing: ['go', 'goes', 'going'],
    playplayedplaying: ['play', 'played', 'playing'],
    watchwatcheswatching: ['watch', 'watches', 'watching'],
    'readreadshas read': ['read', 'reads', 'has read'],
    rainrainsrained: ['rain', 'rains', 'rained'],
    isaream: ['is', 'are', 'am'],
    drinkdrinksdrinking: ['drink', 'drinks', 'drinking'],
    seesawseen: ['see', 'saw', 'seen'],
    'arehave beenhas': ['are', 'have been', 'has'],
    'meetwill meetmet': ['meet', 'will meet', 'met'],
    playplaysplaying: ['play', 'plays', 'playing'],
    "finishfinisheshasn't finished": ['finish', 'finishes', "hasn't finished"],
    givegavegives: ['give', 'gave', 'gives'],
    'gogoeswill go': ['go', 'goes', 'will go'],
    goodbetterbest: ['good', 'better', 'best'],
    DoDoesDid: ['Do', 'Does', 'Did'],
    waswereare: ['was', 'were', 'are'],
    'ishas beenhave': ['is', 'has been', 'have'],
    readreadsreading: ['read', 'reads', 'reading'],
    'completewill completecompleted': ['complete', 'will complete', 'completed'],
    sitsitssitting: ['sit', 'sits', 'sitting'],
    'hearheardhave heard': ['hear', 'heard', 'have heard'],
    loselostloses: ['lose', 'lost', 'loses'],
    'gogoesare going': ['go', 'goes', 'are going'],
    workworksworking: ['work', 'works', 'working'],
};

/** Free tier: words + phrases (aligned with Free Content.pdf curriculum) */
const FREE_WORD_ROWS = [
    { num: 1, text: 'grateful', pronunciation_ipa: "/'greɪtfʊl/", pronunciation_devanagari: 'ग्रेट-फुल', partOfSpeech: 'adjective', meaning_en: 'Feeling or showing thanks', meaning_hi: 'कृतज्ञ, आभारी', examples: [{ en: 'I am grateful for your help.', hi: 'मैं आपकी मदद के लिए कृतज्ञ हूँ।' }], synonyms: ['thankful', 'appreciative'], antonyms: ['ungrateful', 'unthankful'] },
    { num: 2, text: 'curious', pronunciation_ipa: "/'kjʊəriəs/", pronunciation_devanagari: 'क्यूरि-अस', partOfSpeech: 'adjective', meaning_en: 'Eager to know or learn something', meaning_hi: 'जिज्ञासु', examples: [{ en: 'Children are naturally curious.', hi: 'बच्चे स्वभाव से जिज्ञासु होते हैं।' }], synonyms: ['inquisitive', 'interested'], antonyms: ['indifferent', 'uninterested'] },
    { num: 3, text: 'attempt', pronunciation_ipa: '/əˈtempt/ (v), /əˈtempt/ (n)', pronunciation_devanagari: 'अट्टेम्प्ट', partOfSpeech: 'noun / verb', meaning_en: 'An act of trying to do something; to try to do something', meaning_hi: 'प्रयास करना / प्रयास', examples: [{ en: 'She will attempt the exam again.', hi: 'वह परीक्षा दोबारा देने का प्रयास करेगी।' }], synonyms: ['try', 'effort'], antonyms: ['refusal', 'avoidance'] },
    { num: 4, text: 'silent', pronunciation_ipa: "/'saɪlənt/", pronunciation_devanagari: 'साइलन्ट', partOfSpeech: 'adjective', meaning_en: 'Not making any sound', meaning_hi: 'शांत, मौन', examples: [{ en: 'The library is a silent place.', hi: 'पुस्तकालय एक शांत जगह है।' }], synonyms: ['quiet', 'mute'], antonyms: ['loud', 'noisy'] },
    { num: 5, text: 'improve', pronunciation_ipa: '/ɪmˈpruːv/', pronunciation_devanagari: 'इम्प्रूव', partOfSpeech: 'verb', meaning_en: 'To make something better', meaning_hi: 'सुधार करना', examples: [{ en: 'You should read daily to improve your English.', hi: 'अपनी अंग्रेज़ी सुधारने के लिए तुम्हें रोज़ पढ़ना चाहिए।' }], synonyms: ['develop', 'enhance'], antonyms: ['worsen', 'decline'] },
    { num: 6, text: 'honest', pronunciation_ipa: '/ˈɒnɪst/ or /ˈɑːnɪst/', pronunciation_devanagari: 'ऑनिस्ट', partOfSpeech: 'adjective', meaning_en: 'Telling the truth, not cheating or stealing', meaning_hi: 'ईमानदार', examples: [{ en: 'An honest person is trusted by everyone.', hi: 'एक ईमानदार व्यक्ति पर सभी भरोसा करते हैं।' }], synonyms: ['truthful', 'sincere'], antonyms: ['dishonest', 'corrupt'] },
    { num: 7, text: 'delay', pronunciation_ipa: '/dɪˈleɪ/', pronunciation_devanagari: 'डिले', partOfSpeech: 'noun / verb', meaning_en: 'A period of waiting before something happens; to make something late', meaning_hi: 'देरी / देर करना', examples: [{ en: 'The train arrived after a short delay.', hi: 'ट्रेन थोड़ी देरी के बाद पहुँची।' }], synonyms: ['postpone', 'defer'], antonyms: ['advance', 'hasten'] },
    { num: 8, text: 'polite', pronunciation_ipa: '/pəˈlaɪt/', pronunciation_devanagari: 'पलाइट', partOfSpeech: 'adjective', meaning_en: 'Having good manners, speaking respectfully', meaning_hi: 'विनम्र, शिष्ट', examples: [{ en: 'Always be polite to your teachers.', hi: 'अपने शिक्षकों के प्रति हमेशा विनम्र रहो।' }], synonyms: ['courteous', 'respectful'], antonyms: ['rude', 'impolite'] },
    { num: 9, text: 'borrow', pronunciation_ipa: '/ˈbɒrəʊ/ or /ˈbɑːroʊ/', pronunciation_devanagari: 'बॉरो', partOfSpeech: 'verb', meaning_en: 'To take something from someone with the intention of returning it', meaning_hi: 'उधार लेना', examples: [{ en: 'Can I borrow your pen for a minute?', hi: 'क्या मैं आपका पेन एक मिनट के लिए उधार ले सकता हूँ?' }], synonyms: ['take', 'obtain'], antonyms: ['lend', 'return'] },
    { num: 10, text: 'protect', pronunciation_ipa: '/prəˈtekt/', pronunciation_devanagari: 'प्रोटेक्ट', partOfSpeech: 'verb', meaning_en: 'To keep someone or something safe', meaning_hi: 'रक्षा करना, बचाना', examples: [{ en: 'Parents protect their children from danger.', hi: 'माता-पिता अपने बच्चों को ख़तरे से बचाते हैं।' }], synonyms: ['guard', 'defend'], antonyms: ['attack', 'harm'] },
];

const FREE_PHRASE_ROWS = [
    { num: 1, text: 'How are you?', pronunciation_devanagari: 'हाउ आर यू?', meaning_en: "Asking about someone's well-being", meaning_hi: 'आप कैसे हैं?', examples: [{ en: 'How are you today?', hi: 'आज आप कैसे हैं?' }] },
    { num: 2, text: 'Thank you', pronunciation_devanagari: 'थैंक यू', meaning_en: 'Expression of gratitude', meaning_hi: 'धन्यवाद / शुक्रिया', examples: [{ en: 'Thank you for your help.', hi: 'आपकी मदद के लिए धन्यवाद।' }] },
    { num: 3, text: 'Excuse me', pronunciation_devanagari: 'एक्सक्यूज़ मी', meaning_en: 'Polite way to get attention or pass by', meaning_hi: 'माफ़ कीजिए', examples: [{ en: 'Excuse me, where is the washroom?', hi: 'माफ़ कीजिए, वॉशरूम कहाँ है?' }] },
    { num: 4, text: 'I am sorry', pronunciation_devanagari: 'आइ एम सॉरी', meaning_en: 'Saying you feel bad for a mistake', meaning_hi: 'मुझे माफ़ कीजिए', examples: [{ en: 'I am sorry for being late.', hi: 'देर से आने के लिए मुझे माफ़ कीजिए।' }] },
    { num: 5, text: 'Please wait', pronunciation_devanagari: 'प्लीज़ वेट', meaning_en: 'Requesting someone to wait', meaning_hi: 'कृपया इंतज़ार कीजिए', examples: [{ en: 'Please wait for two minutes.', hi: 'कृपया दो मिनट इंतज़ार कीजिए।' }] },
    { num: 6, text: 'What is your name?', pronunciation_devanagari: 'व्हॉट इज़ योर नेम?', meaning_en: "Asking someone's name", meaning_hi: 'आपका नाम क्या है?', examples: [{ en: 'What is your name?', hi: 'आपका नाम क्या है?' }] },
    { num: 7, text: 'Nice to meet you', pronunciation_devanagari: 'नाइस टू मीट यू', meaning_en: 'A polite phrase when meeting someone', meaning_hi: 'आपसे मिलकर अच्छा लगा', examples: [{ en: 'Nice to meet you, Rahul.', hi: 'राहुल, आपसे मिलकर अच्छा लगा।' }] },
    { num: 8, text: "I don't understand", pronunciation_devanagari: 'आइ डोन्ट अंडरस्टैंड', meaning_en: 'Saying you are not able to understand', meaning_hi: 'मुझे समझ नहीं आया', examples: [{ en: "I'm sorry, I don't understand.", hi: 'माफ़ कीजिए, मुझे समझ नहीं आया।' }] },
    { num: 9, text: 'Please speak slowly', pronunciation_devanagari: 'प्लीज़ स्पीक स्लोली', meaning_en: 'Requesting someone to talk more slowly', meaning_hi: 'कृपया धीरे बोलिए', examples: [{ en: 'Please speak slowly, I am learning English.', hi: 'कृपया धीरे बोलिए, मैं अंग्रेज़ी सीख रहा हूँ।' }] },
    { num: 10, text: 'Can you help me?', pronunciation_devanagari: 'कैन यू हेल्प मी?', meaning_en: 'Asking for help', meaning_hi: 'क्या आप मेरी मदद कर सकते हैं?', examples: [{ en: 'Can you help me with this form?', hi: 'क्या आप इस फ़ॉर्म में मेरी मदद कर सकते हैं?' }] },
];

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(base, n) {
    const x = new Date(base);
    x.setDate(x.getDate() + n);
    x.setHours(0, 0, 0, 0);
    return x;
}

async function readPdfText(filePath) {
    const buf = fs.readFileSync(filePath);
    const res = await pdfParse(buf);
    return res.text || '';
}

function dedupeSilverPuzzleText(text) {
    const parts = text.split(/\nSilver : Daily Puzzle/);
    return parts[0] || text;
}

function parseGrammarPuzzleSets(text) {
    const clean = dedupeSilverPuzzleText(text);
    const lines = clean.match(/^\d+.+Option [ABC]\s*$/gm) || [];
    const sets = [];
    let current = null;
    let dayNum = 0;
    for (const line of lines) {
        const m = line.match(/^(\d+)(.+)\.(.+?)Option ([ABC])\s*$/i);
        if (!m) continue;
        const qNum = parseInt(m[1], 10);
        if (qNum === 1) {
            dayNum += 1;
            current = { day: dayNum, title: `Correct Use of Grammar - Day ${dayNum}`, questions: [] };
            sets.push(current);
        }
        const blob = m[3];
        const opts = GRAMMAR_OPTION_BLOBS[blob];
        if (!opts) {
            console.warn(`[import] Unknown option blob "${blob}" — skip line`);
            continue;
        }
        const letter = m[4].toUpperCase();
        const correct_idx = { A: 0, B: 1, C: 2 }[letter];
        current.questions.push({
            question: `${m[2].trim()} (choose the correct option)`,
            options: opts,
            correct_idx,
            explanation: '',
        });
    }
    return sets.filter((s) => s.questions.length === 5);
}

function parseVocabSets(text) {
    const main = text.split(/\nBronze:/)[0];
    const re = /\d(Kitchen|Dining|Travel|Family)/g;
    const hits = [];
    let m;
    while ((m = re.exec(main)) !== null) {
        hits.push({ start: m.index, setNum: parseInt(m[0][0], 10), theme: m[1] });
    }
    const out = [];
    for (let i = 0; i < hits.length; i++) {
        const { start, setNum, theme } = hits[i];
        const end = hits[i + 1]?.start ?? main.length;
        const block = main.slice(start, end);
        const rest = block.replace(/^\d(Kitchen|Dining|Travel|Family)/, '');
        const itemRe = /([a-zA-Z]+);\s*([^;\n]+);\s*([^\n]+)/g;
        const vocabItems = [];
        let im;
        while ((im = itemRe.exec(rest)) !== null) {
            const word = im[1].trim();
            if (word.length < 2 || ['Theme', 'Image', 'Vocabul', 'Field'].some((w) => word.includes(w))) continue;
            vocabItems.push({
                word,
                pronunciation_hi: im[2].replace(/\s+/g, ' ').trim(),
                meaning_hi: im[3].replace(/\s+/g, ' ').trim(),
            });
        }
        if (vocabItems.length) out.push({ setNum, theme, vocabItems });
    }
    return out;
}

function parseBronzeStories(text) {
    const chunks = text.split(/Article number/i).slice(1);
    const stories = [];
    for (const ch of chunks) {
        const titleM = ch.match(/Title\s*([^\n]+)/i);
        let title = titleM ? titleM[1].trim() : 'One minute read';
        title = title.replace(/^Title\s*/i, '').trim();
        const enM = ch.match(/Article\s*\(English\)([\s\S]*?)(?:Article\s*\(Hindi|Moral|Keywords)/i);
        let text_content = enM ? enM[1].replace(/\s+/g, ' ').trim() : '';
        const moralM = ch.match(/Moral\s*\(English\)([\s\S]*?)(?:Keywords|Moral\s*\(Hindi|Article number|One minute)/i);
        const moral_en = moralM ? moralM[1].replace(/\s+/g, ' ').trim() : '—';
        if (!text_content) continue;
        stories.push({
            title,
            metadata: {
                title,
                audio: '',
                text_content,
                moral_en,
                moral_hi: '—',
                keywords: [],
                sentence_translations: [],
                importedFrom: IMPORT_TAG,
            },
        });
    }
    return stories;
}

function parseSpeeches(text) {
    const parts = text.split(/Speech \d+:/i).slice(1);
    const out = [];
    const seenTranscripts = new Set();
    let n = 0;
    for (const p of parts) {
        n += 1;
        const titleM = p.match(/Title\s*([^\n]+)/i);
        const title = (titleM?.[1] || `Speech ${n}`).replace(/^Title\s*/i, '').trim();
        const trM = p.match(/Transcript\s*"([^"]+)"/i) || p.match(/Transcript\s*([\s\S]*?)Keywords/i);
        const transcript = trM ? (trM[1] || '').replace(/\s+/g, ' ').trim() : '';
        if (!transcript || seenTranscripts.has(transcript)) continue;
        seenTranscripts.add(transcript);
        out.push({
            title,
            speaker: title.split(/[-–]/)[0]?.trim() || 'Speaker',
            transcript,
            youtubeUrl: '',
            keywords: [],
            phrases: [],
        });
    }
    return out;
}

function parseLyrics(text) {
    const parts = text.split(/Song \d+:/i).slice(1);
    const out = [];
    const seenLyrics = new Set();
    let n = 0;
    for (const p of parts) {
        n += 1;
        const titleLine = p.match(/^[^\n]+/);
        const rawTitle = titleLine ? titleLine[0].trim() : `Song ${n}`;
        const artistM = rawTitle.match(/[-–]\s*(.+)$/);
        const songTitle = rawTitle.replace(/\s*[-–].*$/, '').trim();
        const artist = artistM ? artistM[1].trim() : '';
        const lyrM = p.match(/Lyrics \(English\)([\s\S]*?)(?:Important Words|Key Phrases|Song \d+:|$)/i);
        const lyrics = lyrM ? lyrM[1].replace(/\s+/g, ' ').trim() : '';
        if (!lyrics || seenLyrics.has(lyrics)) continue;
        seenLyrics.add(lyrics);
        out.push({ title: songTitle || rawTitle, artist, lyrics });
    }
    return out;
}

function parseInstagramPages(text) {
    const parts = text.split(/Page \d+:/i).slice(1);
    return parts
        .map((body, i) => ({
            imageUrl: '',
            credit: `Curated learning feed · section ${i + 1}`,
            postLink: '',
            caption: body.replace(/\s+/g, ' ').trim().slice(0, 12000),
        }))
        .filter((p) => p.caption.length > 40);
}

function dateCursorFactory(baseDate) {
    const c = {};
    return (level, type) => {
        const k = `${level}:${type}`;
        const n = c[k] ?? 0;
        c[k] = n + 1;
        return addDays(baseDate, n);
    };
}

async function ensureModules(courseId, planByName) {
    const pid = (names) =>
        names.map((n) => planByName[n]?._id).filter(Boolean);

    const defs = [
        {
            title: 'Daily: Free foundations',
            description: 'Imported word and phrase of the day (text in app — no PDFs).',
            plans: ['Free Foundation', 'Bronze Content', 'Silver Content', 'Gold Professional', 'Full Course', 'Bonus Extras'],
            order: 95,
        },
        {
            title: 'Daily: Bronze reading & vocabulary',
            description: 'One-minute reads and themed vocabulary sets from Verble curriculum.',
            plans: ['Bronze Content', 'Silver Content', 'Gold Professional', 'Full Course', 'Bonus Extras'],
            order: 96,
        },
        {
            title: 'Daily: Silver grammar puzzles',
            description: 'Correct use of grammar — daily puzzle sets.',
            plans: ['Silver Content', 'Gold Professional', 'Full Course', 'Bonus Extras'],
            order: 97,
        },
        {
            title: 'Daily: Bonus speeches, lyrics & feeds',
            description: 'Speeches, song lyrics, and curated social-style learning snippets.',
            plans: ['Gold Professional', 'Full Course', 'Bonus Extras'],
            order: 98,
        },
    ];

    for (const d of defs) {
        await Module.findOneAndUpdate(
            { course: courseId, title: d.title },
            {
                course: courseId,
                title: d.title,
                description: d.description,
                chapters: ['Open your dashboard for today’s scheduled items.'],
                subscriptionPlans: pid(d.plans),
                order: d.order,
            },
            { upsert: true, new: true }
        );
        console.log(`[import] Module OK: ${d.title}`);
    }
}

async function run() {
    const mongoURI = process.env.DOCKER_ENV
        ? process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI
        : process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER;

    if (!mongoURI) {
        console.error('Set MONGODB_URI in .env');
        process.exit(1);
    }

    const pdfDir = process.env.VERBLE_IMPORT_DIR || DEFAULT_PDF_DIR;
    if (!fs.existsSync(pdfDir)) {
        console.error(`PDF directory missing: ${pdfDir}`);
        process.exit(1);
    }

    const baseDate = startOfDay(
        process.env.VERBLE_IMPORT_START_DATE || addDays(new Date(), 1)
    );
    console.log(`[import] Base date (local midnight): ${baseDate.toISOString()} (set VERBLE_IMPORT_START_DATE to override)`);

    await mongoose.connect(mongoURI);
    const adminUser = await User.findOne({ role: 'admin' });
    const course =
        (await Course.findOne({ isPublished: true }).sort({ createdAt: 1 })) || (await Course.findOne().sort({ createdAt: 1 }));

    if (!course) {
        console.error('No course found. Run seedData first.');
        process.exit(1);
    }

    const plans = await SubscriptionPlan.find({ course: course._id });
    const planByName = Object.fromEntries(plans.map((p) => [p.name, p]));

    const del = await DailyContent.deleteMany({ 'metadata.importedFrom': IMPORT_TAG });
    console.log(`[import] Removed ${del.deletedCount} prior imported daily items.`);

    await ensureModules(course._id, planByName);

    const nextDate = dateCursorFactory(baseDate);
    const docs = [];

    for (const row of FREE_WORD_ROWS) {
        docs.push({
            type: 'WORD',
            level: 'FREE',
            date: nextDate('FREE', 'WORD'),
            title: `Word of the Day — ${row.text}`,
            metadata: {
                wordNumber: row.num,
                text: row.text,
                pronunciation_ipa: row.pronunciation_ipa,
                pronunciation_devanagari: row.pronunciation_devanagari,
                meaning_en: row.meaning_en,
                meaning_hi: row.meaning_hi,
                partOfSpeech: row.partOfSpeech,
                examples: row.examples,
                synonyms: row.synonyms,
                antonyms: row.antonyms,
                importedFrom: IMPORT_TAG,
                importSlug: `free-word-${row.text}`,
            },
            isActive: true,
            createdBy: adminUser?._id,
        });
    }

    for (const row of FREE_PHRASE_ROWS) {
        docs.push({
            type: 'PHRASE',
            level: 'FREE',
            date: nextDate('FREE', 'PHRASE'),
            title: `Phrase of the Day — ${row.text}`,
            metadata: {
                phraseNumber: row.num,
                text: row.text,
                pronunciation_devanagari: row.pronunciation_devanagari,
                meaning_en: row.meaning_en,
                meaning_hi: row.meaning_hi,
                examples: row.examples,
                importedFrom: IMPORT_TAG,
                importSlug: `free-phrase-${row.num}`,
            },
            isActive: true,
            createdBy: adminUser?._id,
        });
    }

    const bronzeReadPath = join(pdfDir, 'Bronze  One minute read.pdf');
    if (fs.existsSync(bronzeReadPath)) {
        const t = await readPdfText(bronzeReadPath);
        const stories = parseBronzeStories(t);
        stories.forEach((s, i) => {
            docs.push({
                type: 'STORY',
                level: 'BRONZE',
                date: nextDate('BRONZE', 'STORY'),
                title: s.title,
                metadata: { ...s.metadata, importSlug: `bronze-read-${i}` },
                isActive: true,
                createdBy: adminUser?._id,
            });
        });
        console.log(`[import] Bronze stories: ${stories.length}`);
    }

    const bronzeVocabPath = join(pdfDir, 'Bronze Essential Vocabulary.pdf');
    if (fs.existsSync(bronzeVocabPath)) {
        const t = await readPdfText(bronzeVocabPath);
        const sets = parseVocabSets(t);
        sets.forEach((s, i) => {
            docs.push({
                type: 'VOCAB_SET',
                level: 'BRONZE',
                date: nextDate('BRONZE', 'VOCAB_SET'),
                title: `${s.theme} vocabulary`,
                metadata: {
                    theme: s.theme,
                    vocabSetNumber: s.setNum,
                    vocabItems: s.vocabItems,
                    importedFrom: IMPORT_TAG,
                    importSlug: `bronze-vocab-${s.theme}-${i}`,
                },
                isActive: true,
                createdBy: adminUser?._id,
            });
        });
        console.log(`[import] Bronze vocab sets: ${sets.length}`);
    }

    const silverPath = join(pdfDir, 'Silver  Daily Puzzle  Correct Use of Grammar.pdf');
    if (fs.existsSync(silverPath)) {
        const t = await readPdfText(silverPath);
        const puzzleSets = parseGrammarPuzzleSets(t);
        puzzleSets.forEach((set, i) => {
            docs.push({
                type: 'PUZZLE',
                level: 'SILVER',
                date: nextDate('SILVER', 'PUZZLE'),
                title: set.title,
                metadata: {
                    questions: set.questions,
                    importedFrom: IMPORT_TAG,
                    importSlug: `silver-grammar-${set.day}-${i}`,
                },
                isActive: true,
                createdBy: adminUser?._id,
            });
        });
        console.log(`[import] Silver puzzle sets: ${puzzleSets.length}`);
    }

    const speechPath = join(pdfDir, 'Bonus Module Famous Speeches.pdf');
    if (fs.existsSync(speechPath)) {
        const t = await readPdfText(speechPath);
        const speeches = parseSpeeches(t);
        speeches.forEach((s, i) => {
            docs.push({
                type: 'SPEECH',
                level: 'GOLD',
                date: nextDate('GOLD', 'SPEECH'),
                title: s.title,
                metadata: {
                    speaker: s.speaker,
                    youtubeUrl: s.youtubeUrl,
                    transcript: s.transcript,
                    keywords: s.keywords,
                    phrases: s.phrases,
                    speechNumber: i + 1,
                    importedFrom: IMPORT_TAG,
                    importSlug: `bonus-speech-${i}`,
                },
                isActive: true,
                createdBy: adminUser?._id,
            });
        });
        console.log(`[import] Speeches: ${speeches.length}`);
    }

    const lyricsPath = join(pdfDir, 'Bonus Module Song Lyrics.pdf');
    if (fs.existsSync(lyricsPath)) {
        const t = await readPdfText(lyricsPath);
        const songs = parseLyrics(t);
        songs.forEach((s, i) => {
            docs.push({
                type: 'LYRICS',
                level: 'GOLD',
                date: nextDate('GOLD', 'LYRICS'),
                title: s.title,
                metadata: {
                    artist: s.artist,
                    lyrics: s.lyrics,
                    audio: '',
                    words: [],
                    phrases: [],
                    lyricsNumber: i + 1,
                    importedFrom: IMPORT_TAG,
                    importSlug: `bonus-lyrics-${i}`,
                },
                isActive: true,
                createdBy: adminUser?._id,
            });
        });
        console.log(`[import] Lyrics: ${songs.length}`);
    }

    const igPath = join(pdfDir, 'Bonus Module Curated Instagram Feeds.pdf');
    if (fs.existsSync(igPath)) {
        const t = await readPdfText(igPath);
        const posts = parseInstagramPages(t);
        if (posts.length) {
            docs.push({
                type: 'FEED',
                level: 'GOLD',
                date: nextDate('GOLD', 'FEED'),
                title: 'Curated Instagram-style learning feed',
                metadata: {
                    posts,
                    feedNumber: 1,
                    importedFrom: IMPORT_TAG,
                    importSlug: 'bonus-feed-1',
                },
                isActive: true,
                createdBy: adminUser?._id,
            });
        }
        console.log(`[import] FEED posts (pages): ${posts.length}`);
    }

    if (docs.length) {
        await DailyContent.insertMany(docs);
    }

    console.log(`[import] Inserted ${docs.length} DailyContent documents.`);
    await mongoose.disconnect();
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
