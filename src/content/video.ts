// ─── Video Grid Support ──────────────────────────────────────────────────────
// Self-contained module for <video> grid overlay.
// Uses shared utilities from shared.ts — no duplicate state or event handlers.

import {
    ATTR, PENDING,
    getState, isVisibleInDOM,
    renderGridElement, createVideoOverlay, syncOverlayPosition,
    onRenderAll, onNavigate, onInteraction, onMutation, ready,
} from './shared';

// ─── State ───────────────────────────────────────────────────────────────────
interface VideoEntry {
    video: HTMLVideoElement;
    container: HTMLElement;
    overlayDiv: HTMLDivElement;
    resizeObserver?: ResizeObserver;
    originalParentPosition?: string;
}

const videoMap = new Map<HTMLVideoElement, VideoEntry>();

// ─── Rendering ───────────────────────────────────────────────────────────────
function renderOverlay(entry: VideoEntry) {
    const { settings } = getState();
    if (!settings.videoEnabled) {
        entry.overlayDiv.style.display = 'none';
        entry.resizeObserver?.disconnect();
        return;
    }
    entry.overlayDiv.style.display = '';
    entry.resizeObserver?.observe(entry.video);
    renderGridElement(entry.overlayDiv, settings);
}

function renderAllOverlays() {
    const { settings } = getState();
    if (!settings.videoEnabled) {
        // Remove all video overlays when video grid is disabled
        videoMap.forEach((_, video) => cleanupVideo(video));
        return;
    }
    if (videoMap.size === 0) {
        // Just re-enabled — inject immediately on all visible videos
        document.querySelectorAll<HTMLVideoElement>(
            `video:not([${ATTR}]):not([${PENDING}])`
        ).forEach(tryInjectOrDefer);
        return;
    }
    videoMap.forEach((entry) => renderOverlay(entry));
}

// Register with shared event system
onRenderAll(renderAllOverlays);
onNavigate(scheduleRescan);
onInteraction(scheduleRescan);

// ─── Cleanup ─────────────────────────────────────────────────────────────────
function cleanupVideo(video: HTMLVideoElement) {
    const entry = videoMap.get(video);
    if (!entry) return;
    try {
        entry.resizeObserver?.disconnect();
        entry.overlayDiv.textContent = '';
        entry.overlayDiv.remove();
        video.removeAttribute(ATTR);
        // Restore parent's original position
        if (entry.originalParentPosition !== undefined) {
            entry.container.style.position = entry.originalParentPosition;
        }
    } catch {
        // Node may already be removed from DOM
    }
    videoMap.delete(video);
}

// ─── Injection ───────────────────────────────────────────────────────────────
function shouldInject(video: HTMLVideoElement): boolean {
    if (video.getAttribute(ATTR) === 'true') return false;
    const { settings } = getState();
    if (!settings.videoEnabled) return false;
    const minSize = settings.minImageSize;

    if (video.offsetWidth < minSize || video.offsetHeight < minSize) return false;
    if (!isVisibleInDOM(video)) return false;

    return true;
}



function injectGrid(video: HTMLVideoElement) {
    const { tabActive } = getState();
    if (!tabActive) return;
    if (!shouldInject(video)) return;

    // Save parent's original position before createVideoOverlay modifies it
    const parent = video.parentElement;
    const originalParentPosition = parent ? parent.style.position : undefined;

    const overlayDiv = createVideoOverlay(video);
    if (!overlayDiv) return;

    video.setAttribute(ATTR, 'true');

    syncOverlayPosition(video, overlayDiv, video.videoWidth, video.videoHeight);

    let rafId = 0;
    const resizeObserver = new ResizeObserver(() => {
        if (!video.isConnected) { resizeObserver.disconnect(); return; }
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => syncOverlayPosition(video, overlayDiv, video.videoWidth, video.videoHeight));
    });
    resizeObserver.observe(video);

    const entry: VideoEntry = { video, container: video.parentElement!, overlayDiv, resizeObserver, originalParentPosition };

    videoMap.set(video, entry);
    renderOverlay(entry);
}

