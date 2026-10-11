#!/usr/bin/env node
// Generates the isometric "technical drawing" SVGs used across the site and
// injects them into HTML files between <!-- svg:name --> ... <!-- /svg:name --> markers.
// Run: node tools/drawings/build.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const C = Math.cos(Math.PI / 6);
const r1 = (n) => Math.round(n * 10) / 10;

function projector(s, cx, cy) {
  return ([x, y, z]) => [r1(cx + (x - y) * C * s), r1(cy + (x + y) * 0.5 * s - z * s)];
}
const pts = (P, list) => list.map((p) => P(p).join(',')).join(' ');
const poly = (P, list, cls, extra = '') => `<polygon class="${cls}" points="${pts(P, list)}"${extra}/>`;
const line = (P, a, b, cls) => { const [x1, y1] = P(a); const [x2, y2] = P(b); return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; };

// Visible faces of an axis-aligned box (viewer at +x,+y,+z).
function box(P, [x0, y0, z0], [x1, y1, z1], cls = 'box') {
  return [
    poly(P, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], `${cls} f-r`),
    poly(P, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], `${cls} f-l`),
    poly(P, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], `${cls} f-t`),
  ].join('');
}

// ---------- Loaded pallet (hero + exploded view) ----------
function pallet3d(id) {
  const s = 0.3; const P = projector(s, 250, 330);
  const W = 1200, D = 800;
  const g = {};
  // Pallet: bottom boards, 9 blocks, top deck (EUR 1200x800x144)
  const xs = [[0, 145], [527, 672], [1055, 1200]]; const ys = [[0, 100], [350, 450], [700, 800]];
  let pal = box(P, [0, 0, 0], [W, D, 22], 'wood');
  for (const [y0, y1] of ys) for (const [x0, x1] of xs) pal += box(P, [x0, y0, 22], [x1, y1, 100], 'wood');
  for (let i = 0; i < 5; i++) { const y0 = i * 172; pal += box(P, [0, y0, 100], [W, y0 + 112, 122], 'wood'); }
  pal += box(P, [0, 0, 122], [W, D, 144], 'wood deck');
  g.pallet = pal;
  // Boxes: 3 tiers of 2x2 cartons 600x400x300
  const tier = (t) => {
    let out = ''; const z0 = 144 + t * 300;
    const cells = [[0, 0], [600, 0], [0, 400], [600, 400]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    for (const [x, y] of cells) {
      out += box(P, [x, y, z0], [x + 600, y + 400, z0 + 300], 'carton');
      // flap seam + tape on top face
      out += poly(P, [[x, y + 175, z0 + 300], [x + 600, y + 175, z0 + 300], [x + 600, y + 225, z0 + 300], [x, y + 225, z0 + 300]], 'tape');
    }
    return out;
  };
  g.tier1 = tier(0); g.tier2 = tier(1); g.tier3 = tier(2);
  // Strapping: two straps along y over the stack, visible on left face (y=D) and top
  let strap = '';
  for (const x of [280, 900]) {
    strap += poly(P, [[x, D + 4, 144], [x + 22, D + 4, 144], [x + 22, D + 4, 1044], [x, D + 4, 1044]], 'strap');
    strap += poly(P, [[x, 0, 1046], [x + 22, 0, 1046], [x + 22, D + 4, 1046], [x, D + 4, 1046]], 'strap');
  }
  // Corner protectors on visible vertical edges and top corners
  for (const [x, y] of [[W, D], [0, D], [W, 0]]) {
    const dx = x === W ? -60 : 60; const dy = y === D ? -60 : 60;
    strap += poly(P, [[x, y, 150], [x, y, 1040], [x + (x === W && y === D ? 0 : 0), y + dy, 1040], [x, y + dy, 150]], 'corner');
    strap += poly(P, [[x, y, 150], [x + dx, y, 150], [x + dx, y, 1040], [x, y, 1040]], 'corner');
  }
  g.strap = strap;
  // Stretch film: spiral bands around the two visible faces (perimeter t: 0..2000)
  const at = (t, z) => (t <= W ? [t, D + 8, z] : [W + 8, D - (t - W), z]);
  let film = '';
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const zb = 150 + i * 118; const slope = 70 / 2000; const h = 190;
    const bottom = [0, W, 2000].map((t) => at(t, zb + slope * t));
    const top = [2000, W, 0].map((t) => at(t, Math.min(1044, zb + slope * t + h)));
    film += poly(P, [...bottom, ...top], 'film', ` style="--i:${i}"`);
  }
  film += poly(P, [[0, D + 8, 1044], [W, D + 8, 1044], [W + 8, D, 1044], [W + 8, 0, 1044], [W, 0, 1044]].map(([x, y, z]) => [x, y, z]), 'film-top');
  g.film = film;
  // Dimension lines (pallet footprint)
  const dim = [];
  const a = P([0, D + 140, 0]); const b = P([W, D + 140, 0]);
  dim.push(`<g class="dim">${line(P, [0, D + 40, 0], [0, D + 170, 0], 'ext')}${line(P, [W, D + 40, 0], [W, D + 170, 0], 'ext')}<line class="dl" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><text x="${r1((a[0] + b[0]) / 2 - 8)}" y="${r1((a[1] + b[1]) / 2 + 22)}" transform="rotate(30 ${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2)})">1200</text></g>`);
  const c = P([W + 140, D, 0]); const d = P([W + 140, 0, 0]);
  dim.push(`<g class="dim">${line(P, [W + 40, D, 0], [W + 170, D, 0], 'ext')}${line(P, [W + 40, 0, 0], [W + 170, 0, 0], 'ext')}<line class="dl" x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}"/><text x="${r1((c[0] + d[0]) / 2 + 6)}" y="${r1((c[1] + d[1]) / 2 + 20)}" transform="rotate(-30 ${r1((c[0] + d[0]) / 2)} ${r1((c[1] + d[1]) / 2)})">800</text></g>`);
  g.dim = dim.join('');

  const order = ['pallet', 'tier1', 'tier2', 'tier3', 'strap', 'film'];
  const body = order.map((k) => `<g class="layer layer-${k}" data-layer="${k}">${g[k]}</g>`).join('') + `<g class="layer layer-dim">${g.dim}</g>`;
  return `<svg class="drawing drawing-pallet" id="${id}" viewBox="-40 -40 640 720" role="img" aria-labelledby="${id}-t"><title id="${id}-t">Чертёж груза на европоддоне 1200 на 800: гофрокороба в три яруса, стреппинг-лента, защитные уголки и стрейч-плёнка</title>${body}</svg>`;
}

