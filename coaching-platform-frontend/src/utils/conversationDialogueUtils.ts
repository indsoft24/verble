export interface DialogueLine {
    speaker: string;
    text_en: string;
    text_hi: string;
    audio?: string;
}

export function getConversationParticipants(metadata: Record<string, unknown>): {
    participant1: string;
    participant2: string;
} {
    const participants = metadata.participants as string[] | undefined;
    const p1 = String(
        metadata.participant1 || (Array.isArray(participants) ? participants[0] : '') || 'Speaker 1'
    ).trim();
    const p2 = String(
        metadata.participant2 || (Array.isArray(participants) ? participants[1] : '') || 'Speaker 2'
    ).trim();
    return { participant1: p1 || 'Speaker 1', participant2: p2 || 'Speaker 2' };
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
