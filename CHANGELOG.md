# Changelog

## v1.0.8 — 2026-03-31

### New Features

- **Fifths Grid (Rule of Fifths)** — 5x5 grid overlay (lines at 20/40/60/80%) commonly used in cinematography. Includes 4 power point dots at corner intersections.
- **Center Grid (Crosshair)** — Center crosshair overlay with quarter guidelines (25/75%) at reduced opacity. Ideal for symmetry-focused composition (architecture, portraits, product photography).
- **Opacity Slider** — Adjustable grid opacity (10%–100%, default 75%). Applies to both lines and dots.
- **Grid Type Reset Button** — Reset icon next to "Grid Type" label that restores default grid selection. Only appears when selection differs from default.

### Performance

- **Content script size reduced by 93%** — Replaced React-based grid rendering with a vanilla DOM/SVG renderer. `content.js` dropped from 204 KB to 14.5 KB.
- **Single MutationObserver** — Merged two separate MutationObservers (image + video) into one centralized observer in `shared.ts`, halving DOM mutation callback overhead.
- **Throttled interaction detection** — Replaced `mousemove` debounce (fires hundreds of times/sec) with `click` + `scroll` listeners using a throttle flag. Eliminates unnecessary `clearTimeout`/`setTimeout` churn.
- **Single `getComputedStyle` per image** — `shouldInject()` now computes styles once and passes them to `isVisibleInDOM()`, avoiding a redundant second call.
- **`ResizeObserver` disconnect on detach** — Added `isConnected` guard so observers auto-disconnect when elements are removed from the DOM.
- **Build target `chrome100`** — Vite now targets Chrome 100+ for content and background builds, eliminating unnecessary compatibility transforms.
- **TypeScript strict mode** — Enabled `noUnusedLocals` and `noUnusedParameters` to catch dead code at compile time.

### Improvements

- **DRY `syncOverlayPosition`** — Consolidated duplicate overlay positioning logic (image + video) into a single shared function in `shared.ts`.
- **Centralized event system** — Added `onMutation()` callback registration alongside existing `onRenderAll`, `onNavigate`, and `onInteraction` hooks.
- **Dead code removal** — Removed unused `src/components/` folder (5 React grid component files) replaced by the vanilla DOM renderer.

### Testing

- **Vitest test suite** — Added 33 unit tests covering types/defaults validation, i18n translations, and all 6 grid renderers.
- **CI integration** — Added `npm test` step to GitHub Actions pipeline (runs before build).

### Landing Page

- **Non-blocking Google Fonts** — Fonts now load asynchronously via `preload` + `media="print"` trick, improving LCP.
- **Reduced font weights** — Trimmed from 6 weights (400–900) to 4 (400, 600, 700, 800), saving ~30–40 KB of font download.
- **Parallel GitHub API calls** — Star count and version tag fetches now run via `Promise.all` instead of sequentially.

---

## v1.0.7 — 2026-03-30

### New Features

- **File URL support notice** — Popup shows a helpful notice when extension is opened on `file://` pages without file access permission, with a direct link to settings.
- **Donate notice** — Dismissable "Buy Me a Coffee" card with 24h cooldown in popup footer.

### Improvements

- **Icon consistency** — Popup logo now uses the original SVG icon, preserving colors across both dark and light themes.
- **Footer readability** — Improved text visibility in popup footer and hint labels.
- **Updated description** — Manifest description now includes "video" alongside images.

---

## v1.0.6 — 2026-03-29

### Bug Fixes

- **Conditional overlay injection** — CSS and grid elements are now only injected when the respective overlay (Image/Video) is actually enabled. Previously, overlays were created and hidden via `display:none` even when disabled.
- **Parent style restoration** — `isolation: isolate` and `position: relative` are now properly restored to their original values when overlays are removed. Previously, these styles were left behind after disabling the extension.
- **Independent context menu** — Right-click grid toggle no longer changes the global `enabled` state. It works independently per image regardless of the Image Overlay toggle, and is temporary (cleared on page reload).

