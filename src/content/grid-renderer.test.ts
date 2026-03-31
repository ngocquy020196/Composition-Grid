import { describe, it, expect, beforeEach } from 'vitest';
import { renderGrid } from './grid-renderer';
import { DEFAULT_SETTINGS } from '../types';
import type { Settings } from '../types';

function createContainer(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
    return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('grid-renderer', () => {
    let container: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = createContainer();
    });

    describe('renderGrid basics', () => {
        it('should clear container before rendering', () => {
            container.innerHTML = '<span>old content</span>';
            renderGrid(container, makeSettings());
            expect(container.querySelector('span')).toBeNull();
        });

        it('should set opacity from settings', () => {
            renderGrid(container, makeSettings({ opacity: 0.5 }));
            expect(container.style.opacity).toBe('0.5');
        });

        it('should use default opacity 0.75', () => {
            renderGrid(container, makeSettings());
            expect(container.style.opacity).toBe('0.75');
        });

        it('should render SVG elements', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'] }));
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });
    });

    describe('thirds grid', () => {
        it('should render 4 lines', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'], showDots: false }));
            const lines = container.querySelectorAll('line');
            expect(lines.length).toBe(4);
        });

        it('should render 4 dots when showDots is true', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'], showDots: true }));
            const dots = container.querySelectorAll('div');
            // container itself is a div, dots are child divs
            expect(dots.length).toBe(4);
        });

        it('should render lines at 33.333% and 66.667%', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'], showDots: false }));
            const lines = container.querySelectorAll('line');
            const positions = Array.from(lines).map((l) => ({
                x1: l.getAttribute('x1'),
                y1: l.getAttribute('y1'),
            }));
            expect(positions.some((p) => p.x1 === '33.333')).toBe(true);
            expect(positions.some((p) => p.x1 === '66.667')).toBe(true);
        });
    });

    describe('golden ratio grid', () => {
        it('should render 4 lines', () => {
            renderGrid(container, makeSettings({ gridTypes: ['golden'], showDots: false }));
            const lines = container.querySelectorAll('line');
            expect(lines.length).toBe(4);
        });

        it('should render lines at golden positions', () => {
            renderGrid(container, makeSettings({ gridTypes: ['golden'], showDots: false }));
            const lines = container.querySelectorAll('line');
            const x1Values = Array.from(lines).map((l) => l.getAttribute('x1'));
            expect(x1Values).toContain('38.197');
            expect(x1Values).toContain('61.803');
        });
    });

    describe('fifths grid', () => {
        it('should render 8 lines (4 vertical + 4 horizontal)', () => {
            renderGrid(container, makeSettings({ gridTypes: ['fifths'], showDots: false }));
            const lines = container.querySelectorAll('line');
            expect(lines.length).toBe(8);
        });

        it('should render 4 power point dots', () => {
            renderGrid(container, makeSettings({ gridTypes: ['fifths'], showDots: true }));
            const dots = container.querySelectorAll('div');
            expect(dots.length).toBe(4);
        });

        it('should have lines at 20%, 40%, 60%, 80%', () => {
            renderGrid(container, makeSettings({ gridTypes: ['fifths'], showDots: false }));
            const lines = container.querySelectorAll('line');
            const x1Values = Array.from(lines).map((l) => l.getAttribute('x1'));
            expect(x1Values).toContain('20');
            expect(x1Values).toContain('40');
            expect(x1Values).toContain('60');
            expect(x1Values).toContain('80');
        });
    });

    describe('center grid', () => {
        it('should render 6 lines (2 main + 4 quarter)', () => {
            renderGrid(container, makeSettings({ gridTypes: ['center'], showDots: false }));
            const lines = container.querySelectorAll('line');
            expect(lines.length).toBe(6);
        });

        it('should render 1 center dot', () => {
            renderGrid(container, makeSettings({ gridTypes: ['center'], showDots: true }));
            const dots = container.querySelectorAll('div');
            expect(dots.length).toBe(1);
        });

        it('should have main crosshair at 50%', () => {
            renderGrid(container, makeSettings({ gridTypes: ['center'], showDots: false }));
            const lines = container.querySelectorAll('line');
            const firstLine = lines[0];
            expect(firstLine.getAttribute('x1')).toBe('50');
        });
    });

    describe('triangle grid', () => {
        it('should render 6 lines', () => {
            renderGrid(container, makeSettings({ gridTypes: ['triangle'], showDots: false }));
            const lines = container.querySelectorAll('line');
            expect(lines.length).toBe(6);
        });
    });

    describe('fibonacci spiral', () => {
        it('should render with wrapper div for orientation', () => {
            renderGrid(container, makeSettings({ gridTypes: ['fibonacci'], showDots: false }));
            const wrapper = container.querySelector('div');
            expect(wrapper).not.toBeNull();
            expect(wrapper!.style.transform).toBeDefined();
        });

        it('should render spiral path element', () => {
            renderGrid(container, makeSettings({ gridTypes: ['fibonacci'], showDots: false }));
            const path = container.querySelector('path');
            expect(path).not.toBeNull();
            expect(path!.getAttribute('d')).toBeTruthy();
        });
    });

    describe('multi-grid rendering', () => {
        it('should render multiple grid types together', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds', 'center'], showDots: false }));
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBe(2);
        });

        it('should render all 6 grid types without error', () => {
            renderGrid(container, makeSettings({
                gridTypes: ['thirds', 'golden', 'fibonacci', 'triangle', 'fifths', 'center'],
                showDots: true,
            }));
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('line styles', () => {
        it('should apply dashed style', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'], lineStyle: 'dashed', showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke-dasharray')).toBe('6 4');
        });

        it('should not have dasharray for solid style', () => {
            renderGrid(container, makeSettings({ gridTypes: ['thirds'], lineStyle: 'solid', showDots: false }));
            const line = container.querySelector('line');
            expect(line!.getAttribute('stroke-dasharray')).toBeNull();
        });
    });
});
