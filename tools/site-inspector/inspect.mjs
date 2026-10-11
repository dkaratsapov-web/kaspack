#!/usr/bin/env node
// Site Inspector: screenshots a page (or a small same-origin crawl) at several
// viewports and extracts what a redesign needs: content, structure, palette,
// typography, contacts, links, forms, performance, console errors and axe a11y.
//
// Usage:
//   node tools/site-inspector/inspect.mjs <url> [--out reports/x] [--crawl N]
//        [--viewports desktop,tablet,mobile] [--no-axe] [--wait 1500]
//
// Output: <out>/<page-slug>/{desktop,tablet,mobile}.png, data.json, report.md
//         <out>/index.md — summary of all inspected pages

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  tablet: { width: 834, height: 1112, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

function parseArgs(argv) {
  const args = { url: null, out: 'reports/inspect', crawl: 0, viewports: Object.keys(VIEWPORTS), axe: true, wait: 1200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--crawl') args.crawl = Number(argv[++i]);
    else if (a === '--viewports') args.viewports = argv[++i].split(',');
    else if (a === '--no-axe') args.axe = false;
    else if (a === '--wait') args.wait = Number(argv[++i]);
    else if (a === '-h' || a === '--help') args.help = true;
    else if (!args.url) args.url = a;
  }
  return args;
}

function slugify(url) {
  const u = new URL(url);
  const p = (u.pathname + u.search).replace(/\/+$/, '') || '/';
  return p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9а-яё_-]+/gi, '_').slice(0, 80);
}

// Runs inside the page: everything is collected from the live DOM + computed styles.
function extractInPage() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
  };
  const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const meta = (name) =>
    document.querySelector(`meta[name="${name}"]`)?.content ||
    document.querySelector(`meta[property="${name}"]`)?.content || null;

  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(visible)
    .map((h) => ({ level: Number(h.tagName[1]), text: text(h).slice(0, 160) }));

  const navAnchors = new Set([...document.querySelectorAll('nav a, header a')].filter(visible));
  const navs = [[...navAnchors].map((a) => ({ text: text(a).slice(0, 80), href: a.href }))];

  const links = [...document.querySelectorAll('a[href]')].map((a) => ({ text: text(a).slice(0, 80), href: a.href }));

  const ctas = [...document.querySelectorAll('button, a[class*="btn"], a[class*="button"], input[type="submit"]')]
    .filter(visible).map((b) => text(b) || b.value || b.getAttribute('aria-label') || '').filter(Boolean).slice(0, 60);

  const images = [...document.querySelectorAll('img')].map((img) => ({
    src: img.currentSrc || img.src, alt: img.getAttribute('alt'),
    w: img.naturalWidth, h: img.naturalHeight, lazy: img.loading === 'lazy',
  }));

  const forms = [...document.querySelectorAll('form')].map((f) => ({
    action: f.action, method: f.method,
    fields: [...f.querySelectorAll('input,select,textarea')].map((i) => ({
      type: i.type || i.tagName.toLowerCase(), name: i.name, placeholder: i.placeholder || null,
      label: i.labels?.[0] ? text(i.labels[0]) : i.getAttribute('aria-label'), required: i.required,
    })),
  }));

  // Palette & typography: weight each value by the visible area it covers.
  const colors = {}; const bgs = {}; const fonts = {}; const sizes = {};
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const area = Math.min(r.width * r.height, 2e6);
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      colors[s.color] = (colors[s.color] || 0) + 1;
      const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      fonts[fam] = (fonts[fam] || 0) + 1;
      const key = `${s.fontSize}/${s.fontWeight}`;
      sizes[key] = (sizes[key] || 0) + 1;
    }
    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgs[s.backgroundColor] = (bgs[s.backgroundColor] || 0) + area;
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);

  const bodyText = text(document.body);
  const phones = [...new Set((bodyText.match(/(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g) || []))];
  const emails = [...new Set((bodyText.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []))];

  const sections = [...document.querySelectorAll('body > *, main > *, section')].filter(visible).slice(0, 60).map((s) => {
    const r = s.getBoundingClientRect();
    return {
      tag: s.tagName.toLowerCase(), id: s.id || null, cls: (s.className && String(s.className).slice(0, 60)) || null,
      top: Math.round(r.top + scrollY), height: Math.round(r.height),
      heading: text(s.querySelector('h1,h2,h3') || { innerText: '' }).slice(0, 100),
    };
  });

  return {
    title: document.title, lang: document.documentElement.lang || null,
    description: meta('description'), ogTitle: meta('og:title'), ogImage: meta('og:image'),
    canonical: document.querySelector('link[rel=canonical]')?.href || null,
    pageHeight: document.documentElement.scrollHeight,
    headings, navs, ctas, images, forms, phones, emails, sections,
    links: { total: links.length, internal: links.filter((l) => l.href.startsWith(location.origin)), external: links.filter((l) => !l.href.startsWith(location.origin) && l.href.startsWith('http')) },
    palette: { text: top(colors, 10), background: top(bgs, 10) },
    typography: { families: top(fonts, 8), sizeWeight: top(sizes, 12) },
    wordCount: bodyText.split(' ').length,
    textSample: bodyText.slice(0, 6000),
  };
}