### Improvements

- **Smarter re-enable** — When toggling Image Overlay back on, images are re-scanned only on the OFF→ON transition, not on every settings change (e.g. color, line size).
- **Context-menu grids persist** — Grids added via right-click are preserved even when the global Image Overlay is toggled off. Only auto-injected grids are removed.
- **Cleaner DOM** — Disabling the extension now fully removes all injected DOM elements, React roots, ResizeObservers, and restores parent element styles — zero leftover artifacts.

---

## v1.0.5 — 2026-03-24

### New Features

- **Video Overlay** — Composition grid overlay on `<video>` elements
  - Independent toggle (default: off) — separate from image overlay
  - Keyboard shortcut `Alt+V` to toggle video overlay
  - Instant re-enable — grids appear immediately when toggling back on
- **Separate Image & Video Controls** — "Enable Grid" renamed to "Image Overlay", fully independent toggles
- **Updated Keyboard Shortcuts**:
  - `Alt+I` — Toggle image overlay (was `Alt+G`)
  - `Alt+V` — Toggle video overlay (new)
  - `Alt+L` — Toggle line style (restored)
  - `Alt+C` — Quick color toggle (unchanged)
  - Removed: `Alt+G` (grid), `Alt+D` (dots)

### Bug Fixes

- **TikTok compatibility** — Video overlay no longer breaks pages with `position: absolute` videos
  - Separated `createImageOverlay` / `createVideoOverlay` to avoid modifying parent layout on absolute-positioned elements
  - Removed `isolation: isolate` from video overlay to prevent stacking context issues

### Improvements

- **Constants extraction** — Message types (`MSG`) and DOM constants (`ATTR`, `PENDING`, `CSS_OVERLAY_ROOT`) moved to dedicated files (`constants/messages.ts`, `constants/dom.ts`)
- **Centralized event listeners** — `mousemove`/`scroll` listeners consolidated in `shared.ts` via `onInteraction` callback (reduced from 4 listeners to 2)
- **Shared module architecture** — `shared.ts` provides state management, overlay helpers, and event system for both image and video modules
- **Show Dots always visible** — Toggle is always shown regardless of overlay state; Dot Color/Size shown only when dots are enabled

---

## v1.0.4 — 2026-03-23

### New Features

- **Quick Color Toggle** — Instantly swap grid color between two presets with `Alt+C`
  - Customizable color pair — pick any two colors in the popup (default: white / black)
  - Toggles both line color and dot color simultaneously

### Bug Fixes

- **Grid injection on lazy-loaded sites** — Fixed images not getting grids on sites like 35awards.com that swap `src` from placeholder to real URL via JavaScript
- **Background-image photo support** — Fixed grid not appearing on lightbox images that use `src="spacer.gif"` + CSS `background-image` for the real photo
- **Spacer image context menu** — Right-click now correctly finds the real image even when a spacer overlay intercepts the click
- **Duplicate grid prevention** — Skip injection if the parent already has a grid overlay (e.g. lightbox with multiple `<img>` tags)
- **Object-fit aware overlay** — Grid now correctly matches the visible photo area when images use `object-fit: contain/cover/scale-down`
- **Stacking context isolation** — Grid overlays no longer escape above modal/lightbox backdrops using `isolation: isolate`

### Improvements

- **Better Color Swatch Visibility** — Increased border contrast on color pickers so dark colors are visible in dark mode
- Added `--swatch-border` CSS variable for consistent swatch styling across themes
- **MutationObserver watches `src` attribute** — Detects lazy-loaded images that swap their `src` dynamically
- **Deferred injection** — `tryInjectOrDefer` waits for image `load` event when `shouldInject` fails due to incomplete loading
- **Dimension guard** — `syncOverlayPosition` skips updates when image dimensions are zero
- **Merged `getComputedStyle` calls** — Single call per `shouldInject` check instead of two
- **ResizeObserver** — Grid overlay stays aligned when images resize (e.g. window resize in modals)

