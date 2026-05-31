/** Explain the Scene — learners submit 2–5 summaries; admin scores once (0–50). */

export const SCENE_MIN_SUMMARIES = 2;
export const SCENE_MAX_SUMMARIES = 5;
export const SCENE_MAX_EVALUATION_SCORE = 50;

export function formatSceneSummariesForAdmin(summaries: string[] | undefined): string {
    if (!summaries?.length) return '—';
    return summaries
        .map((text, i) => `${i + 1}. ${text.trim()}`)
        .filter((line) => line.length > 2)
        .join('\n\n');
}

export function getSceneSubmissionSummaries(submission: {
    summaries?: string[];
    sentences?: unknown;
    description?: string;
}): string[] {
    if (Array.isArray(submission.summaries) && submission.summaries.length > 0) {
        return submission.summaries.map((s) => String(s ?? '').trim()).filter(Boolean);
    }
    if (Array.isArray(submission.sentences) && submission.sentences.length > 0) {
        return submission.sentences
            .map((s) => {
                if (typeof s === 'string') return s.trim();
                if (s && typeof s === 'object' && 'sentence' in s) {
                    return String((s as { sentence?: string }).sentence ?? '').trim();
                }
                return '';
            })
            .filter(Boolean);
    }
    const legacy = submission.description?.trim();
    return legacy ? [legacy] : [];
}

export function countFilledSummaries(drafts: string[]): number {
    return drafts.map((s) => s.trim()).filter(Boolean).length;
}

export function isSceneSubmissionReady(drafts: string[]): boolean {
    const n = countFilledSummaries(drafts);
    return n >= SCENE_MIN_SUMMARIES && n <= SCENE_MAX_SUMMARIES;
}
