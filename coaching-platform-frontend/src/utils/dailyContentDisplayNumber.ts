/**
 * Learner-facing display numbers (#1111, #1112, …).
 * Must stay in sync with coaching-platform-backend/src/utils/dailyContentLevels.js
 */
export const DISPLAY_NUMBER_BASE = 1110;

export function getDisplayTag(sequenceNumber?: number): string {
    if (!sequenceNumber || sequenceNumber < 1) return '';
    return `#${DISPLAY_NUMBER_BASE + sequenceNumber}`;
}

/** Mirrors backend buildAutoTitle — auto title when admin leaves title blank. */
export function buildAutoDisplayTitle(
    type: string,
    sequenceNumber?: number,
    metadata?: Record<string, unknown>
): string {
    if (!sequenceNumber || sequenceNumber < 1) return '';
    const tag = getDisplayTag(sequenceNumber);
    if (type === 'PUZZLE') {
        return metadata?.puzzleType === 'GRAMMAR_FILL_BLANK'
            ? `${tag} Grammar Puzzle`
            : `${tag} Spot Puzzle`;
    }
    return tag;
}

/** @deprecated Use getDisplayTag — kept for existing imports */
export const WORD_DISPLAY_NUMBER_BASE = DISPLAY_NUMBER_BASE + 1;

export function getWordDisplayNumber(sequenceNumber?: number): string {
    const tag = getDisplayTag(sequenceNumber);
    return tag || `#${DISPLAY_NUMBER_BASE + 1}`;
}