// ─── Deferred Injection ──────────────────────────────────────────────────────
function tryInjectOrDefer(video: HTMLVideoElement) {
    if (video.getAttribute(ATTR) === 'true') return;
    if (video.getAttribute(PENDING) === 'true') return;

    if (shouldInject(video)) {
        injectGrid(video);
        return;
    }

    video.setAttribute(PENDING, 'true');

    // Listen for loadedmetadata (fires when video metadata is available)
    if (video.readyState < 1) {
        video.addEventListener('loadedmetadata', () => {
            if (video.getAttribute(ATTR) === 'true') return;
            video.removeAttribute(PENDING);
            if (shouldInject(video)) injectGrid(video);
        }, { once: true });
    }

    // Also watch for resize — handles preload="none" videos that get CSS dimensions
    // before metadata loads, and videos in animated/paginated containers
    const { settings } = getState();
    const minSize = settings.minImageSize;
    const ro = new ResizeObserver(() => {
        if (video.getAttribute(ATTR) === 'true') { ro.disconnect(); return; }
        if (video.offsetWidth >= minSize && video.offsetHeight >= minSize) {
            ro.disconnect();
            video.removeAttribute(PENDING);
            if (shouldInject(video)) injectGrid(video);
        }
    });
    ro.observe(video);
    // Auto-cleanup after 10s to avoid memory leaks
    setTimeout(() => { ro.disconnect(); video.removeAttribute(PENDING); }, 10000);
}

// ─── Debounced Rescan ────────────────────────────────────────────────────────
let rescanTimer: ReturnType<typeof setTimeout>;
function scheduleRescan() {
    clearTimeout(rescanTimer);
    rescanTimer = setTimeout(() => {
        document.querySelectorAll<HTMLVideoElement>(
            `video:not([${ATTR}]):not([${PENDING}])`
        ).forEach(tryInjectOrDefer);
    }, 300);
}

// ─── Observers ───────────────────────────────────────────────────────────────
const intersectionObserver = new IntersectionObserver(
    (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const video = entry.target as HTMLVideoElement;
                tryInjectOrDefer(video);
                if (video.getAttribute(ATTR) === 'true' || video.getAttribute(PENDING) === 'true') {
                    intersectionObserver.unobserve(video);
                }
            }
        }
    },
    { rootMargin: '200px' }
);

function observeVideo(video: HTMLVideoElement) {
    if (video.getAttribute(ATTR) === 'true') return;
    intersectionObserver.observe(video);
}

onMutation((mutations) => {
    let hasChildChanges = false;

    for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (!(target instanceof HTMLVideoElement)) continue;
            if (target.getAttribute(ATTR) === 'true') continue;
            if (target.getAttribute(PENDING) === 'true') continue;
            tryInjectOrDefer(target);
            continue;
        }

        // Handle added nodes
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;
            hasChildChanges = true;

            if (el.tagName === 'VIDEO') observeVideo(el as HTMLVideoElement);
            el.querySelectorAll<HTMLVideoElement>('video').forEach(observeVideo);

            // Also detect <source> added inside existing <video>
            if (el.tagName === 'SOURCE' && el.parentElement?.tagName === 'VIDEO') {
                const parentVideo = el.parentElement as HTMLVideoElement;
                if (parentVideo.getAttribute(ATTR) !== 'true') {
                    tryInjectOrDefer(parentVideo);
                }
            }
        }

        // Handle removed nodes — cleanup
        for (const node of mutation.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;
            hasChildChanges = true;
            el.querySelectorAll<HTMLVideoElement>(`video[${ATTR}]`).forEach(cleanupVideo);
            if (el.tagName === 'VIDEO' && el.getAttribute(ATTR) === 'true') {
                cleanupVideo(el as HTMLVideoElement);
            }
        }
    }

    // Schedule rescan on any DOM change — catches pagination, SPA routing, etc.
    if (hasChildChanges) scheduleRescan();
});

// ─── Initialization ──────────────────────────────────────────────────────────
async function init() {
    // Wait for shared init (settings loading) to complete
    const allowed = await ready;
    if (!allowed) return;

    // Process existing videos
    document.querySelectorAll<HTMLVideoElement>('video').forEach(observeVideo);
}

init();
