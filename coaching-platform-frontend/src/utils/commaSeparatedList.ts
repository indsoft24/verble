export type ParseCommaSeparatedOptions = {
    /** Drop empty segments after trim (default true) */
    omitEmpty?: boolean;
    /** Deduplicate entries (default true) */
    dedupe?: boolean;
    /** Case-insensitive dedupe (default true; use false for IDs) */
    dedupeCaseInsensitive?: boolean;
};

/**
 * Parse comma- or semicolon-separated text into a list.
 * Use with a separate display string while typing so trailing commas are preserved.
 */
export function parseCommaSeparatedList(
    raw: string,
    options: ParseCommaSeparatedOptions = {}
): string[] {
    const { omitEmpty = true, dedupe = true, dedupeCaseInsensitive = true } = options;
    const seen = new Set<string>();
    const items: string[] = [];

    for (const part of raw.split(/[,;]+/)) {
        const item = part.trim();
        if (omitEmpty && !item) continue;
        if (dedupe) {
            const key = dedupeCaseInsensitive ? item.toLowerCase() : item;
            if (seen.has(key)) continue;
            seen.add(key);
        }
        items.push(item);
    }

    return items;
}

export function formatCommaSeparatedList(items: string[] | undefined | null): string {
    return (items || []).filter((item) => item != null && String(item).trim() !== '').join(', ');
}
