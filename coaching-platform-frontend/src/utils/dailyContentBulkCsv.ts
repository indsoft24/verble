import { addDays, format, isValid, parse } from 'date-fns';
import type { CreateDailyContentPayload } from '../services/dailyContentAdminService';
import {
    type AdminContentTypeKey,
    getCatalogEntry,
    apiTypeForAdminKey,
    levelForAdminKey,
} from './dailyContentTypeCatalog';

export type BulkDailyContentType = AdminContentTypeKey;

/** Number of example_N_en / example_N_hi column pairs for WORD and PHRASE bulk CSV. */
export const EXAMPLE_PAIR_COUNT = 5;

/** Numbered slot counts for one-row-per-day grouped types. */
export const VOCAB_WORD_COUNT = 10;
export const CONVERSATION_LINE_COUNT = 12;
export const PUZZLE_QUESTION_COUNT = 5;
export const FEED_POST_COUNT = 6;

/** Rows in downloadable / preview bulk CSV templates (round-trip testing). */
export const BULK_TEMPLATE_ROW_COUNT = 10;

export type ParsedExample = { en: string; hi: string; audio?: string };

export interface BulkColumnSpec {
    key: string;
    label: string;
    required: boolean;
    hint?: string;
    /** Human label matching the manual admin form */
    formField?: string;
}

export interface BulkTypeSchema {
    type: BulkDailyContentType;
    description: string;
    rowMode: 'one_row_per_item' | 'grouped';
    groupHint?: string;
    columns: BulkColumnSpec[];
    /** Extra grouped sample rows keyed by column key (no header row). */
    exampleRows: Record<string, string>[];
}

const DEFAULT_SCENE_SUBMISSION_PROMPT =
    'Write short summaries in your own words. You may submit 2 to 5 summaries about what you understood from the scene.';

function vocabWordColumnSpecs(): BulkColumnSpec[] {
    const cols: BulkColumnSpec[] = [];
    for (let i = 1; i <= VOCAB_WORD_COUNT; i++) {
        cols.push({
            key: `word_${i}`,
            label: `word_${i}`,
            required: false,
            hint: i === 1 ? 'One row per day; up to 10 words' : undefined,
            formField: `Word ${i} (English)`,
        });
        cols.push({
            key: `pronunciation_hi_${i}`,
            label: `pronunciation_hi_${i}`,
            required: false,
            formField: `Pronunciation ${i} (Hindi)`,
        });
        cols.push({
            key: `meaning_hi_${i}`,
            label: `meaning_hi_${i}`,
            required: false,
            formField: `Meaning ${i} (Hindi)`,
        });
    }
    return cols;
}

function conversationLineColumnSpecs(): BulkColumnSpec[] {
    const cols: BulkColumnSpec[] = [];
    for (let i = 1; i <= CONVERSATION_LINE_COUNT; i++) {
        cols.push({
            key: `line_${i}_speaker`,
            label: `line_${i}_speaker`,
            required: false,
            hint: i === 1 ? 'One row per day; up to 12 dialogue lines' : undefined,
            formField: `Line ${i} speaker`,
        });
        cols.push({
            key: `line_${i}_text_en`,
            label: `line_${i}_text_en`,
            required: false,
            formField: `Line ${i} (English)`,
        });
        cols.push({
            key: `line_${i}_text_hi`,
            label: `line_${i}_text_hi`,
            required: false,
            formField: `Line ${i} (Hindi)`,
        });
        cols.push({
            key: `line_${i}_audio`,
            label: `line_${i}_audio`,
            required: false,
            formField: `Line ${i} audio URL`,
        });
    }
    return cols;
}

