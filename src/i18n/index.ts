// Single source of translations: public/_locales/<lang>/messages.json (Chrome native i18n).
// We import the English file so its strings are bundled into the popup/options/background
// JS — needed for the in-app "switch to English" override, which must render English even
// when the browser language is something else (chrome.i18n cannot be overridden at runtime).
import enMessages from '../../public/_locales/en/messages.json';

export type TranslationKey = keyof typeof enMessages;

// Translation resolution:
//  - lang === 'auto' (default): use Chrome's native i18n, which follows the browser UI
//    language. Outside the extension (unit tests) it falls back to the bundled English.
//  - lang === 'en': force English from the bundled messages, bypassing chrome.i18n. This
//    powers the in-app override so the user can read English without changing their browser.
export function t(key: TranslationKey, lang: 'auto' | 'en' = 'auto'): string {
    if (lang === 'auto' && typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
        const msg = chrome.i18n.getMessage(key);
        if (msg) return msg;
    }
    return enMessages[key].message;
}

// Base browser UI language code, e.g. 'vi' from 'vi-VN'. 'en' outside the extension.
export function getBrowserLang(): string {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
        return chrome.i18n.getUILanguage().split('-')[0];
    }
    return 'en';
}

// True when Chrome's native i18n is currently rendering a non-English translation —
// i.e. the browser language has its own _locales file. Detected by comparing sample
// messages against the bundled English, so there is NO language list to maintain:
// adding a new _locales/<lang> makes the in-app "switch to English" toggle appear
// automatically for users on that language.
const SAMPLE_KEYS: TranslationKey[] = ['appTagline', 'enableGrid', 'gridType'];
export function isBrowserNonEnglish(): boolean {
    if (typeof chrome === 'undefined' || !chrome.i18n?.getMessage) return false;
    return SAMPLE_KEYS.some((k) => chrome.i18n.getMessage(k) !== enMessages[k].message);
}
