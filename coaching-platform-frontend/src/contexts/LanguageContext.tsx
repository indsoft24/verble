// src/contexts/LanguageContext.tsx
import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { setStoredLanguage, type SupportedLanguage } from '../i18n/config';

interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => void;
    openLanguageModal: () => void;
    setLanguageModalOpen: (open: boolean) => void;
    isLanguageModalOpen: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
    children,
    isLanguageModalOpen,
    setLanguageModalOpen,
}: {
    children: ReactNode;
    isLanguageModalOpen: boolean;
    setLanguageModalOpen: (open: boolean) => void;
}) {
    const { i18n } = useTranslation();

    const language = (i18n.language === 'hi' ? 'hi' : 'en') as SupportedLanguage;

    const setLanguage = useCallback(
        (lang: SupportedLanguage) => {
            i18n.changeLanguage(lang);
            setStoredLanguage(lang);
            setLanguageModalOpen(false);
        },
        [i18n, setLanguageModalOpen]
    );

    const openLanguageModal = useCallback(() => {
        setLanguageModalOpen(true);
    }, [setLanguageModalOpen]);

    const value = useMemo<LanguageContextType>(
        () => ({
            language,
            setLanguage,
            openLanguageModal,
            setLanguageModalOpen,
            isLanguageModalOpen,
        }),
        [language, setLanguage, openLanguageModal, setLanguageModalOpen, isLanguageModalOpen]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (ctx === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return ctx;
}
