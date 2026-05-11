// Background service worker for Composition Grid extension
// Handles right-click context menu on images with i18n support

import { t } from '../i18n';
import { Language } from '../types';
import { MSG } from '../constants/messages';

const MENU_ID = 'toggle-grid';

function updateMenuTitle(lang: Language) {
    chrome.contextMenus.update(MENU_ID, {
        title: t('toggleGrid', lang),
    });
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
    // Create context menu with default English title
    chrome.contextMenus.create({
        id: MENU_ID,
        title: t('toggleGrid', 'en'),
        contexts: ['image'],
    });

    // Read saved language and update title
    chrome.storage.sync.get({ language: 'en' }, (result) => {
        updateMenuTitle(result.language as Language);
    });

    // Auto-open options page on first install
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// Listen for language setting changes + site list changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.language) {
        updateMenuTitle(changes.language.newValue as Language);
    }
    // Re-check visibility when site mode/lists change
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
