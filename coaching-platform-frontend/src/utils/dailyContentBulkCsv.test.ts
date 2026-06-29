import { describe, expect, it } from 'vitest';
import {
    BULK_TEMPLATE_ROW_COUNT,
    CONVERSATION_LINE_COUNT,
    EXAMPLE_PAIR_COUNT,
    FEED_POST_COUNT,
    getBulkSchema,
    parseExamplesFromRow,
    parseFlexibleDate,
    PUZZLE_QUESTION_COUNT,
    schemaToExampleCsv,
    validateAndBuildPayloads,
    VOCAB_WORD_COUNT,
    parseCsvToObjects,
} from './dailyContentBulkCsv';
import { splitIntoBatches, BULK_IMPORT_BATCH_SIZE } from '../services/dailyContentAdminService';

describe('parseFlexibleDate', () => {
    it('parses 2-digit year dates as 2026', () => {
        expect(parseFlexibleDate('06/01/26')).toBe('2026-06-01');
        expect(parseFlexibleDate('07/20/26')).toBe('2026-07-20');
    });

    it('parses ISO dates unchanged', () => {
        expect(parseFlexibleDate('2026-06-01')).toBe('2026-06-01');
    });

    it('parses M/d/yy as month-first', () => {
        expect(parseFlexibleDate('01/04/26')).toBe('2026-01-04');
    });

    it('rejects year 0026 from legacy M/d/yyyy mis-parse', () => {
        expect(parseFlexibleDate('06/01/26')).not.toBe('0026-06-01');
    });

    it('returns null for garbage', () => {
        expect(parseFlexibleDate('')).toBeNull();
        expect(parseFlexibleDate('not-a-date')).toBeNull();
    });
});

describe('parseExamplesFromRow', () => {
    it('parses two numbered example columns', () => {
        const errors: string[] = [];
        const result = parseExamplesFromRow(
            {
                example_1_en: 'Break the ice.',
                example_1_hi: 'बातचीत शुरू करो।',
                example_2_en: 'She broke the ice at the party.',
                example_2_hi: 'उसने पार्टी में बातचीत शुरू की।',
            },
            2,
            errors
        );
        expect(errors).toEqual([]);
        expect(result.invalid).toBe(false);
        expect(result.examples).toHaveLength(2);
        expect(result.examples?.[0].en).toBe('Break the ice.');
    });

    it('still accepts valid examples_json array', () => {
        const errors: string[] = [];
        const result = parseExamplesFromRow(
            {
                examples_json: '[{"en":"Hello.","hi":"नमस्ते।"},{"en":"Goodbye.","hi":"अलविदा।"}]',
            },
            3,
            errors
        );
        expect(errors).toEqual([]);
        expect(result.examples).toHaveLength(2);
    });

    it('prefers numbered columns over broken examples_json', () => {
        const errors: string[] = [];
        const result = parseExamplesFromRow(
            {
                example_1_en: 'Only numbered.',
                example_1_hi: 'केवल numbered.',
                examples_json: '{not valid json',
            },
            4,
            errors
        );
        expect(errors).toEqual([]);
        expect(result.invalid).toBe(false);
        expect(result.examples).toHaveLength(1);
    });

    it('reports invalid examples_json when no numbered columns', () => {
        const errors: string[] = [];
        const result = parseExamplesFromRow({ examples_json: '{bad json' }, 62, errors);
        expect(result.invalid).toBe(true);
        expect(errors[0]).toContain('Row 62');
        expect(errors[0]).toContain('example_1_en');
    });
});

describe('validateAndBuildPayloads — PHRASE', () => {
    const headers = getBulkSchema('PHRASE').columns.map((c) => c.key);

    it('builds payload with multiple examples from numbered columns', () => {
        const rows = [
            {
                date: '2026-06-01',
                title: 'Phrase 1',
                text: 'break the ice',
                meaning_en: 'start a conversation',
                meaning_hi: 'बातचीत शुरू करना',
                example_1_en: 'He broke the ice.',
                example_1_hi: 'उसने बातचीत शुरू की।',
                example_2_en: 'Try to break the ice.',
                example_2_hi: 'बातचीत शुरू करने की कोशिश करो।',
            },
        ];
        const result = validateAndBuildPayloads('PHRASE', 'FREE', headers, rows);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(1);
        const examples = result.payloads[0].metadata.examples as { en: string; hi: string }[];
        expect(examples).toHaveLength(2);
    });

    it('validates 130 phrase rows without error', () => {
        const rows = Array.from({ length: 130 }, (_, i) => ({
            date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
            title: `Phrase ${i + 1}`,
            text: `phrase-${i + 1}`,
            meaning_en: 'meaning en',
            meaning_hi: 'अर्थ',
            example_1_en: `Example en ${i + 1}`,
            example_1_hi: `उदाहरण ${i + 1}`,
        }));
        const result = validateAndBuildPayloads('PHRASE', 'FREE', headers, rows);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(130);
    });
});

