/** Minimum unique vocab words required (min of 5 and words in the set). */
export function getMinVocabWordsRequired(vocabItems = []) {
    const count = vocabItems.filter((item) => String(item?.word || '').trim()).length;
    if (count === 0) return 1;
    return Math.min(5, count);
}
