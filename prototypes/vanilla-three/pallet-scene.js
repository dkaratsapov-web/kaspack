// 3D-сцена «груз на поддоне»: каждый слой — товар из каталога Kaspack.
// API: const scene = await createPalletScene(canvas, opts)
//   scene.setWrap(0..1)     — сколько стрейч-плёнки намотано
//   scene.setExplode(0..1)  — разбор груза на слои
//   scene.anchors()         — экранные координаты подписей слоёв
//   scene.dispose()
import * as THREE from '../vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/geometries/RoundedBoxGeometry.js';

const W = 1.2, D = 0.8, PH = 0.144, BH = 0.3, TIERS = 3;
const STACK_TOP = PH + BH * TIERS;

const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function makeMaterials(theme) {
  const edge = new THREE.LineBasicMaterial({ color: theme.edge, transparent: true, opacity: theme.edgeOpacity });
  return {
    edge,
    kraft: new THREE.MeshStandardMaterial({ color: 0xb9946a, roughness: 0.92, metalness: 0 }),
    kraftDark: new THREE.MeshStandardMaterial({ color: 0xa88259, roughness: 0.95 }),
    tape: new THREE.MeshStandardMaterial({ color: 0xc8a978, roughness: 0.45, metalness: 0.02 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xd9c49d, roughness: 1 }),
    woodEnd: new THREE.MeshStandardMaterial({ color: 0xc4ab80, roughness: 1 }),
    strap: new THREE.MeshStandardMaterial({ color: theme.accent, roughness: 0.4, metalness: 0.05 }),
    corner: new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6 }),
    film: new THREE.MeshPhysicalMaterial({
      color: theme.film, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.32,
      side: THREE.DoubleSide, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.2,
    }),
  };
}

function withEdges(mesh, mat, threshold = 30) {
  const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), mat);
  mesh.add(lines);
  return mesh;
}

function addBox(group, m, [sx, sy, sz], [x, y, z], mat, edges = true, rounded = 0) {
  const geo = rounded ? new RoundedBoxGeometry(sx, sy, sz, 2, rounded) : new THREE.BoxGeometry(sx, sy, sz);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (edges) withEdges(mesh, m.edge, rounded ? 40 : 1);
  group.add(mesh);
  return mesh;
}

// Three.js: y — вверх. Поддон 1200 (x) × 800 (z).
function buildPallet(m) {
  const g = new THREE.Group();
  const boardW = 0.1;
  for (let i = 0; i < 3; i++) addBox(g, m, [W, 0.022, boardW], [0, 0.011, -D / 2 + boardW / 2 + i * (D - boardW) / 2], m.wood);
  for (const x of [-W / 2 + 0.0725, 0, W / 2 - 0.0725]) {
    for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) addBox(g, m, [0.145, 0.078, 0.1], [x, 0.022 + 0.039, z], m.woodEnd);
  }
  for (const x of [-W / 2 + 0.0725, 0, W / 2 - 0.0725]) addBox(g, m, [0.145, 0.022, D], [x, 0.1 + 0.011, 0], m.wood);
  const tops = 7;
  for (let i = 0; i < tops; i++) {
    const w = i % 3 === 0 ? 0.145 : 0.1;
    addBox(g, m, [W, 0.022, w], [0, 0.122 + 0.011, -D / 2 + w / 2 + i * ((D - w) / (tops - 1))], m.wood);
  }
  return g;
}

function buildTier(m, t) {
  const g = new THREE.Group();
  const y0 = PH + t * BH;
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.2, 0.2]) {
      const box = addBox(g, m, [0.596, BH - 0.004, 0.396], [x, y0 + BH / 2, z], m.kraft, true, 0.012);
      // клапаны и скотч на крышке
      addBox(box, m, [0.598, 0.003, 0.05], [0, BH / 2, 0], m.tape, false);
      addBox(box, m, [0.003, 0.07, 0.05], [0.3, BH / 2 - 0.035, 0], m.tape, false);
      addBox(box, m, [0.003, 0.07, 0.05], [-0.3, BH / 2 - 0.035, 0], m.tape, false);
      // шов клапанов
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.001, 0.004), m.kraftDark);
      seam.position.set(0, BH / 2 + 0.0005, 0.0); box.add(seam);
    }
  }
  return g;
}

