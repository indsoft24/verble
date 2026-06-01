import type { SentenceSubmission } from '../services/sentenceValidationService';

export function formatConversationSubmissionPlain(
    exchanges: Array<{ participant1Line?: string; participant2Line?: string }> | undefined,
    participant1 = 'Speaker 1',
    participant2 = 'Speaker 2'
): string {
    if (!exchanges?.length) return '';
    return exchanges
        .map((row, i) => {
            const p1 = String(row.participant1Line ?? '').trim();
            const p2 = String(row.participant2Line ?? '').trim();
            return `${i + 1}. ${participant1}: ${p1}\n   ${participant2}: ${p2}`;
        })
        .join('\n\n');
}

export function formatConversationSubmissionFromRecord(submission: SentenceSubmission): string {
    const p1 = submission.participant1 || 'Speaker 1';
    const p2 = submission.participant2 || 'Speaker 2';
    return formatConversationSubmissionPlain(submission.exchanges, p1, p2);
}
