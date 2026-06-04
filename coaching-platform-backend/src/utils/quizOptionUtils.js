/** @param {unknown} text */
export const isFilledOption = (text) => String(text ?? '').trim().length > 0;

/** @param {unknown[] | undefined} options */
export const getFilledOptionEntries = (options) =>
    (options ?? [])
        .map((raw, index) => ({ text: String(raw ?? '').trim(), index }))
        .filter((entry) => entry.text.length > 0);

/** @param {unknown[] | undefined} options @param {number} index */
export const getOptionLabelAt = (options, index) => {
    if (index == null || index < 0) return '';
    const raw = options?.[index];
    return isFilledOption(raw) ? String(raw).trim() : '';
};

/** @param {unknown[] | undefined} options @param {number} selectedIndex */
export const isValidFilledSelection = (options, selectedIndex) => {
    if (typeof selectedIndex !== 'number' || selectedIndex < 0) return false;
    if (selectedIndex >= (options?.length ?? 0)) return false;
    return isFilledOption(options[selectedIndex]);
};
