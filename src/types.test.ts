import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './types';
import type { GridType, Settings } from './types';

describe('Types & DEFAULT_SETTINGS', () => {
    it('should have correct default grid types', () => {
        expect(DEFAULT_SETTINGS.gridTypes).toEqual(['thirds', 'triangle']);
    });

    it('should have opacity in valid range', () => {
        expect(DEFAULT_SETTINGS.opacity).toBeGreaterThanOrEqual(0.1);
        expect(DEFAULT_SETTINGS.opacity).toBeLessThanOrEqual(1);
    });

    it('should default to enabled', () => {
        expect(DEFAULT_SETTINGS.enabled).toBe(true);
        expect(DEFAULT_SETTINGS.videoEnabled).toBe(false);
    });

    it('should include all expected grid types in union', () => {
        const allTypes: GridType[] = ['thirds', 'golden', 'fibonacci', 'triangle', 'fifths', 'center'];
        for (const type of allTypes) {
            const settings: Settings = { ...DEFAULT_SETTINGS, gridTypes: [type] };
            expect(settings.gridTypes).toContain(type);
        }
    });

    it('should have valid default colors', () => {
        expect(DEFAULT_SETTINGS.lineColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(DEFAULT_SETTINGS.dotColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have reasonable default sizes', () => {
        expect(DEFAULT_SETTINGS.lineSize).toBeGreaterThan(0);
        expect(DEFAULT_SETTINGS.dotSize).toBeGreaterThan(0);
        expect(DEFAULT_SETTINGS.minImageSize).toBeGreaterThanOrEqual(50);
    });
});