async function scrollThrough(page) {
  // Trigger lazy-loaded images and scroll-driven reveals before the full-page shot.
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
}

async function inspectPage(browser, url, outDir, opts) {
  const slug = slugify(url);
  const dir = path.join(outDir, slug);
  await fs.mkdir(dir, { recursive: true });
  const result = { url, slug, screenshots: {}, console: [], failedRequests: [] };

  for (const vpName of opts.viewports) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS[vpName], ...VIEWPORTS[vpName], locale: 'ru-RU' });
    const page = await ctx.newPage();
    if (vpName === opts.viewports[0]) {
      page.on('console', (m) => ['error', 'warning'].includes(m.type()) && result.console.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
      page.on('pageerror', (e) => result.console.push(`[pageerror] ${e.message.slice(0, 300)}`));
      page.on('requestfailed', (r) => result.failedRequests.push(`${r.failure()?.errorText} ${r.url().slice(0, 200)}`));
    }
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => ({ error: e.message }));
    if (resp?.error) {
      result.error = resp.error;
      await ctx.close();
      await fs.writeFile(path.join(dir, 'report.md'), renderReport(result));
      return result;
    }
    await page.waitForTimeout(opts.wait);
    await scrollThrough(page);
    await page.waitForTimeout(400);

    const shot = path.join(dir, `${vpName}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    await page.screenshot({ path: path.join(dir, `${vpName}-fold.png`) });
    result.screenshots[vpName] = path.relative(outDir, shot);

    if (vpName === opts.viewports[0]) {
      result.status = resp?.status?.() ?? null;
      result.loadMs = Date.now() - t0;
      result.perf = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));
        const res = performance.getEntriesByType('resource');
        return {
          domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0), load: Math.round(nav?.loadEventEnd || 0), ...paint,
          requests: res.length, transferKB: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
        };
      });
      result.data = await page.evaluate(extractInPage);
      if (opts.axe) {
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const axe = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations);
        result.a11y = axe.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') }));
      }
    } else {
      // Horizontal overflow is the most common mobile bug; record it per viewport.
      result.overflow = result.overflow || {};
      result.overflow[vpName] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    }
    await ctx.close();
  }

  await fs.writeFile(path.join(dir, 'data.json'), JSON.stringify(result, null, 2));
  await fs.writeFile(path.join(dir, 'report.md'), renderReport(result));
  return result;
}

function renderReport(r) {
  if (r.error) return `# ${r.url}\n\n**Ошибка загрузки:** ${r.error}\n`;
  const d = r.data;
  const lines = [];
  lines.push(`# ${d.title || r.url}`, '', `- URL: ${r.url}`, `- HTTP: ${r.status} · загрузка ${r.loadMs} мс · запросов ${r.perf.requests} · ${r.perf.transferKB} KB`);
  lines.push(`- FCP: ${r.perf['first-contentful-paint'] ?? '—'} мс · DOMContentLoaded ${r.perf.domContentLoaded} мс`);
  lines.push(`- Высота страницы: ${d.pageHeight}px · слов: ${d.wordCount} · lang=${d.lang}`);
  lines.push(`- Description: ${d.description || '—'}`, `- OG image: ${d.ogImage || '—'}`, '');
  lines.push('## Скриншоты', ...Object.entries(r.screenshots).map(([k, v]) => `- ${k}: \`${v}\``), '');
  if (r.overflow) lines.push('## Горизонтальный overflow', ...Object.entries(r.overflow).map(([k, v]) => `- ${k}: ${v > 0 ? `**${v}px — ПРОБЛЕМА**` : 'нет'}`), '');
  lines.push('## Заголовки', ...d.headings.map((h) => `${'  '.repeat(h.level - 1)}- H${h.level}: ${h.text}`), '');
  lines.push('## Навигация', ...d.navs.flat().slice(0, 40).map((l) => `- ${l.text} → ${l.href}`), '');
  lines.push('## CTA / кнопки', ...d.ctas.map((c) => `- ${c}`), '');
  lines.push('## Контакты', `- Телефоны: ${d.phones.join(', ') || '—'}`, `- Email: ${d.emails.join(', ') || '—'}`, '');
  lines.push('## Палитра (текст)', ...d.palette.text.map(([c, n]) => `- ${c} × ${n}`), '');
  lines.push('## Палитра (фоны, по площади)', ...d.palette.background.map(([c, n]) => `- ${c} — ${Math.round(n / 1000)}k px²`), '');
  lines.push('## Типографика', ...d.typography.families.map(([f, n]) => `- ${f} × ${n}`), '', 'Размер/вес:', ...d.typography.sizeWeight.map(([s, n]) => `- ${s} × ${n}`), '');
  lines.push('## Секции', ...d.sections.map((s) => `- <${s.tag}${s.id ? '#' + s.id : ''}> top=${s.top} h=${s.height} ${s.heading ? '— ' + s.heading : ''}`), '');
  const noAlt = d.images.filter((i) => !i.alt);
  lines.push('## Изображения', `- всего ${d.images.length}, без alt: ${noAlt.length}, lazy: ${d.images.filter((i) => i.lazy).length}`, '');
  if (d.forms.length) lines.push('## Формы', ...d.forms.map((f, i) => `- форма ${i + 1} (${f.method} ${f.action}): ${f.fields.map((x) => `${x.label || x.placeholder || x.name}[${x.type}${x.required ? '*' : ''}]`).join(', ')}`), '');
  if (r.a11y) lines.push('## Доступность (axe-core)', r.a11y.length ? '' : 'Нарушений не найдено.', ...r.a11y.map((v) => `- **${v.impact}** \`${v.id}\` ×${v.nodes}: ${v.help} (${v.sample})`), '');
  lines.push('## Консоль и сеть', ...(r.console.length ? r.console : ['- ошибок нет']).map((c) => (c.startsWith('-') ? c : `- ${c}`)), ...r.failedRequests.map((f) => `- failed: ${f}`), '');
  lines.push('## Текст страницы (фрагмент)', '', '> ' + d.textSample.slice(0, 3000), '');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    console.log('Usage: node tools/site-inspector/inspect.mjs <url> [--out dir] [--crawl N] [--viewports desktop,tablet,mobile] [--no-axe] [--wait ms]');
    process.exit(args.help ? 0 : 1);
  }
  const outDir = path.resolve(args.out);
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--no-sandbox'],
  });

  const origin = new URL(args.url).origin;
  const queue = [args.url];
  const seen = new Set();
  const results = [];
  const limit = 1 + Math.max(0, args.crawl * 15); // crawl depth 1 ≈ homepage + up to 15 internal pages
  while (queue.length && results.length < limit) {
    const url = queue.shift().split('#')[0];
    if (seen.has(url)) continue;
    seen.add(url);
    process.stdout.write(`→ ${url} ... `);
    const r = await inspectPage(browser, url, outDir, args);
    console.log(r.error ? `ошибка: ${r.error}` : `ok (${r.loadMs} мс)`);
    results.push(r);
    if (args.crawl > 0 && r.data) {
      for (const l of r.data.links.internal) {
        const u = l.href.split('#')[0];
        if (u.startsWith(origin) && !seen.has(u) && !/\.(pdf|jpe?g|png|webp|zip|docx?|xlsx?)$/i.test(u)) queue.push(u);
      }
    }
  }
  await browser.close();

  const index = ['# Site Inspector — сводка', '', `Источник: ${args.url} · страниц: ${results.length} · ${new Date().toISOString()}`, '',
    '| Страница | HTTP | Загрузка | Заголовок H1 | a11y нарушений | overflow |', '|---|---|---|---|---|---|',
    ...results.map((r) => `| [${r.slug}](${r.slug}/report.md) | ${r.status ?? 'ERR'} | ${r.loadMs ?? '—'} мс | ${r.data?.headings.find((h) => h.level === 1)?.text ?? '—'} | ${r.a11y?.length ?? '—'} | ${r.overflow ? Object.values(r.overflow).some((v) => v > 0) ? 'да' : 'нет' : '—'} |`)];
  await fs.writeFile(path.join(outDir, 'index.md'), index.join('\n') + '\n');
  console.log(`\nГотово: ${path.join(outDir, 'index.md')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