// ---------- Generic circle in 3D -> polyline ----------
function circle3d(P, center, r, axis, n = 72, from = 0, to = Math.PI * 2) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n; const a = r * Math.cos(t); const b = r * Math.sin(t);
    const p = axis === 'z' ? [center[0] + a, center[1] + b, center[2]] : axis === 'x' ? [center[0], center[1] + a, center[2] + b] : [center[0] + a, center[1], center[2] + b];
    out.push(P(p).join(','));
  }
  return out.join(' ');
}

// ---------- Stretch film roll (vertical axis) ----------
function roll(id, { R = 120, r = 38, H = 500, title, cls = 'roll' } = {}) {
  const s = 0.62; const P = projector(s, 200, 330);
  const top = circle3d(P, [0, 0, H], R, 'z'); const core = circle3d(P, [0, 0, H], r, 'z');
  const coreIn = circle3d(P, [0, 0, H], r - 10, 'z');
  // silhouette: tangents at screen-left/right extremes (angle where x-y is max/min: t = -45deg / 135deg)
  const front = circle3d(P, [0, 0, 0], R, 'z', 48, -Math.PI / 4, (3 * Math.PI) / 4);
  const [lx, ly] = P([R * Math.cos(3 * Math.PI / 4), R * Math.sin(3 * Math.PI / 4), 0]);
  const [rx, ry] = P([R * Math.cos(-Math.PI / 4), R * Math.sin(-Math.PI / 4), 0]);
  const [ltx, lty] = P([R * Math.cos(3 * Math.PI / 4), R * Math.sin(3 * Math.PI / 4), H]);
  const [rtx, rty] = P([R * Math.cos(-Math.PI / 4), R * Math.sin(-Math.PI / 4), H]);
  const body = `<path class="${cls}-body" d="M${rx},${ry} L${rtx},${rty} L${ltx},${lty} L${lx},${ly} L${front.split(' ').reverse().join(' L')} Z"/>`;
  // film wraps (subtle lines on body)
  let wraps = '';
  for (let z = 60; z < H; z += 70) wraps += `<polyline class="${cls}-wrap" points="${circle3d(P, [0, 0, z], R, 'z', 32, -Math.PI / 4, (3 * Math.PI) / 4)}"/>`;
  // dimension: height on the right, diameter on top
  const [hx1, hy1] = P([R * Math.cos(-Math.PI / 4) + 60, R * Math.sin(-Math.PI / 4) - 60, 0]);
  const [hx2, hy2] = P([R * Math.cos(-Math.PI / 4) + 60, R * Math.sin(-Math.PI / 4) - 60, H]);
  const dim = `<g class="dim"><line class="ext" x1="${rx}" y1="${ry}" x2="${hx1 + 10}" y2="${hy1 - 6}"/><line class="ext" x1="${rtx}" y1="${rty}" x2="${hx2 + 10}" y2="${hy2 - 6}"/><line class="dl" x1="${hx1}" y1="${hy1}" x2="${hx2}" y2="${hy2}"/><text class="dim-v" x="${hx1 + 14}" y="${r1((hy1 + hy2) / 2)}">125–500 мм</text></g>`;
  return `<svg class="drawing drawing-roll" id="${id}" viewBox="40 0 380 420" role="img" aria-labelledby="${id}-t"><title id="${id}-t">${title}</title>${body}${wraps}<polygon class="${cls}-top" points="${top}"/><polygon class="${cls}-core" points="${core}"/><polygon class="${cls}-hole" points="${coreIn}"/>${dim}</svg>`;
}

