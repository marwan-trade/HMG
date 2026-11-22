import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import { minify as minifyJs } from 'terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const MEDIA_DIR = path.join(DIST_DIR, 'media');
const BASE_URL = 'https://hmgglobalgroup.com';

const PAGES = [
  { file: 'index.html', fr: '/', en: '/en', zh: '/zh', outEn: 'en/index.html', outZh: 'zh/index.html' },
  { file: 'logistique.html', fr: '/logistique', en: '/en/logistics', zh: '/zh/logistics', outEn: 'en/logistics.html', outZh: 'zh/logistics.html' },
  { file: 'sourcing.html', fr: '/sourcing', en: '/en/sourcing', zh: '/zh/sourcing', outEn: 'en/sourcing.html', outZh: 'zh/sourcing.html' },
  { file: 'conseil.html', fr: '/conseil', en: '/en/consulting', zh: '/zh/consulting', outEn: 'en/consulting.html', outZh: 'zh/consulting.html' },
  { file: 'guides.html', fr: '/guides', en: '/en/guides', zh: '/zh/guides', outEn: 'en/guides.html', outZh: 'zh/guides.html' },
  { file: 'a-propos.html', fr: '/a-propos', en: '/en/about', zh: '/zh/about', outEn: 'en/about.html', outZh: 'zh/about.html' },
  { file: 'contact.html', fr: '/contact', en: '/en/contact', zh: '/zh/contact', outEn: 'en/contact.html', outZh: 'zh/contact.html' },
  { file: 'mentions-legales.html', fr: '/mentions-legales', en: '/en/legal', zh: '/zh/legal', outEn: 'en/legal.html', outZh: 'zh/legal.html' },
  { file: 'merci.html', fr: '/merci', en: '/en/thanks', zh: '/zh/thanks', outEn: 'en/thanks.html', outZh: 'zh/thanks.html' },
];

const JS_FILES = [
  { name: 'theme.js', heavyObfuscation: false },
  { name: 'guard.js', heavyObfuscation: true },
  { name: 'ui.js', heavyObfuscation: true },
  { name: 'forms.js', heavyObfuscation: true },
  { name: 'gallery.js', heavyObfuscation: true },
  { name: 'i18n.js', heavyObfuscation: false },
];