function buildStrapping(m) {
  const g = new THREE.Group();
  const t = 0.004, w = 0.016, h = STACK_TOP - PH;
  for (const x of [-0.32, 0.32]) {
    addBox(g, m, [w, h, t], [x, PH + h / 2, D / 2 + 0.006], m.strap, false);
    addBox(g, m, [w, h, t], [x, PH + h / 2, -D / 2 - 0.006], m.strap, false);
    addBox(g, m, [w, t, D + 0.016], [x, STACK_TOP + 0.004, 0], m.strap, false);
  }
  // защитные уголки на вертикальных рёбрах
  const cw = 0.05;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = (sx * W) / 2, z = (sz * D) / 2;
    addBox(g, m, [cw, h, 0.004], [x - (sx * cw) / 2, PH + h / 2, z + sz * 0.004], m.corner);
    addBox(g, m, [0.004, h, cw], [x + sx * 0.004, PH + h / 2, z - (sz * cw) / 2], m.corner);
  }
  return g;
}

// Спиральная лента плёнки вокруг стека; drawRange управляет «намоткой».
function buildFilm(m) {
  const pad = 0.018, r = 0.035;
  const hw = W / 2 + pad, hd = D / 2 + pad;
  const path = new THREE.Path();
  path.moveTo(-hw + r, hd);
  path.lineTo(hw - r, hd); path.quadraticCurveTo(hw, hd, hw, hd - r);
  path.lineTo(hw, -hd + r); path.quadraticCurveTo(hw, -hd, hw - r, -hd);
  path.lineTo(-hw + r, -hd); path.quadraticCurveTo(-hw, -hd, -hw, -hd + r);
  path.lineTo(-hw, hd - r); path.quadraticCurveTo(-hw, hd, -hw + r, hd);
  const perSpin = 160, turns = 5.5, total = Math.round(perSpin * turns);
  const ring = path.getSpacedPoints(perSpin);
  const bandH = 0.26, yStart = PH + 0.01, yEnd = STACK_TOP + 0.01 - bandH;
  const pos = new Float32Array((total + 1) * 2 * 3);
  for (let i = 0; i <= total; i++) {
    const p = ring[i % perSpin];
    const y = yStart + ((yEnd - yStart) * i) / total;
    pos.set([p.x, y, p.y, p.x, y + bandH, p.y], i * 6);
  }
  const idx = [];
  for (let i = 0; i < total; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, m.film);
  mesh.renderOrder = 2;
  const g = new THREE.Group(); g.add(mesh);
  g.userData.setWrap = (t) => geo.setDrawRange(0, Math.max(0, Math.round(total * t)) * 6);
  g.userData.setWrap(1);
  return g;
}

