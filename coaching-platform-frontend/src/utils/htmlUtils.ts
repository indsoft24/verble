/**
 * Strips HTML tags from a string and returns plain text
 * @param html - HTML string to strip
 * @param maxLength - Maximum length of the returned string (optional)
 * @returns Plain text without HTML tags
 */
export const stripHtmlTags = (html: string | null | undefined, maxLength?: number): string => {
    if (!html) return '';
    
    // Create a temporary DOM element to parse HTML
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    
    // Get text content (automatically strips HTML tags)
    let text = tmp.textContent || tmp.innerText || '';
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Truncate if maxLength is provided
    if (maxLength && text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    }
    
    return text;
};

/**
 * Checks if a string contains HTML tags
 * @param str - String to check
 * @returns True if string contains HTML tags
 */
export const containsHtml = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const htmlRegex = /<[^>]*>/g;
    return htmlRegex.test(str);
};

