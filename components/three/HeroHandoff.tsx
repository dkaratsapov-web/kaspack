'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Studio } from './Studio';
import { ProductModel } from './products';
import { STACK_TOP } from './LoadedPallet';
import { heroProgress } from '@/lib/heroProgress';
import { categories } from '@/lib/content';

/*
 * Передача товаров из груза в каталог (shared element между WebGL и DOM).
 * Canvas живёт в handoff-layer (sticky вместе с первым экраном, высотой в два экрана): груз и карточки
 * каталога двигаются вместе с ним силами браузера, JS меняет только прогресс анимации.
 *   q 0.32…0.92  (экран закреплён) товары по очереди поднимаются из коробов и встают в ряд над грузом,
 *                в порядке каталога
 *   L 0.12…0.87  (лист каталога наезжает) каждый товар опускается в свою карточку, принимая её
 *                ракурс и размер; в момент посадки модель сменяется картинкой карточки
 * q и L сглаживаются по времени: шаги колеса мыши превращаются в непрерывное движение.
 */
const N = 6;
const SLUGS = categories.slice(0, N).map((c) => c.slug);

// Ракурс превью каталога (render-lab): камера на 3,3 м под азимутом −35°, высота 1,55, взгляд в (0; 0,32; 0),
// fov 24°, кадр 640 px ужат до 480 без обрезки. Значит, высота кадра превью в метрах известна точно.
const LAB_EYE = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(-35)) * 3.3, 1.55, Math.cos(THREE.MathUtils.degToRad(-35)) * 3.3);
const LAB_TARGET = new THREE.Vector3(0, 0.32, 0);
const LAB_FRAME_M = 2 * LAB_EYE.distanceTo(LAB_TARGET) * Math.tan(THREE.MathUtils.degToRad(12));
const LAB_Q_INV = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(LAB_EYE, LAB_TARGET, new THREE.Vector3(0, 1, 0))).invert();

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const riseAt = (i: number) => 0.32 + i * 0.075;
const landSpan = (i: number): [number, number] => [0.12 + i * 0.05, 0.62 + i * 0.05];
/** Прогресс посадки: 0 — лист каталога у нижнего края экрана, 1 — каталог дошёл до верха. */
const landing = (catalog: HTMLElement) => clamp01((innerHeight - catalog.getBoundingClientRect().top) / innerHeight);
/** Та же постоянная сглаживания, что у сцены груза: оба слоя идут в ногу. */
export const DAMP = 9;

type Els = { slots: HTMLElement[]; cards: (HTMLElement | null)[]; catalog: HTMLElement; frame: HTMLElement };

function setWait(cards: Els['cards'], i: number, wait: boolean) {
  const li = cards[i];
  if (!li) return;
  if (wait && !('wait' in li.dataset)) li.dataset.wait = '';
  else if (!wait && 'wait' in li.dataset) delete li.dataset.wait;
}