function conversationSetColumns(isProfessional: boolean): BulkColumnSpec[] {
    const shared: BulkColumnSpec[] = [
        { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
        { key: 'title', label: 'title', required: true, formField: 'Admin title' },
    ];
    if (isProfessional) {
        shared.push(
            { key: 'topic_name', label: 'topic_name', required: false, formField: 'Topic name' },
            { key: 'description', label: 'description', required: false, formField: 'Description' },
            { key: 'tags', label: 'tags', required: false, hint: 'comma-separated', formField: 'Tags' },
            {
                key: 'related_content_ids',
                label: 'related_content_ids',
                required: false,
                hint: 'comma-separated content IDs',
                formField: 'Related content IDs',
            }
        );
    } else {
        shared.push(
            { key: 'scenario_title', label: 'scenario_title', required: false, formField: 'Scenario title (English)' },
            {
                key: 'scenario_title_hi',
                label: 'scenario_title_hi',
                required: false,
                formField: 'Scenario title (Hindi)',
            }
        );
    }
    shared.push(
        { key: 'participant_1', label: 'participant_1', required: false, formField: 'Person 1 name' },
        { key: 'participant_2', label: 'participant_2', required: false, formField: 'Person 2 name' },
        {
            key: 'participants',
            label: 'participants',
            required: false,
            hint: 'comma-separated; optional if participant_1 and participant_2 are set',
            formField: 'Participants (legacy)',
        },
        ...conversationLineColumnSpecs()
    );
    return shared;
}

function puzzleQuestionColumnSpecs(): BulkColumnSpec[] {
    const cols: BulkColumnSpec[] = [];
    for (let i = 1; i <= PUZZLE_QUESTION_COUNT; i++) {
        cols.push({
            key: `question_${i}`,
            label: `question_${i}`,
            required: false,
            hint: i === 1 ? 'One row per day; exactly 5 questions' : undefined,
            formField: `Question ${i}`,
        });
        for (let o = 1; o <= 4; o++) {
            cols.push({
                key: `option_${i}_${o}`,
                label: `option_${i}_${o}`,
                required: false,
                formField: `Question ${i} choice ${String.fromCharCode(64 + o)}`,
            });
        }
        cols.push({
            key: `correct_option_${i}`,
            label: `correct_option_${i}`,
            required: false,
            hint: '1–4',
            formField: `Question ${i} correct choice`,
        });
    }
    return cols;
}

function feedPostColumnSpecs(): BulkColumnSpec[] {
    const cols: BulkColumnSpec[] = [];
    for (let i = 1; i <= FEED_POST_COUNT; i++) {
        cols.push({
            key: `post_${i}_image_url`,
            label: `post_${i}_image_url`,
            required: false,
            hint: i === 1 ? 'One row per day; up to 6 posts' : undefined,
            formField: `Post ${i} image URL`,
        });
        cols.push({
            key: `post_${i}_credit`,
            label: `post_${i}_credit`,
            required: false,
            formField: `Post ${i} account name`,
        });
        cols.push({
            key: `post_${i}_credit_url`,
            label: `post_${i}_credit_url`,
            required: false,
            formField: `Post ${i} profile URL`,
        });
        cols.push({
            key: `post_${i}_link`,
            label: `post_${i}_link`,
            required: false,
            formField: `Post ${i} URL`,
        });
        cols.push({
            key: `post_${i}_caption`,
            label: `post_${i}_caption`,
            required: false,
            formField: `Post ${i} caption`,
        });
    }
    return cols;
}

function exampleColumnSpecs(): BulkColumnSpec[] {
    const cols: BulkColumnSpec[] = [];
    for (let i = 1; i <= EXAMPLE_PAIR_COUNT; i++) {
        cols.push({
            key: `example_${i}_en`,
            label: `example_${i}_en`,
            required: false,
            hint: i === 1 ? 'Use numbered columns instead of JSON' : undefined,
            formField: `Example ${i} (English)`,
        });
        cols.push({
            key: `example_${i}_hi`,
            label: `example_${i}_hi`,
            required: false,
            formField: `Example ${i} (Hindi)`,
        });
    }
    return cols;
}

export function getBulkSchema(contentType: BulkDailyContentType): BulkTypeSchema {
    switch (contentType) {
        case 'WORD':
            return {
                type: 'WORD',
                description: 'One row per word. IPA and Devanagari are optional.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, hint: 'YYYY-MM-DD', formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'text', label: 'text', required: true, formField: 'Word' },
                    { key: 'meaning_en', label: 'meaning_en', required: true, hint: 'or en', formField: 'English meaning' },
                    { key: 'meaning_hi', label: 'meaning_hi', required: true, hint: 'or hi', formField: 'Hindi meaning' },
                    { key: 'part_of_speech', label: 'part_of_speech', required: false, formField: 'Part of speech' },
                    { key: 'pronunciation_ipa', label: 'pronunciation_ipa', required: false, formField: 'IPA pronunciation' },
                    { key: 'pronunciation_devanagari', label: 'pronunciation_devanagari', required: false, formField: 'Devanagari pronunciation' },
                    { key: 'synonyms', label: 'synonyms', required: false, hint: 'comma-separated', formField: 'Synonyms' },
                    { key: 'antonyms', label: 'antonyms', required: false, hint: 'comma-separated', formField: 'Antonyms' },
                    { key: 'audio', label: 'audio', required: false, formField: 'Audio URL' },
                    ...exampleColumnSpecs(),
                    {
                        key: 'examples_json',
                        label: 'examples_json',
                        required: false,
                        hint: 'Advanced: [{"en":"","hi":""}] — use example_1_en/hi columns instead',
                        formField: 'Example sentences (advanced JSON)',
                    },
                ],
                exampleRows: [],
            };
        case 'PHRASE':
            return {
                type: 'PHRASE',
                description: 'One row per phrase.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, hint: 'YYYY-MM-DD', formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'text', label: 'text', required: true, formField: 'Phrase' },
                    { key: 'meaning_en', label: 'meaning_en', required: true, hint: 'or en', formField: 'English meaning' },
                    { key: 'meaning_hi', label: 'meaning_hi', required: true, hint: 'or hi', formField: 'Hindi meaning' },
                    { key: 'audio', label: 'audio', required: false, formField: 'Audio URL' },
                    ...exampleColumnSpecs(),
                    {
                        key: 'examples_json',
                        label: 'examples_json',
                        required: false,
                        hint: 'Advanced JSON — prefer example_1_en, example_1_hi, example_2_en, …',
                        formField: 'Example sentences (advanced JSON)',
                    },
                ],
                exampleRows: [],
            };
        case 'STORY':
            return {
                type: 'STORY',
                description: 'One row per story. Use \\n inside text_content for newlines (literal backslash + n).',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'text_content', label: 'text_content', required: true, formField: 'Story body', hint: 'Use \\n for newlines' },
                    { key: 'story_title', label: 'story_title', required: false, formField: 'Story headline' },
                    { key: 'moral_en', label: 'moral_en', required: false, formField: 'Moral (English)' },
                    { key: 'moral_hi', label: 'moral_hi', required: false, formField: 'Moral (Hindi)' },
                    { key: 'sentence_translations', label: 'sentence_translations', required: false, hint: 'pipe | between lines', formField: 'Sentence translations' },
                    { key: 'audio', label: 'audio', required: false, formField: 'Audio URL' },
                    {
                        key: 'important_words',
                        label: 'important_words',
                        required: false,
                        hint: 'word:en:hi|word2:en2:hi2 (up to 5)',
                        formField: 'Important words',
                    },
                ],
                exampleRows: [],
            };
        case 'VOCAB_SET':
            return {
                type: 'VOCAB_SET',
                description:
                    'One row per vocabulary set (one scheduled day). Use word_1, pronunciation_hi_1, meaning_hi_1 through word_10 for up to 10 words.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'theme', label: 'theme', required: true, formField: 'Theme' },
                    { key: 'vocab_set_number', label: 'vocab_set_number', required: false, formField: 'Vocabulary set #' },
                    { key: 'theme_image_description', label: 'theme_image_description', required: false, formField: 'Theme image description' },
                    { key: 'theme_image_url', label: 'theme_image_url', required: false, formField: 'Theme image URL' },
                    ...vocabWordColumnSpecs(),
                ],
                exampleRows: [],
            };
        case 'CONVERSATION':
            return {
                type: 'CONVERSATION',
                description:
                    'One row per conversation day. Set scenario and participants once; use line_1_speaker, line_1_text_en, line_1_text_hi (through line_12) for dialogue.',
                rowMode: 'one_row_per_item',
                columns: conversationSetColumns(false),
                exampleRows: [],
            };
        case 'PUZZLE_SPOT':
        case 'PUZZLE_GRAMMAR':
            return {
                type: contentType,
                description:
                    'One row per puzzle day with exactly 5 questions. Use question_1, option_1_1…option_1_4, correct_option_1 through question_5.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: false, formField: 'Admin title' },
                    ...puzzleQuestionColumnSpecs(),
                    {
                        key: 'questions_json',
                        label: 'questions_json',
                        required: false,
                        hint: 'Optional JSON override — prefer numbered columns',
                        formField: 'Advanced JSON (skip if using columns)',
                    },
                ],
                exampleRows: [],
            };
        case 'PROFESSIONAL_CONVERSATION':
            return {
                type: 'PROFESSIONAL_CONVERSATION',
                description:
                    'One row per professional conversation day. Set topic, tags, and participants once; use line_1_speaker through line_12 for dialogue.',
                rowMode: 'one_row_per_item',
                columns: conversationSetColumns(true),
                exampleRows: [],
            };
        case 'SCENE':
            return {
                type: 'SCENE',
                description: 'One row per scene. Use flat columns below; leave optional fields empty if not needed.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'scene_headline', label: 'scene_headline', required: false, formField: 'Scene headline (learner)' },
                    { key: 'image_url', label: 'image_url', required: false, formField: 'Scene image URL' },
                    { key: 'gif_url', label: 'gif_url', required: false, formField: 'Scene GIF URL' },
                    { key: 'explanation', label: 'explanation', required: true, formField: 'Explanation (English)' },
                    { key: 'hindi_summary', label: 'hindi_summary', required: false, formField: 'Hindi summary' },
                    {
                        key: 'submission_prompt',
                        label: 'submission_prompt',
                        required: false,
                        formField: 'Learner instructions',
                    },
                    { key: 'keywords', label: 'keywords', required: false, hint: 'word:en:hi|word2:en2:hi2', formField: 'Keywords' },
                    { key: 'metadata_json', label: 'metadata_json', required: false, hint: 'Optional override', formField: 'Advanced JSON override' },
                ],
                exampleRows: [],
            };
        case 'SPEECH':
            return {
                type: 'SPEECH',
                description: 'One row per speech. Pipe-separated lists for keywords and phrases.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'speaker', label: 'speaker', required: false, formField: 'Speaker name' },
                    { key: 'youtube_url', label: 'youtube_url', required: false, formField: 'YouTube URL' },
                    { key: 'credit', label: 'credit', required: false, formField: 'Source credit' },
                    { key: 'credit_url', label: 'credit_url', required: false, formField: 'Channel / profile URL' },
                    { key: 'transcript', label: 'transcript', required: false, formField: 'Transcript' },
                    { key: 'keywords', label: 'keywords', required: false, hint: 'word:en:hi|word2:en2:hi2', formField: 'Keywords' },
                    { key: 'phrases', label: 'phrases', required: false, hint: 'phrase:en:hi', formField: 'Phrases' },
                    { key: 'metadata_json', label: 'metadata_json', required: false, formField: 'Advanced JSON override' },
                ],
                exampleRows: [],
            };
        case 'LYRICS':
            return {
                type: 'LYRICS',
                description: 'One row per lyrics entry. Use \\n inside lyrics for line breaks.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'artist', label: 'artist', required: false, formField: 'Artist' },
                    { key: 'youtube_url', label: 'youtube_url', required: false, formField: 'YouTube URL' },
                    { key: 'audio', label: 'audio', required: false, formField: 'Direct audio URL (fallback)' },
                    { key: 'credit', label: 'credit', required: false, formField: 'Source credit' },
                    { key: 'credit_url', label: 'credit_url', required: false, formField: 'Channel / profile URL' },
                    { key: 'lyrics', label: 'lyrics', required: false, formField: 'Lyrics text' },
                    { key: 'words', label: 'words', required: false, hint: 'word:en:hi|word2:en2:hi2', formField: 'Important words' },
                    { key: 'phrases', label: 'phrases', required: false, hint: 'phrase:en:hi|phrase2:en2:hi2', formField: 'Important phrases' },
                    { key: 'metadata_json', label: 'metadata_json', required: false, formField: 'Advanced JSON override' },
                ],
                exampleRows: [],
            };
        case 'FEED':
            return {
                type: 'FEED',
                description:
                    'One row per feed day. Use post_1_image_url, post_1_credit, … through post_6 for up to 6 Instagram posts.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    ...feedPostColumnSpecs(),
                    { key: 'metadata_json', label: 'metadata_json', required: false, formField: 'Advanced JSON override' },
                ],
                exampleRows: [],
            };
        default:
            throw new Error(`Unsupported bulk type: ${contentType}`);
    }
}

/** Common spreadsheet shortcuts → canonical column keys */
const HEADER_ALIASES: Record<string, string> = {
    hi: 'meaning_hi',
    hindi: 'meaning_hi',
    meaning_hindi: 'meaning_hi',
    en: 'meaning_en',
    english: 'meaning_en',
    meaning_english: 'meaning_en',
    moral_hindi: 'moral_hi',
    moral_english: 'moral_en',
};

