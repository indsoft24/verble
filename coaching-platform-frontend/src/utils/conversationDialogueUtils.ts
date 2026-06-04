export interface DialogueLine {
    speaker: string;
    text_en: string;
    text_hi: string;
    audio?: string;
}

const GENERIC_SPEAKER_RE = /^speaker\s*[12]$/i;

export function isGenericSpeakerPlaceholder(name: string): boolean {
    const n = String(name ?? '').trim();
    return !n || GENERIC_SPEAKER_RE.test(n);
}

/** Unique speaker names in dialogue order (first appearance). */
export function getUniqueSpeakersFromDialogue(dialogue: DialogueLine[]): string[] {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const line of dialogue) {
        const s = String(line.speaker ?? '').trim();
        if (!s) continue;
        const key = s.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            order.push(s);
        }
    }
    return order;
}

export function getConversationParticipants(metadata: Record<string, unknown>): {
    participant1: string;
    participant2: string;
} {
    const { participant1, participant2 } = resolveConversationParticipants(metadata);
    return { participant1, participant2 };
}

/**
 * Resolve display names for chat alignment: metadata participants, else first two dialogue speakers.
 */
export function resolveConversationParticipants(
    metadata: Record<string, unknown>,
    dialogue?: DialogueLine[]
): {
    participant1: string;
    participant2: string;
    speakers: string[];
} {
    const fromDialogue = dialogue ? getUniqueSpeakersFromDialogue(dialogue) : [];
    const participants = metadata.participants as string[] | undefined;
    let p1 = String(
        metadata.participant1 || (Array.isArray(participants) ? participants[0] : '') || ''
    ).trim();
    let p2 = String(
        metadata.participant2 || (Array.isArray(participants) ? participants[1] : '') || ''
    ).trim();

    if ((isGenericSpeakerPlaceholder(p1) || isGenericSpeakerPlaceholder(p2)) && fromDialogue.length > 0) {
        p1 = fromDialogue[0];
        p2 = fromDialogue[1] ?? fromDialogue[0];
    }
    if (!p1 && fromDialogue[0]) p1 = fromDialogue[0];
    if (!p2 && fromDialogue[1]) p2 = fromDialogue[1];

    const speakers =
        fromDialogue.length > 0
            ? fromDialogue
            : [p1, p2].filter((n) => n && !isGenericSpeakerPlaceholder(n));

    return {
        participant1: p1 || 'Speaker 1',
        participant2: p2 || 'Speaker 2',
        speakers,
    };
}

/** Label shown above a dialogue line (never a generic placeholder when the line has a name). */
export function getLineSpeakerLabel(
    line: DialogueLine,
    participant1: string,
    participant2: string,
    isUserSide: boolean
): string {
    const fromLine = String(line.speaker ?? '').trim();
    if (fromLine && !isGenericSpeakerPlaceholder(fromLine)) return fromLine;
    return isUserSide ? participant2 : participant1;
}

/** Repair rows where English was pasted into the speaker field by mistake. */
export function repairDialogueLine(
    line: Partial<DialogueLine>,
    participant1: string,
    participant2: string
): DialogueLine {
    const p1 = participant1.trim();
    const p2 = participant2.trim();
    let speaker = String(line.speaker ?? '').trim();
    let text_en = String(line.text_en ?? '').trim();
    const text_hi = String(line.text_hi ?? '').trim();
    const audio = line.audio;

    const isKnownSpeaker = (name: string) => {
        const n = name.toLowerCase();
        return n === p1.toLowerCase() || n === p2.toLowerCase();
    };

    if (!text_en && speaker && !isKnownSpeaker(speaker)) {
        text_en = speaker;
        speaker = p2 || p1;
    }

    if (!speaker) {
        speaker = p1;
    }

    return {
        speaker,
        text_en,
        text_hi,
        ...(audio ? { audio } : {}),
    };
}

export function normalizeDialogue(
    raw: unknown,
    participant1: string,
    participant2: string
): DialogueLine[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) =>
            repairDialogueLine(
                item as Partial<DialogueLine>,
                participant1,
                participant2
            )
        )
        .filter((line) => line.text_en || line.text_hi);
}

export function getSpeakerSideIndex(speaker: string, speakers: string[]): number {
    const s = speaker.trim().toLowerCase();
    if (!s) return 0;
    return speakers.findIndex((name) => name.trim().toLowerCase() === s);
}

/** True when the line should render on the right (second distinct speaker in chat layout). */
export function isRightSideSpeaker(
    speaker: string,
    participant1: string,
    participant2: string,
    speakers: string[]
): boolean {
    if (speakers.length >= 2) {
        const idx = getSpeakerSideIndex(speaker, speakers);
        if (idx >= 0) return idx % 2 === 1;
    }
    return isParticipant2Speaker(speaker, participant1, participant2);
}

export function isParticipant2Speaker(
    speaker: string,
    participant1: string,
    participant2: string
): boolean {
    const s = speaker.trim().toLowerCase();
    const p2 = participant2.trim().toLowerCase();
    const p1 = participant1.trim().toLowerCase();
    if (s === p2) return true;
    if (s === p1) return false;
    const userAliases = ['you', 'customer', 'student', 'learner', 'मैं', 'आप'];
    return userAliases.includes(s);
}
