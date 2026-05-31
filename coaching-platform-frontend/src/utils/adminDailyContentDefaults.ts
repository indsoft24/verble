import type { AdminContentTypeKey } from './dailyContentTypeCatalog';
import { apiTypeForAdminKey } from './dailyContentTypeCatalog';

export const emptyVocabItem = () => ({
    word: '',
    pronunciation_hi: '',
    meaning_hi: '',
    audio: '',
});

export const emptySceneKeyword = () => ({
    word: '',
    meaning_hi: '',
});

export const emptyImportantWord = () => ({
    word: '',
    meaning_en: '',
    meaning_hi: '',
});

export const emptyDialogueLine = () => ({
    speaker: '',
    text_en: '',
    text_hi: '',
    audio: '',
});

export const emptyPuzzleQuestion = () => ({
    question: '',
    options: ['', '', '', ''],
    correct_idx: 0,
});

export const emptyInstagramPost = () => ({
    imageUrl: '',
    credit: '',
    postLink: '',
    caption: '',
});

export const emptySpeechKeyword = () => ({
    word: '',
    meaning_en: '',
    meaning_hi: '',
});

export const emptySpeechPhrase = () => ({
    phrase: '',
    meaning_en: '',
    meaning_hi: '',
});

export function getDefaultMetadataForType(
    type: string,
    options?: { puzzleType?: string; adminKey?: AdminContentTypeKey }
): Record<string, unknown> {
    const puzzleType = options?.puzzleType || 'SPOT_CORRECT_SENTENCE';
    const adminKey = options?.adminKey;

    switch (type) {
        case 'WORD':
            return {
                text: '',
                meaning_en: '',
                meaning_hi: '',
                audio: '',
                partOfSpeech: '',
                examples: [],
                synonyms: [],
                antonyms: [],
            };
        case 'PHRASE':
            return {
                text: '',
                meaning_en: '',
                meaning_hi: '',
                audio: '',
                examples: [],
                synonyms: [],
                antonyms: [],
            };
        case 'STORY':
            return {
                title: '',
                text_content: '',
                audio: '',
                moral_en: '',
                moral_hi: '',
                sentence_translations: [],
                important_words: Array.from({ length: 5 }, emptyImportantWord),
            };
        case 'VOCAB_SET':
            return {
                theme: '',
                vocabSetNumber: '',
                themeImageDescription: '',
                themeImageUrl: '',
                vocabItems: Array.from({ length: 10 }, emptyVocabItem),
            };
        case 'CONVERSATION':
            if (adminKey === 'PROFESSIONAL_CONVERSATION') {
                return {
                    isProfessionalLibrary: true,
                    topicName: '',
                    tags: [] as string[],
                    dialogue: Array.from({ length: 5 }, emptyDialogueLine),
                };
            }
            return {
                scenarioTitle: '',
                scenarioTitle_hi: '',
                participant1: 'Waiter',
                participant2: 'You',
                participants: ['Waiter', 'You'],
                dialogue: Array.from({ length: 6 }, () => ({
                    ...emptyDialogueLine(),
                    speaker: 'Waiter',
                })),
            };
        case 'PUZZLE':
            return {
                puzzleType,
                questions: Array.from({ length: 5 }, emptyPuzzleQuestion),
            };
        case 'SCENE':
            return {
                title: '',
                imageUrl: '',
                gifUrl: '',
                explanation: '',
                hindiSummary: '',
                audio: '',
                keywords: [emptySceneKeyword(), emptySceneKeyword(), emptySceneKeyword()],
            };
        case 'SPEECH':
            return {
                speaker: '',
                youtubeUrl: '',
                transcript: '',
                keywords: [],
                phrases: [],
            };
        case 'LYRICS':
            return {
                artist: '',
                lyrics: '',
                audio: '',
                words: [],
                phrases: [],
            };
        case 'FEED':
            return { posts: [emptyInstagramPost()] };
        default:
            return {};
    }
}

export function defaultMetadataForAdminKey(adminKey: AdminContentTypeKey): Record<string, unknown> {
    const type = apiTypeForAdminKey(adminKey);
    const puzzleType =
        adminKey === 'PUZZLE_GRAMMAR' ? 'GRAMMAR_FILL_BLANK' : adminKey === 'PUZZLE_SPOT' ? 'SPOT_CORRECT_SENTENCE' : undefined;
    return getDefaultMetadataForType(type, { puzzleType, adminKey });
}
