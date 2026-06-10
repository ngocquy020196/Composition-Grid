<p align="center">
  <img src="public/icons/icon128.png" alt="Composition Grid Logo" width="96" height="96" />
</p>

<h1 align="center">Composition Grid</h1>

<p align="center">
  <strong>Rule of Thirds, Golden Ratio, Fibonacci Spiral, Triangle, Fifths & Center guides for any image on the web</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/version-1.1.4-green" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License" />
  <img src="https://img.shields.io/badge/lang-14%20languages-blueviolet" alt="Languages" />
  <a href="https://app.netlify.com/projects/verdant-dolphin-649972/deploys"><img src="https://api.netlify.com/api/v1/badges/8b28cbe6-2074-485d-ab8a-dc2d6e9a527a/deploy-status" alt="Netlify Status" /></a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/composition-grid-rule-of/jogbipaobeabiebmceafacioemlincdl"><img src="https://img.shields.io/badge/Chrome-Install-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Web Store" /></a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/keaefbocibpijkfgjlbcdlgahplmekof"><img src="https://img.shields.io/badge/Edge-Install-0078D7?logo=microsoftedge&logoColor=white" alt="Edge Add-ons" /></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/composition-grid-rule-of-third/"><img src="https://img.shields.io/badge/Firefox-Install-FF7139?logo=firefox&logoColor=white" alt="Firefox Add-ons" /></a>
</p>

---

A lightweight Chrome, Edge & Firefox extension that overlays **Rule of Thirds**, **Golden Ratio**, **Fibonacci Spiral**, **Golden Triangle**, **Fifths**, and **Center Crosshair** composition grids directly onto images and video on any website. Perfect for photographers, designers, and visual artists who want to analyze compositional balance without leaving the browser.

## Features

- **Six Grid Types** — Rule of Thirds, Golden Ratio, Fibonacci Spiral, Golden Triangle, Fifths & Center Crosshair
- **Video Overlay** — Composition grid on `<video>` elements (independent toggle)
- **Opacity Control** — Adjustable grid transparency (10%–100%)
- **Intersection Dots** — Highlight power points with toggleable dots
- **Custom Colors** — Pick any color for grid lines and dots
- **Keyboard Shortcuts** — `Alt+I` image overlay, `Alt+V` video overlay, `Alt+L` line style, `Alt+C` quick color
- **Quick Color Toggle** — Swap grid color between two customizable presets with a Shortcut
- **Context Menu** — Right-click any image to toggle the grid overlay
- **Site Mode** — All Sites / Block List / Allow List — control where the grid appears
- **Dark / Light Theme** — Switch between dark and light interface
- **Interactive Tooltip Tour** — Step-by-step guided tour for new users with highlighted controls
- **Options Page** — Dedicated settings page with site management
- **14 Languages** — UI automatically follows the browser language (English, Tiếng Việt, Español, Português-BR, Français, Deutsch, Русский, 日本語, 한국어, 简体中文, 繁體中文, हिन्दी, Indonesia, العربية), with a one-tap "switch to English" toggle
- **High Performance** — Uses IntersectionObserver & MutationObserver for efficient image detection
- **Manifest V3** — Built with the latest Chrome, Edge & Firefox extension standard

## How It Works

1. Install the extension
2. Navigate to any page with images
3. The grid overlay automatically appears on detected images
4. Use any of these methods to control the grid:
   - **Popup** — Click the extension icon to customize all settings
   - **Keyboard** — Press `Alt+I` to quickly toggle image overlay on/off
   - **Right-click** — Right-click any image to toggle the grid overlay
5. Customize settings in the popup:
   - Toggle grid on/off
   - Toggle intersection dots
   - Choose grid types (Rule of Thirds, Golden Ratio, Fibonacci Spiral, Triangle, Fifths, Center)
   - Set spiral orientation for Fibonacci Spiral
   - Customize line and dot colors & sizes
   - The UI follows your browser language automatically; switch to English in one tap when your browser is set to another language
6. First-time users see an **interactive guided tour** highlighting each control

## Tech Stack

| Technology | Purpose |
|---|---|
| **Vite** | Fast build tooling |
| **React 19** | Popup UI & overlay components |
| **TypeScript** | Type-safe codebase |
| **Manifest V3** | Chrome, Edge & Firefox extension platform |

## Project Structure

