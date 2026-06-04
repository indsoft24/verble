import { toScheduleDateKey } from './scheduleDateUtils';
import type { DailyContent } from '../services/dailyContentService';
import { buildAutoDisplayTitle } from './dailyContentDisplayNumber';

/** Admin dropdown key (includes split puzzles). */
export type AdminContentTypeKey =
    | 'WORD'
    | 'PHRASE'
    | 'STORY'
    | 'VOCAB_SET'
    | 'CONVERSATION'
    | 'PUZZLE_SPOT'
    | 'PUZZLE_GRAMMAR'
    | 'SCENE'
    | 'SPEECH'
    | 'LYRICS'
    | 'FEED'
    | 'PROFESSIONAL_CONVERSATION';

export type ApiContentType = DailyContent['type'];
export type ContentLevel = DailyContent['level'];

export interface DailyContentCatalogEntry {
    adminKey: AdminContentTypeKey;
    label: string;
    apiType: ApiContentType;
    level: ContentLevel;
    puzzleType?: 'SPOT_CORRECT_SENTENCE' | 'GRAMMAR_FILL_BLANK';
    /** Shown on admin placeholder when empty */
    emptyHint: string;
}

/** Fixed order for admin UI and placeholder grid. */
export const DAILY_CONTENT_CATALOG: DailyContentCatalogEntry[] = [
    {
        adminKey: 'WORD',
        label: 'WORD OF THE DAY',
        apiType: 'WORD',
        level: 'FREE',
        emptyHint: 'No word scheduled for this date.',
    },
    {
        adminKey: 'PHRASE',
        label: 'PHRASE OF THE DAY',
        apiType: 'PHRASE',
        level: 'FREE',
        emptyHint: 'No phrase scheduled for this date.',
    },
    {
        adminKey: 'STORY',
        label: 'ONE MINUTE READ',
        apiType: 'STORY',
        level: 'BRONZE',
        emptyHint: 'No one-minute read for this date.',
    },
    {
        adminKey: 'VOCAB_SET',
        label: 'WEEKLY ESSENTIAL VOCAB',
        apiType: 'VOCAB_SET',
        level: 'BRONZE',
        emptyHint: 'No vocabulary set for this date.',
    },
    {
        adminKey: 'CONVERSATION',
        label: 'PRACTICAL CONVERSATIONS',
        apiType: 'CONVERSATION',
        level: 'SILVER',
        emptyHint: 'No practical conversation for this date.',
    },
    {
        adminKey: 'PUZZLE_SPOT',
        label: 'PUZZLE – SPOT CORRECT SENTENCE',
        apiType: 'PUZZLE',
        level: 'SILVER',
        puzzleType: 'SPOT_CORRECT_SENTENCE',
        emptyHint: 'No spot-the-sentence puzzle for this date.',
    },
    {
        adminKey: 'PUZZLE_GRAMMAR',
        label: 'PUZZLE – CORRECT FORM OF VERB',
        apiType: 'PUZZLE',
        level: 'SILVER',
        puzzleType: 'GRAMMAR_FILL_BLANK',
        emptyHint: 'No grammar puzzle for this date.',
    },
    {
        adminKey: 'SCENE',
        label: 'EXPLAIN THE SCENE',
        apiType: 'SCENE',
        level: 'GOLD',
        emptyHint: 'No scene explanation for this date.',
    },
    {
        adminKey: 'SPEECH',
        label: 'FAMOUS SPEECHES',
        apiType: 'SPEECH',
        level: 'GOLD',
        emptyHint: 'No famous speech for this date.',
    },
    {
        adminKey: 'LYRICS',
        label: 'SONG LYRICS',
        apiType: 'LYRICS',
        level: 'GOLD',
        emptyHint: 'No song lyrics for this date.',
    },
    {
        adminKey: 'FEED',
        label: 'INSTAGRAM FEEDS',
        apiType: 'FEED',
        level: 'GOLD',
        emptyHint: 'No Instagram feed for this date.',
    },
    {
        adminKey: 'PROFESSIONAL_CONVERSATION',
        label: 'PROFESSIONAL CONVERSATIONS',
        apiType: 'CONVERSATION',
        level: 'GOLD',
        emptyHint: 'No professional conversation in library yet.',
    },
];