export async function createPalletScene(canvas, opts = {}) {
  const dark = opts.theme === 'dark';
  const theme = {
    accent: new THREE.Color(css('--accent-3d', dark ? '#7b8fff' : '#2445d6')),
    film: new THREE.Color(dark ? '#c9d3ff' : '#9fb0ff'),
    edge: new THREE.Color(dark ? '#e7e9ec' : '#16181b'),
    edgeOpacity: dark ? 0.28 : 0.22,
  };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = dark ? 1.05 : 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x1a1d22 : 0xd9dbe0, dark ? 1.1 : 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, dark ? 2.2 : 2.4);
  sun.position.set(2.5, 4.2, 3.2); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 12 });
  sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(dark ? 0x8899ff : 0xb8c4ff, dark ? 1.4 : 0.6);
  rim.position.set(-3, 2, -2); scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: dark ? 0.35 : 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const m = makeMaterials(theme);
  const root = new THREE.Group(); scene.add(root);
  const layers = {
    pallet: buildPallet(m),
    tier1: buildTier(m, 0), tier2: buildTier(m, 1), tier3: buildTier(m, 2),
    strap: buildStrapping(m), film: buildFilm(m),
  };
  // Разбор: куда уезжает каждый слой (вверх, с небольшим разворотом)
  const explodeTo = {
    pallet: [0, 0, 0], tier1: [0, 0.32, 0], tier2: [0, 0.64, 0], tier3: [0, 0.96, 0],
    strap: [0, 1.36, 0], film: [0, 1.72, 0],
  };
  for (const [k, g] of Object.entries(layers)) { g.userData.key = k; root.add(g); }

  // Якоря подписей (правый край каждого слоя)
  const anchorLocal = {
    pallet: new THREE.Vector3(W / 2, PH * 0.6, D / 2), tier1: new THREE.Vector3(W / 2, PH + BH * 0.5, D / 2),
    tier3: new THREE.Vector3(W / 2, PH + BH * 2.6, -D / 4),
    strap: new THREE.Vector3(-0.32, STACK_TOP, D / 2), film: new THREE.Vector3(-W / 2, PH + BH * 1.5, D / 2),
  };

  const state = { wrap: 1, explode: 0, pointer: { x: 0, y: 0 }, rot: { x: 0, y: 0 }, idle: opts.idle !== false, visible: true, raf: 0 };
  const baseYaw = opts.yaw ?? -0.62;

  function frameCamera() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const e = state.explode;
    const height = STACK_TOP + 1.72 * e;
    const target = new THREE.Vector3(0, height * 0.48, 0);
    // расстояние, чтобы груз помещался по высоте и ширине
    const fitH = (height * 1.25) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const fitW = (1.75 / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const dist = Math.max(fitH, fitW, 3.2) * (opts.zoom ?? 1);
    const dir = new THREE.Vector3(0.0, 0.42, 1).normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  function apply() {
    const e = THREE.MathUtils.smootherstep(state.explode, 0, 1);
    for (const [k, g] of Object.entries(layers)) {
      const [x, y, z] = explodeTo[k];
      g.position.set(x * e, y * e, z * e);
    }
    layers.film.rotation.y = -0.25 * e;
    layers.strap.rotation.y = 0.12 * e;
    layers.film.userData.setWrap(state.wrap);
  }

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    // пружинное сглаживание указателя (без прямого маппинга)
    state.rot.x += (state.pointer.y * 0.12 - state.rot.x) * 0.06;
    state.rot.y += (state.pointer.x * 0.35 - state.rot.y) * 0.06;
    const idle = state.idle ? Math.sin(t * 0.25) * 0.12 : 0;
    root.rotation.set(state.rot.x, baseYaw + state.rot.y + idle, 0);
    renderer.render(scene, camera);
  }
  function loop() { state.raf = requestAnimationFrame(loop); if (state.visible) render(); }

  const ro = new ResizeObserver(() => { frameCamera(); render(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; }, { rootMargin: '100px' });
  io.observe(canvas);
  const onVis = () => { state.visible = !document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  let onMove = null;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !opts.static) {
    onMove = (ev) => {
      state.pointer.x = (ev.clientX / innerWidth) * 2 - 1;
      state.pointer.y = (ev.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onMove, { passive: true });
  }

  apply(); frameCamera();
  if (opts.static) render(); else loop();

  const v = new THREE.Vector3();
  return {
    setWrap(t) { state.wrap = THREE.MathUtils.clamp(t, 0, 1); apply(); if (opts.static) render(); },
    setExplode(t) { state.explode = THREE.MathUtils.clamp(t, 0, 1); apply(); frameCamera(); if (opts.static) render(); },
    setIdle(on) { state.idle = on; },
    anchors() {
      root.updateMatrixWorld(true);
      const rect = canvas.getBoundingClientRect();
      const out = {};
      for (const [k, p] of Object.entries(anchorLocal)) {
        const layer = k === 'tier3' ? layers.tier3 : layers[k];
        v.copy(p).applyMatrix4(layer.matrixWorld).project(camera);
        out[k] = { x: (v.x * 0.5 + 0.5) * rect.width, y: (-v.y * 0.5 + 0.5) * rect.height };
      }
      return out;
    },
    dispose() {
      cancelAnimationFrame(state.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (onMove) removeEventListener('pointermove', onMove);
      renderer.dispose();
    },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
