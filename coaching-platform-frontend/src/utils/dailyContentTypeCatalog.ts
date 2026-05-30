import { format, parseISO } from 'date-fns';
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
        (c) => format(parseISO(c.date), 'yyyy-MM-dd') === dateKey && contentMatchesCatalogSlot(c, slot)
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