describe('getBulkSchema WORD/PHRASE', () => {
    it('includes numbered example columns', () => {
        const phraseCols = getBulkSchema('PHRASE').columns.map((c) => c.key);
        expect(phraseCols).toContain('example_1_en');
        expect(phraseCols).toContain(`example_${EXAMPLE_PAIR_COUNT}_hi`);
        expect(phraseCols).toContain('examples_json');
        expect(phraseCols).toContain('audio');
    });
});

describe('schemaToExampleCsv VOCAB_SET', () => {
    it('has no duplicate header and column count matches schema', () => {
        const schema = getBulkSchema('VOCAB_SET');
        const csv = schemaToExampleCsv(schema);
        const lines = csv.split('\n').filter(Boolean);
        expect(lines).toHaveLength(1 + BULK_TEMPLATE_ROW_COUNT);
        const headerCols = lines[0].split(',');
        expect(headerCols).toHaveLength(schema.columns.length);
        expect(headerCols).toContain('theme_image_url');
        expect(headerCols).toContain('word_1');
        expect(headerCols).toContain(`word_${VOCAB_WORD_COUNT}`);
        const headerCount = lines.filter((l) => l.startsWith('date,')).length;
        expect(headerCount).toBe(1);
    });
});

describe('validateAndBuildPayloads — one row per day (grouped types)', () => {
    it('builds VOCAB_SET from one row with numbered word columns', () => {
        const headers = getBulkSchema('VOCAB_SET').columns.map((c) => c.key);
        const rows = [
            {
                date: '2026-04-01',
                title: 'Dining vocabulary',
                theme: 'Dining',
                vocab_set_number: '1',
                theme_image_description: 'Family at table',
                theme_image_url: 'https://example.com/theme.jpg',
                word_1: 'menu',
                pronunciation_hi_1: 'मेन्यू',
                meaning_hi_1: 'मेन्यू',
                word_2: 'waiter',
                pronunciation_hi_2: 'वेटर',
                meaning_hi_2: 'वेटर',
            },
        ];
        const result = validateAndBuildPayloads('VOCAB_SET', 'BRONZE', headers, rows);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(1);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.themeImageUrl).toBe('https://example.com/theme.jpg');
        expect(meta.vocabItems).toHaveLength(2);
    });

    it('merges legacy VOCAB_SET multi-row format', () => {
        const headers = [
            'date',
            'title',
            'theme',
            'word',
            'pronunciation_hi',
            'meaning_hi',
            'vocab_set_number',
            'theme_image_description',
            'theme_image_url',
        ];
        const rows = [
            {
                date: '2026-04-01',
                title: 'Dining vocabulary',
                theme: 'Dining',
                word: 'menu',
                pronunciation_hi: 'मेन्यू',
                meaning_hi: 'मेन्यू',
                vocab_set_number: '1',
                theme_image_description: 'Family at table',
                theme_image_url: 'https://example.com/theme.jpg',
            },
            {
                date: '2026-04-01',
                title: 'Dining vocabulary',
                theme: 'Dining',
                word: 'waiter',
                pronunciation_hi: 'वेटर',
                meaning_hi: 'वेटर',
                vocab_set_number: '1',
                theme_image_description: '',
                theme_image_url: '',
            },
        ];
        const result = validateAndBuildPayloads('VOCAB_SET', 'BRONZE', headers, rows);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(1);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.themeImageUrl).toBe('https://example.com/theme.jpg');
        expect(meta.vocabItems).toHaveLength(2);
    });

    it('builds CONVERSATION from one row with numbered line columns', () => {
        const headers = getBulkSchema('CONVERSATION').columns.map((c) => c.key);
        const rows = [
            {
                date: '2026-04-01',
                title: 'At the restaurant',
                scenario_title: 'Dinner out',
                scenario_title_hi: 'डिनर',
                participant_1: 'Waiter',
                participant_2: 'Customer',
                line_1_speaker: 'Waiter',
                line_1_text_en: 'Good evening!',
                line_1_text_hi: 'शुभ संध्या!',
                line_2_speaker: 'Customer',
                line_2_text_en: 'Table for two.',
                line_2_text_hi: 'दो लोगों के लिए।',
            },
        ];
        const result = validateAndBuildPayloads('CONVERSATION', 'SILVER', headers, rows);
        expect(result.ok).toBe(true);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.scenarioTitle).toBe('Dinner out');
        expect(meta.scenarioTitle_hi).toBe('डिनर');
        expect(meta.participant1).toBe('Waiter');
        expect(meta.participant2).toBe('Customer');
        expect(meta.dialogue).toHaveLength(2);
    });

    it('merges legacy CONVERSATION multi-row format', () => {
        const headers = [
            'date',
            'title',
            'scenario_title',
            'scenario_title_hi',
            'participant_1',
            'participant_2',
            'participants',
            'speaker',
            'text_en',
            'text_hi',
        ];
        const rows = [
            {
                date: '2026-04-01',
                title: 'At the restaurant',
                scenario_title: 'Dinner out',
                scenario_title_hi: 'डिनर',
                participant_1: 'Waiter',
                participant_2: 'Customer',
                participants: '',
                speaker: 'Waiter',
                text_en: 'Good evening!',
                text_hi: 'शुभ संध्या!',
            },
            {
                date: '2026-04-01',
                title: 'At the restaurant',
                scenario_title: '',
                scenario_title_hi: '',
                participant_1: '',
                participant_2: '',
                participants: '',
                speaker: 'Customer',
                text_en: 'Table for two.',
                text_hi: 'दो लोगों के लिए।',
            },
        ];
        const result = validateAndBuildPayloads('CONVERSATION', 'SILVER', headers, rows);
        expect(result.ok).toBe(true);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.dialogue).toHaveLength(2);
    });

    it('builds PROFESSIONAL_CONVERSATION from one row', () => {
        const headers = getBulkSchema('PROFESSIONAL_CONVERSATION').columns.map((c) => c.key);
        const rows = [
            {
                date: '2026-04-01',
                title: 'Office standup',
                topic_name: 'Standup',
                description: 'Daily sync',
                tags: 'office,meetings',
                related_content_ids: 'abc123,def456',
                participant_1: 'Manager',
                participant_2: 'Employee',
                line_1_speaker: 'Manager',
                line_1_text_en: 'Good morning.',
                line_1_text_hi: 'सुप्रभात।',
            },
        ];
        const result = validateAndBuildPayloads('PROFESSIONAL_CONVERSATION', 'GOLD', headers, rows);
        expect(result.ok).toBe(true);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.isProfessionalLibrary).toBe(true);
        expect(meta.topicName).toBe('Standup');
        expect(meta.description).toBe('Daily sync');
        expect(meta.tags).toEqual(['office', 'meetings']);
        expect(meta.relatedContentIds).toEqual(['abc123', 'def456']);
    });

    it('builds PUZZLE from one row with 5 numbered questions', () => {
        const headers = getBulkSchema('PUZZLE_SPOT').columns.map((c) => c.key);
        const row: Record<string, string> = {
            date: '2026-04-01',
            title: 'Daily puzzle',
        };
        for (let i = 1; i <= PUZZLE_QUESTION_COUNT; i++) {
            row[`question_${i}`] = `Question ${i}?`;
            row[`option_${i}_1`] = 'A';
            row[`option_${i}_2`] = 'B';
            row[`correct_option_${i}`] = '1';
        }
        const result = validateAndBuildPayloads('PUZZLE_SPOT', 'SILVER', headers, [row]);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(1);
        const questions = result.payloads[0].metadata.questions as unknown[];
        expect(questions).toHaveLength(PUZZLE_QUESTION_COUNT);
    });

    it('builds FEED from one row with numbered posts', () => {
        const headers = getBulkSchema('FEED').columns.map((c) => c.key);
        const rows = [
            {
                date: '2026-04-01',
                title: 'Instagram feed',
                post_1_image_url: 'https://example.com/img1.jpg',
                post_1_credit: '@verble',
                post_1_credit_url: 'https://instagram.com/verble',
                post_1_link: 'https://instagram.com/p/abc',
                post_1_caption: 'Hello learners',
                post_2_image_url: 'https://example.com/img2.jpg',
                post_2_credit: '@verble',
                post_2_credit_url: 'https://instagram.com/verble',
            },
        ];
        const result = validateAndBuildPayloads('FEED', 'GOLD', headers, rows);
        expect(result.ok).toBe(true);
        const posts = result.payloads[0].metadata.posts as unknown[];
        expect(posts).toHaveLength(2);
    });

    it('schema includes numbered slot columns for grouped types', () => {
        expect(getBulkSchema('CONVERSATION').columns.map((c) => c.key)).toContain('line_1_speaker');
        expect(getBulkSchema('CONVERSATION').columns.map((c) => c.key)).toContain(
            `line_${CONVERSATION_LINE_COUNT}_text_hi`
        );
        expect(getBulkSchema('PUZZLE_GRAMMAR').columns.map((c) => c.key)).toContain('question_1');
        expect(getBulkSchema('FEED').columns.map((c) => c.key)).toContain(`post_${FEED_POST_COUNT}_caption`);
    });

    it('VOCAB template row validates and builds payload', () => {
        const schema = getBulkSchema('VOCAB_SET');
        const csv = schemaToExampleCsv(schema);
        const { headers, rows } = parseCsvToObjects(csv);
        const firstDataRow = rows[0];
        const result = validateAndBuildPayloads('VOCAB_SET', 'BRONZE', headers, [firstDataRow]);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(1);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.vocabItems).toHaveLength(VOCAB_WORD_COUNT);
        expect(result.payloads[0].date).toMatch(/^2026-/);
    });
});

