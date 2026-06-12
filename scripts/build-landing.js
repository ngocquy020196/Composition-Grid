#!/usr/bin/env node
/**
 * Static multilingual landing generator.
 *
 * For every page template in landing-src/ and every language in landing-src/i18n/,
 * writes a fully translated, SEO-ready static page:
 *   index    -> landing/index.html        + landing/<code>/index.html
 *   changelog-> landing/changelog.html     + landing/<code>/changelog.html
 *   privacy  -> landing/privacy.html       + landing/<code>/privacy.html
 *
 * Each page gets: translated text, localized <title>/meta(/OG), <html lang>+dir,
 * self-canonical, hreflang alternates (+ x-default), language-aware internal links,
 * and a crawlable <a> language switcher. Also regenerates landing/sitemap.xml.
 *
 * Note: 404.html and the dynamic changelog *entries* (fetched from GitHub at runtime)
 * are intentionally NOT localized here.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { load } = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'landing-src');
const OUT = path.join(ROOT, 'landing');
const I18N = path.join(SRC, 'i18n');
const SITE = 'https://composition-grid.ngocquy.dev';

// Cache-busting: use git short hash as version query string
const GIT_HASH = (() => {
    try {
        return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
    } catch {
        return Date.now().toString(36);
    }
})();

// code = URL segment / json filename ; hreflang = BCP-47 ; ogLocale = OG format
// cc = flag file /images/flags/<cc>.svg ; name = native language name shown to users
const LANGS = [
    { code: 'en', hreflang: 'en', ogLocale: 'en_US', cc: 'gb', name: 'English', dir: 'ltr' },
    { code: 'vi', hreflang: 'vi', ogLocale: 'vi_VN', cc: 'vn', name: 'Tiếng Việt', dir: 'ltr' },
    { code: 'es', hreflang: 'es', ogLocale: 'es_ES', cc: 'es', name: 'Español', dir: 'ltr' },
    { code: 'pt-br', hreflang: 'pt-BR', ogLocale: 'pt_BR', cc: 'br', name: 'Português (BR)', dir: 'ltr' },
    { code: 'fr', hreflang: 'fr', ogLocale: 'fr_FR', cc: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', hreflang: 'de', ogLocale: 'de_DE', cc: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'ru', hreflang: 'ru', ogLocale: 'ru_RU', cc: 'ru', name: 'Русский', dir: 'ltr' },
    { code: 'ja', hreflang: 'ja', ogLocale: 'ja_JP', cc: 'jp', name: '日本語', dir: 'ltr' },
    { code: 'ko', hreflang: 'ko', ogLocale: 'ko_KR', cc: 'kr', name: '한국어', dir: 'ltr' },
    { code: 'zh-cn', hreflang: 'zh-CN', ogLocale: 'zh_CN', cc: 'cn', name: '简体中文', dir: 'ltr' },
    { code: 'zh-tw', hreflang: 'zh-TW', ogLocale: 'zh_TW', cc: 'tw', name: '繁體中文', dir: 'ltr' },
    { code: 'hi', hreflang: 'hi', ogLocale: 'hi_IN', cc: 'in', name: 'हिन्दी', dir: 'ltr' },
    { code: 'id', hreflang: 'id', ogLocale: 'id_ID', cc: 'id', name: 'Bahasa Indonesia', dir: 'ltr' },
    { code: 'ar', hreflang: 'ar', ogLocale: 'ar_AR', cc: 'sa', name: 'العربية', dir: 'rtl' },
];

// Pages to generate. slug is the path segment after the language prefix.
const PAGES = [
    { template: '_template.html', slug: '', out: 'index.html', titleKey: 'pageTitle', descKey: 'pageDescription', og: true, priority: '1.0' },
    { template: 'changelog.template.html', slug: 'changelog.html', out: 'changelog.html', titleKey: 'clTitle', descKey: 'clDesc', og: true, priority: '0.6' },
    { template: 'privacy.template.html', slug: 'privacy.html', out: 'privacy.html', titleKey: 'pvTitle', descKey: 'pvDesc', og: true, priority: '0.4' },
];

const pathFor = (code) => (code === 'en' ? '/' : `/${code}/`);
const urlFor = (code, slug = '') => `${SITE}${pathFor(code)}${slug}`;

function hreflangLinks(slug) {
    const links = LANGS.map(
        (l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(l.code, slug)}" />`
    );
    links.push(`<link rel="alternate" hreflang="x-default" href="${urlFor('en', slug)}" />`);
    return links;
}

function switcherHtml(current, slug) {
    const cur = LANGS.find((l) => l.code === current) || LANGS[0];
    const flag = (l) => `<img class="flag" src="/images/flags/${l.cc}.svg" width="20" height="15" alt="" loading="lazy" />`;
    const links = LANGS.map((l) => {
        const active = l.code === current ? ' active' : '';
        const aria = l.code === current ? ' aria-current="true"' : '';
        return `<a href="${pathFor(l.code)}${slug}" class="lang-link${active}" hreflang="${l.hreflang}"${aria}>${flag(l)}<span>${l.name}</span></a>`;
    }).join('');
    return `<details class="lang-dd"><summary aria-label="Language">${flag(cur)}<span class="lang-name">${cur.name}</span><svg class="lang-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary><div class="lang-menu">${links}</div></details>`;
}

// Rewrite internal links so a /<code>/ page points at that language's pages.
function rewriteLinks($, code) {
    const prefix = pathFor(code);
    $('a[href]').each((_, el) => {
        const h = $(el).attr('href');
        if (!h) return;
        if (h === '/') $(el).attr('href', prefix);
        else if (h.startsWith('/#')) $(el).attr('href', prefix + h.slice(1));
        else if (h === '/changelog.html') $(el).attr('href', `${prefix}changelog.html`);
        else if (h === '/privacy.html') $(el).attr('href', `${prefix}privacy.html`);
    });
}

function buildPage(lang, page, template) {
    const t = JSON.parse(fs.readFileSync(path.join(I18N, `${lang.code}.json`), 'utf-8'));
    const $ = load(template, { decodeEntities: false });

    $('html').attr('lang', lang.hreflang);
    if (lang.dir === 'rtl') $('html').attr('dir', 'rtl');
    else $('html').removeAttr('dir');

    // Visible text
    $('[data-i18n]').each((_, el) => {
        const key = $(el).attr('data-i18n');
        if (t[key] != null) $(el).html(t[key]);
    });

    // Head / SEO
    if (t[page.titleKey]) $('title').text(t[page.titleKey]);
    if (t[page.descKey]) $('meta[name="description"]').attr('content', t[page.descKey]);
    $('link[rel="canonical"]').attr('href', urlFor(lang.code, page.slug));

    if (page.og) {
        const ogT = t.ogTitle || t[page.titleKey];
        const ogD = t.ogDescription || t[page.descKey];
        if (ogT) {
            $('meta[property="og:title"]').attr('content', ogT);
            $('meta[name="twitter:title"]').attr('content', ogT);
        }
        if (ogD) {
            $('meta[property="og:description"]').attr('content', ogD);
            $('meta[name="twitter:description"]').attr('content', ogD);
        }
        $('meta[property="og:locale"]').attr('content', lang.ogLocale);
        $('meta[property="og:url"]').attr('content', urlFor(lang.code, page.slug));
        $('meta[property="og:locale:alternate"]').remove();
        const alt = LANGS.filter((l) => l.code !== lang.code)
            .map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}" />`)
            .join('\n    ');
        $('meta[property="og:locale"]').after('\n    ' + alt);

        const ld = $('script[type="application/ld+json"]').first();
        if (ld.length) {
            try {
                const data = JSON.parse(ld.html());
                data.inLanguage = lang.hreflang;
                data.url = urlFor(lang.code, page.slug);
                ld.text('\n    ' + JSON.stringify(data, null, 4) + '\n    ');
            } catch (_) { /* leave as-is if not parseable */ }
        }
    }

    // Relative asset paths -> absolute (so /<code>/ pages resolve them)
    // Also append cache-busting query to style.css
    $('[src], [href]').each((_, el) => {
        for (const attr of ['src', 'href']) {
            const v = $(el).attr(attr);
            if (v && /^(images\/|style\.css)/.test(v)) $(el).attr(attr, `/${v}`);
        }
    });
    $('link[rel="stylesheet"][href*="style.css"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.includes('?')) $(el).attr('href', `${href}?v=${GIT_HASH}`);
    });

    // Language-aware internal links (must run BEFORE injecting the switcher,
    // whose own links are already absolute per-language).
    rewriteLinks($, lang.code);

    // hreflang alternates: refresh in <head>
    $('link[rel="alternate"]').remove();
    $('head').append('\n    ' + hreflangLinks(page.slug).join('\n    ') + '\n');

    // Crawlable language switcher
    $('#langSwitcher').html(switcherHtml(lang.code, page.slug));

    const dir = lang.code === 'en' ? OUT : path.join(OUT, lang.code);
    fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, page.out);
    fs.writeFileSync(outPath, $.html());
    return outPath;
}

function buildSitemap() {
    const today = new Date().toISOString().slice(0, 10);
    let entries = '';
    for (const page of PAGES) {
        const alternates = LANGS.map(
            (l) => `        <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(l.code, page.slug)}" />`
        ).concat(`        <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor('en', page.slug)}" />`).join('\n');
        for (const l of LANGS) {
            const pr = l.code === 'en' ? page.priority : (Math.max(0.1, parseFloat(page.priority) - 0.2)).toFixed(1);
            entries += `    <url>
        <loc>${urlFor(l.code, page.slug)}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>${pr}</priority>
${alternates}
    </url>\n`;
        }
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}</urlset>
`;
    fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml);
}

function main() {
    let count = 0;
    for (const page of PAGES) {
        const template = fs.readFileSync(path.join(SRC, page.template), 'utf-8');
        for (const lang of LANGS) {
            buildPage(lang, page, template);
            count++;
        }
        console.log(`  ${page.out}: ${LANGS.length} languages`);
    }
    buildSitemap();
    console.log(`Generated ${count} pages across ${PAGES.length} templates + sitemap.xml`);
}

main();
