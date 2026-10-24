import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import sharp from 'sharp';
import { minify as minifyJs } from 'terser';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE_URL = normalizeSiteUrl(process.env.SITE_URL || 'https://ironvei-game.online/');
const WIDTHS = [360, 640, 960, 1280];
const IMAGE_BUDGET = 500 * 1024;

function normalizeSiteUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SITE_URL must use HTTP or HTTPS');
  url.hash = '';
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}

async function verifyMetadataStripped(bytes, label) {
  const metadata = await sharp(bytes).metadata();
  if (metadata.exif || metadata.iptc || metadata.xmp || metadata.icc) {
    throw new Error(`Image metadata was not stripped from ${label}`);
  }
}

function publicRelative(fromPage, assetPath) {
  let value = path.posix.relative(path.posix.dirname(fromPage), assetPath);
  if (!value.startsWith('.')) value = `./${value}`;
  return value;
}

// Attribute replacement deliberately handles source HTML that we own and generate.
function replaceAttribute(tag, name, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\s${escaped}=(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${value}"`);
  return tag.replace(/\s*\/?>(?=$)/, ` ${name}="${value}">`);
}

function resolveRepoPath(pagePath, reference) {
  const url = new URL(reference, `https://site.invalid/${pagePath}`);
  return path.posix.normalize(url.pathname.replace(/^\//, ''));
}

async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeHashedBytes(directory, basename, extension, bytes) {
  const name = `${basename}-${hash(bytes)}.${extension}`;
  const relative = path.posix.join(directory, name);
  const target = path.join(DIST, relative);
  await ensureParent(target);
  await writeFile(target, bytes);
  return { path: relative, bytes: bytes.length };
}

async function makeResponsiveImages() {
  const sources = new Map();
  const picture = /<picture\b([^>]*)>([\s\S]*?)<\/picture>/gi;
  const pages = await sourcePages();

  for (const page of pages) {
    const html = await readFile(path.join(ROOT, page), 'utf8');
    let match;
    while ((match = picture.exec(html))) {
      const sourceRef = match[1].match(/\bdata-image="([^"]+)"/i)?.[1];
      if (!sourceRef) throw new Error(`${page}: <picture> is missing data-image`);
      const sourcePath = path.posix.normalize(sourceRef.replace(/^\.\//, ''));
      sources.set(sourcePath, true);
    }
    picture.lastIndex = 0;
  }

  const generated = new Map();
  for (const sourcePath of sources.keys()) {
    const fullSource = path.join(ROOT, sourcePath);
    const metadata = await sharp(fullSource).metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Cannot inspect image dimensions: ${sourcePath}`);
    const base = path.basename(sourcePath, path.extname(sourcePath)).replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const candidates = [];
    for (const requestedWidth of WIDTHS) {
      const width = Math.min(requestedWidth, metadata.width);
      if (candidates.some((item) => item.width === width)) continue;
      const avifBytes = await sharp(fullSource).rotate().resize({ width, withoutEnlargement: true }).avif({ quality: 50, effort: 5 }).toBuffer();
      const webpBytes = await sharp(fullSource).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 68, effort: 5, smartSubsample: true }).toBuffer();
      const avif = await writeHashedBytes('assets/media', base, 'avif', avifBytes);
      const webp = await writeHashedBytes('assets/media', base, 'webp', webpBytes);
      if (avif.bytes > IMAGE_BUDGET || webp.bytes > IMAGE_BUDGET) {
        throw new Error(`Compressed image exceeds ${IMAGE_BUDGET / 1024} KiB: ${sourcePath} (${width}px)`);
      }
      await verifyMetadataStripped(avifBytes, avif.path);
      await verifyMetadataStripped(webpBytes, webp.path);
      candidates.push({ width, avif, webp });
    }
    const fallback = candidates.find((item) => item.width >= 768) || candidates.at(-1);
    generated.set(sourcePath, { candidates, fallback });
  }
  return generated;
}

async function sourcePages() {
  const pages = ['index.html', '404.html'];
  for (const dir of ['how-to-play', 'release', 'demo', 'privacy', 'support']) pages.push(`${dir}/index.html`);
  return pages;
}

async function buildStaticAssets(responsive) {
  const mappings = new Map();
  const faviconSource = path.join(ROOT, 'assets/brand/favicon.png');
  const favicon = await sharp(faviconSource).resize({ width: 64, height: 64, fit: 'inside' }).png({ compressionLevel: 9 }).toBuffer();
  await verifyMetadataStripped(favicon, 'favicon');
  const icon = await writeHashedBytes('assets/brand', 'favicon', 'png', favicon);
  mappings.set('assets/brand/favicon.png', icon.path);

  for (const size of [16, 32, 48, 64, 180, 192, 512]) {
    const sourcePath = `assets/brand/ironveil-${size}.png`;
    const bytes = await readFile(path.join(ROOT, sourcePath));
    await verifyMetadataStripped(bytes, sourcePath);
    const output = await writeHashedBytes('assets/brand', `ironveil-${size}`, 'png', bytes);
    mappings.set(sourcePath, output.path);
  }
  const icoBytes = await readFile(path.join(ROOT, 'assets/brand/favicon.ico'));
  const icoPath = path.join(DIST, 'favicon.ico');
  await ensureParent(icoPath);
  await writeFile(icoPath, icoBytes);
  mappings.set('assets/brand/favicon.ico', 'favicon.ico');
  mappings.set('favicon.ico', 'favicon.ico');
  const manifestSource = JSON.parse(await readFile(path.join(ROOT, 'assets/brand/site.webmanifest'), 'utf8'));
  for (const entry of manifestSource.icons) {
    const sourcePath = `assets/brand/${entry.src}`;
    entry.src = path.basename(mappings.get(sourcePath));
  }
  const manifestOutput = path.join(DIST, 'assets/brand/site.webmanifest');
  await ensureParent(manifestOutput);
  await writeFile(manifestOutput, `${JSON.stringify(manifestSource, null, 2)}\n`);
  mappings.set('assets/brand/site.webmanifest', 'assets/brand/site.webmanifest');

  const shareSource = path.join(ROOT, 'assets/source/gameplay/island.webp');
  const shareBytes = await sharp(shareSource).resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  await verifyMetadataStripped(shareBytes, 'social share image');
  const share = await writeHashedBytes('assets/brand', 'share', 'jpg', shareBytes);
  mappings.set('assets/brand/share.png', share.path);

  for (const [sourcePath, record] of responsive) mappings.set(sourcePath, record.fallback.webp.path);
  return { mappings, share: share.path };
}

function rewritePicture(markup, pagePath, responsive) {
  const picturePattern = /<picture\b([^>]*)>([\s\S]*?)<\/picture>/gi;
  return markup.replace(picturePattern, (whole, attrs, inner) => {
    const sourcePath = attrs.match(/\bdata-image="([^"]+)"/i)?.[1];
    if (!sourcePath) throw new Error(`${pagePath}: picture without a source asset`);
    const normalized = path.posix.normalize(sourcePath.replace(/^\.\//, ''));
    const output = responsive.get(normalized);
    if (!output) throw new Error(`${pagePath}: missing responsive image output for ${normalized}`);
    const sizes = attrs.match(/\bdata-sizes="([^"]+)"/i)?.[1] || '100vw';
    const avifSrcset = output.candidates.map((item) => `${publicRelative(pagePath, item.avif.path)} ${item.width}w`).join(', ');
    const webpSrcset = output.candidates.map((item) => `${publicRelative(pagePath, item.webp.path)} ${item.width}w`).join(', ');
    const deferred = /\bdata-defer(?:\s|$)/i.test(attrs);
    const srcsetAttribute = deferred ? 'data-srcset' : 'srcset';
    const sizesAttribute = deferred ? 'data-sizes' : 'sizes';
    const avif = `<source type="image/avif" ${srcsetAttribute}="${avifSrcset}" ${sizesAttribute}="${sizes}">`;
    const webp = `<source type="image/webp" ${srcsetAttribute}="${webpSrcset}" ${sizesAttribute}="${sizes}">`;
    let img = inner.match(/<img\b[^>]*>/i)?.[0];
    if (!img) throw new Error(`${pagePath}: picture without an img fallback`);
    const fallback = output.fallback.webp.path;
    img = replaceAttribute(img, deferred ? 'data-src' : 'src', publicRelative(pagePath, fallback));
    img = replaceAttribute(img, srcsetAttribute, webpSrcset);
    img = replaceAttribute(img, sizesAttribute, sizes);
    if (deferred) img = img.replace(/\s+src=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    const pictureAttrs = attrs.replace(/\s+data-image="[^"]*"/i, '').replace(/\s+data-sizes="[^"]*"/i, '').replace(/\s+data-defer(?:="[^"]*")?/i, '');
    return `<picture${pictureAttrs}>${avif}${webp}${img}</picture>`;
  });
}

function rewriteAssetAttributes(html, pagePath, mappings) {
  const attrPattern = /\b(href|src|poster)="([^"]+)"/gi;
  return html.replace(attrPattern, (whole, name, reference) => {
    if (/^(?:[a-z]+:|\/\/|#|data:|mailto:|tel:)/i.test(reference)) return whole;
    const repoPath = resolveRepoPath(pagePath, reference);
    const mapped = mappings.get(repoPath);
    if (mapped) return `${name}="${publicRelative(pagePath, mapped)}"`;
    if (repoPath === 'styles.css') return `${name}="${publicRelative(pagePath, mappings.get('__styles__'))}"`;
    if (repoPath === 'scripts/site.js') return `${name}="${publicRelative(pagePath, mappings.get('__script__'))}"`;
    // data-image source paths are transformed into responsive variants before this pass.
    if (repoPath.startsWith('assets/source/')) throw new Error(`${pagePath}: unprocessed source asset URL ${reference}`);
    return whole;
  });
}

async function minifyCssAndJs() {
  const css = await readFile(path.join(ROOT, 'styles.css'), 'utf8');
  const minCss = new CleanCSS({ level: 2 }).minify(css);
  if (minCss.errors?.length) throw new Error(`CSS minification failed: ${minCss.errors.join('; ')}`);
  const cssAsset = await writeHashedBytes('assets/css', 'site', 'css', Buffer.from(minCss.styles));

  const js = await readFile(path.join(ROOT, 'scripts/site.js'), 'utf8');
  const minJs = await minifyJs(js, { compress: true, mangle: true, format: { comments: false } });
  if (minJs.error) throw minJs.error;
  const jsAsset = await writeHashedBytes('assets/js', 'site', 'js', Buffer.from(minJs.code));
  return { css: cssAsset.path, js: jsAsset.path };
}

async function buildHtml(responsive, mappings, sharePath) {
  const pages = await sourcePages();
  const minifierMappings = new Map(mappings);
  for (const page of pages) {
    let html = await readFile(path.join(ROOT, page), 'utf8');
    html = rewritePicture(html, page, responsive);
    html = rewriteAssetAttributes(html, page, minifierMappings);
    html = html.replaceAll('@@OG_IMAGE_URL@@', new URL(sharePath, SITE_URL).href);
    html = html.replaceAll('@@SITE_URL@@', SITE_URL);
    if (page !== '404.html') {
      const route = page === 'index.html' ? '' : page.replace(/\/index\.html$/, '/');
      const canonical = new URL(route, SITE_URL).href;
      html = html.replace('</head>', `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
    }
    if (html.includes('@@')) throw new Error(`${page}: unresolved build placeholder`);
    html = html.replace(/(<meta property="og:image" content="[^"]+">)/, '$1<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Early Ironveil gameplay capture of the island board and resources">');
    const output = await minifyHtml(html, {
      collapseWhitespace: true,
      conservativeCollapse: false,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: false,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
      sortAttributes: false,
      sortClassName: false,
    });
    const target = path.join(DIST, page);
    await ensureParent(target);
    await writeFile(target, output);
  }
}

async function buildDiscoveryFiles() {
  const routes = ['', 'how-to-play/', 'release/', 'demo/', 'privacy/', 'support/'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${new URL(route, SITE_URL).href}</loc></url>`).join('\n')}\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', SITE_URL).href}\n`;
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
  await writeFile(path.join(DIST, 'robots.txt'), robots);
  const customDomain = (await readFile(path.join(ROOT, 'CNAME'), 'utf8')).trim();
  if (customDomain !== 'ironvei-game.online') throw new Error('CNAME must contain ironvei-game.online');
  await writeFile(path.join(DIST, 'CNAME'), `${customDomain}\n`);
  await writeFile(path.join(DIST, '.nojekyll'), '');
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  const responsive = await makeResponsiveImages();
  const { mappings, share } = await buildStaticAssets(responsive);
  const { css, js } = await minifyCssAndJs();
  mappings.set('__styles__', css);
  mappings.set('__script__', js);
  await buildHtml(responsive, mappings, share);
  await buildDiscoveryFiles();
  const totalBytes = await directoryBytes(DIST);
  console.log(`Built ${DIST} for ${SITE_URL}`);
  console.log(`Responsive source images: ${responsive.size}; hashed image/CSS/JS assets generated.`);
  console.log(`Output size: ${(totalBytes / 1024).toFixed(1)} KiB; image metadata removed by Sharp.`);
}

async function directoryBytes(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(filePath);
    else total += (await stat(filePath)).size;
  }
  return total;
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
