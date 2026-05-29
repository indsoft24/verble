export interface SyllabusTopic {
    title: string;
    detail: string;
}

export interface SyllabusModule {
    id: string;
    title: string;
    phase: string;
    duration: string;
    summary: string;
    topics: SyllabusTopic[];
}

export const FULL_COURSE_SYLLABUS: SyllabusModule[] = [
    {
        id: '00',
        title: 'Module 00: Introductions',
        phase: 'Getting started',
        duration: 'Week 0',
        summary: 'Set your goals, meet your coach, and understand how Verble builds fluency step by step.',
        topics: [
            { title: 'Why English matters today', detail: 'Career, travel, and confidence outcomes' },
            { title: 'Meet your lead coach', detail: 'Methodology and how to use the platform' },
            { title: 'Your learning roadmap', detail: 'FREE → Bronze → Silver → Gold path' },
        ],
    },
    {
        id: '01',
        title: 'Module 01: Foundations',
        phase: 'Core skills',
        duration: 'Weeks 1–5',
        summary: 'Master sounds, letters, and pronunciation so you speak clearly from day one.',
        topics: [
            { title: 'Alphabets & phonetics', detail: 'Letter names, sounds, and mouth positions' },
            { title: 'Consonant clusters', detail: 'Blends, silent letters, and common traps' },
            { title: 'Vowel sounds', detail: 'Short vs long vowels with Hindi cues' },
            { title: 'Listening drills', detail: 'Repeat-after-me audio practice' },
        ],
    },
    {
        id: '02',
        title: 'Module 02: Language Basics',
        phase: 'Core skills',
        duration: 'Week 6',
        summary: 'Essential grammar building blocks used in everyday Hindi–English conversation.',
        topics: [
            { title: 'Gender & number', detail: 'He/she/they and singular/plural rules' },
            { title: 'Opposites & pairs', detail: 'Antonyms for faster recall' },
            { title: 'Commonly confused words', detail: 'Say/said, do/does, much/many' },
        ],
    },
    {
        id: '03',
        title: 'Module 03–05: Parts of Speech',
        phase: 'Grammar depth',
        duration: 'Weeks 7–12',
        summary: 'Nouns through prepositions — the toolkit for correct, natural sentences.',
        topics: [
            { title: 'Nouns & pronouns', detail: 'Subjects, objects, and possession' },
            { title: 'Verbs & adverbs', detail: 'Action, manner, frequency, and degree' },
            { title: 'Adjectives & articles', detail: 'Descriptions and a/an/the usage' },
            { title: 'Conjunctions & prepositions', detail: 'Connecting ideas and place/time' },
        ],
    },
    {
        id: '06',
        title: 'Module 06–08: Advanced Structures',
        phase: 'Fluency',
        duration: 'Weeks 13–18',
        summary: 'Tenses, modals, and punctuation for professional and academic English.',
        topics: [
            { title: 'Tenses mastery', detail: 'Past, present, future — simple to perfect' },
            { title: 'Modals & conditionals', detail: 'Can, should, would, if-clauses' },
            { title: 'Punctuation & articles', detail: 'Commas, apostrophes, and clarity' },
            { title: 'Sentence transformation', detail: 'Active/passive and reported speech' },
        ],
    },
    {
        id: 'bonus',
        title: 'Bonus Resources',
        phase: 'Lifetime access',
        duration: 'Ongoing',
        summary: 'Extra practice libraries to keep you improving after the core modules.',
        topics: [
            { title: 'Situational vocabulary', detail: '50+ real-life categories (office, travel, etc.)' },
            { title: 'Famous speeches & scenes', detail: 'Listen, explain, and submit for review' },
            { title: 'Downloadable PDFs', detail: 'Cheat sheets and revision notes' },
            { title: 'Daily Verble activities', detail: 'Word, phrase, puzzles, and more' },
        ],
    },
];
