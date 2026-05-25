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
                    { key: 'date', label: 'date', required: true, hint: 'YYYY-MM-DD' },
                    { key: 'title', label: 'title', required: true },
                    { key: 'text', label: 'text', required: true },
                    { key: 'meaning_en', label: 'meaning_en', required: true },
                    { key: 'meaning_hi', label: 'meaning_hi', required: true },
                    { key: 'audio', label: 'audio', required: false },
                    { key: 'part_of_speech', label: 'part_of_speech', required: false },
                    { key: 'pronunciation_ipa', label: 'pronunciation_ipa', required: false },
                    { key: 'pronunciation_devanagari', label: 'pronunciation_devanagari', required: false },
                    { key: 'synonyms', label: 'synonyms', required: false, hint: 'comma-separated' },
                    { key: 'antonyms', label: 'antonyms', required: false, hint: 'comma-separated' },
                    { key: 'examples_json', label: 'examples_json', required: false, hint: '[{"en":"","hi":""},…]' },
                ],
                exampleRows: [
                    ['date', 'title', 'text', 'meaning_en', 'meaning_hi', 'audio', 'part_of_speech'],
                    ['2026-04-01', 'Word of the Day – curious', 'curious', 'eager to know', 'जिज्ञासु', '', 'adjective'],
                ],
            };
        case 'PHRASE':
            return {
                type: 'PHRASE',
                description: 'One row per phrase.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true, hint: 'YYYY-MM-DD' },
                    { key: 'title', label: 'title', required: true },
                    { key: 'text', label: 'text', required: true },
                    { key: 'meaning_en', label: 'meaning_en', required: true },
                    { key: 'meaning_hi', label: 'meaning_hi', required: true },
                    { key: 'audio', label: 'audio', required: false },
                    { key: 'pronunciation_ipa', label: 'pronunciation_ipa', required: false },
                    { key: 'pronunciation_devanagari', label: 'pronunciation_devanagari', required: false },
                    { key: 'synonyms', label: 'synonyms', required: false },
                    { key: 'antonyms', label: 'antonyms', required: false },
                    { key: 'examples_json', label: 'examples_json', required: false },
                ],
                exampleRows: [
                    ['date', 'title', 'text', 'meaning_en', 'meaning_hi'],
                    ['2026-04-01', 'Phrase – Thank you', 'Thank you for your help.', 'gratitude', 'आपकी मदद के लिए धन्यवाद'],
                ],
            };
        case 'STORY':
            return {
                type: 'STORY',
                description: 'One row per story. Use \\n inside text_content for newlines (literal backslash + n).',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: true },
                    { key: 'text_content', label: 'text_content', required: true },
                    { key: 'story_title', label: 'story_title', required: false, hint: 'metadata.title' },
                    { key: 'audio', label: 'audio', required: false },
                    { key: 'moral_en', label: 'moral_en', required: false },
                    { key: 'moral_hi', label: 'moral_hi', required: false },
                    { key: 'sentence_translations', label: 'sentence_translations', required: false, hint: 'pipe | between lines' },
                ],
                exampleRows: [
                    ['date', 'title', 'text_content', 'moral_en'],
                    ['2026-04-01', 'The honest boy', 'Once there was a boy.\\nHe returned a wallet.', 'Honesty matters'],
                ],
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
                    { key: 'line_audio', label: 'line_audio', required: false },
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
                    'One row per puzzle day. questions_json must be a JSON array of exactly 5 objects: {question, options[], correct_idx}.',
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: false, hint: 'Optional; auto-assigned if blank' },
                    { key: 'questions_json', label: 'questions_json', required: true, hint: 'JSON array of 5 questions' },
                ],
                exampleRows: [
                    ['date', 'title', 'questions_json'],
                    [
                        '2026-04-01',
                        '',
                        '[{"question":"Pick the correct sentence.","options":["I goes","I go"],"correct_idx":1}]',
                    ],
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
                    { key: 'line_audio', label: 'line_audio', required: false },
                ],
                exampleRows: [
                    ['date', 'title', 'participants', 'speaker', 'text_en', 'text_hi'],
                    ['2026-04-01', 'Office standup', 'Manager,Employee', 'Manager', 'Good morning.', 'सुप्रभात।'],
                ],
            };
        case 'SCENE':
        case 'SPEECH':
        case 'LYRICS':
        case 'FEED':
            return {
                type: contentType,
                description: `Each row needs a JSON object in metadata_json for ${contentType} (structure must match the app).`,
                rowMode: 'one_row_per_item',
                columns: [
                    { key: 'date', label: 'date', required: true },
                    { key: 'title', label: 'title', required: true },
                    { key: 'metadata_json', label: 'metadata_json', required: true, hint: 'Valid JSON object' },
                ],
                exampleRows: [
                    ['date', 'title', 'metadata_json'],
                    ['2026-04-01', 'Sample', '{"caption_en":"Hello","caption_hi":"नमस्ते"}'],
                ],
            };
        default:
            throw new Error(`Unsupported bulk type: ${contentType}`);
    }
}

