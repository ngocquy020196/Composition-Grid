import React, { useEffect, useState } from 'react';
import { GridType, LineStyle, SpiralOrientation, Theme, DEFAULT_SETTINGS, GRID } from '../types';
import { useSettings } from '../hooks/useSettings';
import { t, getBrowserLang, isBrowserNonEnglish } from '../i18n';
import Tour from '../components/Tour/Tour';

// Browser UI language is fixed for the popup's lifetime — resolve once at load,
// not on every render.
const browserLang = getBrowserLang();
const showLangSwitch = isBrowserNonEnglish();

const App: React.FC = () => {
    const { settings, loaded, update, reset } = useSettings();
    const lang: 'auto' | 'en' = settings.forceEnglish ? 'en' : 'auto';
    const [fileAccessWarning, setFileAccessWarning] = useState(false);
    const [showDonate, setShowDonate] = useState(false);
    const [showTour, setShowTour] = useState(false);

    // Apply theme to document root
    useEffect(() => {
        document.documentElement.dataset.theme = settings.theme;
    }, [settings.theme]);

    // Check if current tab is file:// and extension lacks file access
    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.startsWith('file://')) {
                chrome.extension.isAllowedFileSchemeAccess((allowed) => {
                    if (!allowed) setFileAccessWarning(true);
                });
            }
        });
    }, []);

    // Check donate dismiss (24h cooldown)
    useEffect(() => {
        chrome.storage.local.get('donateDismissedAt', (result) => {
            const dismissed = result.donateDismissedAt as number | undefined;
            if (!dismissed || Date.now() - dismissed > 24 * 60 * 60 * 1000) {
                setShowDonate(true);
            }
        });
    }, []);

    // Auto-show tour on first install
    useEffect(() => {
        chrome.storage.local.get('tourCompleted', (result) => {
            if (!result.tourCompleted) {
                setShowTour(true);
            }
        });
    }, []);

    const completeTour = () => {
        setShowTour(false);
        chrome.storage.local.set({ tourCompleted: true });
    };

    const replayTour = () => {
        setShowTour(true);
    };

    if (!loaded) return null;

    return (
        <div className="popup-container">
            {/* Header */}
            <header className="popup-header">
                <div className="header-icon">
                    <img src={chrome.runtime.getURL('icons/icon128.svg')} alt="logo" width="36" height="36" />
                </div>
                <div className="header-text">
                    <h1>{t('appName', lang)}</h1>
                    <p>{t('appTagline', lang)}</p>
                </div>
            </header>

            {/* File access warning */}
            {fileAccessWarning && (
                <div className="file-access-notice">
                    <p>{t('fileAccessNotice', lang)}</p>
                    <button onClick={() => {
                        chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
                    }}>{t('fileAccessAction', lang)}</button>
                </div>
            )}

            {/* Image Overlay toggle */}
            <div className="setting-row toggle-row" data-tour="image-overlay">
                <div className="setting-label-group">
                    <span className="setting-label">{t('enableGrid', lang)}</span>
                    <span className="shortcut-hint">
                        <kbd>Alt</kbd><span className="shortcut-plus">+</span><kbd>I</kbd>
                    </span>
                </div>
                <button
                    className={`toggle-btn ${settings.enabled ? 'active' : ''}`}
                    onClick={() => update('enabled', !settings.enabled)}
                    aria-label={t('ariaToggleImage', lang)}
                >
                    <span className="toggle-knob" />
                    <span className="toggle-text">
                        {settings.enabled ? t('enabled', lang) : t('disabled', lang)}
                    </span>
                </button>
            </div>

            {/* Video Overlay toggle */}
            <div className="setting-row toggle-row" data-tour="video-overlay">
                <div className="setting-label-group">
                    <span className="setting-label">{t('videoEnabled', lang)}</span>
                    <span className="shortcut-hint">
                        <kbd>Alt</kbd><span className="shortcut-plus">+</span><kbd>V</kbd>
                    </span>
                </div>
                <button
                    className={`toggle-btn ${settings.videoEnabled ? 'active' : ''}`}
                    onClick={() => update('videoEnabled', !settings.videoEnabled)}
                    aria-label={t('ariaToggleVideo', lang)}
                >
                    <span className="toggle-knob" />
                    <span className="toggle-text">
                        {settings.videoEnabled ? t('enabled', lang) : t('disabled', lang)}
                    </span>
                </button>
            </div>

            {/* Show dots toggle */}
            <div className="setting-row toggle-row">
                <span className="setting-label">{t('showDots', lang)}</span>
                <button
                    className={`toggle-btn ${settings.showDots ? 'active' : ''}`}
                    onClick={() => update('showDots', !settings.showDots)}
                    aria-label={t('ariaToggleDots', lang)}
                >
                    <span className="toggle-knob" />
                    <span className="toggle-text">
                        {settings.showDots ? t('enabled', lang) : t('disabled', lang)}
                    </span>
                </button>
            </div>
            <div className="divider" />

            {/* Grid type (multi-select) */}
            <div className="setting-row setting-row-grid" data-tour="grid-type">
                <div className="setting-label-group">
                    <span className="setting-label">{t('gridType', lang)}</span>
                    {!(settings.gridTypes.length === DEFAULT_SETTINGS.gridTypes.length && DEFAULT_SETTINGS.gridTypes.every((g) => settings.gridTypes.includes(g))) && (
                        <button
                            className="grid-reset-btn"
                            onClick={() => update('gridTypes', DEFAULT_SETTINGS.gridTypes)}
                            title={t('resetGridType', lang)}
                        >
                            ↺
                        </button>
                    )}
                </div>
                <div className="grid-type-selector">
                    {(Object.values(GRID) as GridType[]).map((type) => (
                        <button
                            key={type}
                            className={settings.gridTypes.includes(type) ? 'seg-active' : ''}
                            onClick={() => {
                                const current = settings.gridTypes;
                                const newTypes = current.includes(type)
                                    ? current.filter((t) => t !== type)
                                    : [...current, type];
                                // Ensure at least one type is selected
                                if (newTypes.length > 0) {
                                    update('gridTypes', newTypes);
                                }
                            }}
                        >
                            {t(type, lang)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Spiral orientation (only when fibonacci is selected) */}
            {settings.gridTypes.includes(GRID.FIBONACCI) && (
                <div className="setting-row">
                    <span className="setting-label">{t('spiralOrientation', lang)}</span>
                    <div className="segmented-control">
                        {([0, 1, 2, 3] as SpiralOrientation[]).map((orient) => (
                            <button
                                key={orient}
                                className={settings.spiralOrientation === orient ? 'seg-active' : ''}
                                onClick={() => update('spiralOrientation', orient)}
                                title={`${['↱', '↲', '↳', '↰'][orient]} ${t((['spiralTopLeft', 'spiralTopRight', 'spiralBottomRight', 'spiralBottomLeft'] as const)[orient], lang)}`}
                            >
                                {['↱', '↲', '↳', '↰'][orient]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Line color */}
            <div className="setting-row" data-tour="line-color">
                <span className="setting-label">{t('lineColor', lang)}</span>
                <div className="color-picker-wrapper">
                    <div
                        className="color-swatch"
                        style={{ backgroundColor: settings.lineColor }}
                    />
                    <input
                        type="color"
                        value={settings.lineColor}
                        onChange={(e) => update('lineColor', e.target.value)}
                    />
                </div>
            </div>

            {/* Dot color & size (only when dots are enabled) */}
            {settings.showDots && (
                <>
                    <div className="setting-row">
                        <span className="setting-label">{t('dotColor', lang)}</span>
                        <div className="color-picker-wrapper">
                            <div
                                className="color-swatch"
                                style={{ backgroundColor: settings.dotColor }}
                            />
                            <input
                                type="color"
                                value={settings.dotColor}
                                onChange={(e) => update('dotColor', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="setting-row">
                        <span className="setting-label">{t('dotSize', lang)}</span>
                        <div className="slider-wrapper">
                            <input
                                type="range"
                                min={2}
                                max={20}
                                step={1}
                                value={settings.dotSize}
                                onChange={(e) => update('dotSize', Number(e.target.value))}
                            />
                            <span className="slider-value">{settings.dotSize}px</span>
                        </div>
                    </div>
                </>
            )}

            {/* Line size */}
            <div className="setting-row" data-tour="line-size">
                <span className="setting-label">{t('lineSize', lang)}</span>
                <div className="slider-wrapper">
                    <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={settings.lineSize}
                        onChange={(e) => update('lineSize', Number(e.target.value))}
                    />
                    <span className="slider-value">{settings.lineSize}px</span>
                </div>
            </div>

            {/* Line style */}
            <div className="setting-row">
                <div className="setting-label-group">
                    <span className="setting-label">{t('lineStyle', lang)}</span>
                    <span className="shortcut-hint">
                        <kbd>Alt</kbd><span className="shortcut-plus">+</span><kbd>L</kbd>
                    </span>
                </div>
                <div className="segmented-control">
                    {(['solid', 'dashed'] as LineStyle[]).map((style) => (
                        <button
                            key={style}
                            className={settings.lineStyle === style ? 'seg-active' : ''}
                            onClick={() => update('lineStyle', style)}
                        >
                            {t(style, lang)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Opacity */}
            <div className="setting-row" data-tour="opacity">
                <span className="setting-label">{t('opacity', lang)}</span>
                <div className="slider-wrapper">
                    <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={settings.opacity}
                        onChange={(e) => update('opacity', Number(e.target.value))}
                    />
                    <span className="slider-value">{Math.round(settings.opacity * 100)}%</span>
                </div>
            </div>

            {/* Quick Colors (Alt+C) */}
            <div className="setting-row setting-row-quickcolor" data-tour="quick-color">
                <div className="setting-row-top">
                    <div className="setting-label-group">
                        <span className="setting-label">{t('quickColor', lang)}</span>
                        <span className="shortcut-hint">
                            <kbd>Alt</kbd><span className="shortcut-plus">+</span><kbd>C</kbd>
                        </span>
                    </div>
                    <div className="toggle-colors-picker">
                        <div className="color-picker-wrapper">
                            <div
                                className="color-swatch"
                                style={{ backgroundColor: settings.toggleColorA }}
                            />
                            <input
                                type="color"
                                value={settings.toggleColorA}
                                onChange={(e) => update('toggleColorA', e.target.value)}
                            />
                        </div>
                        <span className="toggle-colors-swap">⇄</span>
                        <div className="color-picker-wrapper">
                            <div
                                className="color-swatch"
                                style={{ backgroundColor: settings.toggleColorB }}
                            />
                            <input
                                type="color"
                                value={settings.toggleColorB}
                                onChange={(e) => update('toggleColorB', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <p className="setting-hint">{t('quickColorHint', lang)}</p>
            </div>

            {/* Min image size */}
            <div className="setting-row">
                <span className="setting-label">{t('minImageSize', lang)}</span>
                <div className="slider-wrapper">
                    <input
                        type="range"
                        min={50}
                        max={500}
                        step={50}
                        value={settings.minImageSize}
                        onChange={(e) => update('minImageSize', Number(e.target.value))}
                    />
                    <span className="slider-value">{settings.minImageSize}px</span>
                </div>
            </div>

            {/* Action buttons — Site Rules left, Reset right */}
            <div className="setting-row" data-tour="site-rules">
                <button
                    className="reset-btn active-btn"
                    onClick={async () => {
                        const optUrl = chrome.runtime.getURL('options.html');
                        const allTabs = await chrome.tabs.query({});
                        const existing = allTabs.find((t) => t.url?.startsWith(optUrl));
                        if (existing?.id) {
                            chrome.tabs.update(existing.id, { url: optUrl + '#sites', active: true });
                        } else {
                            chrome.tabs.create({ url: optUrl + '#sites' });
                        }
                    }}
                >
                    {t('tabSiteRules', lang)}
                </button>
                <button className="reset-btn" onClick={reset}>
                    {t('resetSettings', lang)}
                </button>
            </div>

            <div className="divider" />

            {/* Theme */}
            <div className="setting-row">
                <span className="setting-label">{t('theme', lang)}</span>
                <div className="segmented-control">
                    {(['dark', 'light'] as Theme[]).map((themeOption) => (
                        <button
                            key={themeOption}
                            className={settings.theme === themeOption ? 'seg-active' : ''}
                            onClick={() => update('theme', themeOption)}
                        >
                            {t(themeOption, lang)}
                        </button>
                    ))}
                </div>
            </div>

            {showLangSwitch && (
                <div className="setting-row">
                    <span className="setting-label">{t('language', lang)}</span>
                    <div className="segmented-control">
                        <button
                            className={!settings.forceEnglish ? 'seg-active' : ''}
                            onClick={() => update('forceEnglish', false)}
                        >
                            {browserLang.toUpperCase()}
                        </button>
                        <button
                            className={settings.forceEnglish ? 'seg-active' : ''}
                            onClick={() => update('forceEnglish', true)}
                        >
                            EN
                        </button>
                    </div>
                </div>
            )}

            {/* Guide replay */}
            <div className="setting-row">
                <span className="setting-label">{t('tourReplay', lang)}</span>
                <button className="reset-btn" onClick={replayTour}>
                    {t('tourReplay', lang)}
                </button>
            </div>

            {/* Donate notice — dismissable for 24h */}
            {showDonate && (
                <div className="donate-notice">
                    <button className="donate-close" onClick={() => {
                        setShowDonate(false);
                        chrome.storage.local.set({ donateDismissedAt: Date.now() });
                    }} aria-label={t('close', lang)}>&times;</button>
                    <p>{t('donateMessage', lang)}</p>
                    <a href="https://buymeacoffee.com/ngocquy.dev" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        {t('buyMeCoffee', lang)}
                    </a>
                </div>
            )}

            {/* Footer */}
            <footer className="popup-footer">
                <span>{t('version', lang)} {chrome.runtime.getManifest().version}</span>
                <br />
                <span>
                    {t('poweredBy', lang)} <a href={t('authorWebsite', lang)} target="_blank" rel="noopener noreferrer">{t('authorName', lang)}</a>
                </span>
            </footer>

            {/* Interactive Tour */}
            {showTour && <Tour lang={lang} onComplete={completeTour} />}
        </div>
    );
};

export default App;
