import en_US from "./en_US";
import lv_LV from "./lv_LV";

export type Locale = "en_US" | "lv_LV";

export const locales: Record<Locale, Record<string, string>> = {
    en_US,
    lv_LV,
};

export const localeNames: Record<Locale, string> = {
    en_US: "English",
    lv_LV: "Latviešu",
};

export const defaultLocale: Locale = "en_US";

export {en_US, lv_LV};