const IMAGE_ASSETS = [
  { src: 'assets/hmg-logo-nav.png', slug: 'hmg-logo', maxWidth: 480, ogJpg: false, keepPng: true },
  { src: 'public/assets/aistudio/IMG-20261118-WA0051_1017669b.jpg', slug: 'port-djibouti-hero', maxWidth: 1376, ogJpg: true },
  { src: 'public/assets/aistudio/F627EEEA-FA64-4E65-BEF7-447E4DD370DB_51897636.png', slug: 'terminal-conteneurs-djibouti', maxWidth: 1200, ogJpg: false },
  { src: 'assets/carte-sourcing.jpg', slug: 'sourcing-materiaux-djibouti', maxWidth: 1000, ogJpg: false },
  { src: 'public/assets/aistudio/188AC975-36D4-4DD0-96CB-9BB5565EEB3F_6d704711.png', slug: 'conseil-implantation-djibouti', maxWidth: 1200, ogJpg: false },
  { src: 'assets/logistique-hero.jpg', slug: 'logistique-corridor-djibouti', maxWidth: 1400, ogJpg: true },
  { src: 'assets/port-aerial.jpg', slug: 'port-djibouti-conteneurs', maxWidth: 1000, ogJpg: true },
  { src: 'assets/cargo-vrac.jpg', slug: 'cargo-vrac-port-djibouti', maxWidth: 1200, ogJpg: false },
  { src: 'public/assets/aistudio/F6165FF1-B720-4980-A577-576CE65B2938_8e2b5ebf.png', slug: 'breakbulk-tubes-acier-djibouti', maxWidth: 1200, ogJpg: false },
  { src: 'public/assets/aistudio/229ABD20-24D9-42ED-807A-F0B2A699D299_9c928fb8.png', slug: 'transport-routier-djibouti-ethiopie', maxWidth: 1200, ogJpg: false },
  { src: 'assets/sourcing-hero.jpg', slug: 'sourcing-acier-negoce-djibouti', maxWidth: 1400, ogJpg: true },
  { src: 'public/assets/aistudio/363551E9-B130-4279-92E9-63B738BBA995_76aea9a1.png', slug: 'barres-acier-fers-beton', maxWidth: 1200, ogJpg: false },
  { src: 'assets/produit-acier.jpg', slug: 'aciers-construction-djibouti', maxWidth: 1200, ogJpg: false },
  { src: 'src/assets/images/cement_bags_pallet_1795160324335.jpg', slug: 'ciment-sacs-palettes', maxWidth: 1100, ogJpg: false },
  { src: 'src/assets/images/bulk_cement_silos_1795160326395.jpg', slug: 'ciment-vrac-silos-portuaires', maxWidth: 1100, ogJpg: false },
  { src: 'src/assets/images/construction_aggregates_1795160326243.jpg', slug: 'granulats-materiaux-construction', maxWidth: 1100, ogJpg: false },
  { src: 'public/assets/aistudio/IMG-20261118-WA0052_5edd6900.jpg', slug: 'futs-produits-industriels', maxWidth: 1100, ogJpg: false },
  { src: 'src/assets/images/industrial_tools_workshop_1795160325914.jpg', slug: 'outillages-atelier-industriel', maxWidth: 1100, ogJpg: false },
  { src: 'src/assets/images/industrial_spare_parts_1795160326305.jpg', slug: 'pieces-fournitures-industrielles', maxWidth: 1100, ogJpg: false },
  { src: 'assets/conseil-hero.jpg', slug: 'conseil-entreprises-djibouti', maxWidth: 1400, ogJpg: true },
  { src: 'assets/apropos-hero.jpg', slug: 'djibouti-vue-aerienne', maxWidth: 1400, ogJpg: true },
  { src: 'assets/apropos-locaux.jpg', slug: 'bureaux-hmg-djibouti', maxWidth: 1200, ogJpg: false },
];

const WEB_MEDIA_MAP = new Map(
  IMAGE_ASSETS.filter((a) => a.src !== 'public/assets/aistudio/IMG-20261118-WA0051_1017669b.jpg').map((a) => [
    '/' + a.src,
    `/media/${a.slug}.webp`,
  ])
);
const META_MEDIA_MAP = new Map(
  IMAGE_ASSETS.map((a) => [
    '/' + a.src,
    a.keepPng ? `/media/${a.slug}.png` : a.ogJpg ? `/media/${a.slug}.jpg` : `/media/${a.slug}.webp`,
  ])
);

function normKey(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function loadI18nDictionaries(rawI18n) {
  const noop = () => {};
  const stubEl = {
    getAttribute: () => null,
    setAttribute: noop,
    hasAttribute: () => false,
    classList: { toggle: noop },
    dataset: {},
  };
  const context = {
    window: {},
    document: {
      documentElement: { lang: 'fr', dataset: {} },
      body: {},
      title: '',
      createTreeWalker: () => ({ nextNode: () => null }),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: noop,
      dispatchEvent: noop,
    },
    location: { pathname: '/', search: '', hash: '' },
    localStorage: { getItem: () => null, setItem: noop },
    NodeFilter: { SHOW_TEXT: 4 },
    CustomEvent: function CustomEvent() {},
    Map,
    URLSearchParams,
  };
  context.window = context;
  vm.runInNewContext(rawI18n, context);
  return context.window.HMG_DICT || { en: {}, zh: {} };
}

function createIcoFromPng(pngBuf, size = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const dir = Buffer.alloc(16);
  dir.writeUInt8(size === 256 ? 0 : size, 0);
  dir.writeUInt8(size === 256 ? 0 : size, 1);
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(pngBuf.length, 8);
  dir.writeUInt32LE(22, 12);

  return Buffer.concat([header, dir, pngBuf]);
}

async function buildMediaAssets() {
  await fs.mkdir(MEDIA_DIR, { recursive: true });

  const faviconSvg = await fs.readFile(path.join(__dirname, 'favicon.svg'));
  const favicon32 = await sharp(faviconSvg, { density: 300 }).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  const appleIcon = await sharp(faviconSvg, { density: 300 }).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();

  await fs.writeFile(path.join(MEDIA_DIR, 'favicon-32.png'), favicon32);
  await fs.writeFile(path.join(MEDIA_DIR, 'apple-touch-icon.png'), appleIcon);
  await fs.writeFile(path.join(DIST_DIR, 'favicon.ico'), createIcoFromPng(favicon32, 32));
  await fs.copyFile(path.join(__dirname, 'favicon.svg'), path.join(DIST_DIR, 'favicon.svg'));
  await fs.copyFile(path.join(__dirname, 'site.webmanifest'), path.join(DIST_DIR, 'site.webmanifest'));

  for (const item of IMAGE_ASSETS) {
    const absSrc = path.join(__dirname, item.src);
    const pipeline = sharp(absSrc).rotate().resize({ width: item.maxWidth, withoutEnlargement: true });
    await pipeline.clone().webp({ quality: 82, effort: 5 }).toFile(path.join(MEDIA_DIR, `${item.slug}.webp`));

    if (item.ogJpg) {
      await pipeline.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(MEDIA_DIR, `${item.slug}.jpg`));
    }
    if (item.keepPng) {
      await fs.copyFile(absSrc, path.join(MEDIA_DIR, `${item.slug}.png`));
    }
  }
}

