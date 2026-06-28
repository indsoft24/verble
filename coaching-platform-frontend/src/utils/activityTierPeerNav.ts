import type { NavFooterSlot } from '../components/features/ActivityTierNavFooter';
import type { DailyContent } from '../services/dailyContentService';

export type ActivityKind =
    | 'word'
    | 'phrase'
    | 'story'
    | 'vocab'
    | 'conversation'
    | 'puzzle_spot'
    | 'puzzle_grammar'
    | 'scene'
    | 'speech'
    | 'lyrics'
    | 'feed';

export const SILVER_PEER_CYCLE = ['conversation', 'puzzle_spot', 'puzzle_grammar'] as const;
export const GOLD_MEDIA_PEER_CYCLE = ['speech', 'lyrics', 'feed'] as const;

export type SilverPeerKind = (typeof SILVER_PEER_CYCLE)[number];
export type GoldMediaPeerKind = (typeof GOLD_MEDIA_PEER_CYCLE)[number];

const PEER_NAV_LABELS: Record<SilverPeerKind | GoldMediaPeerKind, string> = {
    conversation: '→ Spot the Sentence',
    puzzle_spot: '→ Grammar Puzzle',
    puzzle_grammar: '→ Practical Conversations',
    speech: '→ Song Lyrics',
    lyrics: '→ Instagram Feeds',
    feed: '→ Famous Speeches',
};

const SEQUENTIAL_LABELS: Partial<Record<ActivityKind, { prev: string; next: string }>> = {
    conversation: { prev: 'Previous Conversation', next: 'Next Conversation' },
    puzzle_spot: { prev: 'Previous Puzzle', next: 'Next Puzzle' },
    puzzle_grammar: { prev: 'Previous Puzzle', next: 'Next Puzzle' },
    speech: { prev: 'Previous Speech', next: 'Next Speech' },
    lyrics: { prev: 'Previous Lyrics', next: 'Next Lyrics' },
    feed: { prev: 'Previous Feed', next: 'Next Feed' },
};

export function getNextPeerInCycle<T extends string>(current: T, cycle: readonly T[]): T {
    const idx = cycle.indexOf(current);
    if (idx < 0) return cycle[0];
    return cycle[(idx + 1) % cycle.length];
}

export function getPeerNavLabel(kind: SilverPeerKind | GoldMediaPeerKind): string {
    return PEER_NAV_LABELS[kind];
}

export function buildPeerCenterSlot(
    kind: ActivityKind,
    contents: Partial<Record<ActivityKind, DailyContent | undefined>>,
    openLinked: (content: DailyContent, peerKind: ActivityKind) => void
): NavFooterSlot | undefined {
    let nextKind: ActivityKind | undefined;
    if (SILVER_PEER_CYCLE.includes(kind as SilverPeerKind)) {
        nextKind = getNextPeerInCycle(kind as SilverPeerKind, SILVER_PEER_CYCLE);
    } else if (GOLD_MEDIA_PEER_CYCLE.includes(kind as GoldMediaPeerKind)) {
        nextKind = getNextPeerInCycle(kind as GoldMediaPeerKind, GOLD_MEDIA_PEER_CYCLE);
    } else {
        return undefined;
    }

    const content = contents[nextKind];
    const label = getPeerNavLabel(kind as SilverPeerKind | GoldMediaPeerKind);

    return {
        label,
        onClick: content ? () => openLinked(content, nextKind!) : undefined,
        disabled: !content,
    };
}

export interface TierNavSequentialInput {
    kind: ActivityKind;
    hasPrevious: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    loading?: boolean;
}

export interface TierNavBuildInput {
    kind: ActivityKind;
    contents: Partial<Record<ActivityKind, DailyContent | undefined>>;
    openLinked: (content: DailyContent, peerKind: ActivityKind) => void;
    sequential?: TierNavSequentialInput;
}

export function buildTierNavSlots(input: TierNavBuildInput): {
    left?: NavFooterSlot;
    center?: NavFooterSlot;
    right?: NavFooterSlot;
} {
    const center = buildPeerCenterSlot(input.kind, input.contents, input.openLinked);
    const seq = input.sequential;
    const labels = SEQUENTIAL_LABELS[seq?.kind ?? input.kind];

    if (!seq || !labels) {
        return { center };
    }

    return {
        left: {
            label: labels.prev,
            onClick: seq.onPrev,
            disabled: !seq.hasPrevious,
            loading: seq.loading,
        },
        center,
        right: {
            label: labels.next,
            onClick: seq.onNext,
            disabled: !seq.hasNext,
            loading: seq.loading,
        },
    };
}
