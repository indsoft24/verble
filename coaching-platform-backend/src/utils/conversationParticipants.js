/**
 * Resolve left/right participant labels from daily content metadata.
 */
export function getConversationParticipants(metadata = {}) {
    const meta = metadata && typeof metadata === 'object' ? metadata : {};
    const participants = meta.participants;
    const p1 = String(
        meta.participant1 || (Array.isArray(participants) ? participants[0] : '') || 'Speaker 1'
    ).trim();
    const p2 = String(
        meta.participant2 || (Array.isArray(participants) ? participants[1] : '') || 'Speaker 2'
    ).trim();
    return { participant1: p1 || 'Speaker 1', participant2: p2 || 'Speaker 2' };
}