function Flights({ els, onWarm }: { els: Els; onWarm: () => void }) {
  const { camera, gl, scene, size } = useThree();
  const items = useRef<(THREE.Group | null)[]>([]);
  const studio = useRef<THREE.Group>(null);
  const landedAt = useRef<number[]>(Array(N).fill(-1));
  const smooth = useRef({ q: heroProgress.q, L: landing(els.catalog), frames: 0 });
  const v = useMemo(() => ({
    a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0), m: new THREE.Matrix4(), q: new THREE.Quaternion(), qh: new THREE.Quaternion(), e: new THREE.Euler(),
    clip: [new THREE.Plane(new THREE.Vector3(0, 1, 0), -(STACK_TOP + 0.02))], none: [] as THREE.Plane[],
  }), []);

  useFrame((s, dt) => {
    const sh = heroProgress;
    const sm = smooth.current;
    // прогрев: первые кадры рисуем все товары (крошечными) — шейдеры и текстуры готовы до скролла
    if (sm.frames < 3) {
      sm.frames++;
      items.current.forEach((g) => { if (g) { g.visible = true; g.scale.setScalar(1e-4); } });
      if (sm.frames === 3) onWarm();
      return;
    }

    const cr = gl.domElement.getBoundingClientRect();
    const f = els.frame.getBoundingClientRect();
    if (!sh.cam.ready || !f.width || !cr.height) return;
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width, H = size.height;

    // рисуем только видимую часть высокого canvas
    const top = Math.max(0, -cr.top), bottom = Math.min(cr.height, innerHeight - cr.top);
    gl.setScissorTest(true);
    gl.setScissor(0, H - bottom, W, Math.max(0, bottom - top));

    // камера груза: рамка hero-frame в координатах этого canvas
    cam.fov = sh.cam.fov;
    cam.aspect = f.width / f.height;
    cam.setViewOffset(f.width, f.height, cr.left - f.left, cr.top - f.top, W, H);
    cam.position.fromArray(sh.cam.pos);
    cam.quaternion.fromArray(sh.cam.quat);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const pxPerM = (dist: number) => f.height / (2 * dist * tanH);
    const toWorld = (px: number, py: number, dist: number, out: THREE.Vector3) =>
      out.set(((px - cr.left) / W) * 2 - 1, -((py - cr.top) / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(dist).add(cam.position);

    const k = 1 - Math.exp(-dt * DAMP);
    sm.q += (sh.q - sm.q) * k;
    sm.L += (landing(els.catalog) - sm.L) * k;
    const q = sm.q, L = sm.L;
    // пока товар внутри короба, всё ниже кромки срезано — он «вырастает» из полости
    gl.clippingPlanes = L > 0.01 ? v.none : v.clip;

    const D = sh.cam.dist * 0.86;
    const r0 = els.slots[0].getBoundingClientRect(), r1 = els.slots[1].getBoundingClientRect();
    const xLast = f.left + f.width * 0.55;
    const gap = Math.min((r1.left - r0.left) * 0.5, (xLast - 90) / (N - 1));
    const t = s.clock.elapsedTime;
    let lit = false;

    for (let i = 0; i < N; i++) {
      const g = items.current[i];
      if (!g) continue;
      const s0 = riseAt(i);
      const rise = span(q, s0, s0 + 0.1);
      const toRow = span(q, s0 + 0.07, s0 + 0.22);
      const [la, lb] = landSpan(i);
      const land = span(L, la, lb);
      if (land < 1) landedAt.current[i] = -1;
      else if (landedAt.current[i] < 0) landedAt.current[i] = t;
      // картинка карточки проявляется в момент посадки, модель держится под ней ещё 0,55 с
      setWait(els.cards, i, land < 1);
      const show = rise > 0 && !(land >= 1 && t - landedAt.current[i] > 0.55);
      g.visible = show;
      if (!show) continue;

      // карточка: центр кадра превью = точка модели (0; 0,32; 0), поза — как у камеры превью
      const r = els.slots[i].getBoundingClientRect();
      toWorld(r.left + r.width / 2, r.top + r.height / 2, D, v.c);
      v.m.lookAt(cam.position, v.c, v.up);
      v.q.setFromRotationMatrix(v.m).multiply(LAB_Q_INV);
      const sLand = r.width / LAB_FRAME_M / pxPerM(D);

      // ряд над грузом: тот же порядок, что на ленте каталога
      const kk = i - (N - 1) / 2;
      toWorld(xLast - (N - 1 - i) * gap, f.top - f.height * 0.03 + kk * kk * 5, D, v.b);
      const sRow = sLand * 0.55;

      const c = sh.cartons[i % 4];
      v.a.set(c[0], c[1] - 0.2 + 0.45 * easeOut(rise), c[2]);
      const h = easeInOut(toRow);
      v.d.lerpVectors(v.a, v.b, h);
      v.d.y += Math.sin(Math.PI * h) * 0.15;

      const l = easeInOut(land);
      g.position.lerpVectors(v.d, v.c, l);
      g.position.y += Math.sin(Math.PI * l) * 0.1;
      const sc = 0.24 + (sRow - 0.24) * h;
      g.scale.setScalar(sc + (sLand - sc) * l);
      v.e.set(0.18 * (1 - l), i * 0.9 + q * 3 + t * 0.35, 0.06 * (1 - l));
      v.qh.setFromEuler(v.e);
      g.quaternion.slerpQuaternions(v.qh, v.q, l);

      // свет поворачивается вместе с ракурсом превью — при подмене на картинку блики совпадают
      if (!lit) {
        scene.environmentRotation.setFromQuaternion(v.q);
        studio.current?.quaternion.copy(v.q);
        lit = true;
      }
    }
  });

  return (
    <>
      <group ref={studio}><Studio /></group>
      {SLUGS.map((slug, i) => (
        <group key={slug} ref={(o) => { items.current[i] = o; }} visible={false}>
          <group position={[0, -0.32, 0]}><ProductModel slug={slug} /></group>
        </group>
      ))}
    </>
  );
}

export default function HeroHandoff() {
  const [els, setEls] = useState<Els | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [warm, setWarm] = useState(true);

  useEffect(() => {
    const catalog = document.getElementById('catalog');
    const frame = document.querySelector<HTMLElement>('[data-hero-frame]');
    const layer = document.querySelector<HTMLElement>('[data-handoff-layer]');
    const slots = [...document.querySelectorAll<HTMLElement>('#catalog .spin')].slice(0, N);
    if (!catalog || !frame || !layer || slots.length < N) return;
    const cards = slots.map((sl) => sl.closest('li'));
    setEls({ slots, cards, catalog, frame });
    setTarget(layer);
    let raf = 0;
    const update = () => {
      raf = 0;
      const ct = catalog.getBoundingClientRect().top;
      const on = heroProgress.q > 0.15 && ct > -innerHeight * 0.3;
      setActive(on);
      // вне активной зоны карточки в предсказуемом состоянии: наверху ждут товар, ниже — уже с картинкой
      if (!on) cards.forEach((_, i) => setWait(cards, i, ct > 0));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      cards.forEach((_, i) => setWait(cards, i, false));
    };
  }, []);

  if (!els || !target) return null;
  return createPortal(
    <div className="absolute inset-x-0 top-0 h-[200%]" style={{ visibility: active ? 'visible' : 'hidden' }}>
      <Canvas
        dpr={[1, 1.25]}
        frameloop={active || warm ? 'always' : 'never'}
        camera={{ fov: 26, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Flights els={els} onWarm={() => setWarm(false)} />
      </Canvas>
    </div>,
    target,
  );
}
