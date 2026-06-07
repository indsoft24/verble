import { format, parse, isValid } from 'date-fns';

const SCHEDULE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SCHEDULE_TZ = 'Asia/Kolkata';

const istDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/** Calendar day key (yyyy-MM-dd) in Asia/Kolkata for stored schedule instants. */
export function toScheduleDateKey(value: string | Date): string {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (SCHEDULE_DATE_RE.test(trimmed)) {
            return trimmed;
        }
    }
    const d = typeof value === 'string' ? new Date(value) : value;
    if (!isValid(d)) return '';
    return istDateKeyFormatter.format(d);
}

/** Parse a schedule day key for date pickers (local browser calendar). */
export function parseScheduleDateLocal(value: string | Date | null | undefined): Date | null {
    const key = value == null ? '' : toScheduleDateKey(value);
    if (!key) return null;
    const d = parse(key, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : null;
}

/** Human-readable scheduled date for admin tables. */
export function formatScheduledDateDisplay(value: string): string {
    const local = parseScheduleDateLocal(value);
    if (!local) return '—';
    return format(local, 'EEE, MMM d, yyyy');
}

/** Query param for API schedule range filters. */
export function toScheduleDateParam(d: Date): string {
    return format(d, 'yyyy-MM-dd');
}
