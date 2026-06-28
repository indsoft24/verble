import { describe, expect, it } from 'vitest';
import {
    normalizeTranslationInput,
    pairBilingualSegments,
    splitTextByPunctuation,
} from './textSegmentUtils';

describe('splitTextByPunctuation', () => {
    it('splits on full stop, comma, and question mark', () => {
        expect(splitTextByPunctuation('Hello, world. How are you?')).toEqual([
            'Hello,',
            'world.',
            'How are you?',
        ]);
    });

    it('splits on Hindi purn viram', () => {
        expect(splitTextByPunctuation('पहली पंक्ति। दूसरी पंक्ति।')).toEqual([
            'पहली पंक्ति।',
            'दूसरी पंक्ति।',
        ]);
    });

    it('normalizes manual newlines to spaces before splitting', () => {
        expect(splitTextByPunctuation('Line one.\nLine two.\nLine three.')).toEqual([
            'Line one.',
            'Line two.',
            'Line three.',
        ]);
    });

    it('splits glued punctuation without trailing space', () => {
        expect(splitTextByPunctuation('vitae.Interdum et malesuada.')).toEqual([
            'vitae.',
            'Interdum et malesuada.',
        ]);
    });

    it('returns empty array for blank input', () => {
        expect(splitTextByPunctuation('')).toEqual([]);
        expect(splitTextByPunctuation('   ')).toEqual([]);
    });
});

describe('normalizeTranslationInput', () => {
    it('joins legacy string arrays with spaces', () => {
        expect(normalizeTranslationInput(['पहली।', 'दूसरी।'])).toBe('पहली। दूसरी।');
    });

    it('handles string input', () => {
        expect(normalizeTranslationInput('  एक पैराग्राफ।  ')).toBe('एक पैराग्राफ।');
    });
});

describe('pairBilingualSegments', () => {
    it('pairs segments by index', () => {
        expect(
            pairBilingualSegments('One. Two.', ['एक।', 'दो।'])
        ).toEqual([
            { en: 'One.', hi: 'एक।' },
            { en: 'Two.', hi: 'दो।' },
        ]);
    });

    it('re-splits legacy hindi arrays after joining', () => {
        expect(
            pairBilingualSegments('A, B.', ['हिंदी ए,', 'हिंदी बी।'])
        ).toEqual([
            { en: 'A,', hi: 'हिंदी ए,' },
            { en: 'B.', hi: 'हिंदी बी।' },
        ]);
    });

    it('handles mismatched segment counts', () => {
        expect(pairBilingualSegments('Only one.', ['एक।', 'अतिरिक्त।'])).toEqual([
            { en: 'Only one.', hi: 'एक।' },
            { en: '', hi: 'अतिरिक्त।' },
        ]);
    });
});