export const LEVEL_CARD_COLORS: Record<
    ContentLevel,
    { backgroundColor: string; borderColor: string; color: string }
> = {
    FREE: { backgroundColor: '#e0f7fa', borderColor: '#14b8a6', color: '#0f766e' },
    BRONZE: { backgroundColor: '#fff7ed', borderColor: '#ea580c', color: '#c2410c' },
    SILVER: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' },
    GOLD: { backgroundColor: '#fefce8', borderColor: '#ca8a04', color: '#a16207' },
    FULL_COURSE: { backgroundColor: '#faf5ff', borderColor: '#7c3aed', color: '#5b21b6' },
    BONUS: { backgroundColor: '#f5f3ff', borderColor: '#7c3aed', color: '#5b21b6' },
};

export function getCatalogEntry(adminKey: AdminContentTypeKey): DailyContentCatalogEntry {
    return DAILY_CONTENT_CATALOG.find((e) => e.adminKey === adminKey) ?? DAILY_CONTENT_CATALOG[0];
}

export function resolveAdminKeyFromContent(item: DailyContent): AdminContentTypeKey {
    if (item.type === 'PUZZLE') {
        const pt = item.metadata?.puzzleType;
        return pt === 'GRAMMAR_FILL_BLANK' ? 'PUZZLE_GRAMMAR' : 'PUZZLE_SPOT';
    }
    if (item.type === 'CONVERSATION' && item.level === 'GOLD') {
        return 'PROFESSIONAL_CONVERSATION';
    }
    return item.type as AdminContentTypeKey;
}

export function contentMatchesCatalogSlot(
    item: DailyContent,
    slot: DailyContentCatalogEntry
): boolean {
    if (item.type !== slot.apiType || item.level !== slot.level) return false;
    if (slot.puzzleType) {
        return item.metadata?.puzzleType === slot.puzzleType;
    }
    if (slot.adminKey === 'CONVERSATION') {
        return item.level === 'SILVER';
    }
    if (slot.adminKey === 'PROFESSIONAL_CONVERSATION') {
        return item.level === 'GOLD';
    }
    return true;
}

