// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const STORAGE_KEY = 'verble_lang';
const STORAGE_KEY_CHOICE_MADE = 'verble_lang_choice_made';

export const defaultLanguage = 'en';
export const supportedLanguages = ['en', 'hi'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export function getStoredLanguage(): SupportedLanguage {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'hi') return stored;
    } catch {
        // ignore
    }
    return defaultLanguage;
}

export function setStoredLanguage(lang: SupportedLanguage): void {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
        localStorage.setItem(STORAGE_KEY_CHOICE_MADE, '1');
    } catch {
        // ignore
    }
}

/** True if user has seen/chosen language (first-visit popup shown once). */
export function getLanguageChoiceMade(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY_CHOICE_MADE) === '1';
    } catch {
        return false;
    }
}

export function setLanguageChoiceMade(): void {
    try {
        localStorage.setItem(STORAGE_KEY_CHOICE_MADE, '1');
    } catch {
        // ignore
    }
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        hi: { translation: hi },
    },
    lng: getStoredLanguage(),
    fallbackLng: defaultLanguage,
    interpolation: {
        escapeValue: false, // React already escapes
    },
});

export default i18n;
