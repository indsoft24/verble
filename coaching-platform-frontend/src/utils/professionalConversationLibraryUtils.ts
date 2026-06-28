import type { DailyContent } from '../services/dailyContentService';

export const UNTAGGED_BUCKET = 'General';

export function sortConversationsForTag(items: DailyContent[]): DailyContent[] {
    return [...items].sort((a, b) => {
        const seqA = a.sequenceNumber ?? 0;
        const seqB = b.sequenceNumber ?? 0;
        if (seqA !== seqB) return seqA - seqB;
        return a.title.localeCompare(b.title);
    });
}

export function getConversationTags(conv: DailyContent): string[] {
    const tags = conv.metadata?.tags;
    if (!Array.isArray(tags) || tags.length === 0) return [];
    return tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '');
}

/** Unique sorted tag labels from professional conversation library entries. */
export function collectProfessionalConversationTagOptions(conversations: DailyContent[]): string[] {
    const seen = new Map<string, string>();
    for (const conv of conversations) {
        const isProfessional =
            conv.metadata?.isProfessionalLibrary === true || conv.level === 'GOLD';
        if (!isProfessional) continue;
        for (const tag of getConversationTags(conv)) {
            const trimmed = tag.trim();
            const key = trimmed.toLowerCase();
            if (trimmed && !seen.has(key)) {
                seen.set(key, trimmed);
            }
        }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export interface ProfessionalTagIndex {
    sortedTags: string[];
    byTag: Map<string, DailyContent[]>;
}

export function buildTagIndex(conversations: DailyContent[]): ProfessionalTagIndex {
    const byTag = new Map<string, DailyContent[]>();
    const taggedIds = new Set<string>();

    for (const conv of conversations) {
        const tags = getConversationTags(conv);
        if (tags.length === 0) {
            continue;
        }
        taggedIds.add(conv._id);
        for (const tag of tags) {
            const list = byTag.get(tag) ?? [];
            list.push(conv);
            byTag.set(tag, list);
        }
    }

    const untagged = conversations.filter((c) => !taggedIds.has(c._id));
    if (untagged.length > 0) {
        byTag.set(UNTAGGED_BUCKET, untagged);
    }

    for (const [tag, list] of byTag.entries()) {
        byTag.set(tag, sortConversationsForTag(list));
    }

    const sortedTags = Array.from(byTag.keys()).sort((a, b) => a.localeCompare(b));
    return { sortedTags, byTag };
}

export function getAdjacentTag(
    sortedTags: string[],
    currentTag: string,
    direction: 'prev' | 'next'
): string | null {
    const idx = sortedTags.indexOf(currentTag);
    if (idx < 0) return null;
    const nextIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= sortedTags.length) return null;
    return sortedTags[nextIdx] ?? null;
}

export function getConversationIndex(list: DailyContent[], id: string): number {
    return list.findIndex((c) => c._id === id);
}

export function getAdjacentConversation(
    list: DailyContent[],
    currentId: string,
    direction: 'prev' | 'next'
): DailyContent | null {
    const idx = getConversationIndex(list, currentId);
    if (idx < 0) return null;
    const nextIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= list.length) return null;
    return list[nextIdx] ?? null;
}
