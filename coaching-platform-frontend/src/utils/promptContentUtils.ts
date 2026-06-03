/** Normalize prompt text for clipboard (preserve line breaks). */
export function normalizePromptText(value: string): string {
    return (value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export type ParsedPromptArticle = {
    promptText: string;
    beforeHtml: string;
    afterHtml: string;
};

function extractPreTextFromHtml(html: string): string {
    const match = html.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/i);
    if (!match) return '';
    const inner = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    return normalizePromptText(inner);
}

function extractByMarkers(fullText: string): string {
    const normalized = normalizePromptText(fullText);
    const startIdx = normalized.toLowerCase().indexOf('act as');
    if (startIdx < 0) return '';
    const quickTipsMatch = normalized.match(/\n\s*quick tips/i);
    return normalizePromptText(normalized.slice(startIdx, quickTipsMatch?.index ?? normalized.length));
}

function isPromptBlock(el: Element): boolean {
    const text = normalizePromptText(el.textContent || '').toLowerCase();
    if (el.tagName === 'PRE' || el.querySelector('pre')) return true;
    return text.includes('act as an expert') || text.startsWith('act as');
}

function isQuickTipsHeading(el: Element): boolean {
    if (!/^H[1-6]$/i.test(el.tagName)) return false;
    return /quick tips/i.test(normalizePromptText(el.textContent || ''));
}

/**
 * Parse editor HTML: extract the AI prompt for copy, return instructions + tips without duplicate prompt body.
 */
export function parsePromptArticle(html: string, fallbackPrompt = ''): ParsedPromptArticle {
    const source = html || '';
    const fallback = normalizePromptText(fallbackPrompt);

    if (!source.trim()) {
        return { promptText: fallback, beforeHtml: '', afterHtml: '' };
    }

    const doc = new DOMParser().parseFromString(source, 'text/html');
    const body = doc.body;
    const children = Array.from(body.children);

    let promptStart = -1;
    let promptEnd = children.length;

    for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (promptStart < 0 && isPromptBlock(el)) {
            promptStart = i;
            continue;
        }
        if (promptStart >= 0 && isQuickTipsHeading(el)) {
            promptEnd = i;
            break;
        }
    }

    let promptText = '';
    if (promptStart >= 0) {
        const chunk = children.slice(promptStart, promptEnd);
        const preEl = chunk.flatMap((el) => Array.from(el.querySelectorAll('pre'))).find(Boolean)
            || chunk.find((el) => el.tagName === 'PRE');
        if (preEl) {
            promptText = normalizePromptText(preEl.textContent || '');
        }
        if (!promptText) {
            promptText = normalizePromptText(chunk.map((el) => el.textContent || '').join('\n\n'));
        }
    }

    if (!promptText) {
        promptText =
            normalizePromptText(body.querySelector('pre')?.textContent || '') ||
            extractPreTextFromHtml(source) ||
            extractByMarkers(body.innerText || '') ||
            fallback;
    }

    if (promptStart >= 0) {
        return {
            promptText,
            beforeHtml: children.slice(0, promptStart).map((el) => el.outerHTML).join(''),
            afterHtml: children.slice(promptEnd).map((el) => el.outerHTML).join(''),
        };
    }

    body.querySelectorAll('pre').forEach((node) => node.remove());
    for (const el of Array.from(body.children)) {
        if (isPromptBlock(el) && !isQuickTipsHeading(el)) {
            el.remove();
        }
    }

    const quickMatch = body.innerHTML.match(/<h[1-6][^>]*>[\s\S]*?quick\s+tips[\s\S]*?<\/h[1-6]>/i);
    if (quickMatch?.index !== undefined) {
        return {
            promptText,
            beforeHtml: body.innerHTML.slice(0, quickMatch.index),
            afterHtml: body.innerHTML.slice(quickMatch.index),
        };
    }

    return { promptText, beforeHtml: body.innerHTML, afterHtml: '' };
}