```
composition-grid/
├── public/
│   ├── _locales/               # Chrome i18n translations (14 languages, one messages.json each)
│   ├── icons/                  # Extension icons (16, 48, 128px)
│   └── manifest.json           # Extension manifest (Chrome & Edge — Firefox generated at build)
├── src/
│   ├── background/
│   │   └── index.ts            # Service worker (context menu & keyboard shortcuts)
│   ├── content/
│   │   ├── index.ts            # Content script (image detection & injection)
│   │   ├── video.ts            # Video overlay (detection & injection)
│   │   ├── shared.ts           # Shared state, utilities & event system
│   │   ├── grid-renderer.ts    # Vanilla DOM/SVG grid renderer (6 types)
│   │   └── content.css         # Overlay positioning styles
│   ├── constants/
│   │   ├── messages.ts         # Message type constants
│   │   └── dom.ts              # DOM-related constants
│   ├── hooks/
│   │   └── useSettings.ts     # Shared settings hook (debounced saves)
│   ├── i18n/
│   │   └── index.ts            # i18n helpers over Chrome native i18n (reads public/_locales)
│   ├── options/
│   │   ├── Options.tsx         # Options page (settings + site management)
│   │   ├── main.tsx            # Options entry point
│   │   └── options.css         # Options page styles
│   ├── popup/
│   │   ├── App.tsx             # Settings popup UI
│   │   ├── main.tsx            # Popup entry point
│   │   └── popup.css           # Popup styles
│   ├── components/
│   │   └── Tour/
│   │       ├── Tour.tsx        # Interactive tooltip tour component
│   │       └── tourSteps.ts    # Tour step definitions
│   ├── utils/
│   │   └── storage.ts          # Chrome storage API wrapper
│   └── types.ts                # TypeScript types & default settings
├── landing/                    # Landing page (static HTML/CSS)
├── popup.html                  # Popup HTML shell
├── options.html                # Options page HTML shell
├── scripts/
│   └── build-firefox.js        # Firefox manifest generator (dist → dist-firefox)
├── vite.config.ts              # Vite config (popup + content + background builds)
├── vitest.config.ts            # Vitest test config (jsdom)
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9

### Install Dependencies

```bash
npm install
```

### Build for Production

```bash
# Chrome & Edge
npm run build

# Firefox
npm run build:firefox
```

This builds the popup, content script, and background service worker into the `dist/` directory (Chrome/Edge) or `dist-firefox/` (Firefox).

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Navigate to any website with images — the grid overlay will appear!

### Load in Microsoft Edge

1. Open `edge://extensions/`
2. Enable **Developer mode** (left sidebar)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. The extension works the same as in Chrome!

### Load in Firefox

1. Run `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `dist-firefox/manifest.json`
5. Navigate to any website with images — the grid overlay will appear!

### Development

```bash
# Build popup only
npm run build:popup

# Build content script only
npm run build:content

# Build Firefox version
npm run build:firefox

# Run tests
npm test               # Run once
npm run test:watch     # Watch mode

# Create distribution zip files
npm run zip            # Chrome/Edge zip
npm run zip:firefox    # Firefox zip
```

## Settings

| Setting | Description | Default |
|---|---|---|
| Image Overlay | Toggle image grid on/off | On |
| Video Overlay | Toggle video grid on/off | Off |
| Show Dots | Toggle intersection point dots | On |
| Grid Type | Rule of Thirds, Golden Ratio, Fibonacci Spiral, Triangle, Fifths, Center (multi-select) | Rule of Thirds, Triangle |
| Spiral Direction | Fibonacci spiral orientation | Top-Left |
| Line Color | Color of grid lines | `#ffffff` |
| Dot Color | Color of intersection dots | `#ffffff` |
| Dot Size | Size of intersection dots (2–20px) | `8px` |
| Line Width | Thickness of grid lines (0.5–5px) | `1px` |
| Line Style | Solid or Dashed | Solid |
| Opacity | Grid transparency (10%–100%) | `75%` |
| Skip Small Images | Minimum image size to show grid (50–500px) | `200px` |
| Site Mode | All Sites / Block List / Allow List | All Sites |
| Theme | Dark or Light interface | Dark |
| Quick Color | Two preset colors for quick toggle (`Alt+C`) | `#ffffff` / `#000000` |
| Language | Follows the browser language (14 supported) + quick switch to English | Browser language |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+I` | Toggle image overlay on/off |
| `Alt+V` | Toggle video overlay on/off |
| `Alt+L` | Switch between solid and dashed lines |
| `Alt+C` | Quick color toggle (swap both line and intersection dot colors between two presets) |

You can customize these shortcuts at `chrome://extensions/shortcuts`, `edge://extensions/shortcuts`, or Firefox's `about:addons` → Manage Extension Shortcuts.

## Contributing

Contributions are welcome! Feel free to:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Author

**Quy Nguyen**

- Website: [ngocquy.dev](https://ngocquy.dev/?ref=github-composition-grid)
- Email: [contact@ngocquy.dev](mailto:contact@ngocquy.dev)

<a href="https://buymeacoffee.com/ngocquy.dev/?ref=github-composition-grid" target="_blank">
  <img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" >
</a>

---
