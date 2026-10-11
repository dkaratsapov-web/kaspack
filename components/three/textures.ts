import * as THREE from 'three';

// Процедурные текстуры: без внешних файлов и CDN. Детерминированный шум, чтобы картинка была одинаковой.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true, repeat = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

/** Бурый гофрокартон: пятнистость, волокна, лёгкие вертикальные полосы гофры. */
export function kraftTextures(seed = 7) {
  const size = 512;
  const r = rng(seed);
  const [c, g] = canvas(size);
  g.fillStyle = '#b08a5c';
  g.fillRect(0, 0, size, size);
  // крупная пятнистость
  for (let i = 0; i < 260; i++) {
    const x = r() * size, y = r() * size, rad = 20 + r() * 70;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const tone = r() > 0.5 ? '186,148,104' : '160,124,84';
    grd.addColorStop(0, `rgba(${tone},0.18)`);
    grd.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // полосы гофры (едва заметные)
  for (let x = 0; x < size; x += 6) {
    g.fillStyle = `rgba(90,62,30,${0.025 + r() * 0.02})`;
    g.fillRect(x, 0, 2, size);
  }
  // волокна
  for (let i = 0; i < 2600; i++) {
    const x = r() * size, y = r() * size, len = 3 + r() * 10, a = r() * Math.PI;
    g.strokeStyle = r() > 0.5 ? 'rgba(70,46,20,0.16)' : 'rgba(230,200,150,0.14)';
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  const map = toTexture(c);

  // карта рельефа: полосы гофры + шум
  const [bc, bg] = canvas(size);
  bg.fillStyle = '#808080';
  bg.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 6) {
    bg.fillStyle = 'rgba(255,255,255,0.08)';
    bg.fillRect(x, 0, 3, size);
  }
  const img = bg.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 26;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  bg.putImageData(img, 0, 0);
  const bump = toTexture(bc, false);
  return { map, bump };
}

/** Сосновая доска: продольные годовые кольца, сучки. */
export function woodTextures(seed = 11) {
  const w = 1024, h = 256;
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d8c096';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const y0 = r() * h, amp = 2 + r() * 8, freq = 0.002 + r() * 0.006, ph = r() * 10;
    g.strokeStyle = `rgba(${150 + r() * 30},${110 + r() * 25},${60 + r() * 20},${0.18 + r() * 0.25})`;
    g.lineWidth = 0.6 + r() * 1.8;
    g.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const x = r() * w, y = r() * h, rx = 6 + r() * 8;
    const grd = g.createRadialGradient(x, y, 0, x, y, rx * 2.4);
    grd.addColorStop(0, 'rgba(110,72,30,0.75)');
    grd.addColorStop(0.4, 'rgba(140,96,48,0.35)');
    grd.addColorStop(1, 'rgba(140,96,48,0)');
    g.fillStyle = grd;
    g.beginPath(); g.ellipse(x, y, rx * 2.4, rx * 1.2, 0, 0, Math.PI * 2); g.fill();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return { map };
}

/** Штамп на коробе: знак-шеврон и вордмарк графитовой краской, слегка «непропечатанный». */
export function stampTexture(seed = 3) {
  const w = 512, h = 256;
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(28,30,34,0.86)';
  // знак 190x128 → масштаб 0.55
  g.save();
  g.translate(40, 70);
  g.scale(0.62, 0.62);
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(95, 59); g.lineTo(190, 0); g.lineTo(190, 23); g.lineTo(95, 88); g.lineTo(0, 23); g.closePath();
  g.fill();
  g.fillRect(0, 105, 190, 23);
  g.restore();
  g.font = '600 64px "Arial", sans-serif';
  g.textBaseline = 'middle';
  g.fillText('kaspack', 175, 112);
  g.font = '500 20px "Arial", sans-serif';
  g.fillText('ПРОИЗВОДСТВО ПРОМЫШЛЕННОЙ УПАКОВКИ', 42, 190);
  // непропечатка: выбиваем случайные точки
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.6})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