function normalizeHeader(raw: string): string {
    const base = raw
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/["']/g, '');
    return HEADER_ALIASES[base] ?? base;
}

/** Read a cell when headers were not normalized (legacy spreadsheets). */
function rowCell(row: Record<string, string>, ...keys: string[]): string {
    for (const key of keys) {
        const v = row[key];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

/** Split CSV into physical lines; merge quoted newlines inside fields */
function splitCsvRecords(text: string): string[] {
    const records: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            // Preserve doubled quotes in the record; parseCsvLine unescapes them once.
            if (inQuotes && text[i + 1] === '"') {
                cur += '""';
                i++;
            } else {
                inQuotes = !inQuotes;
                cur += c;
            }
        } else if ((c === '\n' || (c === '\r' && text[i + 1] === '\n')) && !inQuotes) {
            if (c === '\r') i++;
            const t = cur.trim();
            if (t.length) records.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    const t = cur.trim();
    if (t.length) records.push(cur);
    return records;
}

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    const s = line.replace(/\r$/, '');
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '"') {
            if (inQuotes && s[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            cells.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    cells.push(cur);
    return cells.map((cell) => {
        let v = cell.trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
        return v;
    });
}

export function parseCsvToObjects(csvText: string): { headers: string[]; rawHeaders: string[]; rows: Record<string, string>[] } {
    const records = splitCsvRecords(csvText);
    if (records.length === 0) {
        throw new Error('The CSV file is empty.');
    }
    const rawHeaders = parseCsvLine(records[0]);
    if (rawHeaders.length === 0 || !rawHeaders.some((h) => h.trim())) {
        throw new Error('Missing header row.');
    }
    const headers = rawHeaders.map(normalizeHeader);
    const seen = new Set<string>();
    for (const h of headers) {
        if (seen.has(h)) throw new Error(`Duplicate column header after normalization: ${h}`);
        seen.add(h);
    }
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < records.length; i++) {
        const cells = parseCsvLine(records[i]);
        if (cells.every((c) => !c.trim())) continue;
        if (cells.length !== headers.length) {
            throw new Error(
                `Row ${i + 1}: expected ${headers.length} columns (same as header), found ${cells.length}. Check for unquoted commas or mismatched quotes.`
            );
        }
        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = cells[j] ?? '';
        }
        rows.push(row);
    }
    if (rows.length === 0) {
        throw new Error('No data rows found (only headers).');
    }
    return { headers, rawHeaders, rows };
}

export function parseFlexibleDate(value: string): string | null {
    const v = value.trim();
    if (!v) return null;

    const isReasonableYear = (d: Date) => {
        const y = d.getFullYear();
        return y >= 2000 && y <= 2099;
    };

    const formats = [
        'yyyy-MM-dd',
        'M/d/yy',
        'MM/dd/yy',
        'd/M/yy',
        'dd/MM/yy',
        'M/d/yyyy',
        'MM/dd/yyyy',
        'd/M/yyyy',
        'dd/MM/yyyy',
    ];
    for (const f of formats) {
        const d = parse(v, f, new Date());
        if (isValid(d) && isReasonableYear(d)) return format(d, 'yyyy-MM-dd');
    }
    const iso = new Date(v);
    if (isValid(iso) && isReasonableYear(iso)) return format(iso, 'yyyy-MM-dd');
    return null;
}

function splitCommaList(s: string): string[] {
    return s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function unescapeTextContent(s: string): string {
    return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

function escapeCsvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function buildNumberedColumnSamples(): Record<string, string> {
    const samples: Record<string, string> = {};

    const vocabWords = [
        { word: 'menu', ph: 'मेन्यू', hi: 'मेन्यू' },
        { word: 'waiter', ph: 'वेटर', hi: 'बैरा' },
        { word: 'table', ph: 'टेबल', hi: 'टेबल' },
        { word: 'apron', ph: 'एप्रन', hi: 'एप्रन' },
        { word: 'napkin', ph: 'नैपकिन', hi: 'नैपकिन' },
        { word: 'spoon', ph: 'स्पून', hi: 'चम्मच' },
        { word: 'fork', ph: 'फोर्क', hi: 'कांटा' },
        { word: 'plate', ph: 'प्लेट', hi: 'प्लेट' },
        { word: 'bowl', ph: 'बाउल', hi: 'कटोरी' },
        { word: 'tissue', ph: 'टिश्यू', hi: 'टिश्यू पेपर' },
    ];
    for (let i = 1; i <= VOCAB_WORD_COUNT; i++) {
        const item = vocabWords[i - 1];
        samples[`word_${i}`] = item.word;
        samples[`pronunciation_hi_${i}`] = item.ph;
        samples[`meaning_hi_${i}`] = item.hi;
    }

    const dialogueLines = [
        { speaker: 'Waiter', en: 'Good evening!', hi: 'शुभ संध्या!' },
        { speaker: 'Customer', en: 'A table for two please.', hi: 'कृपया दो लोगों के लिए एक मेज।' },
        { speaker: 'Waiter', en: 'Here is the menu.', hi: 'यह रहा मेन्यू।' },
        { speaker: 'Customer', en: 'I will have soup.', hi: 'मुझे सूप चाहिए।' },
        { speaker: 'Waiter', en: 'Anything to drink?', hi: 'पीने के लिए कुछ?' },
        { speaker: 'Customer', en: 'Water, please.', hi: 'पानी, कृपया।' },
    ];
    for (let i = 1; i <= CONVERSATION_LINE_COUNT; i++) {
        const line = dialogueLines[(i - 1) % dialogueLines.length];
        samples[`line_${i}_speaker`] = line.speaker;
        samples[`line_${i}_text_en`] = line.en;
        samples[`line_${i}_text_hi`] = line.hi;
        samples[`line_${i}_audio`] = '';
    }

    for (let i = 1; i <= PUZZLE_QUESTION_COUNT; i++) {
        samples[`question_${i}`] = `Sample question ${i}?`;
        samples[`option_${i}_1`] = 'Option A';
        samples[`option_${i}_2`] = 'Option B';
        samples[`option_${i}_3`] = 'Option C';
        samples[`option_${i}_4`] = 'Option D';
        samples[`correct_option_${i}`] = String((i % 4) + 1);
    }

    for (let i = 1; i <= FEED_POST_COUNT; i++) {
        samples[`post_${i}_image_url`] = `https://example.com/post${i}.jpg`;
        samples[`post_${i}_credit`] = '@verble';
        samples[`post_${i}_credit_url`] = 'https://instagram.com/verble';
        samples[`post_${i}_link`] = `https://instagram.com/p/sample${i}`;
        samples[`post_${i}_caption`] = `Sample caption ${i}`;
    }

    return samples;
}

const COLUMN_SAMPLE_VALUES: Record<string, string> = {
    date: '2026-04-01',
    title: 'Sample title',
    text: 'curious',
    meaning_en: 'eager to know',
    meaning_hi: 'जिज्ञासु',
    audio: '',
    part_of_speech: 'adjective',
    pronunciation_ipa: '/ˈkjʊəriəs/',
    pronunciation_devanagari: '',
    synonyms: 'inquisitive, eager',
    antonyms: 'indifferent',
    example_1_en: 'She was curious about the result.',
    example_1_hi: 'वह परिणाम के बारे में जिज्ञासु थी।',
    example_2_en: 'A curious mind learns faster.',
    example_2_hi: 'जिज्ञासु दिमाग तेजी से सीखता है।',
    example_3_en: 'Curiosity helps us learn.',
    example_3_hi: 'जिज्ञासा सीखने में मदद करती है।',
    example_4_en: 'Stay curious every day.',
    example_4_hi: 'हर दिन जिज्ञासु बने रहें।',
    example_5_en: 'Ask good questions.',
    example_5_hi: 'अच्छे प्रश्न पूछें।',
    examples_json: '',
    text_content: 'Once there was a boy.\\nHe returned a wallet.',
    story_title: 'The honest boy',
    moral_en: 'Honesty matters',
    moral_hi: 'ईमानदारी महत्वपूर्ण है',
    sentence_translations: 'Line 1 hi|Line 2 hi',
    important_words: 'honest:honest:ईमानदार|wallet:wallet:बटुआ',
    theme: 'Dining',
    word: 'menu',
    pronunciation_hi: 'मेन्यू',
    vocab_set_number: '1',
    theme_image_description: 'Family at a table',
    theme_image_url: 'https://example.com/theme.jpg',
    scenario_title: 'At the restaurant',
    scenario_title_hi: 'रेस्तरां में',
    participant_1: 'Waiter',
    participant_2: 'Customer',
    topic_name: 'Office standup',
    description: 'A short professional check-in',
    tags: 'office,meetings',
    related_content_ids: '',
    participants: 'Waiter,Customer',
    speaker: 'Waiter',
    text_en: 'Good evening!',
    text_hi: 'शुभ संध्या!',
    line_audio: '',
    question: 'Which sentence is correct?',
    option_1: 'I go to school.',
    option_2: 'I goes to school.',
    option_3: 'I going school.',
    option_4: 'I gone school.',
    correct_option: '1',
    questions_json: '',
    scene_headline: 'At the market',
    image_url: 'https://example.com/scene.jpg',
    gif_url: '',
    explanation: 'A busy market scene.',
    hindi_summary: 'एक व्यस्त बाजार',
    submission_prompt: DEFAULT_SCENE_SUBMISSION_PROMPT,
    keywords: 'stall:दुकान|crowd:भीड',
    metadata_json: '',
    youtube_url: 'https://youtube.com/watch?v=example',
    transcript: 'Speech transcript text…',
    phrases: 'thank you:Thank you:धन्यवाद',
    words: 'love:love:प्यार|heart:heart:दिल',
    artist: 'Sample Artist',
    lyrics: 'Line one\\nLine two',
    post_image_url: 'https://example.com/post.jpg',
    post_credit: '@verble',
    post_credit_url: 'https://instagram.com/verble',
    post_link: 'https://instagram.com/p/example',
    post_caption: 'Daily inspiration',
    ...buildNumberedColumnSamples(),
};

const TEMPLATE_THEMES = [
    'Dining',
    'Kitchen',
    'Bedroom',
    'Bathroom',
    'Classroom',
    'Office',
    'Living Room',
    'Hospital',
    'Airport',
    'Bank',
];

function templateDate(rowIndex: number): string {
    const base = parse('2026-04-01', 'yyyy-MM-dd', new Date());
    return format(addDays(base, rowIndex), 'yyyy-MM-dd');
}

function baseTemplateRow(schema: BulkTypeSchema): Record<string, string> {
    const row: Record<string, string> = {};
    for (const col of schema.columns) {
        row[col.key] = COLUMN_SAMPLE_VALUES[col.key] ?? '';
    }
    return row;
}

function fillVocabWordSlots(row: Record<string, string>, rowIndex: number): void {
    const bank = [
        { word: 'menu', ph: 'मेन्यू', hi: 'मेन्यू' },
        { word: 'waiter', ph: 'वेटर', hi: 'बैरा' },
        { word: 'table', ph: 'टेबल', hi: 'टेबल' },
        { word: 'apron', ph: 'एप्रन', hi: 'एप्रन' },
        { word: 'napkin', ph: 'नैपकिन', hi: 'नैपकिन' },
        { word: 'spoon', ph: 'स्पून', hi: 'चम्मच' },
        { word: 'fork', ph: 'फोर्क', hi: 'कांटा' },
        { word: 'plate', ph: 'प्लेट', hi: 'प्लेट' },
        { word: 'bowl', ph: 'बाउल', hi: 'कटोरी' },
        { word: 'tissue', ph: 'टिश्यू', hi: 'टिश्यू पेपर' },
    ];
    for (let w = 1; w <= VOCAB_WORD_COUNT; w++) {
        const item = bank[(w - 1 + rowIndex) % bank.length];
        row[`word_${w}`] = item.word;
        row[`pronunciation_hi_${w}`] = item.ph;
        row[`meaning_hi_${w}`] = item.hi;
    }
}

function fillConversationLineSlots(row: Record<string, string>, rowIndex: number): void {
    const lines = [
        { speaker: 'Waiter', en: 'Good evening!', hi: 'शुभ संध्या!' },
        { speaker: 'Customer', en: 'A table for two please.', hi: 'कृपया दो लोगों के लिए एक मेज।' },
        { speaker: 'Waiter', en: 'Here is the menu.', hi: 'यह रहा मेन्यू।' },
        { speaker: 'Customer', en: 'I will have soup.', hi: 'मुझे सूप चाहिए।' },
        { speaker: 'Waiter', en: 'Anything to drink?', hi: 'पीने के लिए कुछ?' },
        { speaker: 'Customer', en: 'Water, please.', hi: 'पानी, कृपया।' },
    ];
    for (let i = 1; i <= CONVERSATION_LINE_COUNT; i++) {
        const line = lines[(i - 1 + rowIndex) % lines.length];
        row[`line_${i}_speaker`] = line.speaker;
        row[`line_${i}_text_en`] = line.en;
        row[`line_${i}_text_hi`] = line.hi;
        row[`line_${i}_audio`] = '';
    }
}

function fillExamplePairSlots(row: Record<string, string>, rowIndex: number): void {
    for (let i = 1; i <= EXAMPLE_PAIR_COUNT; i++) {
        row[`example_${i}_en`] = `Example ${i} sentence for row ${rowIndex + 1}.`;
        row[`example_${i}_hi`] = `पंक्ति ${rowIndex + 1} का उदाहरण ${i}।`;
    }
    row.examples_json = '';
}

function fillPuzzleQuestionSlots(row: Record<string, string>, rowIndex: number): void {
    for (let i = 1; i <= PUZZLE_QUESTION_COUNT; i++) {
        row[`question_${i}`] = `Row ${rowIndex + 1} question ${i}?`;
        row[`option_${i}_1`] = 'Option A';
        row[`option_${i}_2`] = 'Option B';
        row[`option_${i}_3`] = 'Option C';
        row[`option_${i}_4`] = 'Option D';
        row[`correct_option_${i}`] = String((i % 4) + 1);
    }
    row.questions_json = '';
}

function fillFeedPostSlots(row: Record<string, string>, rowIndex: number): void {
    for (let i = 1; i <= FEED_POST_COUNT; i++) {
        row[`post_${i}_image_url`] = `https://example.com/row${rowIndex + 1}-post${i}.jpg`;
        row[`post_${i}_credit`] = '@verble';
        row[`post_${i}_credit_url`] = 'https://instagram.com/verble';
        row[`post_${i}_link`] = `https://instagram.com/p/row${rowIndex + 1}-${i}`;
        row[`post_${i}_caption`] = `Row ${rowIndex + 1} caption ${i}`;
    }
    row.metadata_json = '';
}

function buildTemplateRow(schema: BulkTypeSchema, rowIndex: number): Record<string, string> {
    const row = baseTemplateRow(schema);
    const theme = TEMPLATE_THEMES[rowIndex % TEMPLATE_THEMES.length];
    row.date = templateDate(rowIndex);

    switch (schema.type) {
        case 'VOCAB_SET':
            row.theme = theme;
            row.title = `${theme} vocabulary`;
            row.vocab_set_number = String(rowIndex + 1);
            row.theme_image_description = `${theme} scene for learners`;
            row.theme_image_url = `https://example.com/themes/${theme.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            fillVocabWordSlots(row, rowIndex);
            break;
        case 'CONVERSATION':
            row.title = `${theme} conversation`;
            row.scenario_title = `At the ${theme.toLowerCase()}`;
            row.scenario_title_hi = `${theme} में`;
            row.participant_1 = 'Waiter';
            row.participant_2 = 'Customer';
            row.participants = 'Waiter,Customer';
            fillConversationLineSlots(row, rowIndex);
            break;
        case 'PROFESSIONAL_CONVERSATION':
            row.title = `${theme} standup`;
            row.topic_name = `${theme} meeting`;
            row.description = `Professional ${theme.toLowerCase()} dialogue sample`;
            row.tags = 'office,meetings';
            row.related_content_ids = '';
            row.participant_1 = 'Manager';
            row.participant_2 = 'Employee';
            fillConversationLineSlots(row, rowIndex);
            break;
        case 'PUZZLE_SPOT':
        case 'PUZZLE_GRAMMAR':
            row.title = `Puzzle day ${rowIndex + 1}`;
            fillPuzzleQuestionSlots(row, rowIndex);
            break;
        case 'FEED':
            row.title = `Instagram feed ${rowIndex + 1}`;
            fillFeedPostSlots(row, rowIndex);
            break;
        case 'WORD':
            row.title = `Word ${rowIndex + 1}`;
            row.text = `sample${rowIndex + 1}`;
            row.meaning_en = `meaning ${rowIndex + 1}`;
            row.meaning_hi = `अर्थ ${rowIndex + 1}`;
            row.part_of_speech = 'noun';
            row.pronunciation_ipa = '/ˈsæmpəl/';
            row.pronunciation_devanagari = 'सैंपल';
            row.synonyms = 'example, instance';
            row.antonyms = 'counterexample';
            row.audio = `https://example.com/audio/word${rowIndex + 1}.mp3`;
            fillExamplePairSlots(row, rowIndex);
            break;
        case 'PHRASE':
            row.title = `Phrase ${rowIndex + 1}`;
            row.text = `break the ice ${rowIndex + 1}`;
            row.meaning_en = 'start a conversation';
            row.meaning_hi = 'बातचीत शुरू करना';
            row.audio = `https://example.com/audio/phrase${rowIndex + 1}.mp3`;
            fillExamplePairSlots(row, rowIndex);
            break;
        case 'STORY':
            row.title = `Story ${rowIndex + 1}`;
            row.story_title = `The honest student ${rowIndex + 1}`;
            row.text_content = `Once there was a student.\\nThey helped a friend on day ${rowIndex + 1}.`;
            row.moral_en = 'Kindness matters';
            row.moral_hi = 'दयालुता महत्वपूर्ण है';
            row.sentence_translations = 'Line 1 hi|Line 2 hi';
            row.important_words = 'honest:honest:ईमानदार|friend:friend:दोस्त';
            row.audio = `https://example.com/audio/story${rowIndex + 1}.mp3`;
            break;
        case 'SCENE':
            row.title = `Scene ${rowIndex + 1}`;
            row.scene_headline = `At the ${theme.toLowerCase()}`;
            row.image_url = `https://example.com/scene${rowIndex + 1}.jpg`;
            row.gif_url = `https://example.com/scene${rowIndex + 1}.gif`;
            row.explanation = `A busy ${theme.toLowerCase()} scene.`;
            row.hindi_summary = `एक व्यस्त ${theme}`;
            row.submission_prompt = DEFAULT_SCENE_SUBMISSION_PROMPT;
            row.keywords = 'stall:stall:दुकान|crowd:crowd:भीड';
            row.metadata_json = '';
            break;
        case 'SPEECH':
            row.title = `Speech ${rowIndex + 1}`;
            row.speaker = 'Sample Speaker';
            row.youtube_url = 'https://youtube.com/watch?v=example';
            row.credit = 'Verble';
            row.credit_url = 'https://verble.in';
            row.transcript = `Speech transcript for row ${rowIndex + 1}.`;
            row.keywords = 'hope:hope:आशा|learn:learn:सीखना';
            row.phrases = 'thank you:Thank you:धन्यवाद';
            row.metadata_json = '';
            break;
        case 'LYRICS':
            row.title = `Song ${rowIndex + 1}`;
            row.artist = 'Sample Artist';
            row.youtube_url = 'https://youtube.com/watch?v=example';
            row.audio = `https://example.com/audio/song${rowIndex + 1}.mp3`;
            row.credit = 'Verble Music';
            row.credit_url = 'https://verble.in';
            row.lyrics = `Line one row ${rowIndex + 1}\\nLine two row ${rowIndex + 1}`;
            row.words = 'love:love:प्यार|heart:heart:दिल';
            row.phrases = 'thank you:Thank you:धन्यवाद|good night:Good night:शुभ रात्रि';
            row.metadata_json = '';
            break;
        default:
            row.title = `Sample ${rowIndex + 1}`;
            break;
    }

    return row;
}

export function generateTemplateRows(schema: BulkTypeSchema): Record<string, string>[] {
    return Array.from({ length: BULK_TEMPLATE_ROW_COUNT }, (_, i) => buildTemplateRow(schema, i));
}

export function buildExampleCsvFromSchema(schema: BulkTypeSchema): string {
    const header = schema.columns.map((c) => c.label);
    const dataRows = generateTemplateRows(schema);
    const lines = [header.map(escapeCsvCell).join(','), ...rowsToCsvLines(schema, dataRows)];
    return lines.join('\n');
}

function exampleRowToCells(schema: BulkTypeSchema, values: Record<string, string>): string[] {
    return schema.columns.map((col) => values[col.key] ?? '');
}

function rowsToCsvLines(schema: BulkTypeSchema, dataRows: Record<string, string>[]): string[] {
    return dataRows.map((row) => exampleRowToCells(schema, row).map(escapeCsvCell).join(','));
}

function firstNonEmptyInGroup(grouped: Record<string, string>[], key: string): string {
    for (const row of grouped) {
        const v = (row[key] ?? '').trim();
        if (v) return v;
    }
    return '';
}

function parseColonTriplets(s: string): { primary: string; meaning_en: string; meaning_hi: string }[] {
    if (!s.trim()) return [];
    return s
        .split('|')
        .map((part) => {
            const bits = part.split(':').map((x) => x.trim());
            if (bits.length >= 3) {
                return { primary: bits[0] || '', meaning_en: bits[1] || '', meaning_hi: bits[2] || '' };
            }
            return { primary: bits[0] || '', meaning_en: '', meaning_hi: bits[1] || '' };
        })
        .filter((k) => k.primary);
}

function parseWordTriplets(s: string): { word: string; meaning_en: string; meaning_hi: string }[] {
    return parseColonTriplets(s).map(({ primary, meaning_en, meaning_hi }) => ({
        word: primary,
        meaning_en,
        meaning_hi,
    }));
}

function parsePhraseTriplets(s: string): { phrase: string; meaning_en: string; meaning_hi: string }[] {
    return parseColonTriplets(s).map(({ primary, meaning_en, meaning_hi }) => ({
        phrase: primary,
        meaning_en,
        meaning_hi,
    }));
}

function parseImportantWords(s: string): { word: string; meaning_en: string; meaning_hi: string }[] {
    const parsed = parseWordTriplets(s);
    if (parsed.length === 0) return [];
    while (parsed.length < 5) {
        parsed.push({ word: '', meaning_en: '', meaning_hi: '' });
    }
    return parsed.slice(0, 5);
}

function buildConversationMetadata(
    adminKey: BulkDailyContentType,
    grouped: Record<string, string>[],
    title: string,
    dialogue: { speaker: string; text_en: string; text_hi: string; audio?: string }[]
): Record<string, unknown> {
    const participant1 = firstNonEmptyInGroup(grouped, 'participant_1');
    const participant2 = firstNonEmptyInGroup(grouped, 'participant_2');
    let participants: string[] | undefined;
    if (participant1 && participant2) {
        participants = [participant1, participant2];
    } else {
        const p = firstNonEmptyInGroup(grouped, 'participants');
        if (p) participants = splitCommaList(p);
    }

    const meta: Record<string, unknown> = { dialogue };
    if (participants && participants.length > 0) {
        meta.participants = participants;
        meta.participant1 = participants[0];
        meta.participant2 = participants[1] ?? '';
    }

    if (adminKey === 'PROFESSIONAL_CONVERSATION') {
        meta.isProfessionalLibrary = true;
        meta.topicName = firstNonEmptyInGroup(grouped, 'topic_name') || title;
        const desc = firstNonEmptyInGroup(grouped, 'description');
        if (desc) meta.description = desc;
        const tags = firstNonEmptyInGroup(grouped, 'tags');
        if (tags) meta.tags = splitCommaList(tags);
        const related = firstNonEmptyInGroup(grouped, 'related_content_ids');
        if (related) meta.relatedContentIds = splitCommaList(related);
    } else {
        meta.scenarioTitle = firstNonEmptyInGroup(grouped, 'scenario_title') || title;
        const scenarioTitleHi = firstNonEmptyInGroup(grouped, 'scenario_title_hi');
        if (scenarioTitleHi) meta.scenarioTitle_hi = scenarioTitleHi;
    }

    return meta;
}

function parseSceneKeywords(s: string): { word: string; meaning_en: string; meaning_hi: string }[] {
    return parseWordTriplets(s);
}

function parseSpeechKeywords(s: string): { word: string; meaning_en: string; meaning_hi: string }[] {
    return parseWordTriplets(s);
}

function parseSpeechPhrases(s: string): { phrase: string; meaning_en: string; meaning_hi: string }[] {
    return parsePhraseTriplets(s);
}

function normalizeJsonLike(raw: string): string {
    return raw
        .replace(/^\uFEFF/, '')
        .trim()
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
}

function tryParseJsonArray(raw: string): unknown[] | null {
    const normalized = normalizeJsonLike(raw);
    const attempts = [normalized];
    if (normalized.includes("'") && !normalized.includes('"')) {
        attempts.push(normalized.replace(/'/g, '"'));
    }
    for (const attempt of attempts) {
        try {
            const parsed = JSON.parse(attempt);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            /* try next */
        }
    }
    return null;
}

function parseNumberedExamples(
    row: Record<string, string>,
    line: number,
    errors: string[]
): { examples: ParsedExample[]; invalid: boolean } {
    const examples: ParsedExample[] = [];
    let invalid = false;
    for (let i = 1; i <= EXAMPLE_PAIR_COUNT; i++) {
        const en = (row[`example_${i}_en`] ?? '').trim();
        const hi = (row[`example_${i}_hi`] ?? '').trim();
        if (!en && !hi) continue;
        if (en && !hi) {
            errors.push(`Row ${line}: example_${i}_hi is required when example_${i}_en is set`);
            invalid = true;
            continue;
        }
        if (hi && !en) {
            errors.push(`Row ${line}: example_${i}_en is required when example_${i}_hi is set`);
            invalid = true;
            continue;
        }
        examples.push({ en, hi });
    }
    return { examples, invalid };
}

function parseExamplesFromJson(
    raw: string,
    line: number,
    errors: string[]
): { examples?: ParsedExample[]; invalid: boolean } {
    const parsed = tryParseJsonArray(raw);
    if (!parsed) {
        errors.push(
            `Row ${line}: examples_json is not valid JSON — use example_1_en / example_1_hi columns instead`
        );
        return { invalid: true };
    }
    const examples: ParsedExample[] = [];
    let invalid = false;
    for (let j = 0; j < parsed.length; j++) {
        const item = parsed[j] as { en?: unknown; hi?: unknown; audio?: unknown } | null;
        if (!item || typeof item.en !== 'string' || typeof item.hi !== 'string') {
            errors.push(`Row ${line}: examples_json[${j}] needs en and hi strings`);
            invalid = true;
        } else {
            examples.push({
                en: item.en,
                hi: item.hi,
                audio: typeof item.audio === 'string' ? item.audio : undefined,
            });
        }
    }
    return { examples: examples.length ? examples : undefined, invalid };
}

/** Parse example sentences from numbered columns (preferred) or examples_json. */
export function parseExamplesFromRow(
    row: Record<string, string>,
    line: number,
    errors: string[]
): { examples?: ParsedExample[]; invalid: boolean } {
    const numbered = parseNumberedExamples(row, line, errors);
    if (numbered.examples.length > 0) {
        return { examples: numbered.examples, invalid: numbered.invalid };
    }
    if (numbered.invalid) {
        return { invalid: true };
    }

    const exJson = (row.examples_json ?? '').trim();
    if (!exJson) {
        return { examples: undefined, invalid: false };
    }

    return parseExamplesFromJson(exJson, line, errors);
}

function isLegacyGroupedFormat(headers: string[], legacyKey: string, numberedKey: string): boolean {
    return headers.includes(legacyKey) && !headers.includes(numberedKey);
}

function parseNumberedVocabItems(
    row: Record<string, string>,
    line: number,
    errors: string[]
): { items: { word: string; pronunciation_hi: string; meaning_hi: string }[]; invalid: boolean } {
    const items: { word: string; pronunciation_hi: string; meaning_hi: string }[] = [];
    let invalid = false;
    for (let i = 1; i <= VOCAB_WORD_COUNT; i++) {
        const w = (row[`word_${i}`] ?? '').trim();
        const ph = (row[`pronunciation_hi_${i}`] ?? '').trim();
        const mh = rowCell(row, `meaning_hi_${i}`);
        if (!w && !ph && !mh) continue;
        if (!w || !ph || !mh) {
            errors.push(
                `Row ${line}: word_${i}, pronunciation_hi_${i}, and meaning_hi_${i} are all required when any is set`
            );
            invalid = true;
            continue;
        }
        items.push({ word: w, pronunciation_hi: ph, meaning_hi: mh });
    }
    return { items, invalid };
}

function parseNumberedConversationLines(
    row: Record<string, string>,
    line: number,
    errors: string[]
): { dialogue: { speaker: string; text_en: string; text_hi: string; audio?: string }[]; invalid: boolean } {
    const dialogue: { speaker: string; text_en: string; text_hi: string; audio?: string }[] = [];
    let invalid = false;
    for (let i = 1; i <= CONVERSATION_LINE_COUNT; i++) {
        const speaker = (row[`line_${i}_speaker`] ?? '').trim();
        const text_en = (row[`line_${i}_text_en`] ?? '').trim();
        const text_hi = (row[`line_${i}_text_hi`] ?? '').trim();
        const audio = (row[`line_${i}_audio`] ?? '').trim();
        if (!speaker && !text_en && !text_hi && !audio) continue;
        if (!speaker || !text_en || !text_hi) {
            errors.push(
                `Row ${line}: line_${i}_speaker, line_${i}_text_en, and line_${i}_text_hi are required when any line field is set`
            );
            invalid = true;
            continue;
        }
        dialogue.push({
            speaker,
            text_en,
            text_hi,
            ...(audio ? { audio } : {}),
        });
    }
    return { dialogue, invalid };
}

function buildConversationMetadataFromRow(
    adminKey: BulkDailyContentType,
    row: Record<string, string>,
    title: string,
    dialogue: { speaker: string; text_en: string; text_hi: string; audio?: string }[]
): Record<string, unknown> {
    return buildConversationMetadata(adminKey, [row], title, dialogue);
}

function parseNumberedPuzzleQuestions(
    row: Record<string, string>,
    line: number,
    title: string,
    errors: string[]
): { questions: { question: string; options: string[]; correct_idx: number }[] | null; invalid: boolean } {
    const questions: { question: string; options: string[]; correct_idx: number }[] = [];
    let invalid = false;
    for (let i = 1; i <= PUZZLE_QUESTION_COUNT; i++) {
        const qText = (row[`question_${i}`] ?? '').trim();
        const opts = [1, 2, 3, 4]
            .map((o) => (row[`option_${i}_${o}`] ?? '').trim())
            .filter(Boolean);
        const correctOpt = parseInt((row[`correct_option_${i}`] ?? '').trim(), 10);
        if (!qText && opts.length === 0 && !row[`correct_option_${i}`]?.trim()) continue;
        if (!qText || opts.length < 2) {
            errors.push(`Row ${line}: question_${i} and at least option_${i}_1/option_${i}_2 required`);
            invalid = true;
            continue;
        }
        if (Number.isNaN(correctOpt) || correctOpt < 1 || correctOpt > opts.length) {
            errors.push(`Row ${line}: correct_option_${i} must be 1–${opts.length}`);
            invalid = true;
            continue;
        }
        questions.push({ question: qText, options: opts, correct_idx: correctOpt - 1 });
    }
    if (questions.length !== PUZZLE_QUESTION_COUNT) {
        errors.push(
            `Row ${line}: PUZZLE "${title}" needs exactly ${PUZZLE_QUESTION_COUNT} questions (found ${questions.length})`
        );
        invalid = true;
    }
    return { questions: invalid ? null : questions, invalid };
}

function parsePuzzleQuestionsJson(
    raw: string,
    line: number,
    errors: string[]
): { question: string; options: string[]; correct_idx: number }[] | null {
    let questions: { question: string; options: string[]; correct_idx: number }[] | null = null;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length !== PUZZLE_QUESTION_COUNT) {
            errors.push(`Row ${line}: questions_json must be a JSON array of exactly ${PUZZLE_QUESTION_COUNT} questions`);
            return null;
        }
        questions = [];
        for (let q = 0; q < parsed.length; q++) {
            const item = parsed[q];
            const qText = String(item?.question ?? '').trim();
            const options = Array.isArray(item?.options)
                ? item.options.map((o: unknown) => String(o).trim()).filter(Boolean)
                : [];
            const correct_idx = Number(item?.correct_idx);
            if (!qText || options.length < 2) {
                errors.push(`Row ${line}: question ${q + 1} needs text and at least 2 options`);
                return null;
            }
            if (Number.isNaN(correct_idx) || correct_idx < 0 || correct_idx >= options.length) {
                errors.push(`Row ${line}: question ${q + 1} has invalid correct_idx`);
                return null;
            }
            questions.push({ question: qText, options, correct_idx });
        }
    } catch {
        errors.push(`Row ${line}: questions_json is not valid JSON`);
        return null;
    }
    return questions;
}

function parseNumberedFeedPosts(
    row: Record<string, string>
): { imageUrl: string; credit: string; creditUrl: string; postLink: string; caption: string }[] {
    const posts: { imageUrl: string; credit: string; creditUrl: string; postLink: string; caption: string }[] = [];
    for (let i = 1; i <= FEED_POST_COUNT; i++) {
        const imageUrl = (row[`post_${i}_image_url`] ?? '').trim();
        const credit = (row[`post_${i}_credit`] ?? '').trim();
        const creditUrl = (row[`post_${i}_credit_url`] ?? '').trim();
        const postLink = (row[`post_${i}_link`] ?? '').trim();
        const caption = (row[`post_${i}_caption`] ?? '').trim();
        if (!imageUrl && !credit && !creditUrl && !postLink && !caption) continue;
        posts.push({ imageUrl, credit, creditUrl, postLink, caption });
    }
    return posts;
}

function parseVocabSetLegacyGrouped(
    rows: Record<string, string>[],
    level: string,
    errors: string[],
    payloads: CreateDailyContentPayload[]
): void {
    const groupMap = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
        const date = parseFlexibleDate(row.date ?? '');
        const title = (row.title ?? '').trim();
        const theme = (row.theme ?? '').trim();
        if (!date || !title || !theme) {
            errors.push(`VOCAB_SET row: date, title, and theme are required on every line`);
            continue;
        }
        const key = `${date}\0${title}\0${theme}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(row);
    }
    for (const [key, grouped] of groupMap) {
        const [date, title, theme] = key.split('\0');
        const words: { word: string; pronunciation_hi: string; meaning_hi: string }[] = [];
        let vocabSetNumber: number | undefined;
        let themeImageDescription: string | undefined;
        let themeImageUrl: string | undefined;
        let groupFailed = false;
        grouped.forEach((row, i) => {
            const lineHint = `"${title}" / "${theme}" row ${i + 1}`;
            const w = (row.word ?? '').trim();
            const ph = (row.pronunciation_hi ?? '').trim();
            const mh = rowCell(row, 'meaning_hi', 'hi', 'hindi', 'meaning_hindi');
            if (!w || !ph || !mh) {
                errors.push(`VOCAB_SET ${lineHint}: word, pronunciation_hi, meaning_hi required`);
                groupFailed = true;
                return;
            }
            words.push({ word: w, pronunciation_hi: ph, meaning_hi: mh });
            const n = (row.vocab_set_number ?? '').trim();
            if (n && vocabSetNumber === undefined) {
                const num = parseInt(n, 10);
                if (Number.isNaN(num)) {
                    errors.push(`VOCAB_SET ${lineHint}: vocab_set_number must be a number`);
                    groupFailed = true;
                } else vocabSetNumber = num;
            }
            const tid = (row.theme_image_description ?? '').trim();
            if (tid && !themeImageDescription) themeImageDescription = tid;
            const turl = (row.theme_image_url ?? '').trim();
            if (turl && !themeImageUrl) themeImageUrl = turl;
        });
        if (groupFailed) continue;
        if (words.length === 0) {
            errors.push(`VOCAB_SET "${title}": no valid words in group`);
            continue;
        }
        if (words.length > VOCAB_WORD_COUNT) {
            errors.push(
                `Note: VOCAB_SET "${title}" has ${words.length} words (manual form recommends up to ${VOCAB_WORD_COUNT})`
            );
        }
        payloads.push({
            type: 'VOCAB_SET',
            date,
            level,
            title,
            metadata: {
                theme,
                ...(vocabSetNumber !== undefined ? { vocabSetNumber } : {}),
                ...(themeImageDescription ? { themeImageDescription } : {}),
                ...(themeImageUrl ? { themeImageUrl } : {}),
                vocabItems: words,
            },
            isActive: true,
        });
    }
}

function parseConversationLegacyGrouped(
    adminKey: BulkDailyContentType,
    apiType: string,
    rows: Record<string, string>[],
    level: string,
    errors: string[],
    payloads: CreateDailyContentPayload[]
): void {
    const groupMap = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
        const date = parseFlexibleDate(row.date ?? '');
        const title = (row.title ?? '').trim();
        if (!date || !title) {
            errors.push(`CONVERSATION row: date and title required`);
            continue;
        }
        const key = `${date}\0${title}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(row);
    }
    for (const [key, grouped] of groupMap) {
        const [date, title] = key.split('\0');
        const dialogue: { speaker: string; text_en: string; text_hi: string; audio?: string }[] = [];
        let groupFailed = false;
        grouped.forEach((row, i) => {
            const line = `Conversation "${title}" line ${i + 1}`;
            const speaker = (row.speaker ?? '').trim();
            const text_en = (row.text_en ?? '').trim();
            const text_hi = (row.text_hi ?? '').trim();
            if (!speaker || !text_en || !text_hi) {
                errors.push(`${line}: speaker, text_en, text_hi required`);
                groupFailed = true;
                return;
            }
            const audio = (row.line_audio ?? '').trim();
            dialogue.push({
                speaker,
                text_en,
                text_hi,
                ...(audio ? { audio } : {}),
            });
        });

        const participant1 = firstNonEmptyInGroup(grouped, 'participant_1');
        const participant2 = firstNonEmptyInGroup(grouped, 'participant_2');
        const participantsCol = firstNonEmptyInGroup(grouped, 'participants');
        const hasParticipants = (participant1 && participant2) || Boolean(participantsCol);
        if (!hasParticipants) {
            errors.push(
                `Conversation "${title}": set participant_1 + participant_2, or participants on the first row`
            );
            groupFailed = true;
        }
        if (groupFailed || dialogue.length === 0) continue;

        const meta = buildConversationMetadata(adminKey, grouped, title, dialogue);
        payloads.push({
            type: apiType,
            date,
            level,
            title,
            metadata: meta,
            isActive: true,
        });
    }
}

function parsePuzzleLegacyGrouped(
    puzzleType: string,
    rows: Record<string, string>[],
    level: string,
    errors: string[],
    payloads: CreateDailyContentPayload[]
): void {
    const groupMap = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
        const date = parseFlexibleDate(row.date ?? '');
        if (!date) {
            errors.push('PUZZLE row: invalid or empty date');
            continue;
        }
        const title = (row.title ?? '').trim() || 'bulk-import';
        const key = `${date}\0${title}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(row);
    }
    for (const [key, grouped] of groupMap) {
        const [date, title] = key.split('\0');
        const jsonRow = grouped.find((r) => (r.questions_json ?? '').trim());
        if (jsonRow) {
            const line = rows.indexOf(jsonRow) + 2;
            const questions = parsePuzzleQuestionsJson((jsonRow.questions_json ?? '').trim(), line, errors);
            if (questions) {
                payloads.push({
                    type: 'PUZZLE',
                    date,
                    level,
                    title,
                    metadata: { puzzleType, questions },
                    isActive: true,
                });
            }
            continue;
        }

        if (grouped.length !== PUZZLE_QUESTION_COUNT) {
            errors.push(
                `PUZZLE "${title}" on ${date}: need exactly ${PUZZLE_QUESTION_COUNT} question rows (found ${grouped.length})`
            );
            continue;
        }
        const questions: { question: string; options: string[]; correct_idx: number }[] = [];
        let groupFailed = false;
        grouped.forEach((row, i) => {
            const qText = (row.question ?? '').trim();
            const opts = ['option_1', 'option_2', 'option_3', 'option_4']
                .map((k) => (row[k] ?? '').trim())
                .filter(Boolean);
            const correctOpt = parseInt((row.correct_option ?? '').trim(), 10);
            if (!qText || opts.length < 2) {
                errors.push(`PUZZLE "${title}" question ${i + 1}: question and at least option_1/option_2 required`);
                groupFailed = true;
                return;
            }
            if (Number.isNaN(correctOpt) || correctOpt < 1 || correctOpt > opts.length) {
                errors.push(`PUZZLE "${title}" question ${i + 1}: correct_option must be 1–${opts.length}`);
                groupFailed = true;
                return;
            }
            questions.push({ question: qText, options: opts, correct_idx: correctOpt - 1 });
        });
        if (groupFailed) continue;
        payloads.push({
            type: 'PUZZLE',
            date,
            level,
            title,
            metadata: { puzzleType, questions },
            isActive: true,
        });
    }
}

function parseFeedLegacyGrouped(
    apiType: string,
    rows: Record<string, string>[],
    level: string,
    errors: string[],
    payloads: CreateDailyContentPayload[]
): void {
    const groupMap = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
        const date = parseFlexibleDate(row.date ?? '');
        const title = (row.title ?? '').trim();
        if (!date || !title) {
            errors.push('FEED row: date and title required on every line');
            continue;
        }
        const key = `${date}\0${title}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(row);
    }
    for (const [key, grouped] of groupMap) {
        const [date, title] = key.split('\0');
        const jsonRow = grouped.find((r) => (r.metadata_json ?? '').trim());
        if (jsonRow) {
            const line = rows.indexOf(jsonRow) + 2;
            const override = parseMetadataJsonOptional(jsonRow.metadata_json ?? '', line, errors);
            if (override) {
                payloads.push({ type: apiType, date, level, title, metadata: override, isActive: true });
            }
            continue;
        }
        const posts = grouped
            .map((row) => ({
                imageUrl: (row.post_image_url ?? '').trim(),
                credit: (row.post_credit ?? '').trim(),
                creditUrl: (row.post_credit_url ?? '').trim(),
                postLink: (row.post_link ?? '').trim(),
                caption: (row.post_caption ?? '').trim(),
            }))
            .filter((p) => p.imageUrl || p.credit || p.creditUrl || p.postLink || p.caption);
        if (posts.length === 0) {
            errors.push(`FEED "${title}": at least one post row with image, credit, link, or caption`);
            continue;
        }
        payloads.push({
            type: apiType,
            date,
            level,
            title,
            metadata: { posts },
            isActive: true,
        });
    }
}

function parseMetadataJsonOptional(
    raw: string,
    line: number,
    errors: string[]
): Record<string, unknown> | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            errors.push(`Row ${line}: metadata_json must be a JSON object`);
            return null;
        }
        return parsed as Record<string, unknown>;
    } catch {
        errors.push(`Row ${line}: metadata_json is not valid JSON`);
        return null;
    }
}

