/**
 * Daily content schedule dates use the Asia/Kolkata calendar day consistently.
 * Stored instants are IST midnight (UTC -5:30 from the calendar Y-M-D).
 * This matches learner/admin expectations on verble.in and avoids UTC/IST drift.
 */

const SCHEDULE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const SCHEDULE_TZ = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const istDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/** yyyy-MM-dd calendar key in IST for any stored instant. */
export function toScheduleDateKeyFromStored(storedDate) {
    const d = new Date(storedDate);
    if (Number.isNaN(d.getTime())) {
        throw new Error('Invalid schedule date.');
    }
    return istDateKeyFormatter.format(d);
}

function istMidnightInstant(year, monthIndex, day) {
    const utcMs = Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - IST_OFFSET_MS;
    const start = new Date(utcMs);
    if (Number.isNaN(start.getTime())) {
        throw new Error('Invalid schedule date.');
    }
    return start;
}

/** Canonical IST-midnight instant for a schedule date (YYYY-MM-DD or Date). */
export function parseScheduleDateInput(input) {
    if (input == null || input === '') return null;
    const str = String(input).trim();
    const match = SCHEDULE_DATE_RE.exec(str);
    if (match) {
        return istMidnightInstant(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid schedule date.');
    }
    const key = toScheduleDateKeyFromStored(parsed);
    const parts = SCHEDULE_DATE_RE.exec(key);
    if (!parts) {
        throw new Error('Invalid schedule date.');
    }
    return istMidnightInstant(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
}

/** Exclusive end of IST calendar day for schedule date filtering. */
export function endOfScheduleDayExclusive(input) {
    const start = parseScheduleDateInput(input);
    return new Date(start.getTime() + MS_PER_DAY);
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
    const key = toScheduleDateKeyFromStored(new Date());
    return {
        start: parseScheduleDateInput(key),
        end: endOfScheduleDayExclusive(key),
    };
}

export function isDailyContentScheduledForLocalToday(storedDate) {
    const { start, end } = getLocalTodayBounds();
    const t = new Date(storedDate).getTime();
    return t >= start.getTime() && t < end.getTime();
}
