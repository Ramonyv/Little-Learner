import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const distDir = path.join(root, 'dist');
const ssrOutDir = path.join(root, '.prerender-tmp');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeJsonLd(obj) {
  return JSON.stringify(obj).replaceAll('<', '\\u003c');
}

try {
  execFileSync(
    path.join(root, 'node_modules/.bin/vite'),
    ['build', '--ssr', 'src/entry-prerender.tsx', '--outDir', '.prerender-tmp', '--logLevel', 'silent'],
    { cwd: root, stdio: 'inherit' },
  );

  const entryPath = path.join(ssrOutDir, 'entry-prerender.js');
  const { renderRoute, INDEXABLE_ROUTES, OG_IMAGE, SITE_NAME } = await import(pathToFileURL(entryPath).href);
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  for (const route of INDEXABLE_ROUTES) {
    const { html, seo } = renderRoute(route);
    if (!html || !html.includes('<h1')) {
      throw new Error(`Pre-render check failed for ${route}: missing <h1> content`);
    }

    const headTags = [
      `<title>${escapeHtml(seo.fullTitle)}</title>`,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`,
      `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
      `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
      `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
      `<meta property="og:type" content="${escapeHtml(seo.ogType)}" />`,
      `<meta property="og:title" content="${escapeHtml(seo.fullTitle)}" />`,
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`,
      `<meta property="og:image" content="${escapeHtml(OG_IMAGE)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(seo.fullTitle)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}" />`,
      `<link rel="alternate" type="text/markdown" title="LLM Context" href="/llms.txt" />`,
      ...seo.jsonLd.map(
        (node) => `<script type="application/ld+json" data-seo-jsonld="true">${escapeJsonLd(node)}</script>`,
      ),
    ].join('\n    ');

    let pageHtml = template
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
      .replace('</head>', `    ${headTags}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

    const targetPath =
      route === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, pageHtml, 'utf8');
  }

  console.log(`Pre-rendered ${INDEXABLE_ROUTES.length} routes to dist/ for SEO & AI crawlers.`);
} finally {
  fs.rmSync(ssrOutDir, { recursive: true, force: true });
}