function normalizeHeader(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/["']/g, '');
}

/** Split CSV into physical lines; merge quoted newlines inside fields */
function splitCsvRecords(text: string): string[] {
    const records: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
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
        errors.push(`Unknown column(s) (remove or fix spelling): ${extras.join(', ')}`);
    }
    if (errors.length) return { ok: false, errors, payloads: [] };

    const payloads: CreateDailyContentPayload[] = [];

    if (adminKey === 'WORD' || adminKey === 'PHRASE') {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            const text = (row.text ?? '').trim();
            const meaning_en = (row.meaning_en ?? '').trim();
            const meaning_hi = (row.meaning_hi ?? '').trim();
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
                synonyms: row.synonyms ? splitCommaList(row.synonyms) : undefined,
                antonyms: row.antonyms ? splitCommaList(row.antonyms) : undefined,
                examples,
                pronunciation_ipa: (row.pronunciation_ipa ?? '').trim() || undefined,
                pronunciation_devanagari: (row.pronunciation_devanagari ?? '').trim() || undefined,
            };
            if (adminKey === 'WORD') {
                meta.partOfSpeech = (row.part_of_speech ?? '').trim() || undefined;
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
                    moral_hi: (row.moral_hi ?? '').trim() || undefined,
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
                const mh = (row.meaning_hi ?? '').trim();
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
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            const raw = (row.questions_json ?? '').trim();
            if (!raw) errors.push(`Row ${line}: questions_json is required`);
            let questions: { question: string; options: string[]; correct_idx: number }[] | null = null;
            if (raw) {
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
                                errors.push(`Row ${line}: question ${q + 1} needs question text and at least 2 options`);
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
            }
            if (!date || !raw || !questions) continue;
            payloads.push({
                type: 'PUZZLE',
                date,
                level,
                title: title || 'bulk-import',
                metadata: { puzzleType, questions },
                isActive: true,
            });
        }
    } else if (['SCENE', 'SPEECH', 'LYRICS', 'FEED'].includes(adminKey)) {
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const line = idx + 2;
            const date = parseFlexibleDate(row.date ?? '');
            if (!date) errors.push(`Row ${line}: invalid or empty date`);
            const title = (row.title ?? '').trim();
            const raw = (row.metadata_json ?? '').trim();
            if (!title) errors.push(`Row ${line}: title is required`);
            if (!raw) errors.push(`Row ${line}: metadata_json is required`);
            let metadata: Record<string, unknown> | null = null;
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                        errors.push(`Row ${line}: metadata_json must be a JSON object`);
                    } else {
                        metadata = parsed as Record<string, unknown>;
                    }
                } catch {
                    errors.push(`Row ${line}: metadata_json is not valid JSON`);
                }
            }
            if (!date || !title || !raw || !metadata) continue;
            payloads.push({
                type: apiType,
                date,
                level,
                title,
                metadata,
                isActive: true,
            });
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors, payloads: [] };
    }
    return { ok: true, errors: [], payloads };
}

export function schemaToExampleCsv(schema: BulkTypeSchema): string {
    const header = schema.exampleRows[0].join(',');
    const dataLines = schema.exampleRows.slice(1).map((r) =>
        r.map((c) => (c.includes(',') || c.includes('"') || c.includes('\n') ? `"${c.replace(/"/g, '""')}"` : c)).join(',')
    );
    return [header, ...dataLines].join('\n');
}
