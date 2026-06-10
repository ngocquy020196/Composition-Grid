import React, { useState } from 'react';
import App from '../popup/App';
import { SiteMode } from '../types';
import { useSettings } from '../hooks/useSettings';
import { t } from '../i18n';

const SITE_MODES: SiteMode[] = ['all', 'block', 'allow'];
const MODE_LABELS = { all: 'siteModeAll', block: 'siteModeBlock', allow: 'siteModeAllow' } as const;
const MODE_DESCS = { all: 'siteModeAllDesc', block: 'siteModeBlockDesc', allow: 'siteModeAllowDesc' } as const;

const Options: React.FC = () => {
    const initialTab = window.location.hash === '#sites' ? 'sites' : 'settings';
    const [activeTab, setActiveTab] = useState<'settings' | 'sites'>(initialTab);
    const { settings, loaded, update } = useSettings();
    const [newSite, setNewSite] = useState('');
    const lang: 'auto' | 'en' = settings.forceEnglish ? 'en' : 'auto';

    if (!loaded) return null;

    // Get the active list based on current mode
    const listKey = settings.siteMode === 'block' ? 'blockList' : 'allowList';
    const currentList = settings.siteMode === 'block' ? settings.blockList : settings.allowList;

    const addSite = () => {
        const site = newSite.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!site) return;
        if (currentList.includes(site)) {
            setNewSite('');
            return;
        }
        update(listKey, [...currentList, site]);
        setNewSite('');
    };

    const removeSite = (site: string) => {
        update(listKey, currentList.filter((s) => s !== site));
    };

    return (
        <div className="options-wrapper">
            {/* Tab bar */}
            <div className="tab-bar">
                <button
                    className={activeTab === 'settings' ? 'tab-active' : ''}
                    onClick={() => setActiveTab('settings')}
                >
                    {t('appName', lang)}
                </button>
                <button
                    className={activeTab === 'sites' ? 'tab-active' : ''}
                    onClick={() => setActiveTab('sites')}
                >
                    {t('tabSiteRules', lang)}
                </button>
            </div>

            {/* Settings tab — reuse popup App */}
            {activeTab === 'settings' && <App />}

            {/* Site rules tab */}
            {activeTab === 'sites' && (
                <div className="popup-container">
                    {/* Mode selector */}
                    <div className="mode-selector">
                        {SITE_MODES.map((mode) => (
                            <button
                                key={mode}
                                className={`mode-btn ${settings.siteMode === mode ? 'mode-active' : ''}`}
                                onClick={() => update('siteMode', mode)}
                            >
                                {t(MODE_LABELS[mode], lang)}
                            </button>
                        ))}
                    </div>

                    {/* Mode description */}
                    <p className="ignored-sites-desc">{t(MODE_DESCS[settings.siteMode], lang)}</p>

                    {/* Site list (only when block or allow) */}
                    {settings.siteMode !== 'all' && (
                        <>
                            <div className="add-site-row">
                                <input
                                    type="text"
                                    placeholder={t('siteInputPlaceholder', lang)}
                                    value={newSite}
                                    onChange={(e) => setNewSite(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSite()}
                                />
                                <button className="add-site-btn" onClick={addSite}>
                                    {t('addSite', lang)}
                                </button>
                            </div>

                            <div className="site-list">
                                {currentList.length === 0 ? (
                                    <div className="empty-state">{t('noSites', lang)}</div>
                                ) : (
                                    currentList.map((site) => (
                                        <div key={site} className="site-item">
                                            <span>{site}</span>
                                            <button
                                                className="site-remove-btn"
                                                onClick={() => removeSite(site)}
                                                title={t('remove', lang)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Options;
