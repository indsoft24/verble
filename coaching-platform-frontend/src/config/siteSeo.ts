/** Public site URL (no trailing slash). Override in build: VITE_SITE_URL=https://verble.in */
export const SITE_URL =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://verble.in';

export const SITE_NAME = 'Verble';

export const DEFAULT_ROBOTS = 'index, follow';

/** Homepage — keep in sync with index.html defaults for crawlers that skip JS. */
export const HOME_PAGE_SEO = {
    title: 'Verble | Learn English Fluently with AI — Speaking Practice',
    description:
        "Learn English fluently with Verble's AI companion. Daily speaking practice, real-life conversations, and structured courses for learners in India. Start free.",
    path: '/',
    ogImage: `${SITE_URL}/verble-logo.svg`,
    ogType: 'website' as const,
};

export function canonicalForPath(path: string): string {
    if (!path || path === '/') return SITE_URL;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
