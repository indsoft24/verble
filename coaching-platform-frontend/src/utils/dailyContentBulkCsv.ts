import { format, isValid, parse } from 'date-fns';
import type { CreateDailyContentPayload } from '../services/dailyContentAdminService';
import {
    type AdminContentTypeKey,
    getCatalogEntry,
    apiTypeForAdminKey,
    levelForAdminKey,
} from './dailyContentTypeCatalog';

export type BulkDailyContentType = AdminContentTypeKey;

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
    exampleRows: string[][];
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
                    { key: 'examples_json', label: 'examples_json', required: false, hint: '[{"en":"","hi":""}]', formField: 'Example sentences (advanced)' },
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
                    { key: 'examples_json', label: 'examples_json', required: false, formField: 'Example sentences (advanced)' },
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
                ],
                exampleRows: [],
            };
        case 'VOCAB_SET':
            return {
                type: 'VOCAB_SET',
                description: 'Multiple rows per set: same date, title, and theme define one vocabulary set.',
                rowMode: 'grouped',
                groupHint: 'Every row with the same date + title + theme is merged into one VOCAB_SET.',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: true },
                    { key: 'theme', label: 'theme', required: true },
                    { key: 'word', label: 'word', required: true },
                    { key: 'pronunciation_hi', label: 'pronunciation_hi', required: true },
                    { key: 'meaning_hi', label: 'meaning_hi', required: true },
                    { key: 'vocab_set_number', label: 'vocab_set_number', required: false },
                    { key: 'theme_image_description', label: 'theme_image_description', required: false },
                ],
                exampleRows: [
                    ['date', 'title', 'theme', 'word', 'pronunciation_hi', 'meaning_hi', 'theme_image_description'],
                    ['2026-04-01', 'Dining vocabulary', 'Dining', 'menu', 'मेन्यू', 'मेन्यू', 'Family at a table'],
                    ['2026-04-01', 'Dining vocabulary', 'Dining', 'waiter', 'वेटर', 'वेटर', ''],
                ],
            };
        case 'CONVERSATION':
            return {
                type: 'CONVERSATION',
                description: 'Multiple rows per conversation: same date and title. participants can repeat (first non-empty wins).',
                rowMode: 'grouped',
                groupHint: 'Group rows by date + title. Each row is one dialogue line.',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: true },
                    { key: 'participants', label: 'participants', required: true, hint: 'comma-separated, e.g. Waiter,Customer' },
                    { key: 'speaker', label: 'speaker', required: true },
                    { key: 'text_en', label: 'text_en', required: true },
                    { key: 'text_hi', label: 'text_hi', required: true },
                ],
                exampleRows: [
                    ['date', 'title', 'participants', 'speaker', 'text_en', 'text_hi'],
                    ['2026-04-01', 'At the restaurant', 'Waiter,Customer', 'Waiter', 'Good evening!', 'शुभ संध्या!'],
                    ['2026-04-01', 'At the restaurant', '', 'Customer', 'A table for two please.', 'कृपया दो लोगों के लिए एक मेज।'],
                ],
            };
        case 'PUZZLE_SPOT':
        case 'PUZZLE_GRAMMAR':
            return {
                type: contentType,
                description:
                    'Five rows per puzzle day: same date (and title if used). One row per question with four options.',
                rowMode: 'grouped',
                groupHint: 'Group exactly 5 rows with the same date (+ title). Each row is one puzzle question.',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: false, formField: 'Admin title' },
                    { key: 'question', label: 'question', required: true, formField: 'Question text' },
                    { key: 'option_1', label: 'option_1', required: true, formField: 'Choice A' },
                    { key: 'option_2', label: 'option_2', required: true, formField: 'Choice B' },
                    { key: 'option_3', label: 'option_3', required: false, formField: 'Choice C' },
                    { key: 'option_4', label: 'option_4', required: false, formField: 'Choice D' },
                    { key: 'correct_option', label: 'correct_option', required: true, hint: '1–4', formField: 'Correct choice' },
                    { key: 'questions_json', label: 'questions_json', required: false, hint: 'Optional legacy JSON override', formField: 'Advanced JSON (skip if using columns)' },
                ],
                exampleRows: [
                    ['2026-04-01', 'Daily puzzle', 'Which sentence is correct?', 'I goes to school.', 'I go to school.', 'I going school.', 'I gone school.', '2'],
                    ['2026-04-01', '', 'Pick the right verb.', 'She go', 'She goes', 'She going', 'She gone', '2'],
                    ['2026-04-01', '', 'Question 3…', '', '', '', '', '1'],
                    ['2026-04-01', '', 'Question 4…', '', '', '', '', '1'],
                    ['2026-04-01', '', 'Question 5…', '', '', '', '', '1'],
                ],
            };
        case 'PROFESSIONAL_CONVERSATION':
            return {
                type: 'PROFESSIONAL_CONVERSATION',
                description:
                    'Multiple rows per conversation (GOLD). Same columns as PRACTICAL CONVERSATIONS; sets isProfessionalLibrary.',
                rowMode: 'grouped',
                groupHint: 'Group rows by date + title. Each row is one dialogue line.',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: true },
                    { key: 'participants', label: 'participants', required: true, hint: 'comma-separated' },
                    { key: 'speaker', label: 'speaker', required: true },
                    { key: 'text_en', label: 'text_en', required: true },
                    { key: 'text_hi', label: 'text_hi', required: true },
                ],
                exampleRows: [
                    ['date', 'title', 'participants', 'speaker', 'text_en', 'text_hi'],
                    ['2026-04-01', 'Office standup', 'Manager,Employee', 'Manager', 'Good morning.', 'सुप्रभात।'],
                ],
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
                    { key: 'explanation', label: 'explanation', required: false, formField: 'Explanation (English)' },
                    { key: 'hindi_summary', label: 'hindi_summary', required: false, formField: 'Hindi summary' },
                    { key: 'keywords', label: 'keywords', required: false, hint: 'word:meaning_hi|word2:meaning_hi2', formField: 'Keywords' },
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
                    { key: 'lyrics', label: 'lyrics', required: false, formField: 'Lyrics text' },
                    { key: 'metadata_json', label: 'metadata_json', required: false, formField: 'Advanced JSON override' },
                ],
                exampleRows: [],
            };
        case 'FEED':
            return {
                type: 'FEED',
                description: 'Multiple rows per feed day: same date + title; each row is one Instagram post.',
                rowMode: 'grouped',
                groupHint: 'Group rows by date + title. Each row is one post.',
                columns: [
                    { key: 'date', label: 'date', required: true, formField: 'Schedule date' },
                    { key: 'title', label: 'title', required: true, formField: 'Admin title' },
                    { key: 'post_image_url', label: 'post_image_url', required: false, formField: 'Post image URL' },
                    { key: 'post_credit', label: 'post_credit', required: false, formField: 'Credit / account' },
                    { key: 'post_link', label: 'post_link', required: false, formField: 'Instagram post link' },
                    { key: 'post_caption', label: 'post_caption', required: false, formField: 'Caption' },
                    { key: 'metadata_json', label: 'metadata_json', required: false, formField: 'Advanced JSON override' },
                ],
                exampleRows: [
                    ['2026-04-01', 'Instagram feed', 'https://example.com/img1.jpg', '@verble', 'https://instagram.com/p/abc', 'Hello learners'],
                    ['2026-04-01', 'Instagram feed', 'https://example.com/img2.jpg', '@verble', '', ''],
                ],
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
    const formats = ['yyyy-MM-dd', 'M/d/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 'dd/MM/yyyy'];
    for (const f of formats) {
        const d = parse(v, f, new Date());
        if (isValid(d)) return format(d, 'yyyy-MM-dd');
    }
    const iso = new Date(v);
    if (isValid(iso)) return format(iso, 'yyyy-MM-dd');
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
    examples_json: '[{"en":"She was curious.","hi":"वह जिज्ञासु थी।"}]',
    text_content: 'Once there was a boy.\\nHe returned a wallet.',
    story_title: 'The honest boy',
    moral_en: 'Honesty matters',
    moral_hi: 'ईमानदारी महत्वपूर्ण है',
    sentence_translations: 'Line 1 hi|Line 2 hi',
    theme: 'Dining',
    word: 'menu',
    pronunciation_hi: 'मेन्यू',
    vocab_set_number: '1',
    theme_image_description: 'Family at a table',
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
    keywords: 'stall:दुकान|crowd:भीड',
    metadata_json: '',
    youtube_url: 'https://youtube.com/watch?v=example',
    transcript: 'Speech transcript text…',
    phrases: 'thank you:Thank you:धन्यवाद',
    artist: 'Sample Artist',
    lyrics: 'Line one\\nLine two',
    post_image_url: 'https://example.com/post.jpg',
    post_credit: '@verble',
    post_link: 'https://instagram.com/p/example',
    post_caption: 'Daily inspiration',
};

export function buildExampleCsvFromSchema(schema: BulkTypeSchema): string {
    const header = schema.columns.map((c) => c.label);
    const sampleRow = schema.columns.map((c) => COLUMN_SAMPLE_VALUES[c.key] ?? '');
    const lines = [
        header.map(escapeCsvCell).join(','),
        sampleRow.map(escapeCsvCell).join(','),
    ];
    return lines.join('\n');
}

function parseSceneKeywords(s: string): { word: string; meaning_hi: string }[] {
    if (!s.trim()) return [];
    return s
        .split('|')
        .map((part) => {
            const [word, meaning_hi] = part.split(':').map((x) => x.trim());
            return { word: word || '', meaning_hi: meaning_hi || '' };
        })
        .filter((k) => k.word);
}

function parseSpeechKeywords(s: string): { word: string; meaning_en: string; meaning_hi: string }[] {
    if (!s.trim()) return [];
    return s
        .split('|')
        .map((part) => {
            const bits = part.split(':').map((x) => x.trim());
            return { word: bits[0] || '', meaning_en: bits[1] || '', meaning_hi: bits[2] || '' };
        })
        .filter((k) => k.word);
}

function parseSpeechPhrases(s: string): { phrase: string; meaning_en: string; meaning_hi: string }[] {
    if (!s.trim()) return [];
    return s
        .split('|')
        .map((part) => {
            const bits = part.split(':').map((x) => x.trim());
            return { phrase: bits[0] || '', meaning_en: bits[1] || '', meaning_hi: bits[2] || '' };
        })
        .filter((p) => p.phrase);
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
            let examples: { en: string; hi: string; audio?: string }[] | undefined;
            let examplesInvalid = false;
            const exJson = (row.examples_json ?? '').trim();
            if (exJson) {
                try {
                    const parsed = JSON.parse(exJson);
                    if (!Array.isArray(parsed)) {
                        errors.push(`Row ${line}: examples_json must be a JSON array`);
                        examplesInvalid = true;
                    } else {
                        examples = [];
                        for (let j = 0; j < parsed.length; j++) {
                            const item = parsed[j];
                            if (!item || typeof item.en !== 'string' || typeof item.hi !== 'string') {
                                errors.push(`Row ${line}: examples_json[${j}] needs en and hi strings`);
                                examplesInvalid = true;
                            } else {
                                examples.push({
                                    en: item.en,
                                    hi: item.hi,
                                    audio: typeof item.audio === 'string' ? item.audio : undefined,
                                });
                            }
                        }
                    }
                } catch {
                    errors.push(`Row ${line}: examples_json is not valid JSON`);
                    examplesInvalid = true;
                }
            }
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
                },
                isActive: true,
            });
        }
    } else if (adminKey === 'VOCAB_SET') {
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
            });
            if (groupFailed) continue;
            if (words.length === 0) {
                errors.push(`VOCAB_SET "${title}": no valid words in group`);
                continue;
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
                    vocabItems: words,
                },
                isActive: true,
            });
        }
    } else if (adminKey === 'CONVERSATION' || adminKey === 'PROFESSIONAL_CONVERSATION') {
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
            let participants: string[] | undefined;
            let groupFailed = false;
            grouped.forEach((row, i) => {
                const line = `Conversation "${title}" line ${i + 1}`;
                const p = (row.participants ?? '').trim();
                if (p) {
                    participants = splitCommaList(p);
                }
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
            if (!participants || participants.length === 0) {
                errors.push(`Conversation "${title}": participants required on at least one line (usually the first)`);
                groupFailed = true;
            }
            if (groupFailed) continue;
            const meta: Record<string, unknown> = { participants: participants!, dialogue };
            if (adminKey === 'PROFESSIONAL_CONVERSATION') {
                meta.isProfessionalLibrary = true;
            }
            payloads.push({
                type: apiType,
                date,
                level,
                title,
                metadata: meta,
                isActive: true,
            });
        }
    } else if (adminKey === 'PUZZLE_SPOT' || adminKey === 'PUZZLE_GRAMMAR') {
        const puzzleType = catalogEntry.puzzleType || 'SPOT_CORRECT_SENTENCE';
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
                const raw = (jsonRow.questions_json ?? '').trim();
                let questions: { question: string; options: string[]; correct_idx: number }[] | null = null;
                try {
                    const parsed = JSON.parse(raw);
                    if (!Array.isArray(parsed) || parsed.length !== 5) {
                        errors.push(`Row ${line}: questions_json must be a JSON array of exactly 5 questions`);
                    } else {
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
                                questions = null;
                                break;
                            }
                            if (Number.isNaN(correct_idx) || correct_idx < 0 || correct_idx >= options.length) {
                                errors.push(`Row ${line}: question ${q + 1} has invalid correct_idx`);
                                questions = null;
                                break;
                            }
                            questions.push({ question: qText, options, correct_idx });
                        }
                    }
                } catch {
                    errors.push(`Row ${line}: questions_json is not valid JSON`);
                }
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

            if (grouped.length !== 5) {
                errors.push(`PUZZLE "${title}" on ${date}: need exactly 5 question rows (found ${grouped.length})`);
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
            const meta: Record<string, unknown> = {
                title: (row.scene_headline ?? '').trim() || undefined,
                imageUrl: (row.image_url ?? '').trim() || undefined,
                gifUrl: (row.gif_url ?? '').trim() || undefined,
                explanation: (row.explanation ?? '').trim() || undefined,
                hindiSummary: (row.hindi_summary ?? '').trim() || undefined,
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
            payloads.push({
                type: apiType,
                date,
                level,
                title,
                metadata: {
                    artist: (row.artist ?? '').trim() || undefined,
                    audio: (row.audio ?? '').trim() || undefined,
                    lyrics: unescapeTextContent((row.lyrics ?? '').trim()) || undefined,
                },
                isActive: true,
            });
        }
    } else if (adminKey === 'FEED') {
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
                    postLink: (row.post_link ?? '').trim(),
                    caption: (row.post_caption ?? '').trim(),
                }))
                .filter((p) => p.imageUrl || p.credit || p.postLink || p.caption);
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

    const hardErrors = errors.filter((e) => !e.startsWith('Note:'));
    if (hardErrors.length > 0) {
        return { ok: false, errors, payloads: [] };
    }
    return { ok: true, errors, payloads };
}

export function schemaToExampleCsv(schema: BulkTypeSchema): string {
    const main = buildExampleCsvFromSchema(schema);
    if (schema.rowMode === 'grouped' && schema.exampleRows.length > 0) {
        const header = schema.columns.map((c) => c.label);
        const extraLines = schema.exampleRows.map((row) => {
            const cells = header.map((_, i) => row[i] ?? '');
            return cells.map(escapeCsvCell).join(',');
        });
        return [main, ...extraLines].join('\n');
    }
    return main;
}
