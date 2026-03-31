// ─── Shared utilities for image and video grid injection ─────────────────────
// Centralizes state, constants, and reusable functions.

import { renderGrid } from './grid-renderer';
import { Settings, DEFAULT_SETTINGS } from '../types';
import { getSettings, onSettingsChanged } from '../utils/storage';
import { MSG } from '../constants/messages';
import { ATTR, PENDING, CSS_OVERLAY_ROOT } from '../constants/dom';

// Re-export constants for consumer modules
export { ATTR, PENDING, CSS_OVERLAY_ROOT };

// ─── Shared State ────────────────────────────────────────────────────────────
let currentSettings: Settings = { ...DEFAULT_SETTINGS };
let tabActive = true;

export function getState() {
    return { settings: currentSettings, tabActive };
}


// ─── DOM Helpers ─────────────────────────────────────────────────────────────────
export function isVisibleInDOM(el: HTMLElement, style?: CSSStyleDeclaration): boolean {
    if (typeof el.checkVisibility === 'function') {
        return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }
    const s = style || window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) !== 0;
}

// ─── Object-fit Bounds Calculation ───────────────────────────────────────────
// Calculate rendered bounds accounting for object-fit on any replaced element
export function calcObjectFitBounds(
    el: HTMLElement,
    natW: number,
    natH: number,
): { left: number; top: number; width: number; height: number } {
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    if (!natW || !natH || !elW || !elH) {
        return { left: el.offsetLeft, top: el.offsetTop, width: elW, height: elH };
    }

    const objectFit = window.getComputedStyle(el).objectFit || 'fill';
    let renderW = elW;
    let renderH = elH;

    if (objectFit === 'contain' || objectFit === 'scale-down') {
        const natRatio = natW / natH;
        const elRatio = elW / elH;
        if (natRatio > elRatio) {
            renderW = elW;
            renderH = elW / natRatio;
        } else {
            renderH = elH;
            renderW = elH * natRatio;
        }
    } else if (objectFit === 'cover') {
        const natRatio = natW / natH;
        const elRatio = elW / elH;
        if (natRatio > elRatio) {
            renderH = elH;
            renderW = elH * natRatio;
        } else {
            renderW = elW;
            renderH = elW / natRatio;
        }
    }

    return {
        left: el.offsetLeft + (elW - renderW) / 2,
        top: el.offsetTop + (elH - renderH) / 2,
        width: renderW,
        height: renderH,
    };
}

// ─── Overlay Rendering ──────────────────────────────────────────────────────
export function renderGridElement(container: HTMLElement, settings: Settings) {
    renderGrid(container, settings);
}

// Position overlay to exactly match element's visible area (accounting for object-fit)
export function syncOverlayPosition(el: HTMLElement, overlayDiv: HTMLDivElement, natW: number, natH: number) {
    const bounds = calcObjectFitBounds(el, natW, natH);
    if (bounds.width <= 0 || bounds.height <= 0) return;
    overlayDiv.style.left = `${bounds.left}px`;
    overlayDiv.style.top = `${bounds.top}px`;
    overlayDiv.style.width = `${bounds.width}px`;
    overlayDiv.style.height = `${bounds.height}px`;
}

// ─── Overlay Injection Helpers ───────────────────────────────────────────────
function createBaseOverlay(el: HTMLElement): { parent: HTMLElement; overlayDiv: HTMLDivElement } | null {
    const parent = el.parentElement;
    if (!parent) return null;

    // Check if this specific element already has an overlay
    if (el.nextElementSibling?.classList.contains(CSS_OVERLAY_ROOT)) return null;

    const overlayDiv = document.createElement('div');
    overlayDiv.className = CSS_OVERLAY_ROOT;
    el.insertAdjacentElement('afterend', overlayDiv);

    return { parent, overlayDiv };
}

export function createImageOverlay(el: HTMLElement): HTMLDivElement | null {
    const result = createBaseOverlay(el);
    if (!result) return null;

    const parentPosition = window.getComputedStyle(result.parent).position;
    if (parentPosition === 'static') {
        result.parent.style.position = 'relative';
    }
    result.parent.style.isolation = 'isolate';

    return result.overlayDiv;
}

export function createVideoOverlay(el: HTMLElement): HTMLDivElement | null {
    const result = createBaseOverlay(el);
    if (!result) return null;

    const elPosition = window.getComputedStyle(el).position;
    // For absolute/fixed videos (e.g. TikTok), don't modify parent — would break layout
    if (elPosition !== 'absolute' && elPosition !== 'fixed') {
        const parentPosition = window.getComputedStyle(result.parent).position;
        if (parentPosition === 'static') {
            result.parent.style.position = 'relative';
        }
    }

    return result.overlayDiv;
}