function truncatePreview(text: string, max = 100): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max).trim()}…`;
}

/** Primary learner-facing text for admin lists (word, phrase, story excerpt, etc.). */
export function getAdminContentPreview(item: DailyContent): string {
    const meta = (item.metadata || {}) as Record<string, unknown>;
    const adminKey = resolveAdminKeyFromContent(item);

    switch (item.type) {
        case 'WORD':
        case 'PHRASE': {
            const text = String(meta.text || '').trim();
            const meaning = String(meta.meaning_en || meta.meaning_hi || '').trim();
            if (text && meaning) return `${text} — ${truncatePreview(meaning, 60)}`;
            return text || meaning || getAdminCardDisplayTitle(item);
        }
        case 'STORY': {
            const headline = String(meta.title || item.title || '').trim();
            const body = String(meta.text_content || '').trim();
            if (headline) return truncatePreview(headline, 100);
            return truncatePreview(body, 100) || getAdminCardDisplayTitle(item);
        }
        case 'VOCAB_SET': {
            const theme = String(meta.theme || '').trim();
            const vocabItems = (meta.vocabItems as Array<{ word?: string }>) || [];
            const words = vocabItems
                .map((v) => String(v?.word || '').trim())
                .filter(Boolean)
                .slice(0, 5);
            if (theme && words.length) return `${theme}: ${words.join(', ')}`;
            return theme || words.join(', ') || getAdminCardDisplayTitle(item);
        }
        case 'CONVERSATION': {
            if (adminKey === 'PROFESSIONAL_CONVERSATION') {
                const topic = String(meta.topicName || '').trim();
                const desc = String(meta.description || '').trim();
                if (topic && desc) return `${topic} — ${truncatePreview(desc, 55)}`;
                return topic || truncatePreview(desc, 90) || getAdminCardDisplayTitle(item);
            }
            const scenario = String(meta.scenarioTitle || item.title || '').trim();
            const dialogue = (meta.dialogue as Array<{ text_en?: string }>) || [];
            const firstLine = dialogue.map((d) => String(d?.text_en || '').trim()).find(Boolean);
            if (scenario && firstLine) return `${scenario} — ${truncatePreview(firstLine, 50)}`;
            return scenario || firstLine || getAdminCardDisplayTitle(item);
        }
        case 'PUZZLE': {
            const questions = (meta.questions as Array<{ question?: string }>) || [];
            const first = questions.map((q) => String(q?.question || '').trim()).find(Boolean);
            return first ? truncatePreview(first, 100) : getAdminCardDisplayTitle(item);
        }
        case 'SCENE': {
            const title = String(meta.title || item.title || '').trim();
            const explanation = String(meta.explanation || meta.hindiSummary || '').trim();
            if (title && explanation) return `${title} — ${truncatePreview(explanation, 50)}`;
            return title || truncatePreview(explanation, 100) || getAdminCardDisplayTitle(item);
        }
        case 'SPEECH': {
            const speaker = String(meta.speaker || '').trim();
            const transcript = String(meta.transcript || '').trim();
            if (speaker && transcript) return `${speaker}: ${truncatePreview(transcript, 70)}`;
            return speaker || truncatePreview(transcript, 90) || getAdminCardDisplayTitle(item);
        }
        case 'LYRICS': {
            const artist = String(meta.artist || '').trim();
            const lyrics = String(meta.lyrics || '').trim();
            const firstLine = lyrics.split('\n').map((l) => l.trim()).find(Boolean) || '';
            if (artist && firstLine) return `${artist} — ${truncatePreview(firstLine, 60)}`;
            return artist || truncatePreview(lyrics, 90) || getAdminCardDisplayTitle(item);
        }
        case 'FEED': {
            const posts = (meta.posts as Array<{ caption?: string }>) || [];
            const caption = posts.map((p) => String(p?.caption || '').trim()).find(Boolean);
            return caption ? truncatePreview(caption, 100) : getAdminCardDisplayTitle(item);
        }
        default:
            return getAdminCardDisplayTitle(item);
    }
}

export function getAdminCardDisplayTitle(item: DailyContent): string {
    if (item.type === 'STORY') {
        const storyTitle = String(item.metadata?.title ?? '').trim();
        if (storyTitle) return storyTitle;
    }
    if (item.title?.trim()) return item.title.trim();
    if (item.sequenceNumber) {
        const auto = buildAutoDisplayTitle(item.type, item.sequenceNumber, item.metadata);
        if (auto) return auto;
    }
    const slot = DAILY_CONTENT_CATALOG.find((s) => contentMatchesCatalogSlot(item, s));
    return slot?.label ?? item.type;
}

export function levelForAdminKey(adminKey: AdminContentTypeKey): ContentLevel {
    return getCatalogEntry(adminKey).level;
}

export function apiTypeForAdminKey(adminKey: AdminContentTypeKey): ApiContentType {
    return getCatalogEntry(adminKey).apiType;
}

/** Find scheduled item for a catalog slot on a given yyyy-MM-dd day. */
export function findContentForSlot(
    items: DailyContent[],
    dateKey: string,
    slot: DailyContentCatalogEntry
): DailyContent | undefined {
    return items.find(
        (c) => toScheduleDateKey(c.date) === dateKey && contentMatchesCatalogSlot(c, slot)
    );
}

/** True when another item (not excludeId) already occupies this catalog slot on dateKey. */
export function findSlotConflictOnDate(
    items: DailyContent[],
    dateKey: string,
    adminKey: AdminContentTypeKey,
    excludeId?: string
): DailyContent | undefined {
    const slot = getCatalogEntry(adminKey);
    const existing = findContentForSlot(items, dateKey, slot);
    if (!existing) return undefined;
    if (excludeId && existing._id === excludeId) return undefined;
    return existing;
}
