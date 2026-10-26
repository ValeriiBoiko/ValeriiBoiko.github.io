// Generates the localized landing pages and sitemap from src/landing.template.html and i18n/*.json.
// Usage: node scripts/build.mjs
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thapp.pro';
const DEFAULT_LANG = 'en';
const LANGS = ['en', 'pl', 'uk', 'es'];
const APP_STORE_URL = 'https://apps.apple.com/app/id6748391178';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.vboiko.trainhub';

// Phone screenshots, keyed by the name used in {{@screen:name}}.
const SCREENS = {
  dashboard: {eager: true},
  agent: {eager: true},
  session: {},
  workout: {},
  nutrition: {},
  progress: {},
  highlights: {},
  story: {},
  story2: {},
  clients: {},
};
const SCREEN_WIDTH = 430;
const SCREEN_HEIGHT = 932;

const read = path => readFileSync(join(ROOT, path), 'utf8');
const template = read('src/landing.template.html');
const dicts = Object.fromEntries(LANGS.map(lang => [lang, JSON.parse(read(`i18n/${lang}.json`))]));

const pathFor = lang => (lang === DEFAULT_LANG ? '/' : `/${lang}/`);
const urlFor = lang => SITE + pathFor(lang);

const lookup = (dict, key) => {
  const value = key.split('.').reduce((node, part) => node?.[part], dict);
  if (value === undefined) {
    throw new Error(`Missing translation key "${key}"`);
  }
  return value;
};

// Attribute-safe text for meta tags and JSON-LD; page copy is trusted HTML.
const escapeAttr = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const stripTags = html => html.replace(/<[^>]+>/g, '');

const renderScreen = (name, dict) => {
  const screen = SCREENS[name];
  if (!screen) {
    throw new Error(`Unknown screen "${name}"`);
  }
  const base = `/images/screens/${name}`;
  const hasWebp = existsSync(join(ROOT, `images/screens/${name}.webp`));
  const fallback = ['jpg', 'png'].find(ext => existsSync(join(ROOT, `images/screens/${name}.${ext}`)));
  if (!hasWebp && !fallback) {
    return '<div class="screen-placeholder" aria-hidden="true"><img src="/images/app-icon.png" alt="" width="94" height="56" /></div>';
  }
  const alt = escapeAttr(dict.screens?.[name] ?? '');
  const loading = screen.eager ? '' : ' loading="lazy"';
  const img = `<img src="${base}.${fallback ?? 'webp'}" alt="${alt}" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"${loading} decoding="async" />`;
  return hasWebp && fallback ? `<picture><source srcset="${base}.webp" type="image/webp" />${img}</picture>` : img;
};

const renderJsonLd = (lang, dict) => {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'TrainHub: Workout & Calorie',
      operatingSystem: 'iOS 15.6 or later, Android 7.0 or later',
      applicationCategory: 'HealthApplication',
      inLanguage: lang,
      description: dict.meta.description,
      url: urlFor(lang),
      downloadUrl: [APP_STORE_URL, PLAY_URL],
      image: `${SITE}/images/app-icon.png`,
      screenshot: `${SITE}/images/og-image.png`,
      offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
      author: {'@type': 'Organization', name: 'TrainHub', url: `${SITE}/`},
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TrainHub',
      url: `${SITE}/`,
      logo: `${SITE}/images/app-icon.png`,
      email: 'support@thapp.pro',
      sameAs: [APP_STORE_URL, PLAY_URL],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TrainHub',
      url: `${SITE}/`,
      inLanguage: lang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: dict.faq.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {'@type': 'Answer', text: stripTags(item.a)},
      })),
    },
  ];
  return data
    .map(entry => `  <script type="application/ld+json">\n${JSON.stringify(entry, null, 2).replace(/</g, '\\u003c')}\n  </script>`)
    .join('\n');
};

const renderComputed = (name, lang, dict) => {
  switch (name) {
    case 'lang':
      return lang;
    case 'langCode':
      return lang.toUpperCase();
    case 'home':
      return pathFor(lang);
    case 'canonical':
      return urlFor(lang);
    case 'hreflang':
      return [
        ...LANGS.map(l => `  <link rel="alternate" hreflang="${l}" href="${urlFor(l)}" />`),
        `  <link rel="alternate" hreflang="x-default" href="${urlFor(DEFAULT_LANG)}" />`,
      ].join('\n');
    case 'ogLocales':
      return LANGS.filter(l => l !== lang)
        .map(l => `  <meta property="og:locale:alternate" content="${dicts[l].meta.locale}" />`)
        .join('\n');
    case 'langMenu':
      return LANGS.map(l => {
        const current = l === lang ? ' aria-current="true"' : '';
        return `            <li><a href="${pathFor(l)}" hreflang="${l}" lang="${l}" data-lang="${l}"${current}>${dicts[l].meta.langName}</a></li>`;
      }).join('\n');
    case 'footerLangs':
      return LANGS.map(l => {
        const current = l === lang ? ' aria-current="true"' : '';
        return `      <a href="${pathFor(l)}" hreflang="${l}" lang="${l}" data-lang="${l}"${current}>${dicts[l].meta.langName}</a>`;
      }).join('\n');
    case 'faq':
      return dict.faq.items
        .map(
          item =>
            `          <details class="faq-item reveal">\n            <summary>${item.q}</summary>\n            <p>${item.a}</p>\n          </details>`,
        )
        .join('\n');
    case 'jsonld':
      return renderJsonLd(lang, dict);
    case 'langData':
      // Each language's own suggestion text, so the banner speaks the visitor's language.
      return JSON.stringify({
        current: lang,
        langs: Object.fromEntries(LANGS.map(l => [l, {href: pathFor(l), ...dicts[l].langSuggest}])),
      }).replace(/</g, '\\u003c');
    default:
      // Content hash in the URL, so browsers and the Pages CDN never serve a stale file.
      if (name.startsWith('version:')) {
        return createHash('sha256').update(read(name.slice('version:'.length))).digest('hex').slice(0, 10);
      }
      if (name.startsWith('screen:')) {
        return renderScreen(name.slice('screen:'.length), dict);
      }
      throw new Error(`Unknown computed placeholder "@${name}"`);
  }
};

const META_KEYS = /^meta\.|^badges\./;

const render = lang => {
  const dict = dicts[lang];
  return template.replace(/\{\{\s*([@\w.:-]+)\s*\}\}/g, (_, token) => {
    if (token.startsWith('@')) {
      return renderComputed(token.slice(1), lang, dict);
    }
    if (token.startsWith('list:')) {
      return lookup(dict, token.slice('list:'.length))
        .map(item => `              <li>${item}</li>`)
        .join('\n');
    }
    const value = lookup(dict, token);
    return META_KEYS.test(token) ? escapeAttr(value) : value;
  });
};

for (const lang of LANGS) {
  const out = lang === DEFAULT_LANG ? 'index.html' : `${lang}/index.html`;
  mkdirSync(dirname(join(ROOT, out)), {recursive: true});
  writeFileSync(join(ROOT, out), render(lang));
}

const staticPages = ['support.html', 'privacy-policy.html', 'terms.html'];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...LANGS.map(lang =>
    [
      '  <url>',
      `    <loc>${urlFor(lang)}</loc>`,
      ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(DEFAULT_LANG)}" />`,
      '  </url>',
    ].join('\n'),
  ),
  ...staticPages.map(page => `  <url>\n    <loc>${SITE}/${page}</loc>\n  </url>`),
  '</urlset>',
  '',
].join('\n');
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

console.log(`Built ${LANGS.length} pages and sitemap.xml`);
