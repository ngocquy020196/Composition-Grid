// ─── Vanilla DOM/SVG Grid Renderer ───────────────────────────────────────────
// Replaces React GridOverlay for the content script build.
// Renders grids using pure DOM manipulation — no React dependency.

import type { Settings, SpiralOrientation } from '../types';
import { GRID } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_STYLE = 'position:absolute;top:0;left:0;width:100%;height:100%';

const GRID_POSITIONS = {
    [GRID.THIRDS]: [33.333, 66.667],
    [GRID.GOLDEN]: [38.197, 61.803],
} satisfies Record<'thirds' | 'golden', [number, number]>;

const SPIRAL_TRANSFORMS: Record<SpiralOrientation, string> = {
    0: 'none',
    1: 'scaleX(-1)',
    2: 'scale(-1, -1)',
    3: 'scaleY(-1)',
};

const FIFTHS_DOTS: [number, number][] = [
    [20, 20], [20, 80], [80, 20], [80, 80],
];

const CENTER_DOT: [number, number][] = [[50, 50]];

// Pre-compute Fibonacci spiral geometry (fixed viewBox 161.8 × 100)
const FIBONACCI = (() => {
    const VW = 161.8, VH = 100;
    let x = 0, y = 0, w = VW, h = VH;
    const pathParts: string[] = [];
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    for (let i = 0; i < 10; i++) {
        const dir = i % 4;
        let sq: number, toX: number, toY: number;

        switch (dir) {
            case 0:
                sq = h;
                if (i === 0) pathParts.push(`M ${x} ${y + sq}`);
                toX = x + sq; toY = y;
                lines.push({ x1: x + sq, y1: y, x2: x + sq, y2: y + h });
                pathParts.push(`A ${sq} ${sq} 0 0 1 ${toX} ${toY}`);
                x += sq; w -= sq;
                break;
            case 1:
                sq = w;
                toX = x + sq; toY = y + sq;
                lines.push({ x1: x, y1: y + sq, x2: x + w, y2: y + sq });
                pathParts.push(`A ${sq} ${sq} 0 0 1 ${toX} ${toY}`);
                y += sq; h -= sq;
                break;
            case 2:
                sq = h;
                toX = x + w - sq; toY = y + h;
                lines.push({ x1: x + w - sq, y1: y, x2: x + w - sq, y2: y + h });
                pathParts.push(`A ${sq} ${sq} 0 0 1 ${toX} ${toY}`);
                w -= sq;
                break;
            case 3:
                sq = w;
                toX = x; toY = y + h - sq;
                lines.push({ x1: x, y1: y + h - sq, x2: x + w, y2: y + h - sq });
                pathParts.push(`A ${sq} ${sq} 0 0 1 ${toX} ${toY}`);
                h -= sq;
                break;
        }
    }

    return { path: pathParts.join(' '), lines, viewBox: `0 0 ${VW} ${VH}` };
})();

// ─── SVG Helpers ─────────────────────────────────────────────────────────────

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, tag);
}