export interface ValidationResult {
    ok: boolean;
    errors: string[];
    payloads: CreateDailyContentPayload[];
}

function requireCols(headers: string[], schema: BulkTypeSchema): string[] {
    const missing: string[] = [];
    for (const col of schema.columns) {
        if (!col.required) continue;
        if (!headers.includes(col.key)) missing.push(col.label);
    }
    return missing;
}

function extraCols(headers: string[], schema: BulkTypeSchema): string[] {
    const allowed = new Set(schema.columns.map((c) => c.key));
    return headers.filter((h) => h && !allowed.has(h));
}

export function validateAndBuildPayloads(
    adminKey: BulkDailyContentType,
    _levelIgnored: string,
    headers: string[],
    rows: Record<string, string>[]
): ValidationResult {
    const errors: string[] = [];
    const schema = getBulkSchema(adminKey);
    const catalogEntry = getCatalogEntry(adminKey);
    const apiType = apiTypeForAdminKey(adminKey);
    const level = levelForAdminKey(adminKey);
    const missing = requireCols(headers, schema);
    if (missing.length) {
        errors.push(`Missing required column(s): ${missing.join(', ')}`);
    }
    const extras = extraCols(headers, schema);
    if (extras.length) {
        errors.push(`Note: these columns will be ignored: ${extras.join(', ')}`);
    }

    const payloads: CreateDailyContentPayload[] = [];

    if (adminKey === 'WORD' || adminKey === 'PHRASE') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            const text = (row.text ?? '').trim();
            const meaning_en = rowCell(row, 'meaning_en', 'en', 'english', 'meaning_english');
            const meaning_hi = rowCell(row, 'meaning_hi', 'hi', 'hindi', 'meaning_hindi');
            if (!title) errors.push(`Row ${line}: title is required`);
            if (!text) errors.push(`Row ${line}: text is required`);
            if (!meaning_en) errors.push(`Row ${line}: meaning_en is required`);
            if (!meaning_hi) errors.push(`Row ${line}: meaning_hi is required`);
            const { examples, invalid: examplesInvalid } = parseExamplesFromRow(row, line, errors);
            if (!date || !title || !text || !meaning_en || !meaning_hi || examplesInvalid) continue;
            const meta: Record<string, unknown> = {
                text,
                meaning_en,
                meaning_hi,
                audio: (row.audio ?? '').trim() || undefined,
                examples,
            };
            if (adminKey === 'WORD') {
                meta.partOfSpeech = (row.part_of_speech ?? '').trim() || undefined;
                meta.synonyms = row.synonyms ? splitCommaList(row.synonyms) : undefined;
                meta.antonyms = row.antonyms ? splitCommaList(row.antonyms) : undefined;
                meta.pronunciation_ipa = (row.pronunciation_ipa ?? '').trim() || undefined;
                meta.pronunciation_devanagari = (row.pronunciation_devanagari ?? '').trim() || undefined;
            }
            Object.keys(meta).forEach((k) => (meta[k] === undefined || meta[k] === '') && delete meta[k]);
            payloads.push({
                type: apiType,
                date,
                level,
                title: title || 'bulk-import',
                metadata: meta,
                isActive: true,
            });
        }
    } else if (adminKey === 'STORY') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            const text_content = unescapeTextContent((row.text_content ?? '').trim());
            if (!title) errors.push(`Row ${line}: title is required`);
            if (!text_content) errors.push(`Row ${line}: text_content is required`);
            if (!date || !title || !text_content) continue;
            const sentence_translations = (row.sentence_translations ?? '').trim()
                ? (row.sentence_translations ?? '').split('|').map((x) => x.trim()).filter(Boolean)
                : undefined;
            const importantRaw = (row.important_words ?? '').trim();
            const important_words = importantRaw ? parseImportantWords(importantRaw) : undefined;
            payloads.push({
                type: 'STORY',
                date,
                level,
                title,
                metadata: {
                    title: (row.story_title ?? '').trim() || undefined,
                    text_content,
                    audio: (row.audio ?? '').trim() || undefined,
                    moral_en: (row.moral_en ?? '').trim() || undefined,
                    moral_hi: rowCell(row, 'moral_hi', 'moral_hindi') || undefined,
                    sentence_translations,
                    ...(important_words ? { important_words } : {}),
                },
                isActive: true,
            });
        }
    } else if (adminKey === 'VOCAB_SET') {
        if (isLegacyGroupedFormat(headers, 'word', 'word_1')) {
            parseVocabSetLegacyGrouped(rows, level, errors, payloads);
        } else {
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];
                const line = idx + 2;
                const date = parseFlexibleDate(row.date ?? '');
                if (!date) errors.push(`Row ${line}: invalid or empty date`);
                const title = (row.title ?? '').trim();
                const theme = (row.theme ?? '').trim();
                if (!title) errors.push(`Row ${line}: title is required`);
                if (!theme) errors.push(`Row ${line}: theme is required`);
                const { items, invalid } = parseNumberedVocabItems(row, line, errors);
                if (!date || !title || !theme || invalid) continue;
                if (items.length === 0) {
                    errors.push(`Row ${line}: at least one word (word_1, pronunciation_hi_1, meaning_hi_1) is required`);
                    continue;
                }
                let vocabSetNumber: number | undefined;
                const n = (row.vocab_set_number ?? '').trim();
                if (n) {
                    const num = parseInt(n, 10);
                    if (Number.isNaN(num)) {
                        errors.push(`Row ${line}: vocab_set_number must be a number`);
                        continue;
                    }
                    vocabSetNumber = num;
                }
                const themeImageDescription = (row.theme_image_description ?? '').trim() || undefined;
                const themeImageUrl = (row.theme_image_url ?? '').trim() || undefined;
                payloads.push({
                    type: 'VOCAB_SET',
                    date,
                    level,
                    title,
                    metadata: {
                        theme,
                        ...(vocabSetNumber !== undefined ? { vocabSetNumber } : {}),
                        ...(themeImageDescription ? { themeImageDescription } : {}),
                        ...(themeImageUrl ? { themeImageUrl } : {}),
                        vocabItems: items,
                    },
                    isActive: true,
                });
            }
        }
    } else if (adminKey === 'CONVERSATION' || adminKey === 'PROFESSIONAL_CONVERSATION') {
        if (isLegacyGroupedFormat(headers, 'speaker', 'line_1_speaker')) {
            parseConversationLegacyGrouped(adminKey, apiType, rows, level, errors, payloads);
        } else {
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];
                const line = idx + 2;
                const date = parseFlexibleDate(row.date ?? '');
                if (!date) errors.push(`Row ${line}: invalid or empty date`);
                const title = (row.title ?? '').trim();
                if (!title) errors.push(`Row ${line}: title is required`);
                const { dialogue, invalid } = parseNumberedConversationLines(row, line, errors);
                const participant1 = (row.participant_1 ?? '').trim();
                const participant2 = (row.participant_2 ?? '').trim();
                const participantsCol = (row.participants ?? '').trim();
                const hasParticipants = (participant1 && participant2) || Boolean(participantsCol);
                if (!hasParticipants) {
                    errors.push(
                        `Row ${line}: set participant_1 + participant_2, or participants`
                    );
                }
                if (!date || !title || invalid || !hasParticipants) continue;
                if (dialogue.length === 0) {
                    errors.push(`Row ${line}: at least one dialogue line (line_1_speaker, line_1_text_en, line_1_text_hi) is required`);
                    continue;
                }
                const meta = buildConversationMetadataFromRow(adminKey, row, title, dialogue);
                payloads.push({
                    type: apiType,
                    date,
                    level,
                    title,
                    metadata: meta,
                    isActive: true,
                });
            }
        }
    } else if (adminKey === 'PUZZLE_SPOT' || adminKey === 'PUZZLE_GRAMMAR') {
        const puzzleType = catalogEntry.puzzleType || 'SPOT_CORRECT_SENTENCE';
        if (isLegacyGroupedFormat(headers, 'question', 'question_1')) {
            parsePuzzleLegacyGrouped(puzzleType, rows, level, errors, payloads);
        } else {
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];
                const line = idx + 2;
                const date = parseFlexibleDate(row.date ?? '');
                if (!date) errors.push(`Row ${line}: invalid or empty date`);
                const title = (row.title ?? '').trim() || 'bulk-import';
                const questionsJson = (row.questions_json ?? '').trim();
                if (questionsJson) {
                    const questions = parsePuzzleQuestionsJson(questionsJson, line, errors);
                    if (questions && date) {
                        payloads.push({
                            type: 'PUZZLE',
                            date,
                            level,
                            title,
                            metadata: { puzzleType, questions },
                            isActive: true,
                        });
                    }
                    continue;
                }
                const { questions, invalid } = parseNumberedPuzzleQuestions(row, line, title, errors);
                if (!date || invalid || !questions) continue;
                payloads.push({
                    type: 'PUZZLE',
                    date,
                    level,
                    title,
                    metadata: { puzzleType, questions },
                    isActive: true,
                });
            }
        }
    } else if (adminKey === 'SCENE') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            if (!title) errors.push(`Row ${line}: title is required`);
            const override = parseMetadataJsonOptional(row.metadata_json ?? '', line, errors);
            if (!date || !title) continue;
            if (override) {
                payloads.push({ type: apiType, date, level, title, metadata: override, isActive: true });
                continue;
            }
            const explanation = (row.explanation ?? '').trim();
            if (!explanation) {
                errors.push(`Row ${line}: explanation is required`);
                continue;
            }
            const submissionPrompt =
                (row.submission_prompt ?? '').trim() || DEFAULT_SCENE_SUBMISSION_PROMPT;
            const meta: Record<string, unknown> = {
                title: (row.scene_headline ?? '').trim() || undefined,
                imageUrl: (row.image_url ?? '').trim() || undefined,
                gifUrl: (row.gif_url ?? '').trim() || undefined,
                explanation,
                hindiSummary: (row.hindi_summary ?? '').trim() || undefined,
                submissionPrompt,
                audio: (row.audio ?? '').trim() || undefined,
                keywords: parseSceneKeywords(row.keywords ?? ''),
            };
            Object.keys(meta).forEach((k) => {
                const v = meta[k];
                if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete meta[k];
            });
            payloads.push({ type: apiType, date, level, title, metadata: meta, isActive: true });
        }
    } else if (adminKey === 'SPEECH') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            if (!title) errors.push(`Row ${line}: title is required`);
            const override = parseMetadataJsonOptional(row.metadata_json ?? '', line, errors);
            if (!date || !title) continue;
            if (override) {
                payloads.push({ type: apiType, date, level, title, metadata: override, isActive: true });
                continue;
            }
            const meta: Record<string, unknown> = {
                speaker: (row.speaker ?? '').trim() || undefined,
                youtubeUrl: (row.youtube_url ?? '').trim() || undefined,
                credit: (row.credit ?? '').trim() || undefined,
                creditUrl: (row.credit_url ?? '').trim() || undefined,
                transcript: (row.transcript ?? '').trim() || undefined,
                keywords: parseSpeechKeywords(row.keywords ?? ''),
                phrases: parseSpeechPhrases(row.phrases ?? ''),
            };
            Object.keys(meta).forEach((k) => {
                const v = meta[k];
                if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete meta[k];
            });
            payloads.push({ type: apiType, date, level, title, metadata: meta, isActive: true });
        }
    } else if (adminKey === 'LYRICS') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            if (!title) errors.push(`Row ${line}: title is required`);
            const override = parseMetadataJsonOptional(row.metadata_json ?? '', line, errors);
            if (!date || !title) continue;
            if (override) {
                payloads.push({ type: apiType, date, level, title, metadata: override, isActive: true });
                continue;
            }
            const words = parseWordTriplets(row.words ?? '');
            const phrases = parsePhraseTriplets(row.phrases ?? '');
            const meta: Record<string, unknown> = {
                artist: (row.artist ?? '').trim() || undefined,
                youtubeUrl: (row.youtube_url ?? '').trim() || undefined,
                audio: (row.audio ?? '').trim() || undefined,
                credit: (row.credit ?? '').trim() || undefined,
                creditUrl: (row.credit_url ?? '').trim() || undefined,
                lyrics: unescapeTextContent((row.lyrics ?? '').trim()) || undefined,
                ...(words.length ? { words } : {}),
                ...(phrases.length ? { phrases } : {}),
            };
            Object.keys(meta).forEach((k) => {
                const v = meta[k];
                if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete meta[k];
            });
            payloads.push({
                type: apiType,
                date,
                level,
                title,
                metadata: meta,
                isActive: true,
            });
        }
    } else if (adminKey === 'FEED') {
        if (isLegacyGroupedFormat(headers, 'post_image_url', 'post_1_image_url')) {
            parseFeedLegacyGrouped(apiType, rows, level, errors, payloads);
        } else {
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];
                const line = idx + 2;
                const date = parseFlexibleDate(row.date ?? '');
                if (!date) errors.push(`Row ${line}: invalid or empty date`);
                const title = (row.title ?? '').trim();
                if (!title) errors.push(`Row ${line}: title is required`);
                const override = parseMetadataJsonOptional(row.metadata_json ?? '', line, errors);
                if (!date || !title) continue;
                if (override) {
                    payloads.push({ type: apiType, date, level, title, metadata: override, isActive: true });
                    continue;
                }
                const posts = parseNumberedFeedPosts(row);
                if (posts.length === 0) {
                    errors.push(`Row ${line}: at least one post (post_1_image_url, post_1_credit, etc.) is required`);
                    continue;
                }
                payloads.push({
                    type: apiType,
                    date,
                    level,
                    title,
                    metadata: { posts },
                    isActive: true,
                });
            }
        }
    }

    const hardErrors = errors.filter((e) => !e.startsWith('Note:'));
    if (hardErrors.length > 0) {
        return { ok: false, errors, payloads: [] };
    }
    return { ok: true, errors, payloads };
}

export function schemaToExampleCsv(schema: BulkTypeSchema): string {
    return buildExampleCsvFromSchema(schema);
}
