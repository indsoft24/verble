/** Minimum unique vocab words required for a set (caps at 5 or list size). */
export function getMinVocabWordsRequired(vocabItemCount: number): number {
    const count = Math.max(0, vocabItemCount);
    if (count === 0) return 1;
    return Math.min(5, count);
}

export const MIN_VOCAB_SENTENCES = 2;
export const MAX_VOCAB_SENTENCES = 5;
