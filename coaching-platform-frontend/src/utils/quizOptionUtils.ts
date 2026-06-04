export type FilledOptionEntry = {
    text: string;
    /** Original index in the stored options array */
    index: number;
};

export const isFilledOption = (text: unknown): boolean => String(text ?? '').trim().length > 0;

export const getFilledOptionEntries = (options: unknown[] | undefined): FilledOptionEntry[] =>
    (options ?? [])
        .map((raw, index) => ({ text: String(raw ?? '').trim(), index }))
        .filter((entry) => entry.text.length > 0);

/**
 * Compact options for persistence: only filled strings, correct index remapped.
 */
export const normalizeQuestionOptions = (
    options: unknown[] | undefined,
    correctIndex: number
): { options: string[]; correctIndex: number } => {
    const filled = getFilledOptionEntries(options);
    if (filled.length === 0) {
        return { options: [], correctIndex: 0 };
    }
    const remappedCorrect = filled.findIndex((entry) => entry.index === correctIndex);
    return {
        options: filled.map((entry) => entry.text),
        correctIndex: remappedCorrect >= 0 ? remappedCorrect : 0,
    };
};

/** Resolve label for a stored index; returns empty string if slot was blank. */
export const getOptionLabelAt = (options: unknown[] | undefined, index: number | null | undefined): string => {
    if (index == null || index < 0) return '';
    const raw = options?.[index];
    return isFilledOption(raw) ? String(raw).trim() : '';
};
