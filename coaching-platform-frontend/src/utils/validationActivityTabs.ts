import type { SentenceSubmission } from '../services/sentenceValidationService';

export type ValidationTabId =
    | 'sentence'
    | 'vocabulary'
    | 'dialogues'
    | 'audio_speech'
    | 'free_writing';

export type SubmissionType = SentenceSubmission['submissionType'];

export interface ValidationActivityTab {
    id: ValidationTabId;
    label: string;
    submissionTypes: SubmissionType[];
}

/** Tab labels aligned with daily content activity names on the learner dashboard. */
export const VALIDATION_ACTIVITY_TABS: ValidationActivityTab[] = [
    {
        id: 'sentence',
        label: 'Sentences',
        submissionTypes: ['sentence'],
    },
    {
        id: 'vocabulary',
        label: 'Vocabulary',
        submissionTypes: ['vocab'],
    },
    {
        id: 'dialogues',
        label: 'Dialogues',
        submissionTypes: ['scene'],
    },
    {
        id: 'audio_speech',
        label: 'Audio / Speech',
        submissionTypes: ['speech'],
    },
    {
        id: 'free_writing',
        label: 'Free-writing',
        submissionTypes: ['story'],
    },
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
    WORD: 'Word of the Day',
    PHRASE: 'Phrase of the Day',
    STORY: 'One Minute Read',
    VOCAB_SET: 'Weekly Essential Vocab',
    CONVERSATION: 'Practical Conversations',
    PUZZLE: 'Daily Puzzle',
    SCENE: 'Explain the Scene',
    SPEECH: 'Famous Speeches',
    LYRICS: 'Song Lyrics',
    FEED: 'Instagram Feeds',
};

export function submissionMatchesTab(
    submission: SentenceSubmission,
    tabId: ValidationTabId
): boolean {
    const tab = VALIDATION_ACTIVITY_TABS.find((t) => t.id === tabId);
    if (!tab) return false;
    return tab.submissionTypes.includes(submission.submissionType);
}

export function getLinkedContentType(
    submission: SentenceSubmission
): string | undefined {
    const ref =
        submission.wordId ||
        submission.storyId ||
        submission.vocabSetId ||
        submission.sceneId ||
        submission.speechId;
    return ref?.type;
}

function contentLabel(submission: SentenceSubmission): string {
    const type = getLinkedContentType(submission);
    if (type && CONTENT_TYPE_LABELS[type]) return CONTENT_TYPE_LABELS[type];

    switch (submission.submissionType) {
        case 'sentence':
            return 'Sentence Practice';
        case 'story':
            return 'One Minute Read';
        case 'vocab':
            return 'Weekly Essential Vocab';
        case 'scene':
            return 'Explain the Scene';
        case 'speech':
            return 'Famous Speeches';
        default:
            return 'Activity';
    }
}

export function getActivityRowLabel(submission: SentenceSubmission): string {
    const ref =
        submission.wordId ||
        submission.storyId ||
        submission.vocabSetId ||
        submission.sceneId ||
        submission.speechId;
    const meta = ref?.metadata as Record<string, unknown> | undefined;
    const storyTitle = meta?.title ? String(meta.title).trim() : '';
    const listTitle = ref?.title?.trim() || '';
    const displayTitle = storyTitle || listTitle;

    const label = contentLabel(submission);
    if (displayTitle) return displayTitle;
    return label;
}

export function getOriginalReferenceText(submission: SentenceSubmission): string {
    const ref =
        submission.wordId ||
        submission.storyId ||
        submission.vocabSetId ||
        submission.sceneId ||
        submission.speechId;
    const meta = (ref?.metadata || {}) as Record<string, unknown>;

    if (submission.submissionType === 'sentence') {
        const text = String(meta.text ?? submission.word ?? '').trim();
        const meaning = String(meta.meaning_en ?? '').trim();
        if (text && meaning) return `${text} — ${meaning}`;
        return text || meaning || '—';
    }

    if (submission.submissionType === 'story') {
        const title = String(meta.title ?? ref?.title ?? '').trim();
        const excerpt = String(meta.text_content ?? '')
            .trim()
            .slice(0, 120);
        if (title && excerpt) return `${title}: ${excerpt}…`;
        return title || excerpt || '—';
    }

    if (submission.submissionType === 'vocab') {
        return String(meta.theme ?? ref?.title ?? '').trim() || '—';
    }

    if (submission.submissionType === 'scene') {
        return String(meta.explanation ?? '').trim().slice(0, 120) || '—';
    }

    if (submission.submissionType === 'speech') {
        const speaker = String(meta.speaker ?? '').trim();
        const transcript = String(meta.transcript ?? '')
            .trim()
            .slice(0, 100);
        if (speaker && transcript) return `${speaker}: ${transcript}…`;
        return speaker || transcript || '—';
    }

    return '—';
}

export function getUserPhone(submission: SentenceSubmission): string {
    const u = submission.userId;
    if (!u) return '—';
    return u.phoneNumber || u.mobile || '—';
}
