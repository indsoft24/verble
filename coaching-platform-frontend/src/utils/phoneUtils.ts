const DEFAULT_COUNTRY_CODE = '+91';

/**
 * Normalize phone to E.164-style string (mirrors backend formatMobileNumber).
 */
export const formatPhoneNumber = (
    phone: string,
    defaultCountryCode: string = DEFAULT_COUNTRY_CODE
): string | null => {
    if (!phone?.trim()) return null;

    let cleaned = phone.replace(/[\s\-()]/g, '');

    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    if (cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
    }

    const countryDigits = defaultCountryCode.replace(/^\+/, '');
    if (countryDigits && cleaned.startsWith(countryDigits)) {
        cleaned = cleaned.slice(countryDigits.length);
    }

    if (!cleaned.startsWith('+')) {
        cleaned = defaultCountryCode + cleaned;
    }

    return cleaned;
};

/** Mirrors backend validateMobileNumber */
export const validatePhoneNumber = (phone: string | null): boolean => {
    if (!phone) return false;

    const mobileRegex = /^\+[1-9]\d{9,14}$/;
    if (!mobileRegex.test(phone)) return false;

    if (phone.startsWith('+91')) {
        return /^\d{10}$/.test(phone.slice(3));
    }

    return true;
};

export const normalizeAndValidatePhone = (
    raw: string
): { formatted: string | null; valid: boolean } => {
    const formatted = formatPhoneNumber(raw);
    return { formatted, valid: validatePhoneNumber(formatted) };
};
