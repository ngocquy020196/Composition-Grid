import { describe, it, expect, beforeEach } from 'vitest';
import { renderGrid } from './grid-renderer';
import { DEFAULT_SETTINGS, GRID } from '../types';
import type { Settings } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createContainer(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
    return { ...DEFAULT_SETTINGS, ...overrides };
}

function getLines(container: HTMLElement) {
    return container.querySelectorAll('line');
}

/** Count dot divs — dots are direct child divs (not the container itself) */
function getDotCount(container: HTMLElement): number {
    // Dots are appended as direct children (div elements).
    // Fibonacci wrapper is also a div, but it contains an SVG child.
    // Dots have no children — use this to distinguish.
    return Array.from(container.querySelectorAll('div'))
        .filter((d) => d !== container && d.children.length === 0).length;
}

function getLineAttr(container: HTMLElement, attr: string): string[] {
    return Array.from(getLines(container)).map((l) => l.getAttribute(attr) ?? '');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('grid-renderer', () => {
    let container: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = createContainer();
    });

    // ── renderGrid basics ────────────────────────────────────────────────

    describe('renderGrid basics', () => {
        it('should clear previous content before rendering', () => {
            container.innerHTML = '<span>old</span>';
            renderGrid(container, makeSettings());
            expect(container.querySelector('span')).toBeNull();
        });

        it('should set default opacity 0.75', () => {
            renderGrid(container, makeSettings());
            expect(container.style.opacity).toBe('0.75');
        });

        it('should apply custom opacity', () => {
            renderGrid(container, makeSettings({ opacity: 0.4 }));
            expect(container.style.opacity).toBe('0.4');
        });

        it('should render nothing for empty gridTypes', () => {
            renderGrid(container, makeSettings({ gridTypes: [] }));
            expect(container.querySelectorAll('svg').length).toBe(0);
        });
    });

    // ── Thirds Grid ──────────────────────────────────────────────────────

    describe('thirds grid', () => {
        it('should render 4 lines (2 vertical + 2 horizontal)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            expect(getLines(container).length).toBe(4);
        });

        it('should position lines at 33.333% and 66.667%', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            const x1s = getLineAttr(container, 'x1');
            expect(x1s).toContain('33.333');
            expect(x1s).toContain('66.667');
        });

        it('should render 4 intersection dots when enabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: true }));
            expect(getDotCount(container)).toBe(4);
        });

        it('should render 0 dots when disabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            expect(getDotCount(container)).toBe(0);
        });
    });

    // ── Golden Ratio Grid ────────────────────────────────────────────────

    describe('golden ratio grid', () => {
        it('should render 4 lines', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.GOLDEN], showDots: false }));
            expect(getLines(container).length).toBe(4);
        });

        it('should position lines at golden ratio (38.197 / 61.803)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.GOLDEN], showDots: false }));
            const x1s = getLineAttr(container, 'x1');
            expect(x1s).toContain('38.197');
            expect(x1s).toContain('61.803');
        });

        it('should render 4 dots when enabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.GOLDEN], showDots: true }));
            expect(getDotCount(container)).toBe(4);
        });

        it('should render 0 dots when disabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.GOLDEN], showDots: false }));
            expect(getDotCount(container)).toBe(0);
        });
    });

    // ── Fibonacci Spiral ─────────────────────────────────────────────────

    describe('fibonacci spiral', () => {
        it('should render wrapper div for orientation transform', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI] }));
            const wrapper = container.querySelector('div');
            expect(wrapper).not.toBeNull();
        });

        it('should render spiral path element', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI] }));
            const path = container.querySelector('path');
            expect(path).not.toBeNull();
            expect(path!.getAttribute('d')).toBeTruthy();
        });

        it('should render division lines', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI] }));
            expect(getLines(container).length).toBeGreaterThan(0);
        });

        it('should use viewBox 161.8 × 100', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI] }));
            const svg = container.querySelector('svg');
            expect(svg!.getAttribute('viewBox')).toBe('0 0 161.8 100');
        });

        it('should NOT render any dots regardless of showDots', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI], showDots: true }));
            expect(getDotCount(container)).toBe(0);
        });

        it('should apply orientation 0 as transform: none', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI], spiralOrientation: 0 }));
            const wrapper = container.querySelector('div');
            expect(wrapper!.style.transform).toBe('none');
        });

        it('should apply orientation 1 as scaleX(-1)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI], spiralOrientation: 1 }));
            const wrapper = container.querySelector('div');
            expect(wrapper!.style.transform).toBe('scaleX(-1)');
        });

        it('should apply orientation 2 as scale(-1, -1)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI], spiralOrientation: 2 }));
            const wrapper = container.querySelector('div');
            expect(wrapper!.style.transform).toBe('scale(-1, -1)');
        });

        it('should apply orientation 3 as scaleY(-1)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIBONACCI], spiralOrientation: 3 }));
            const wrapper = container.querySelector('div');
            expect(wrapper!.style.transform).toBe('scaleY(-1)');
        });
    });

    // ── Golden Triangle ──────────────────────────────────────────────────

    describe('triangle grid', () => {
        it('should render 6 lines (2 diagonals + 4 perpendiculars)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.TRIANGLE], showDots: false }));
            expect(getLines(container).length).toBe(6);
        });

        it('should render 1 center dot when enabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.TRIANGLE], showDots: true }));
            expect(getDotCount(container)).toBe(1);
        });

        it('should render 0 dots when disabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.TRIANGLE], showDots: false }));
            expect(getDotCount(container)).toBe(0);
        });
    });

    // ── Fifths Grid ──────────────────────────────────────────────────────

    describe('fifths grid', () => {
        it('should render 8 lines (4 vertical + 4 horizontal)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIFTHS], showDots: false }));
            expect(getLines(container).length).toBe(8);
        });

        it('should have lines at 20%, 40%, 60%, 80%', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIFTHS], showDots: false }));
            const x1s = getLineAttr(container, 'x1');
            expect(x1s).toContain('20');
            expect(x1s).toContain('40');
            expect(x1s).toContain('60');
            expect(x1s).toContain('80');
        });

        it('should render 4 power point dots when enabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIFTHS], showDots: true }));
            expect(getDotCount(container)).toBe(4);
        });

        it('should render 0 dots when disabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.FIFTHS], showDots: false }));
            expect(getDotCount(container)).toBe(0);
        });
    });

    // ── Center Grid ──────────────────────────────────────────────────────

    describe('center grid', () => {
        it('should render 6 lines (2 crosshair + 4 quarter)', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: false }));
            expect(getLines(container).length).toBe(6);
        });

        it('should have main crosshair at 50%', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: false }));
            const firstLine = getLines(container)[0];
            expect(firstLine.getAttribute('x1')).toBe('50');
        });

        it('should have quarter guidelines at 25% and 75%', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: false }));
            const x1s = getLineAttr(container, 'x1');
            expect(x1s).toContain('25');
            expect(x1s).toContain('75');
        });

        it('should render 1 center dot when enabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: true }));
            expect(getDotCount(container)).toBe(1);
        });

        it('should render 0 dots when disabled', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: false }));
            expect(getDotCount(container)).toBe(0);
        });
    });

    // ── Line Styles ──────────────────────────────────────────────────────

    describe('line styles', () => {
        it('should apply stroke-dasharray for dashed style', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], lineStyle: 'dashed', showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke-dasharray')).toBe('6 4');
        });

        it('should not set stroke-dasharray for solid style', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], lineStyle: 'solid', showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke-dasharray')).toBeNull();
        });

        it('should apply custom line color', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], lineColor: '#ff0000', showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke')).toBe('#ff0000');
        });

        it('should apply custom line width', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], lineSize: 3, showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke-width')).toBe('3');
        });

        it('should set vector-effect non-scaling-stroke', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('vector-effect')).toBe('non-scaling-stroke');
        });
    });

    // ── Multi-Grid Rendering ─────────────────────────────────────────────

    describe('multi-grid rendering', () => {
        it('should render two SVGs for thirds + center', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS, GRID.CENTER], showDots: false }));
            expect(container.querySelectorAll('svg').length).toBe(2);
        });

        it('should render all 6 grid types without error', () => {
            renderGrid(container, makeSettings({
                gridTypes: [GRID.THIRDS, GRID.GOLDEN, GRID.FIBONACCI, GRID.TRIANGLE, GRID.FIFTHS, GRID.CENTER],
                showDots: false,
            }));
            // 5 direct SVGs + 1 inside fibonacci wrapper = 6
            expect(container.querySelectorAll('svg').length).toBe(6);
        });

        it('should count correct total dots (no fibonacci dots)', () => {
            renderGrid(container, makeSettings({
                gridTypes: [GRID.THIRDS, GRID.GOLDEN, GRID.FIBONACCI, GRID.TRIANGLE, GRID.FIFTHS, GRID.CENTER],
                showDots: true,
            }));
            // thirds:4 + golden:4 + fibonacci:0 + triangle:1 + fifths:4 + center:1 = 14
            expect(getDotCount(container)).toBe(14);
        });

        it('should clear and re-render on consecutive calls', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            expect(getLines(container).length).toBe(4);

            renderGrid(container, makeSettings({ gridTypes: [GRID.CENTER], showDots: false }));
            expect(getLines(container).length).toBe(6);
        });
    });

    // ── SVG Attributes ───────────────────────────────────────────────────

    describe('SVG attributes', () => {
        it('should set viewBox 0 0 100 100 for standard grids', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            const svg = container.querySelector('svg');
            expect(svg!.getAttribute('viewBox')).toBe('0 0 100 100');
        });

        it('should set preserveAspectRatio to none', () => {
            renderGrid(container, makeSettings({ gridTypes: [GRID.THIRDS], showDots: false }));
            const svg = container.querySelector('svg');
            expect(svg!.getAttribute('preserveAspectRatio')).toBe('none');
        });
    });
});