// ---------- Tape roll (short wide ring) ----------
function tape(id) {
  const s = 0.8; const P = projector(s, 200, 250);
  const R = 150, r = 95, H = 70;
  const outerTop = circle3d(P, [0, 0, H], R, 'z'); const innerTop = circle3d(P, [0, 0, H], r, 'z');
  const front = circle3d(P, [0, 0, 0], R, 'z', 48, -Math.PI / 4, (3 * Math.PI) / 4);
  const [lx, ly] = P([R * Math.cos(3 * Math.PI / 4), R * Math.sin(3 * Math.PI / 4), 0]);
  const [rx, ry] = P([R * Math.cos(-Math.PI / 4), R * Math.sin(-Math.PI / 4), 0]);
  const [ltx, lty] = P([R * Math.cos(3 * Math.PI / 4), R * Math.sin(3 * Math.PI / 4), H]);
  const [rtx, rty] = P([R * Math.cos(-Math.PI / 4), R * Math.sin(-Math.PI / 4), H]);
  const innerBack = circle3d(P, [0, 0, 0], r, 'z', 48, (3 * Math.PI) / 4, (7 * Math.PI) / 4);
  // a loose tail of tape
  const t0 = P([R * Math.cos(Math.PI / 6), R * Math.sin(Math.PI / 6), 0]); const t1 = P([R * Math.cos(Math.PI / 6), R * Math.sin(Math.PI / 6), H]);
  const tail = `<path class="tape-tail" d="M${t0} L${t1} L${r1(t1[0] + 70)},${r1(t1[1] + 110)} L${r1(t0[0] + 70)},${r1(t0[1] + 110)} Z"/>`;
  return `<svg class="drawing drawing-tape" id="${id}" viewBox="40 60 340 300" role="img" aria-labelledby="${id}-t"><title id="${id}-t">Чертёж рулона упаковочной ленты</title><path class="roll-body" d="M${rx},${ry} L${rtx},${rty} L${ltx},${lty} L${lx},${ly} L${front.split(' ').reverse().join(' L')} Z"/>${tail}<polygon class="roll-top" points="${outerTop}"/><polygon class="roll-hole" points="${innerTop}"/><polyline class="roll-wrap" points="${innerBack}"/></svg>`;
}

