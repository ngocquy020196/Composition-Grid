
import {
    ATTR, PENDING,
    getState, isVisibleInDOM,
    renderGridElement, createImageOverlay, syncOverlayPosition,
    onRenderAll, onNavigate, onInteraction, onMutation, initShared,
} from './shared';
import { MSG } from '../constants/messages';
import './video'; // Video grid support (self-contained)

// ─── Constants ───────────────────────────────────────────────────────────────
// Common avatar/thumbnail indicators in class names, alt text, or src
const SKIP_PATTERNS = /avatar|icon|thumb|logo|badge|emoji|profile[-_]?(?:pic|img|photo)|favicon/i;

// ─── State ───────────────────────────────────────────────────────────────────
interface InjectedEntry {
    img: HTMLImageElement;
    container: HTMLElement;
    overlayDiv: HTMLDivElement;
    resizeObserver?: ResizeObserver;
    originalParentStyles?: { position: string; isolation: string };
}

const injectedMap = new Map<HTMLImageElement, InjectedEntry>();
// Track images injected via context menu — these work independently of `enabled` state
const contextMenuImages = new Set<HTMLImageElement>();

// ─── Rendering ───────────────────────────────────────────────────────────────
function renderOverlay(entry: InjectedEntry) {
    const { settings } = getState();
    // Context-menu images always show regardless of enabled state
    if (!settings.enabled && !contextMenuImages.has(entry.img)) {
        entry.overlayDiv.style.display = 'none';
        entry.resizeObserver?.disconnect();
        return;
    }
    entry.overlayDiv.style.display = '';
    entry.resizeObserver?.observe(entry.img);
    renderGridElement(entry.overlayDiv, settings);
}

let prevEnabled = false; // tracks previous enabled state for OFF→ON detection

function renderAllOverlays() {
    const { settings } = getState();
    const justEnabled = settings.enabled && !prevEnabled;
    prevEnabled = settings.enabled;

    if (!settings.enabled) {
        // Remove auto-injected overlays, but keep context-menu ones
        injectedMap.forEach((entry, img) => {
            if (contextMenuImages.has(img)) {
                renderOverlay(entry);
            } else {
                cleanupImage(img);
            }
        });
        return;
    }
    // Re-render existing overlays
    injectedMap.forEach((entry) => renderOverlay(entry));
    // Only rescan when just re-enabled (OFF→ON), not on every settings change
    if (justEnabled) rescanImages();
}

// Register with shared event system
onRenderAll(renderAllOverlays);
onNavigate(rescanImages);
onInteraction(rescanImages);

function rescanImages() {
    document.querySelectorAll<HTMLImageElement>(
        `img:not([${ATTR}]):not([${PENDING}])`
    ).forEach(tryInjectOrDefer);
}

// ─── Cleanup Helper ──────────────────────────────────────────────────────────
function cleanupImage(img: HTMLImageElement) {
    const entry = injectedMap.get(img);
    if (!entry) return;
    try {
        entry.resizeObserver?.disconnect();
        entry.overlayDiv.textContent = '';
        entry.overlayDiv.remove();
        img.removeAttribute(ATTR);
        // Restore parent's original styles
        if (entry.originalParentStyles) {
            entry.container.style.position = entry.originalParentStyles.position;
            entry.container.style.isolation = entry.originalParentStyles.isolation;
        }
    } catch {
        // Node may already be removed from DOM
    }
    injectedMap.delete(img);
    contextMenuImages.delete(img);
}

// ─── Injection ───────────────────────────────────────────────────────────────
function shouldInject(img: HTMLImageElement): boolean {
    if (img.getAttribute(ATTR) === 'true') return false;
    const { settings } = getState();
    if (!settings.enabled) return false;
    const minSize = settings.minImageSize;

    // Cheap size check first — filters out most images before expensive calls
    if (img.width < minSize || img.height < minSize) return false;

    // Single getComputedStyle call for all style-dependent checks
    const style = window.getComputedStyle(img);

    // Skip hidden images (display:none, visibility:hidden, opacity:0)
    if (!isVisibleInDOM(img, style)) return false;

    // Size checks — skip small natural dimensions
    // Some sites use spacer.gif with background-image for the real photo.
    // Only filter by natural dimensions if there's no background-image.
    const hasBgImage = style.backgroundImage !== 'none';
    if (!hasBgImage) {
        if (img.naturalWidth > 0 && img.naturalWidth < minSize) return false;
        if (img.naturalHeight > 0 && img.naturalHeight < minSize) return false;
    }

    // Skip tiny data URIs (inline icons)
    const src = img.src || '';
    if (src.startsWith('data:') && src.length < 500) return false;

    // Skip decorative / presentation images
    if (img.getAttribute('role') === 'presentation') return false;

    // Skip circular images (likely avatars)
    const radius = parseFloat(style.borderRadius);
    if (radius >= Math.min(img.width, img.height) / 2) return false;

    // Skip images whose class, alt, or src match avatar/thumbnail patterns
    const textToCheck = `${img.className} ${img.alt} ${src}`;
    if (SKIP_PATTERNS.test(textToCheck)) return false;

    return true;
}

