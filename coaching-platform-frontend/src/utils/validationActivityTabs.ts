import type { SentenceSubmission } from '../services/sentenceValidationService';
import { TIER_COLORS } from '../components/dashboard/DashboardActivitiesPanel';

export type ValidationTabId = 'free' | 'bronze' | 'silver' | 'gold';

export type SubmissionType = SentenceSubmission['submissionType'];

export type ContentPlanLevel = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface ValidationPlanTab {
    id: ValidationTabId;
    label: string;
    /** Daily content `level` values included in this tab (BONUS counts as Gold). */
    planLevels: ContentPlanLevel[];
    accentColor: string;
}

/** Tabs aligned with subscription tiers on the learner dashboard. */
export const VALIDATION_PLAN_TABS: ValidationPlanTab[] = [
    { id: 'free', label: 'Free', planLevels: ['FREE'], accentColor: TIER_COLORS.FREE },
    { id: 'bronze', label: 'Bronze', planLevels: ['BRONZE'], accentColor: TIER_COLORS.BRONZE },
    { id: 'silver', label: 'Silver', planLevels: ['SILVER'], accentColor: TIER_COLORS.SILVER },
    { id: 'gold', label: 'Gold', planLevels: ['GOLD'], accentColor: TIER_COLORS.GOLD },
];

/** @deprecated Use VALIDATION_PLAN_TABS */
export const VALIDATION_ACTIVITY_TABS = VALIDATION_PLAN_TABS;

const SUBMISSION_TYPE_DEFAULT_LEVEL: Record<SubmissionType, ContentPlanLevel> = {
    sentence: 'FREE',
    story: 'BRONZE',
    vocab: 'BRONZE',
    scene: 'GOLD',
    speech: 'GOLD',
};

export function getLinkedContentRef(submission: SentenceSubmission) {
    return (
        submission.wordId ||
        submission.storyId ||
        submission.vocabSetId ||
        submission.sceneId ||
        submission.speechId
    );
}

/** Resolve plan tier from linked daily content (or submission type fallback). */
export function getSubmissionPlanLevel(submission: SentenceSubmission): ContentPlanLevel {
    const ref = getLinkedContentRef(submission);
    const raw = ref?.level ? String(ref.level).toUpperCase() : '';
    if (raw === 'BONUS') return 'GOLD';
    if (raw === 'FREE' || raw === 'BRONZE' || raw === 'SILVER' || raw === 'GOLD') {
        return raw;
    }
    return SUBMISSION_TYPE_DEFAULT_LEVEL[submission.submissionType] ?? 'FREE';
}

export function submissionMatchesTab(
    submission: SentenceSubmission,
    tabId: ValidationTabId
): boolean {
    const tab = VALIDATION_PLAN_TABS.find((t) => t.id === tabId);
    if (!tab) return false;
    const level = getSubmissionPlanLevel(submission);
    return tab.planLevels.includes(level);
}

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

export function getLinkedContentType(
    submission: SentenceSubmission
): string | undefined {
    return getLinkedContentRef(submission)?.type;
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
    const ref = getLinkedContentRef(submission);
    const meta = ref?.metadata as Record<string, unknown> | undefined;
    const storyTitle = meta?.title ? String(meta.title).trim() : '';
    const listTitle = ref?.title?.trim() || '';
    const displayTitle = storyTitle || listTitle;

    const label = contentLabel(submission);
    if (displayTitle) return displayTitle;
    return label;
}

export function getContentTypeLabel(submission: SentenceSubmission): string {
    const type = getLinkedContentType(submission);
    if (type && CONTENT_TYPE_LABELS[type]) return CONTENT_TYPE_LABELS[type];
    return contentLabel(submission);
}

export interface ValidationContentDetailLine {
    label: string;
    value: string;
}

