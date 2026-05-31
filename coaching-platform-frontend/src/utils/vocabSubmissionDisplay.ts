export interface VocabSentenceEntry {
    sentence: string;
    vocabWordsUsed: string[];
}

export function normalizeVocabSentences(sentences: unknown): VocabSentenceEntry[] {
    if (!Array.isArray(sentences)) return [];
    return sentences
        .map((raw) => {
            if (typeof raw === 'string') {
                const s = raw.trim();
                return s ? { sentence: s, vocabWordsUsed: [] } : null;
            }
            if (raw && typeof raw === 'object') {
                const o = raw as Record<string, unknown>;
                const sentence = String(o.sentence ?? '').trim();
                if (!sentence) return null;
                const vocabWordsUsed = Array.isArray(o.vocabWordsUsed)
                    ? o.vocabWordsUsed.map((w) => String(w).trim()).filter(Boolean)
                    : [];
                return { sentence, vocabWordsUsed };
            }
            return null;
        })
        .filter((s): s is VocabSentenceEntry => s !== null);
}

export function formatVocabSubmissionPlain(sentences: unknown): string {
    return normalizeVocabSentences(sentences)
        .map((s, i) => {
            const tags =
                s.vocabWordsUsed.length > 0 ? ` [${s.vocabWordsUsed.join(', ')}]` : '';
            return `${i + 1}. ${s.sentence}${tags}`;
        })
        .join('\n');
}