### Performance

- **Native visibility check** — Replaced JS ancestor traversal with `checkVisibility()` API
- **Debounced ResizeObserver** — Uses `requestAnimationFrame` to batch resize events
- **Eliminated double rendering** — Shortcut handlers no longer trigger redundant re-renders via `onSettingsChanged`
- **Optimized check order** — Cheap size check runs before expensive visibility/style checks in `shouldInject`
- **Smart ResizeObserver lifecycle** — Disconnected when grid is hidden, reconnected when shown
- **MutationObserver guards** — Skips already-injected and pending images on `src` attribute changes

---

## v1.0.3 — 2026-03-22

### New Features

- **Dark / Light Theme** — Switch between dark and light interface for popup & options page
  - New segmented control in the popup to toggle theme
  - Theme preference saved to Chrome Storage and persists across sessions

### Improvements

- Refactored CSS variables to support both themes — extracted hardcoded `rgba()` values into reusable custom properties
- Fixed toggle switch text readability on active state in light theme

---

## v1.0.2 — 2026-03-22

### New Features

- **Site Mode** — Control where the grid appears with three modes:
  - **All Sites** — Grid works on every website (default)
  - **Block List** — Grid works everywhere except listed sites
  - **Allow List** — Grid only works on listed sites
- **Separate Block & Allow Lists** — Each mode maintains its own independent site list
- **Options Page** — Dedicated full-page settings with tabbed navigation (Settings + Allowed Sites)
- **Allowed Sites Button** — Quick access from popup to the options page site management tab
- **Additional Keyboard Shortcuts**:
  - `Alt+D` — Toggle intersection dots
  - `Alt+L` — Switch between solid and dashed lines
- **Dynamic Context Menu** — Right-click menu automatically hides on blocked/disabled sites

### Improvements

- **Grid Components Refactor** — Extracted grid overlays into dedicated component files (`StandardGrid`, `FibonacciSpiral`, `GoldenTriangle`, `IntersectionDot`)
- **Shared Settings Hook** — New `useSettings` hook with debounced saves to avoid Chrome storage rate limits
- **Smart Tab Reuse** — "Allowed Sites" button reuses existing options tab instead of opening duplicates
- **Cleaner Build Output** — Banner folder and `.DS_Store` excluded from `dist/`
- **Minimal Permissions** — Removed `activeTab` and `scripting` permissions; only requires `storage`, `contextMenus`, and `tabs`

### Cleanup

- Removed `alert()` on blocked sites — replaced with hidden context menu
- Removed dead CSS classes (`.cg-grid-wrapper`, `.site-rules-row`, `.reset-link`)
- Removed unused code from previous iterations

### Docs & Landing Page

- Updated README with new features, project structure, settings table, and keyboard shortcuts
- Landing page: updated feature cards (Site Control, Keyboard Shortcuts), added Buy Me a Coffee and Privacy links to footer
- Added Edge shortcuts URL alongside Chrome in documentation

---

## v1.0.1 — 2026-03-20

### New Features

- **Fibonacci Spiral** — New grid overlay with configurable orientation (4 directions)
- **Golden Triangle** — Diagonal composition guide overlay
- **Context Menu** — Right-click any image to toggle grid
- **Keyboard Shortcut** — `Alt+G` to toggle grid
- **Line Style** — Switch between solid and dashed lines (`Alt+L`)
- **Skip Small Images** — Configurable minimum image size threshold

### Improvements

- Bilingual support (English & Vietnamese)
- Custom line width and dot size controls
- IntersectionObserver for efficient lazy injection

---

## v1.0.0 — Initial Release

- Rule of Thirds grid overlay
- Golden Ratio grid overlay
- Intersection dots with custom colors
- Works on all websites
- Chrome & Edge support (Manifest V3)