function createSVG(viewBox: string): SVGSVGElement {
    const svg = svgEl('svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = SVG_STYLE;
    return svg;
}

function addLine(
    svg: SVGSVGElement,
    x1: number, y1: number, x2: number, y2: number,
    stroke: string, strokeWidth: number,
    dashArray?: string, opacity?: number,
) {
    const line = svgEl('line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    if (dashArray) line.setAttribute('stroke-dasharray', dashArray);
    if (opacity !== undefined) line.setAttribute('opacity', String(opacity));
    svg.appendChild(line);
}

function createDot(cx: number, cy: number, color: string, size: number): HTMLDivElement {
    const dot = document.createElement('div');
    dot.style.cssText = `position:absolute;left:${cx}%;top:${cy}%;width:${size}px;height:${size}px;border-radius:50%;background:${color};transform:translate(-50%,-50%);box-shadow:0 0 2px rgba(0,0,0,0.5)`;
    return dot;
}

// ─── Grid Builders ───────────────────────────────────────────────────────────

function buildStandardGrid(
    type: 'thirds' | 'golden',
    lineColor: string, lineSize: number, dashArray?: string,
    showDots?: boolean, dotColor?: string, dotSize?: number,
): DocumentFragment {
    const frag = document.createDocumentFragment();
    const [p1, p2] = GRID_POSITIONS[type];
    const svg = createSVG('0 0 100 100');

    addLine(svg, p1, 0, p1, 100, lineColor, lineSize, dashArray);
    addLine(svg, p2, 0, p2, 100, lineColor, lineSize, dashArray);
    addLine(svg, 0, p1, 100, p1, lineColor, lineSize, dashArray);
    addLine(svg, 0, p2, 100, p2, lineColor, lineSize, dashArray);
    frag.appendChild(svg);

    if (showDots && dotColor && dotSize) {
        for (const [cx, cy] of [[p1, p1], [p1, p2], [p2, p1], [p2, p2]]) {
            frag.appendChild(createDot(cx, cy, dotColor, dotSize));
        }
    }

    return frag;
}

function buildFibonacciSpiral(
    lineColor: string, lineSize: number, dashArray: string | undefined,
    orientation: SpiralOrientation,
): DocumentFragment {
    const frag = document.createDocumentFragment();

    // Wrapper for orientation transform
    const wrapper = document.createElement('div');
    const xform = SPIRAL_TRANSFORMS[orientation];
    wrapper.style.cssText = `width:100%;height:100%;transform:${xform}`;

    const svg = createSVG(FIBONACCI.viewBox);

    // Division lines
    for (const l of FIBONACCI.lines) {
        addLine(svg, l.x1, l.y1, l.x2, l.y2, lineColor, lineSize * 0.5, dashArray, 0.4);
    }

    // Spiral path
    const path = svgEl('path');
    path.setAttribute('d', FIBONACCI.path);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', lineColor);
    path.setAttribute('stroke-width', String(lineSize * 1.5));
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    if (dashArray) path.setAttribute('stroke-dasharray', dashArray);
    svg.appendChild(path);

    wrapper.appendChild(svg);
    frag.appendChild(wrapper);
    return frag;
}

function buildGoldenTriangle(
    lineColor: string, lineSize: number, dashArray: string | undefined,
    showDots?: boolean, dotColor?: string, dotSize?: number,
): DocumentFragment {
    const frag = document.createDocumentFragment();
    const svg = createSVG('0 0 100 100');
    const sw = lineSize * 0.8;

    // Main diagonal: bottom-left to top-right
    addLine(svg, 0, 100, 100, 0, lineColor, lineSize, dashArray);
    // Secondary diagonal: top-left to bottom-right
    addLine(svg, 0, 0, 100, 100, lineColor, lineSize, dashArray, 0.5);
    // Perpendiculars to center
    addLine(svg, 0, 0, 50, 50, lineColor, sw, dashArray, 0.7);
    addLine(svg, 100, 100, 50, 50, lineColor, sw, dashArray, 0.7);
    addLine(svg, 100, 0, 50, 50, lineColor, sw, dashArray, 0.6);
    addLine(svg, 0, 100, 50, 50, lineColor, sw, dashArray, 0.6);

    frag.appendChild(svg);

    if (showDots && dotColor && dotSize) {
        for (const [cx, cy] of CENTER_DOT) {
            frag.appendChild(createDot(cx, cy, dotColor, dotSize));
        }
    }

    return frag;
}

function buildFifthsGrid(
    lineColor: string, lineSize: number, dashArray?: string,
    showDots?: boolean, dotColor?: string, dotSize?: number,
): DocumentFragment {
    const frag = document.createDocumentFragment();
    const svg = createSVG('0 0 100 100');
    const positions = [20, 40, 60, 80];

    for (const p of positions) {
        addLine(svg, p, 0, p, 100, lineColor, lineSize, dashArray);
        addLine(svg, 0, p, 100, p, lineColor, lineSize, dashArray);
    }
    frag.appendChild(svg);

    if (showDots && dotColor && dotSize) {
        for (const [cx, cy] of FIFTHS_DOTS) {
            frag.appendChild(createDot(cx, cy, dotColor, dotSize));
        }
    }

    return frag;
}

function buildCenterGrid(
    lineColor: string, lineSize: number, dashArray?: string,
    showDots?: boolean, dotColor?: string, dotSize?: number,
): DocumentFragment {
    const frag = document.createDocumentFragment();
    const svg = createSVG('0 0 100 100');

    // Center crosshair
    addLine(svg, 50, 0, 50, 100, lineColor, lineSize, dashArray);
    addLine(svg, 0, 50, 100, 50, lineColor, lineSize, dashArray);

    // Quarter guidelines (lighter)
    const sw = lineSize * 0.5;
    addLine(svg, 25, 0, 25, 100, lineColor, sw, dashArray, 0.25);
    addLine(svg, 75, 0, 75, 100, lineColor, sw, dashArray, 0.25);
    addLine(svg, 0, 25, 100, 25, lineColor, sw, dashArray, 0.25);
    addLine(svg, 0, 75, 100, 75, lineColor, sw, dashArray, 0.25);

    frag.appendChild(svg);

    if (showDots && dotColor && dotSize) {
        for (const [cx, cy] of CENTER_DOT) {
            frag.appendChild(createDot(cx, cy, dotColor, dotSize));
        }
    }

    return frag;
}

// ─── Main Render Function ────────────────────────────────────────────────────

export function renderGrid(container: HTMLElement, settings: Settings): void {
    container.textContent = ''; // Fast clear

    const { gridTypes, lineColor, lineSize, lineStyle, dotColor, showDots, dotSize, spiralOrientation, opacity } = settings;
    const dashArray = lineStyle === 'dashed' ? '6 4' : undefined;

    container.style.opacity = String(opacity);

    for (const type of gridTypes) {
        switch (type) {
            case GRID.THIRDS:
            case GRID.GOLDEN:
                container.appendChild(
                    buildStandardGrid(type, lineColor, lineSize, dashArray, showDots, dotColor, dotSize),
                );
                break;
            case GRID.FIBONACCI:
                container.appendChild(
                    buildFibonacciSpiral(lineColor, lineSize, dashArray, spiralOrientation),
                );
                break;
            case GRID.TRIANGLE:
                container.appendChild(
                    buildGoldenTriangle(lineColor, lineSize, dashArray, showDots, dotColor, dotSize),
                );
                break;
            case GRID.FIFTHS:
                container.appendChild(
                    buildFifthsGrid(lineColor, lineSize, dashArray, showDots, dotColor, dotSize),
                );
                break;
            case GRID.CENTER:
                container.appendChild(
                    buildCenterGrid(lineColor, lineSize, dashArray, showDots, dotColor, dotSize),
                );
                break;
        }
    }
}

