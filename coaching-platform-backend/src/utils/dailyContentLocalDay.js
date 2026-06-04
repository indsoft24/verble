/**
 * Daily content "today" uses the server's **local** calendar midnight window
 * (see GET /api/daily-content/today).
 * Submission controllers must use the same rule, otherwise users see today's
 * word on the dashboard but get "only today's content" errors when UTC date
 * differs (common with IST / Asia timezones vs UTC-stored dates).
 */

const SCHEDULE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Start of local calendar day for a schedule date (YYYY-MM-DD or Date). */
export function parseScheduleDateInput(input) {
    if (input == null || input === '') return null;
    const str = String(input).trim();
    const match = SCHEDULE_DATE_RE.exec(str);
    if (match) {
        const y = Number(match[1]);
        const m = Number(match[2]) - 1;
        const d = Number(match[3]);
        const start = new Date(y, m, d, 0, 0, 0, 0);
        if (Number.isNaN(start.getTime())) {
            throw new Error('Invalid schedule date.');
        }
        return start;
    }
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid schedule date.');
    }
    const start = new Date(parsed);
    start.setHours(0, 0, 0, 0);
    return start;
}

/** Exclusive end of local calendar day for schedule date filtering. */
export function endOfScheduleDayExclusive(input) {
    const start = parseScheduleDateInput(input);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return end;
}

/** MongoDB range on DailyContent.date (scheduled day, not createdAt). */
export function buildScheduledDateRangeQuery(startStr, endStr) {
    if (!startStr && !endStr) return null;
    const range = {};
    if (startStr) {
        range.$gte = parseScheduleDateInput(startStr);
    }
    if (endStr) {
        range.$lt = endOfScheduleDayExclusive(endStr);
    }
    return Object.keys(range).length > 0 ? range : null;
}

export function getLocalTodayBounds() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}

export function isDailyContentScheduledForLocalToday(storedDate) {
    const { start, end } = getLocalTodayBounds();
    const t = new Date(storedDate).getTime();
    return t >= start.getTime() && t < end.getTime();
}
