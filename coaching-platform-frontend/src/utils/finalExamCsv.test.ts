import { describe, expect, it } from 'vitest';
import { finalExamTemplateCsv, validateFinalExamCsv } from './finalExamCsv';

describe('validateFinalExamCsv', () => {
    it('accepts the BOM template and converts correct option to zero-based', () => {
        const result = validateFinalExamCsv(`\uFEFF${finalExamTemplateCsv()}`);
        expect(result.ok).toBe(true);
        expect(result.questions[0]).toMatchObject({
            stableKey: 'grammar-past-001',
            correctOption: 1,
            difficulty: 'medium',
            active: true,
        });
    });

    it('rejects duplicate stable keys', () => {
        const template = finalExamTemplateCsv();
        const [, sample] = template.split('\n');
        const result = validateFinalExamCsv(`${template}\n${sample}`);
        expect(result.ok).toBe(false);
        expect(result.errors.join(' ')).toContain('duplicate stable_key');
    });

    it('rejects option gaps and invalid correct options', () => {
        const csv = finalExamTemplateCsv()
            .replace('She went yesterday.', '')
            .replace(',2,Went is', ',6,Went is');
        const result = validateFinalExamCsv(csv);
        expect(result.ok).toBe(false);
        expect(result.errors.join(' ')).toContain('options must be contiguous');
        expect(result.errors.join(' ')).toContain('correct_option');
    });
});