function rewriteAssetPaths($) {
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && WEB_MEDIA_MAP.has(src)) {
      $(el).attr('src', WEB_MEDIA_MAP.get(src));
    }
  });

  $('[data-img]').each((_, el) => {
    const imgPath = $(el).attr('data-img');
    if (imgPath && WEB_MEDIA_MAP.has(imgPath)) {
      $(el).attr('data-img', WEB_MEDIA_MAP.get(imgPath));
    }
  });

  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => {
    const content = $(el).attr('content') || '';
    for (const [srcPath, metaPath] of META_MEDIA_MAP.entries()) {
      if (content === BASE_URL + srcPath || content === srcPath) {
        $(el).attr('content', BASE_URL + metaPath);
        break;
      }
    }
  });
}

function mapUrlToLang(urlStr, lang, frToTarget) {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  for (const [srcPath, metaPath] of META_MEDIA_MAP.entries()) {
    if (urlStr === BASE_URL + srcPath) return BASE_URL + metaPath;
  }
  if (!urlStr.startsWith(BASE_URL)) return urlStr;
  const rel = urlStr.slice(BASE_URL.length) || '/';
  const [pathAndQuery, hash] = rel.split('#');
  const [pathname, query] = pathAndQuery.split('?');
  const mapped = frToTarget.get(pathname || '/');
  if (!mapped) return urlStr;
  return BASE_URL + mapped + (query ? '?' + query : '') + (hash ? '#' + hash : '');
}

function localizeJsonLd(obj, lang, dict, frToTarget) {
  if (Array.isArray(obj)) {
    return obj.map((item) => localizeJsonLd(item, lang, dict, frToTarget));
  }
  if (!obj || typeof obj !== 'object') return obj;

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'inLanguage' && typeof v === 'string') {
      out[k] = lang === 'zh' ? 'zh-Hans' : 'en';
      continue;
    }
    if ((k === 'url' || k === 'item' || k === '@id') && typeof v === 'string') {
      out[k] = mapUrlToLang(v, lang, frToTarget);
      continue;
    }
    if (typeof v === 'string') {
      if (k === 'name' || k === 'headline' || k === 'description' || k === 'text' || k === 'serviceType' || k === 'caption') {
        const translated = dict[normKey(v)];
        out[k] = translated || mapUrlToLang(v, lang, frToTarget);
      } else {
        out[k] = mapUrlToLang(v, lang, frToTarget);
      }
      continue;
    }
    out[k] = localizeJsonLd(v, lang, dict, frToTarget);
  }
  return out;
}