describe('validateAndBuildPayloads — grouped / multi-value types', () => {
    it('parses STORY important_words', () => {
        const headers = getBulkSchema('STORY').columns.map((c) => c.key);
        const rows = [
            {
                date: '2026-04-01',
                title: 'Honest boy',
                text_content: 'Once there was a boy.',
                important_words: 'honest:honest:ईमानदार|wallet:wallet:बटुआ',
            },
        ];
        const result = validateAndBuildPayloads('STORY', 'BRONZE', headers, rows);
        expect(result.ok).toBe(true);
        const words = result.payloads[0].metadata.important_words as { word: string }[];
        expect(words).toHaveLength(5);
        expect(words[0].word).toBe('honest');
        expect(words[1].word).toBe('wallet');
    });

    it('requires SCENE explanation', () => {
        const headers = getBulkSchema('SCENE').columns.map((c) => c.key);
        const fail = validateAndBuildPayloads('SCENE', 'GOLD', headers, [
            { date: '2026-04-01', title: 'Market', explanation: '' },
        ]);
        expect(fail.ok).toBe(false);
        expect(fail.errors.some((e) => e.includes('explanation'))).toBe(true);

        const ok = validateAndBuildPayloads('SCENE', 'GOLD', headers, [
            {
                date: '2026-04-01',
                title: 'Market',
                explanation: 'A busy market.',
                submission_prompt: 'Describe what you see.',
            },
        ]);
        expect(ok.ok).toBe(true);
        expect(ok.payloads[0].metadata.explanation).toBe('A busy market.');
        expect(ok.payloads[0].metadata.submissionPrompt).toBe('Describe what you see.');
    });

    it('parses LYRICS words and phrases', () => {
        const headers = getBulkSchema('LYRICS').columns.map((c) => c.key);
        const result = validateAndBuildPayloads('LYRICS', 'GOLD', headers, [
            {
                date: '2026-04-01',
                title: 'Song 1',
                artist: 'Artist',
                lyrics: 'Line one',
                words: 'love:love:प्यार',
                phrases: 'thank you:Thank you:धन्यवाद',
            },
        ]);
        expect(result.ok).toBe(true);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.words).toHaveLength(1);
        expect(meta.phrases).toHaveLength(1);
    });
});

