import { describe, expect, it } from 'vitest';
import {
    EXAMPLE_PAIR_COUNT,
    getBulkSchema,
    parseExamplesFromRow,
    validateAndBuildPayloads,
} from './dailyContentBulkCsv';
import { splitIntoBatches, BULK_IMPORT_BATCH_SIZE } from '../services/dailyContentAdminService';

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