function translateTextNodes($, rootEl, dict) {
  const contents = $(rootEl).contents();
  contents.each((_, node) => {
    if (node.type === 'text') {
      const raw = node.data || '';
      if (!/[A-Za-zÀ-ÿ]/.test(raw)) return;
      const t = dict[normKey(raw)];
      if (t) {
        const lead = raw.match(/^\s*/)[0];
        const tail = raw.match(/\s*$/)[0];
        node.data = lead + t + tail;
      }
      return;
    }
    if (node.type === 'tag') {
      const tag = (node.name || '').toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'svg') return;
      translateTextNodes($, node, dict);
    }
  });
}

function buildLocalizedHtml(frHtml, page, lang, dict, frToTarget) {
  const $ = cheerio.load(frHtml, { decodeEntities: false });
  rewriteAssetPaths($);

  if (lang === 'fr') {
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html();
      if (!raw) return;
      try {
        let parsed = JSON.parse(raw);
        const replaceMediaUrls = (node) => {
          if (Array.isArray(node)) return node.map(replaceMediaUrls);
          if (!node || typeof node !== 'object') return node;
          const res = {};
          for (const [k, v] of Object.entries(node)) {
            if (typeof v === 'string') {
              let next = v;
              for (const [srcPath, metaPath] of META_MEDIA_MAP.entries()) {
                if (next === BASE_URL + srcPath) {
                  next = BASE_URL + metaPath;
                  break;
                }
              }
              res[k] = next;
            } else {
              res[k] = replaceMediaUrls(v);
            }
          }
          return res;
        };
        parsed = replaceMediaUrls(parsed);
        $(el).text(JSON.stringify(parsed));
      } catch {}
    });
    return $.html();
  }

  const htmlLang = lang === 'zh' ? 'zh-Hans' : 'en';
  $('html').attr('lang', htmlLang).attr('data-prerendered', lang);

  const canonicalUrl = BASE_URL + page[lang];
  $('link[rel="canonical"]').attr('href', canonicalUrl);
  $('meta[property="og:url"]').attr('content', canonicalUrl);
  $('meta[property="og:locale"]').attr('content', lang === 'zh' ? 'zh_CN' : 'en_US');

  const altLocales = lang === 'zh' ? ['fr_FR', 'en_US'] : ['fr_FR', 'zh_CN'];
  $('meta[property="og:locale:alternate"]').each((idx, el) => {
    if (altLocales[idx]) $(el).attr('content', altLocales[idx]);
  });

  const tTitle = dict[normKey($('title').text())];
  if (tTitle) $('title').text(tTitle);

  $('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').each((_, el) => {
    const val = $(el).attr('content');
    if (!val) return;
    const tr = dict[normKey(val)];
    if (tr) $(el).attr('content', tr);
  });

  translateTextNodes($, $('body')[0], dict);

  $('[placeholder],[alt],[title],[aria-label],[data-alt]').each((_, el) => {
    for (const attr of ['placeholder', 'alt', 'title', 'aria-label', 'data-alt']) {
      const val = $(el).attr(attr);
      if (!val) continue;
      const tr = dict[normKey(val)];
      if (tr) $(el).attr(attr, tr);
    }
  });

  $('a[href^="https://wa.me/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/^(https:\/\/wa\.me\/\d+\?text=)(.*)$/);
    if (!m) return;
    const msg = decodeURIComponent(m[2]);
    const tr = dict[normKey(msg)];
    if (tr) $(el).attr('href', m[1] + encodeURIComponent(tr));
  });

  $('body a[href]').each((_, el) => {
    if ($(el).closest('.lang').length) return;
    const href = $(el).attr('href') || '';
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const [pathAndQuery, hash] = href.split('#');
    const [pathname, query] = pathAndQuery.split('?');
    const mapped = frToTarget.get(pathname || '/');
    if (mapped) {
      $(el).attr('href', mapped + (query ? '?' + query : '') + (hash ? '#' + hash : ''));
    }
  });

  $('.lang a[data-lang]').each((_, el) => {
    const dl = $(el).attr('data-lang');
    const isActive = dl === lang;
    $(el).toggleClass('on', isActive);
    $(el).attr('aria-pressed', isActive ? 'true' : 'false');
  });

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const localized = localizeJsonLd(parsed, lang, dict, frToTarget);
      $(el).text(JSON.stringify(localized));
    } catch {}
  });

  return $.html();
}

