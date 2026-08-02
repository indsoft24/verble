/** Convert ISO UTC string to value for `<input type="datetime-local">` in the user's local timezone. */
export function isoToDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse datetime-local value (local time) to ISO UTC for the API. */
export function datetimeLocalToIso(localValue: string): string {
    if (!localValue?.trim()) {
        throw new Error('Date and time are required.');
    }
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) {
        throw new Error('Invalid date/time.');
    }
    return d.toISOString();
}

/** Human-readable schedule for admin tables (India locale). */
export function formatWebinarScheduleRange(startIso: string, endIso: string): { dateLine: string; timeLine: string } {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    const dateLine = start.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const startTime = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const timeLine = sameDay ? `${startTime} – ${endTime}` : `${startTime} → ${end.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`;

    return { dateLine, timeLine };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string } }; message?: string };
        return axiosErr.response?.data?.message || axiosErr.message || fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}
