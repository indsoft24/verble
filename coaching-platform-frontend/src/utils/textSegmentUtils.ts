export interface BilingualSegment {
    en: string;
    hi: string;
}

/**
 * Normalize raw translation input (legacy string[] or string) into one paragraph.
 */
export function normalizeTranslationInput(value: string | string[] | undefined | null): string {
    if (value == null) return '';
    if (Array.isArray(value)) {
        return value.map((s) => String(s ?? '').trim()).filter(Boolean).join(' ').trim();
    }
    return String(value).trim();
}

/**
 * Split text into segments after `.`, `,`, `?`, or Hindi purn viram `।`.
 * Manual newlines are folded to spaces so admins need not press Enter per line.
 */
export function splitTextByPunctuation(text: string): string[] {
    const normalized = String(text ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\n+/g, ' ')
        .trim();

    if (!normalized) return [];

    const segments = normalized
        .split(/(?<=[.,?।])/u)
        .map((s) => s.trim())
        .filter(Boolean);

    return segments.length > 0 ? segments : [normalized];
}

/**
 * Pair English and Hindi segments by index for bilingual row display.
 */
export function pairBilingualSegments(
    englishText: string,
    hindiText: string | string[] | undefined | null
): BilingualSegment[] {
    const enSegments = splitTextByPunctuation(englishText);
    const hiSegments = splitTextByPunctuation(normalizeTranslationInput(hindiText));

    const maxLen = Math.max(enSegments.length, hiSegments.length);
    if (maxLen === 0) return [];
    const pairs: BilingualSegment[] = [];

    for (let i = 0; i < maxLen; i++) {
        const en = enSegments[i] ?? '';
        const hi = hiSegments[i] ?? '';
        if (en || hi) {
            pairs.push({ en, hi });
        }
    }

    return pairs;
}