/** Full prompt/context for admin review (table + dialog). */
export function getValidationContentDetails(
    submission: SentenceSubmission
): ValidationContentDetailLine[] {
    const ref = getLinkedContentRef(submission);
    const meta = (ref?.metadata || {}) as Record<string, unknown>;
    const lines: ValidationContentDetailLine[] = [];

    lines.push({ label: 'Activity type', value: getContentTypeLabel(submission) });

    if (ref?.title?.trim()) {
        lines.push({ label: 'Title', value: ref.title.trim() });
    }

    if (submission.submissionType === 'sentence') {
        const text = String(meta.text ?? submission.word ?? '').trim();
        const meaningEn = String(meta.meaning_en ?? '').trim();
        const meaningHi = String(meta.meaning_hi ?? '').trim();
        const pos = String(meta.part_of_speech ?? '').trim();
        if (text) lines.push({ label: 'Word / phrase', value: text });
        if (meaningEn) lines.push({ label: 'English meaning', value: meaningEn });
        if (meaningHi) lines.push({ label: 'Hindi meaning', value: meaningHi });
        if (pos) lines.push({ label: 'Part of speech', value: pos });
        const examples = meta.examples as { en?: string; hi?: string }[] | undefined;
        if (Array.isArray(examples) && examples.length > 0) {
            const exText = examples
                .map((ex, i) => {
                    const en = String(ex.en ?? '').trim();
                    const hi = String(ex.hi ?? '').trim();
                    if (en && hi) return `${i + 1}. ${en} — ${hi}`;
                    return en || hi ? `${i + 1}. ${en || hi}` : '';
                })
                .filter(Boolean)
                .join('\n');
            if (exText) lines.push({ label: 'Examples', value: exText });
        }
        return lines;
    }

    if (submission.submissionType === 'story') {
        const storyTitle = String(meta.title ?? '').trim();
        const body = String(meta.text_content ?? '').trim();
        if (storyTitle) lines.push({ label: 'Story title', value: storyTitle });
        if (body) lines.push({ label: 'Story text', value: body });
        return lines;
    }

    if (submission.submissionType === 'vocab') {
        const theme = String(meta.theme ?? '').trim();
        if (theme) lines.push({ label: 'Theme', value: theme });
        const items = meta.vocabItems as {
            word?: string;
            pronunciation_hi?: string;
            meaning_hi?: string;
            meaning_en?: string;
        }[] | undefined;
        if (Array.isArray(items) && items.length > 0) {
            const vocabList = items
                .map((v, i) => {
                    const w = String(v.word ?? '').trim();
                    const pron = String(v.pronunciation_hi ?? '').trim();
                    const hi = String(v.meaning_hi ?? '').trim();
                    const en = String(v.meaning_en ?? '').trim();
                    if (!w) return '';
                    const parts = [w];
                    if (pron) parts.push(pron);
                    if (hi) parts.push(hi);
                    else if (en) parts.push(en);
                    return `${i + 1}. ${parts.join(' — ')}`;
                })
                .filter(Boolean)
                .join('\n');
            if (vocabList) lines.push({ label: 'Vocabulary list', value: vocabList });
        }
        return lines;
    }

    if (submission.submissionType === 'scene') {
        const headline = String(meta.title ?? ref?.title ?? '').trim();
        const explanation = String(meta.explanation ?? '').trim();
        if (headline) lines.push({ label: 'Headline', value: headline });
        if (explanation) lines.push({ label: 'Scene / prompt', value: explanation });
        const prompt = String(meta.submissionPrompt ?? '').trim();
        if (prompt) lines.push({ label: 'Learner instructions', value: prompt });
        const keywords = meta.keywords as { word?: string }[] | undefined;
        if (Array.isArray(keywords) && keywords.length > 0) {
            const kw = keywords.map((k) => String(k.word ?? '').trim()).filter(Boolean).join(', ');
            if (kw) lines.push({ label: 'Keywords', value: kw });
        }
        return lines;
    }

    if (submission.submissionType === 'speech') {
        const speaker = String(meta.speaker ?? '').trim();
        const transcript = String(meta.transcript ?? '').trim();
        if (speaker) lines.push({ label: 'Speaker', value: speaker });
        if (transcript) lines.push({ label: 'Speech excerpt', value: transcript });
        return lines;
    }

    return lines;
}

export function getOriginalReferenceText(submission: SentenceSubmission): string {
    const ref = getLinkedContentRef(submission);
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