// ---------- Cable drum (horizontal axis along x) ----------
function drum(id) {
  const s = 0.42; const P = projector(s, 230, 300);
  const R = 420, rc = 190, L = 520;
  const back = circle3d(P, [0, 0, R], R, 'x'); const front = circle3d(P, [L, 0, R], R, 'x');
  const holeF = circle3d(P, [L, 0, R], 45, 'x');
  const barrelTop = P([0, -rc * Math.SQRT1_2, R + rc * Math.SQRT1_2]);
  let spokes = '';
  for (let k = 0; k < 8; k++) {
    const t = (k * Math.PI) / 4; const a = P([L, 60 * Math.cos(t), R + 60 * Math.sin(t)]); const b = P([L, (R - 25) * Math.cos(t), R + (R - 25) * Math.sin(t)]);
    spokes += `<line class="drum-plank" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
  }
  const ring = circle3d(P, [L, 0, R], R - 25, 'x');
  // barrel: draw a few cable turns between flanges
  let cable = '';
  for (let x = 30; x < L; x += 34) cable += `<polyline class="drum-cable" points="${circle3d(P, [x, 0, R], rc + 40, 'x', 36, Math.PI * 0.25, Math.PI * 1.25)}"/>`;
  return `<svg class="drawing drawing-drum" id="${id}" viewBox="0 -60 520 520" role="img" aria-labelledby="${id}-t"><title id="${id}-t">Чертёж деревянного кабельного барабана</title><polygon class="drum-flange back" points="${back}"/>${cable}<polygon class="drum-flange" points="${front}"/><polygon class="drum-ring" points="${ring}"/>${spokes}<polygon class="drum-hole" points="${holeF}"/><circle class="anchor" cx="${barrelTop[0]}" cy="${barrelTop[1]}" r="0"/></svg>`;
}

// ---------- Corrugated board cross-section (2D) ----------
function corrugated(id) {
  const w = 460; const x0 = 20;
  const wave = (yMid, amp, period, phase = 0) => {
    let d = `M${x0},${yMid}`;
    for (let x = 0; x <= w; x += 4) d += ` L${x0 + x},${r1(yMid + amp * Math.sin((x / period) * Math.PI * 2 + phase))}`;
    return d;
  };
  const liners = [70, 130, 190];
  return `<svg class="drawing drawing-corr" id="${id}" viewBox="0 0 500 280" role="img" aria-labelledby="${id}-t"><title id="${id}-t">Разрез пятислойного гофрокартона: три плоских слоя и два гофрированных</title>
<rect class="corr-liner" x="${x0}" y="${liners[0] - 4}" width="${w}" height="8"/>
<path class="corr-flute" d="${wave(100, 24, 60)}"/>
<rect class="corr-liner" x="${x0}" y="${liners[1] - 4}" width="${w}" height="8"/>
<path class="corr-flute" d="${wave(160, 24, 46, 1)}"/>
<rect class="corr-liner" x="${x0}" y="${liners[2] - 4}" width="${w}" height="8"/>
<g class="dim"><line class="ext" x1="${x0 + w}" y1="62" x2="${x0 + w + 2}" y2="62"/><line class="dl" x1="${x0 + 12}" y1="230" x2="${x0 + w - 12}" y2="230"/><text x="${x0 + w / 2 - 70}" y="258">5 слоёв · Т-21…Т-24</text></g></svg>`;
}

const drawings = {
  hero: pallet3d('dwg-hero'),
  explode: pallet3d('dwg-explode'),
  roll: roll('dwg-roll', { title: 'Чертёж рулона стрейч-плёнки шириной от 125 до 500 мм' }),
  'roll-product': roll('dwg-roll-product', { title: 'Чертёж рулона стрейч-плёнки с размерами' }),
  tape: tape('dwg-tape'),
  drum: drum('dwg-drum'),
  corrugated: corrugated('dwg-corr'),
};

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), process.argv[2] || '../../prototypes');
await fs.mkdir(path.join(root, 'drawings'), { recursive: true });
for (const [name, svg] of Object.entries(drawings)) {
  await fs.writeFile(path.join(root, 'drawings', `${name}.svg`), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
}
// Inject into HTML files
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'assets') out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
for (const file of await walk(root)) {
  let html = await fs.readFile(file, 'utf8'); let n = 0;
  html = html.replace(/<!-- svg:([\w-]+) -->[\s\S]*?<!-- \/svg:\1 -->/g, (m, name) => {
    if (!drawings[name]) return m; n++;
    return `<!-- svg:${name} -->${drawings[name]}<!-- /svg:${name} -->`;
  });
  if (n) { await fs.writeFile(file, html); console.log(`${path.relative(root, file)}: ${n} drawing(s)`); }
}
console.log('drawings written');