describe('Essential Vocabulary.csv', () => {
    it('parses 51 rows with 2026 schedule dates', async () => {
        const { readFileSync } = await import('fs');
        const { parseCsvToObjects, validateAndBuildPayloads, getBulkSchema } = await import(
            './dailyContentBulkCsv'
        );
        const csv = readFileSync('/var/www/verble.in/Essential Vocabulary.csv', 'utf8');
        const { headers, rows } = parseCsvToObjects(csv);
        expect(rows).toHaveLength(51);
        const result = validateAndBuildPayloads('VOCAB_SET', 'BRONZE', headers, rows);
        expect(result.ok).toBe(true);
        expect(result.payloads).toHaveLength(51);
        expect(result.payloads[0].date).toMatch(/^2026-/);
        expect(result.payloads[50].date).toMatch(/^2026-/);
        const meta = result.payloads[0].metadata as Record<string, unknown>;
        expect(meta.vocabItems).toHaveLength(10);
    });
});

describe('splitIntoBatches', () => {
    it('splits 132 items into 6 batches of 25', () => {
        const items = Array.from({ length: 132 }, (_, i) => i);
        const batches = splitIntoBatches(items, BULK_IMPORT_BATCH_SIZE);
        expect(batches).toHaveLength(6);
        expect(batches[0]).toHaveLength(25);
        expect(batches[5]).toHaveLength(7);
    });
});
