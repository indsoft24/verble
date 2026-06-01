/** YouTube / Instagram URL helpers for gold media activities. */

export function normalizeHttpUrl(url: string): string {
    let t = url.trim();
    if (!t) return '';
    t = t.replace(/^hhttps:\/\//i, 'https://').replace(/^hhttp:\/\//i, 'http://');
    if (!/^https?:\/\//i.test(t) && /^[\w.-]+\.[a-z]{2,}/i.test(t)) {
        t = `https://${t}`;
    }
    return t;
}

export function extractYouTubeVideoId(url: string): string | null {
    const t = normalizeHttpUrl(url);
    if (!t) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = t.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function isInstagramPostUrl(url: string): boolean {
    const t = normalizeHttpUrl(url);
    if (!t) return false;
    return /instagram\.com\/(p|reel|tv)\//i.test(t);
}

export function isInstagramProfileUrl(url: string): boolean {
    const t = normalizeHttpUrl(url);
    if (!t) return false;
    return /instagram\.com\/(?!p\/|reel\/|tv\/)[\w.]+/i.test(t);
}

/** Build Instagram embed iframe URL from a post/reel link. */
export function getInstagramEmbedUrl(postUrl: string): string | null {
    const t = normalizeHttpUrl(postUrl);
    if (!isInstagramPostUrl(t)) return null;
    try {
        const parsed = new URL(t);
        const path = parsed.pathname.replace(/\/$/, '');
        return `${parsed.origin}${path}/embed`;
    } catch {
        return null;
    }
}

export interface NormalizedInstagramPost {
    imageUrl: string;
    credit: string;
    creditUrl: string;
    postLink: string;
    caption: string;
}

export function normalizeInstagramPost(raw: Record<string, unknown>): NormalizedInstagramPost {
    let imageUrl = String(raw.imageUrl ?? raw.image ?? '').trim();
    let postLink = normalizeHttpUrl(String(raw.postLink ?? raw.link ?? ''));
    const credit = String(raw.credit ?? '').trim();
    const creditUrl = normalizeHttpUrl(String(raw.creditUrl ?? ''));
    const caption = String(raw.caption ?? raw.text ?? '').trim();

    if (imageUrl && isInstagramPostUrl(imageUrl)) {
        if (!postLink) postLink = normalizeHttpUrl(imageUrl);
        imageUrl = '';
    }

    return { imageUrl, credit, creditUrl, postLink, caption };
}