// ─── Centralized Event System ────────────────────────────────────────────────
type Callback = () => void;
type MutationCb = (mutations: MutationRecord[]) => void;
const renderCallbacks: Callback[] = [];
const navigateCallbacks: Callback[] = [];
const interactionCallbacks: Callback[] = [];
const mutationCallbacks: MutationCb[] = [];

export function onRenderAll(callback: Callback) {
    renderCallbacks.push(callback);
}

export function onNavigate(callback: Callback) {
    navigateCallbacks.push(callback);
}

export function onInteraction(callback: Callback) {
    interactionCallbacks.push(callback);
}

export function onMutation(callback: MutationCb) {
    mutationCallbacks.push(callback);
}

function renderAll() {
    renderCallbacks.forEach((cb) => cb());
}

// ─── User Interaction Detection ─────────────────────────────────────────
let interactionPending = false;
const handleInteraction = () => {
    if (interactionPending) return;
    interactionPending = true;
    setTimeout(() => {
        interactionPending = false;
        interactionCallbacks.forEach((cb) => cb());
    }, 500);
};
window.addEventListener('scroll', handleInteraction, { passive: true });
window.addEventListener('click', handleInteraction, { passive: true });

// ─── SPA Navigation Detection ───────────────────────────────────────────────
// Intercept pushState/replaceState and popstate for SPA route changes
let lastUrl = location.href;
let navTimer: ReturnType<typeof setTimeout>;

function handleNavigation() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    // Debounce — give the SPA time to render new DOM content
    clearTimeout(navTimer);
    navTimer = setTimeout(() => {
        navigateCallbacks.forEach((cb) => cb());
    }, 500);
}

// Monkey-patch pushState and replaceState
const origPushState = history.pushState.bind(history);
const origReplaceState = history.replaceState.bind(history);

history.pushState = function (...args: Parameters<typeof origPushState>) {
    origPushState(...args);
    handleNavigation();
};
history.replaceState = function (...args: Parameters<typeof origReplaceState>) {
    origReplaceState(...args);
    handleNavigation();
};
window.addEventListener('popstate', handleNavigation);

// ─── Initialization ─────────────────────────────────────────────────────────
// Promise that resolves when initShared() completes — other modules await this
let resolveReady: (allowed: boolean) => void;
export const ready = new Promise<boolean>((r) => { resolveReady = r; });

// Called once — sets up settings, message handlers, and settings change listener
export async function initShared(): Promise<boolean> {
    currentSettings = await getSettings();

    // Check site mode
    const currentHost = window.location.hostname;
    if (currentSettings.siteMode === 'block') {
        if (currentSettings.blockList.some((site: string) => currentHost.includes(site))) { resolveReady(false); return false; }
    }
    if (currentSettings.siteMode === 'allow') {
        if (!currentSettings.allowList.some((site: string) => currentHost.includes(site))) { resolveReady(false); return false; }
    }

    // Settings change listener (debounced)
    let settingsTimer: ReturnType<typeof setTimeout>;
    onSettingsChanged((newSettings) => {
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(() => {
            currentSettings = newSettings;
            renderAll();
        }, 100);
    });

    // Tab activation messages
    chrome.runtime.onMessage.addListener((message: { type: string }) => {
        if (message.type === MSG.TAB_ACTIVATED) { tabActive = true; return; }
        if (message.type === MSG.TAB_DEACTIVATED) { tabActive = false; return; }

        if (message.type === MSG.TOGGLE_GRID_ALL) {
            currentSettings.enabled = !currentSettings.enabled;
            renderAll();
            chrome.storage.sync.set({ enabled: currentSettings.enabled });
            return;
        }
        if (message.type === MSG.TOGGLE_LINE_STYLE) {
            currentSettings.lineStyle = currentSettings.lineStyle === 'solid' ? 'dashed' : 'solid';
            renderAll();
            chrome.storage.sync.set({ lineStyle: currentSettings.lineStyle });
            return;
        }
        if (message.type === MSG.TOGGLE_VIDEO) {
            currentSettings.videoEnabled = !currentSettings.videoEnabled;
            renderAll();
            chrome.storage.sync.set({ videoEnabled: currentSettings.videoEnabled });
            return;
        }
        if (message.type === MSG.TOGGLE_COLOR) {
            const { toggleColorA, toggleColorB } = currentSettings;
            const newColor = currentSettings.lineColor === toggleColorA ? toggleColorB : toggleColorA;
            currentSettings.lineColor = newColor;
            currentSettings.dotColor = newColor;
            renderAll();
            chrome.storage.sync.set({ lineColor: newColor, dotColor: newColor });
            return;
        }
    });

    // Start centralized MutationObserver for all modules
    const mutationObserver = new MutationObserver((mutations) => {
        mutationCallbacks.forEach((cb) => cb(mutations));
    });
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy-src', 'data-original', 'class', 'poster'],
    });

    resolveReady(true);
    return true;
}
