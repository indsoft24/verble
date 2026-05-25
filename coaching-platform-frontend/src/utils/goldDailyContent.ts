import type { DailyContent } from '../services/dailyContentService';

/** Content types shown in the Gold / Premium dashboard section. */
export const GOLD_MEDIA_TYPES = ['SCENE', 'SPEECH', 'LYRICS', 'FEED'] as const;
export type GoldMediaType = (typeof GOLD_MEDIA_TYPES)[number];

export const GOLD_MEDIA_LEVELS = ['GOLD', 'BONUS'] as const;

export function isGoldMediaType(type: string): type is GoldMediaType {
    return (GOLD_MEDIA_TYPES as readonly string[]).includes(type);
}

export function isGoldMediaLevel(level: string): boolean {
    return (GOLD_MEDIA_LEVELS as readonly string[]).includes(level);
}

/** Today's scheduled item for a Gold media type (GOLD before BONUS). */
export function findTodaysGoldMedia(
    items: DailyContent[],
    type: GoldMediaType
): DailyContent | undefined {
    const matches = items.filter((c) => c.type === type && isGoldMediaLevel(c.level));
    return (
        matches.find((c) => c.level === 'GOLD') ??
        matches.find((c) => c.level === 'BONUS')
    );
}
