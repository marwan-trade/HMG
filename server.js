import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDist } from './build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

if (process.env.FORCE_BUILD === '1' || process.env.NODE_ENV !== 'production' || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  await buildDist();
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(compression({ level: 6, threshold: 1024 }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://formsubmit.co; form-action 'self' https://formsubmit.co; object-src 'none'; base-uri 'self'"
  );
  const host = (req.hostname || '').toLowerCase();
  if (host === 'www.hmgglobalgroup.com') {
    return res.redirect(301, 'https://hmgglobalgroup.com' + req.originalUrl);
  }
  if (host.endsWith('.onrender.com') || host === 'hmg.sdmon.com') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const CLEAN_ROUTES = Object.freeze({
  '/': 'index.html',
  '/logistique': 'logistique.html',
  '/sourcing': 'sourcing.html',
  '/conseil': 'conseil.html',
  '/guides': 'guides.html',
  '/a-propos': 'a-propos.html',
  '/contact': 'contact.html',
  '/mentions-legales': 'mentions-legales.html',
  '/merci': 'merci.html',
  '/en': 'en/index.html',
  '/en/logistics': 'en/logistics.html',
  '/en/sourcing': 'en/sourcing.html',
  '/en/consulting': 'en/consulting.html',
  '/en/guides': 'en/guides.html',
  '/en/about': 'en/about.html',
  '/en/contact': 'en/contact.html',
  '/en/legal': 'en/legal.html',
  '/en/thanks': 'en/thanks.html',
  '/zh': 'zh/index.html',
  '/zh/logistics': 'zh/logistics.html',
  '/zh/sourcing': 'zh/sourcing.html',
  '/zh/consulting': 'zh/consulting.html',
  '/zh/guides': 'zh/guides.html',
  '/zh/about': 'zh/about.html',
  '/zh/contact': 'zh/contact.html',
  '/zh/legal': 'zh/legal.html',
  '/zh/thanks': 'zh/thanks.html',
  '/am': 'am/index.html',
  '/am/logistics': 'am/logistics.html',
  '/am/sourcing': 'am/sourcing.html',
  '/am/consulting': 'am/consulting.html',
  '/am/guides': 'am/guides.html',
  '/am/about': 'am/about.html',
  '/am/contact': 'am/contact.html',
  '/am/legal': 'am/legal.html',
  '/am/thanks': 'am/thanks.html',
});

const BLOCKED_EXACT = new Set([
  '/server.js',
  '/build.mjs',
  '/package.json',
  '/package-lock.json',
  '/bun.lock',
  '/readme.md',
  '/metadata.json',
  '/render.yaml',
  '/.env',
  '/.env.example',
]);

const BLOCKED_PREFIXES = ['/node_modules', '/dist', '/v2', '/v3', '/.'];

function send404(req, res) {
  const lower = (req.path || '').toLowerCase();
  const rel = /^\/en(\/|$)/.test(lower) ? 'en/404.html' : /^\/zh(\/|$)/.test(lower) ? 'zh/404.html' : /^\/am(\/|$)/.test(lower) ? 'am/404.html' : '404.html';
  res.status(404).setHeader('Cache-Control', 'no-store').setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.sendFile(path.join(DIST_DIR, rel));
}

app.use((req, res, next) => {
  const lower = req.path.toLowerCase();

  if (
    BLOCKED_EXACT.has(lower) ||
    BLOCKED_PREFIXES.some((p) => lower.startsWith(p)) ||
    (lower.startsWith('/src/') && !lower.startsWith('/src/assets/images/')) ||
    (lower.startsWith('/public/assets/aistudio/') && lower.endsWith('.html')) ||
    lower.endsWith('.map')
  ) {
    return send404(req, res);
  }

  const query = req.url.slice(req.path.length);

  if (lower === '/index' || lower === '/index.html') {
    return res.redirect(301, '/' + query);
  }
  if (lower === '/en/index' || lower === '/en/index.html') {
    return res.redirect(301, '/en' + query);
  }
  if (lower === '/zh/index' || lower === '/zh/index.html') {
    return res.redirect(301, '/zh' + query);
  }
  if (lower === '/am/index' || lower === '/am/index.html') {
    return res.redirect(301, '/am' + query);
  }

  if (lower.endsWith('.html')) {
    const clean = req.path.slice(0, -5);
    if (Object.prototype.hasOwnProperty.call(CLEAN_ROUTES, clean)) {
      return res.redirect(301, clean + query);
    }
    return send404(req, res);
  }

  if (req.path.length > 1 && req.path.endsWith('/')) {
    return res.redirect(301, req.path.slice(0, -1) + query);
  }

  next();
});

const STATIC_IMMUTABLE = {
  maxAge: '365d',
  immutable: true,
  etag: true,
  index: false,
  fallthrough: false,
};

const STATIC_BUNDLE = {
  maxAge: '7d',
  etag: true,
  index: false,
  fallthrough: false,
};

app.use('/css', express.static(path.join(DIST_DIR, 'css'), STATIC_BUNDLE));
app.use('/js', express.static(path.join(DIST_DIR, 'js'), STATIC_BUNDLE));
app.use('/media', express.static(path.join(DIST_DIR, 'media'), STATIC_IMMUTABLE));
app.use('/assets', express.static(path.join(__dirname, 'assets'), STATIC_IMMUTABLE));
app.use('/images', express.static(path.join(__dirname, 'images'), STATIC_IMMUTABLE));
app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images'), STATIC_IMMUTABLE));
app.use('/public/assets/aistudio', express.static(path.join(__dirname, 'public', 'assets', 'aistudio'), STATIC_IMMUTABLE));

app.get('/favicon.ico', (req, res) => {
  res.type('image/x-icon').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(DIST_DIR, 'favicon.ico'));
});

app.get('/favicon.svg', (req, res) => {
  res.type('image/svg+xml').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(DIST_DIR, 'favicon.svg'));
});

app.get('/site.webmanifest', (req, res) => {
  res.type('application/manifest+json; charset=utf-8').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(DIST_DIR, 'site.webmanifest'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml; charset=utf-8').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/llms.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'llms.txt'));
});

app.get('/llms-full.txt', (req, res) => {
  res.type('text/plain; charset=utf-8').setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'llms-full.txt'));
});

app.get('/healthz', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.json({ status: 'ok' });
});

for (const [route, fileName] of Object.entries(CLEAN_ROUTES)) {
  app.get(route, (req, res) => {
    const target = path.join(DIST_DIR, fileName);
    if (!fs.existsSync(target)) {
      return send404(req, res);
    }
    if (route === '/merci' || route === '/en/thanks' || route === '/zh/thanks' || route === '/am/thanks') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.sendFile(target);
  });
}

app.use((req, res) => send404(req, res));

app.listen(PORT, HOST, () => {
  console.log(`HMG Global Business Solutions server running at http://${HOST}:${PORT}`);
});