function injectGrid(img: HTMLImageElement, force = false) {
    const { tabActive } = getState();
    if (!tabActive) return;
    if (!force && !shouldInject(img)) return;
    if (img.getAttribute(ATTR) === 'true') return;

    // Save parent's original styles before createImageOverlay modifies them
    const parent = img.parentElement;
    const originalParentStyles = parent ? {
        position: parent.style.position,
        isolation: parent.style.isolation,
    } : undefined;

    const overlayDiv = createImageOverlay(img);
    if (!overlayDiv) return;

    img.setAttribute(ATTR, 'true');

    // Position overlay to match image bounds (not parent bounds)
    syncOverlayPosition(img, overlayDiv, img.naturalWidth, img.naturalHeight);

    // Keep overlay aligned when image resizes — debounced to avoid jank during animations
    let rafId = 0;
    const resizeObserver = new ResizeObserver(() => {
        if (!img.isConnected) { resizeObserver.disconnect(); return; }
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => syncOverlayPosition(img, overlayDiv, img.naturalWidth, img.naturalHeight));
    });
    resizeObserver.observe(img);

    const entry: InjectedEntry = { img, container: img.parentElement!, overlayDiv, resizeObserver, originalParentStyles };

    injectedMap.set(img, entry);
    renderOverlay(entry);
}

// ─── IntersectionObserver ────────────────────────────────────────────────────
function tryInjectOrDefer(img: HTMLImageElement) {
    if (img.getAttribute(ATTR) === 'true') return;
    if (img.getAttribute(PENDING) === 'true') return;
    if (shouldInject(img)) {
        injectGrid(img);
        return;
    }

    // Image may not be loaded yet (width/height = 0 on lazy-loaded sites).
    // Wait for its load event and retry once.
    if (!img.complete) {
        img.setAttribute(PENDING, 'true');
        img.addEventListener('load', () => {
            img.removeAttribute(PENDING);
            if (shouldInject(img)) injectGrid(img);
        }, { once: true });
        return;
    }

    // Image is loaded but has zero/small dimensions (e.g. React lightbox animation).
    // Watch for resize and retry once it reaches visible size.
    const { settings } = getState();
    const minSize = settings.minImageSize;
    if (img.width < minSize || img.height < minSize) {
        img.setAttribute(PENDING, 'true');
        const ro = new ResizeObserver(() => {
            if (img.width >= minSize && img.height >= minSize) {
                ro.disconnect();
                img.removeAttribute(PENDING);
                if (shouldInject(img)) injectGrid(img);
            }
        });
        ro.observe(img);
        // Auto-cleanup after 10s to avoid memory leaks
        setTimeout(() => { ro.disconnect(); img.removeAttribute(PENDING); }, 10000);
    }
}

const intersectionObserver = new IntersectionObserver(
    (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                tryInjectOrDefer(img);
                // Only stop observing if injection succeeded or a retry is pending
                if (img.getAttribute(ATTR) === 'true' || img.getAttribute(PENDING) === 'true') {
                    intersectionObserver.unobserve(img);
                }
            }
        }
    },
    { rootMargin: '200px' }
);

function observeImage(img: HTMLImageElement) {
    if (img.getAttribute(ATTR) === 'true') return;
    intersectionObserver.observe(img);
}

// ─── MutationObserver Callback ───────────────────────────────────────────────
onMutation((mutations) => {
    for (const mutation of mutations) {
        // Handle lazy-load attribute changes (src, srcset, data-src, class)
        if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (!(target instanceof HTMLImageElement)) continue;
            if (target.getAttribute(ATTR) === 'true') continue;
            if (target.getAttribute(PENDING) === 'true') continue;
            tryInjectOrDefer(target);
            continue;
        }

        // Handle added nodes
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;

            if (el.tagName === 'IMG') {
                observeImage(el as HTMLImageElement);
            }

            // Search children for images
            const imgs = el.querySelectorAll<HTMLImageElement>('img');
            imgs.forEach(observeImage);
        }

        // Handle removed nodes — cleanup
        for (const node of mutation.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;

            // Clean up injected images within the removed element
            el.querySelectorAll<HTMLImageElement>(`img[${ATTR}]`)
                .forEach(cleanupImage);

            // Check if the removed element itself is an injected image
            if (el.tagName === 'IMG' && el.getAttribute(ATTR) === 'true') {
                cleanupImage(el as HTMLImageElement);
            }
        }
    }
});

// ─── Context Menu Message Handler (image-specific) ───────────────────────────
chrome.runtime.onMessage.addListener((message: { type: string; srcUrl?: string }) => {
    if (message.type !== MSG.TOGGLE_GRID || !message.srcUrl) return;

    // Find the image by its src URL
    const images = document.querySelectorAll<HTMLImageElement>('img');
    let targetImg: HTMLImageElement | null = null;

    for (const img of images) {
        if (img.src === message.srcUrl || img.currentSrc === message.srcUrl) {
            targetImg = img;
            break;
        }
    }

    // Fallback: if srcUrl matched a spacer/presentation image.
    // look for the real sibling image in the same parent
    if (targetImg && targetImg.getAttribute('role') === 'presentation') {
        const parent = targetImg.parentElement;
        if (parent) {
            const sibling = Array.from(parent.querySelectorAll<HTMLImageElement>('img'))
                .find(img => img !== targetImg && img.getAttribute('role') !== 'presentation');
            if (sibling) targetImg = sibling;
        }
    }

    if (!targetImg) return;

    {
        const img = targetImg;
        const entry = injectedMap.get(img);

        if (entry) {
            // Grid exists → remove it
            cleanupImage(img);
        } else {
            // No grid → inject independently (works regardless of enabled state)
            contextMenuImages.add(img);
            injectGrid(img, true);
        }
    }
});

// ─── Initialization ──────────────────────────────────────────────────────────
async function init() {
    const allowed = await initShared();
    if (!allowed) return;

    // Sync prevEnabled with initial settings
    prevEnabled = getState().settings.enabled;

    // Process existing images via IntersectionObserver
    const existingImages = document.querySelectorAll<HTMLImageElement>('img');
    existingImages.forEach(observeImage);
}

// Start
init();
