import { format, parse, parseISO, isValid } from 'date-fns';

const SCHEDULE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Calendar day key (yyyy-MM-dd) from stored schedule date — avoids UTC display drift. */
export function toScheduleDateKey(value: string | Date): string {
    if (typeof value === 'string') {
        const match = SCHEDULE_DATE_RE.exec(value.trim());
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
    }
    const d = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(d)) return '';
    return format(d, 'yyyy-MM-dd');
}

/** Human-readable scheduled date for admin tables. */
export function formatScheduledDateDisplay(value: string): string {
    const key = toScheduleDateKey(value);
    if (!key) return '—';
    const local = parse(key, 'yyyy-MM-dd', new Date());
    return format(local, 'EEE, MMM d, yyyy');
}

/** Query param for API schedule range filters. */
export function toScheduleDateParam(d: Date): string {
    return format(d, 'yyyy-MM-dd');
}
