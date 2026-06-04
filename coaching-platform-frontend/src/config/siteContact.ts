/** Global public contact details for Verble (site-wide). */
export const SITE_CONTACT = {
    email: 'info@verble.in',
    /** National mobile number without country code */
    phoneNational: '9310587606',
    countryCode: '+91',
    officeLocation: 'New Delhi, Delhi, India',
    supportHours: 'Mon - Sat, 9:00 AM to 7:00 PM',
} as const;

export const siteContactMailto = `mailto:${SITE_CONTACT.email}`;

export const siteContactPhoneE164 = `${SITE_CONTACT.countryCode}${SITE_CONTACT.phoneNational}`;

export const siteContactTel = `tel:${siteContactPhoneE164}`;

/** Human-readable phone, e.g. +91 93105 87606 */
export const siteContactPhoneDisplay = `${SITE_CONTACT.countryCode} ${SITE_CONTACT.phoneNational.slice(0, 5)} ${SITE_CONTACT.phoneNational.slice(5)}`;
