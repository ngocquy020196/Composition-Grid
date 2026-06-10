// Background service worker for Composition Grid extension
// Handles right-click context menu on images with i18n support

import { t } from '../i18n';
import { MSG } from '../constants/messages';

const MENU_ID = 'toggle-grid';

function applyMenuTitle(forceEnglish: boolean) {
    chrome.contextMenus.update(MENU_ID, { title: t('toggleGrid', forceEnglish ? 'en' : 'auto') });
}

// Check if a site is blocked based on site mode settings
async function isSiteBlocked(hostname: string): Promise<boolean> {
    const result = await chrome.storage.sync.get({ siteMode: 'all', blockList: [], allowList: [] });
    if (result.siteMode === 'block') {
        return (result.blockList as string[]).some((s) => hostname.includes(s));
    }
    if (result.siteMode === 'allow') {
        return !(result.allowList as string[]).some((s) => hostname.includes(s));
    }
    return false;
}

// Show or hide context menu based on current tab's site
async function updateMenuVisibility(tab?: chrome.tabs.Tab) {
    if (!tab?.url) return;
    try {
        const host = new URL(tab.url).hostname;
        const blocked = await isSiteBlocked(host);
        chrome.contextMenus.update(MENU_ID, { visible: !blocked });
    } catch {
        // Ignore invalid URLs (chrome://, etc.)
    }
}

chrome.runtime.onInstalled.addListener((details) => {
    // Create context menu. Title is localized by Chrome's native i18n (chrome.i18n),
    // which follows the browser UI language.
    chrome.contextMenus.create({
        id: MENU_ID,
        title: t('toggleGrid', 'auto'),
        contexts: ['image'],
    });

    // Apply saved English override (if any) to the menu title
    chrome.storage.sync.get({ forceEnglish: false }, (result) => {
        applyMenuTitle(result.forceEnglish as boolean);
    });

    // Auto-open options page on first install
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// React to relevant setting changes
chrome.storage.onChanged.addListener((changes) => {
    // Keep menu title in sync with the in-app English override
    if (changes.forceEnglish) {
        applyMenuTitle(changes.forceEnglish.newValue as boolean);
    }
    if (changes.siteMode || changes.blockList || changes.allowList) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) updateMenuVisibility(tabs[0]);
        });
    }
});

// Update context menu visibility when switching tabs + notify content scripts
let previousTabId: number | undefined;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Deactivate grid on the previous tab
    if (previousTabId !== undefined) {
        chrome.tabs.sendMessage(previousTabId, { type: MSG.TAB_DEACTIVATED }).catch(() => {});
    }

    // Activate grid on the new tab
    previousTabId = activeInfo.tabId;
    chrome.tabs.sendMessage(activeInfo.tabId, { type: MSG.TAB_ACTIVATED }).catch(() => {});

    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateMenuVisibility(tab);
});

// When a window gains focus, activate its current tab
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (!tabs[0]?.id) return;
        if (previousTabId !== undefined && previousTabId !== tabs[0].id) {
            chrome.tabs.sendMessage(previousTabId, { type: MSG.TAB_DEACTIVATED }).catch(() => {});
        }
        previousTabId = tabs[0].id;
        chrome.tabs.sendMessage(tabs[0].id, { type: MSG.TAB_ACTIVATED }).catch(() => {});
    });
});

// Update context menu visibility when page loads
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateMenuVisibility(tab);
    }
});

// Context menu click — just toggle, no blocked check needed (menu is hidden on blocked sites)
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) return;

    chrome.tabs.sendMessage(tab.id, {
        type: MSG.TOGGLE_GRID,
        srcUrl: info.srcUrl,
    }).catch(() => { /* content script not loaded on this tab */ });
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
    const messageMap: Record<string, string> = {
        'toggle-grid': MSG.TOGGLE_GRID_ALL,
        'toggle-video': MSG.TOGGLE_VIDEO,
        'toggle-line-style': MSG.TOGGLE_LINE_STYLE,
        'toggle-color': MSG.TOGGLE_COLOR,
    };

    const type = messageMap[command];
    if (!type) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type }).catch(() => { /* content script not loaded */ });
        }
    });
});
