import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { t } from './index';

// public/_locales is the single source of translation content. These tests auto-discover
// every locale folder, so adding a new language (a new _locales/<lang>/messages.json) is
// automatically validated with no test changes needed.

const LOCALES_DIR = resolve(__dirname, '../../public/_locales');

function loadLocale(lang: string): Record<string, { message: string }> {
    const path = resolve(LOCALES_DIR, lang, 'messages.json');
    return JSON.parse(readFileSync(path, 'utf-8'));
}

const langs = readdirSync(LOCALES_DIR).filter((name) => !name.startsWith('.'));
const enKeys = Object.keys(loadLocale('en')).sort();

describe('_locales', () => {
    it('ships at least English', () => {
        expect(langs).toContain('en');
        expect(enKeys.length).toBeGreaterThan(0);
    });

    for (const lang of langs) {
        it(`${lang}/messages.json has the same keys as English`, () => {
            expect(Object.keys(loadLocale(lang)).sort()).toEqual(enKeys);
        });

        it(`${lang}/messages.json has only non-empty strings`, () => {
            const locale = loadLocale(lang);
            for (const key of enKeys) {
                expect(locale[key]?.message).toBeTruthy();
            }
        });
    }

    it('all message keys are valid Chrome i18n identifiers', () => {
        // Chrome requires message names to match /^[A-Za-z0-9_@]+$/
        for (const key of enKeys) {
            expect(key).toMatch(/^[A-Za-z0-9_@]+$/);
        }
    });
});

describe('t()', () => {
    it('forces English when lang = "en"', () => {
        const en = loadLocale('en');
        expect(t('appName', 'en')).toBe(en.appName.message);
        expect(t('thirds', 'en')).toBe(en.thirds.message);
    });

    it('falls back to English outside the extension (no chrome.i18n)', () => {
        // In vitest there is no chrome global, so 'auto' resolves to bundled English.
        const en = loadLocale('en');
        expect(t('opacity')).toBe(en.opacity.message);
    });
});
