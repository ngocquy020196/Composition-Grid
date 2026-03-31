import { describe, it, expect } from 'vitest';
import { t } from './index';
import type { TranslationKey } from './index';

describe('i18n translations', () => {
    const requiredKeys: TranslationKey[] = [
        'appName', 'enableGrid', 'gridType', 'thirds', 'golden',
        'fibonacci', 'triangle', 'fifths', 'center',
        'opacity', 'lineColor', 'dotColor', 'lineSize', 'lineStyle',
        'resetGridType', 'resetSettings',
    ];

    it('should return English translations', () => {
        for (const key of requiredKeys) {
            const val = t(key, 'en');
            expect(val).toBeTruthy();
            expect(typeof val).toBe('string');
        }
    });

    it('should return Vietnamese translations', () => {
        for (const key of requiredKeys) {
            const val = t(key, 'vi');
            expect(val).toBeTruthy();
            expect(typeof val).toBe('string');
        }
    });

    it('should return different values for EN vs VI', () => {
        expect(t('appName', 'en')).not.toBe(t('appName', 'vi'));
        expect(t('thirds', 'en')).not.toBe(t('thirds', 'vi'));
    });

    it('should have correct grid type names', () => {
        expect(t('fifths', 'en')).toBe('Fifths');
        expect(t('fifths', 'vi')).toBe('Quy Tắc 1/5');
        expect(t('center', 'en')).toBe('Center');
        expect(t('center', 'vi')).toBe('Tâm Đối Xứng');
    });

    it('should have opacity translation', () => {
        expect(t('opacity', 'en')).toBe('Opacity');
        expect(t('opacity', 'vi')).toBe('Độ Mờ');
    });
});
