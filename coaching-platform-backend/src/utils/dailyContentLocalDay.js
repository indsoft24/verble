/**
 * Daily content "today" uses the server's **local** calendar midnight window
 * (see GET /api/daily-content/today).
 * Submission controllers must use the same rule, otherwise users see today's
 * word on the dashboard but get "only today's content" errors when UTC date
 * differs (common with IST / Asia timezones vs UTC-stored dates).
 */

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
