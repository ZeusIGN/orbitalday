import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";
import {defaultLocale, Locale, localeNames, locales} from "@/locales";

export type TranslationState = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, fallback?: string) => string;
    availableLocales: { code: Locale; name: string }[];
};

const TranslationContext = createContext<TranslationState | undefined>(undefined);

const LOCALE_STORAGE_KEY = "orbital_locale";

export function TranslationProvider({children}: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
            if (stored && locales[stored]) {
                setLocaleState(stored);
            }
        }
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
        }
    }, []);

    const t = useCallback((key: string, fallback?: string): string => {
        const translations = locales[locale];
        if (translations && translations[key]) {
            return translations[key];
        }
        const defaultTranslations = locales[defaultLocale];
        if (defaultTranslations && defaultTranslations[key]) {
            return defaultTranslations[key];
        }
        return fallback || key;
    }, [locale]);

    const availableLocales = Object.keys(locales).map((code) => ({
        code: code as Locale,
        name: localeNames[code as Locale],
    }));

    if (!isClient) {
        return (
            <TranslationContext.Provider value={{
                locale: defaultLocale,
                setLocale: () => {},
                t: (key: string, fallback?: string) => locales[defaultLocale][key] || fallback || key,
                availableLocales,
            }}>
                {children}
            </TranslationContext.Provider>
        );
    }

    return (
        <TranslationContext.Provider value={{locale, setLocale, t, availableLocales}}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}

export function translateServerMessage(message: string, t: (key: string, fallback?: string) => string): string {
    if (message.startsWith("key:")) {
        const key = message.substring(4);
        return t(key, message);
    }
    return message;
}