async function minifyWriteHtml(outRelPath, html) {
  const htmlMin = await minifyHtml(html, {
    collapseWhitespace: true,
    conservativeCollapse: false,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    processScripts: ['application/ld+json'],
  });
  const outPath = path.join(DIST_DIR, outRelPath);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, htmlMin, 'utf8');
}

export async function buildDist() {
  await fs.mkdir(path.join(DIST_DIR, 'css'), { recursive: true });
  await fs.mkdir(path.join(DIST_DIR, 'js'), { recursive: true });
  await fs.mkdir(path.join(DIST_DIR, 'en'), { recursive: true });
  await fs.mkdir(path.join(DIST_DIR, 'zh'), { recursive: true });

  await buildMediaAssets();

  const cssInput = await fs.readFile(path.join(__dirname, 'css', 'main.css'), 'utf8');
  const cssResult = new CleanCSS({ level: 2, sourceMap: false }).minify(cssInput);
  if (cssResult.errors.length) {
    throw new Error(`CSS minification failed: ${cssResult.errors.join('; ')}`);
  }
  await fs.writeFile(path.join(DIST_DIR, 'css', 'main.css'), cssResult.styles, 'utf8');

  const rawI18n = await fs.readFile(path.join(__dirname, 'js', 'i18n.js'), 'utf8');
  const dicts = loadI18nDictionaries(rawI18n);

  for (const entry of JS_FILES) {
    const srcPath = path.join(__dirname, 'js', entry.name);
    const raw = await fs.readFile(srcPath, 'utf8');
    const terserOut = await minifyJs(raw, {
      compress: { drop_console: true, passes: 2 },
      mangle: { toplevel: false },
      format: { comments: false },
    });
    const baseCode = terserOut.code || raw;
    const obfuscated = JavaScriptObfuscator.obfuscate(baseCode, {
      compact: true,
      controlFlowFlattening: entry.heavyObfuscation,
      controlFlowFlatteningThreshold: entry.heavyObfuscation ? 0.65 : 0,
      deadCodeInjection: false,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      selfDefending: false,
      simplify: true,
      splitStrings: entry.heavyObfuscation,
      splitStringsChunkLength: 8,
      stringArray: true,
      stringArrayEncoding: [entry.heavyObfuscation ? 'rc4' : 'base64'],
      stringArrayThreshold: entry.heavyObfuscation ? 0.85 : 0.75,
      transformObjectKeys: entry.heavyObfuscation,
      unicodeEscapeSequence: true,
      sourceMap: false,
    }).getObfuscatedCode();

    await fs.writeFile(path.join(DIST_DIR, 'js', entry.name), obfuscated, 'utf8');
  }

  const frToEn = new Map(PAGES.map((p) => [p.fr, p.en]));
  const frToZh = new Map(PAGES.map((p) => [p.fr, p.zh]));

  for (const page of PAGES) {
    const htmlInput = await fs.readFile(path.join(__dirname, page.file), 'utf8');

    const frHtml = buildLocalizedHtml(htmlInput, page, 'fr', {}, new Map());
    await minifyWriteHtml(page.file, frHtml);

    const enHtml = buildLocalizedHtml(htmlInput, page, 'en', dicts.en || {}, frToEn);
    await minifyWriteHtml(page.outEn, enHtml);

    const zhHtml = buildLocalizedHtml(htmlInput, page, 'zh', dicts.zh || {}, frToZh);
    await minifyWriteHtml(page.outZh, zhHtml);
  }

  const raw404 = await fs.readFile(path.join(__dirname, '404.html'), 'utf8');
  const errPage = { fr: '/404', en: '/en/404', zh: '/zh/404' };
  await minifyWriteHtml('404.html', buildLocalizedHtml(raw404, errPage, 'fr', {}, new Map()));
  await minifyWriteHtml('en/404.html', buildLocalizedHtml(raw404, errPage, 'en', dicts.en || {}, frToEn));
  await minifyWriteHtml('zh/404.html', buildLocalizedHtml(raw404, errPage, 'zh', dicts.zh || {}, frToZh));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await buildDist();
  console.log('Production bundle built cleanly in dist/');
}
