'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Studio } from './Studio';
import { ProductModel } from './products';
import { StageDriver } from './StageDriver';
import { HANDOFF_COUNT, heroProgress } from '@/lib/heroProgress';
import { categories } from '@/lib/content';

/*
 * Товары из груза встают на ленту каталога (shared element между WebGL и DOM).
 * Canvas лежит в закреплённом экране сцены HeroCatalogStage вместе с грузом и каталогом и рисуется её циклом
 * сразу после записи q (уже сглаженного). Ничего не скроллится, поэтому DOM и 3D всегда совпадают.
 *   0.12…0.40  товары по очереди выезжают из коробов и встают в ряд над грузом, в порядке каталога
 *   0.42…0.62  подложка первого экрана растворяется — товары на светлом экране
 *   0.50…0.92  каждый товар едет в свою карточку, принимая её ракурс и размер; затем модель
 *              сменяется картинкой карточки
 * Положения рамки груза и карточек меряются при ресайзе (в цикле layout не читается).
 */
const N = HANDOFF_COUNT;
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
const riseAt = (i: number) => 0.12 + i * 0.035;
/** длина подъёма из короба; пока товар внутри, его рисует сцена груза (HeroRisers) — стенки и клапаны его честно закрывают */
const RISE = 0.1;
const landSpan = (i: number): [number, number] => [0.5 + i * 0.035, 0.74 + i * 0.035];
const ACTIVE_FROM = 0.08, ACTIVE_TO = 0.999;

type Box = { left: number; top: number; width: number; height: number };
type Els = { view: HTMLElement; frame: HTMLElement; slots: HTMLElement[]; cards: (HTMLElement | null)[] };

function setWait(cards: Els['cards'], i: number, wait: boolean) {
  const li = cards[i];
  if (!li) return;
  if (wait && !('wait' in li.dataset)) li.dataset.wait = '';
  else if (!wait && 'wait' in li.dataset) delete li.dataset.wait;
}

/** Подъём из короба внутри сцены груза: та же поза, что у слоя товаров в момент подхвата. */
export function HeroRisers() {
  const items = useRef<(THREE.Group | null)[]>([]);
  const warm = useRef(0);
  const e = useMemo(() => new THREE.Euler(), []);

  useFrame((s) => {
    const q = heroProgress.q, t = s.clock.elapsedTime;
    // прогрев: шейдеры товаров компилируются сразу, а не в момент подъёма
    const warming = warm.current < 3;
    if (warming) warm.current++;
    for (let i = 0; i < N; i++) {
      const g = items.current[i];
      if (!g) continue;
      const rise = span(q, riseAt(i), riseAt(i) + RISE);
      g.visible = warming || (rise > 0 && rise < 1);
      if (!g.visible) continue;
      const c = heroProgress.cartons[i % 4];
      g.position.set(c[0], c[1] - 0.2 + 0.45 * easeOut(rise), c[2]);
      g.scale.setScalar(warming ? 1e-4 : 0.24);
      e.set(0.18, i * 0.9 + q * 3 + t * 0.35, 0.06);
      g.quaternion.setFromEuler(e);
    }
  });

  return (
    <>
      {SLUGS.map((slug, i) => (
        <group key={slug} ref={(o) => { items.current[i] = o; }} visible={false}>
          <group position={[0, -0.32, 0]}><ProductModel slug={slug} /></group>
        </group>
      ))}
    </>
  );
}

function Flights({ els, warm }: { els: Els; warm: React.RefObject<number> }) {
  const { camera, scene, size } = useThree();
  const items = useRef<(THREE.Group | null)[]>([]);
  const studio = useRef<THREE.Group>(null);
  const landedAt = useRef<number[]>(Array(N).fill(-1));
  const bounds = useRef<{ frame: Box; slots: Box[] } | null>(null);
  const v = useMemo(() => ({
    a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0), m: new THREE.Matrix4(), q: new THREE.Quaternion(), qh: new THREE.Quaternion(), e: new THREE.Euler(),
    one: new THREE.Quaternion(),
  }), []);

  // замеры относительно закреплённого экрана (canvas занимает его целиком); лента — без текущего сдвига
  useEffect(() => {
    const measure = () => {
      const view = els.view.getBoundingClientRect();
      const rel = (r: DOMRect, dx = 0): Box => ({ left: r.left - view.left - dx, top: r.top - view.top, width: r.width, height: r.height });
      bounds.current = {
        frame: rel(els.frame.getBoundingClientRect()),
        slots: els.slots.map((sl) => rel(sl.getBoundingClientRect(), heroProgress.trackX)),
      };
    };
    measure();
    addEventListener('resize', measure);
    addEventListener('load', measure);
    return () => { removeEventListener('resize', measure); removeEventListener('load', measure); };
  }, [els, size]);

  useFrame((s) => {
    // прогрев: первые кадры рисуем все товары (крошечными) — шейдеры и текстуры готовы до скролла
    if (warm.current < 3) {
      warm.current++;
      items.current.forEach((g) => { if (g) { g.visible = true; g.scale.setScalar(1e-4); } });
      return;
    }
    const sh = heroProgress;
    const b = bounds.current;
    if (!sh.cam.ready || !b || !b.frame.width) return;
    const f = b.frame;
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width, H = size.height;

    // камера груза: рамка hero-frame в координатах этого canvas
    cam.fov = sh.cam.fov;
    cam.aspect = f.width / f.height;
    cam.setViewOffset(f.width, f.height, -f.left, -f.top, W, H);
    cam.position.fromArray(sh.cam.pos);
    cam.quaternion.fromArray(sh.cam.quat);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const pxPerM = (dist: number) => f.height / (2 * dist * tanH);
    const toWorld = (px: number, py: number, dist: number, out: THREE.Vector3) =>
      out.set((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(dist).add(cam.position);

    const q = sh.q;

    const xLast = f.left + f.width * 0.55;
    const gap = Math.min((b.slots[1].left - b.slots[0].left) * 0.5, (xLast - 90) / (N - 1));
    const t = s.clock.elapsedTime;
    let lit = false;

    for (let i = 0; i < N; i++) {
      const g = items.current[i];
      if (!g) continue;
      const s0 = riseAt(i);
      const rise = span(q, s0, s0 + RISE);
      const toRow = span(q, s0 + RISE, s0 + RISE + 0.12);
      const [la, lb] = landSpan(i);
      const land = span(q, la, lb);
      if (land < 1) landedAt.current[i] = -1;
      else if (landedAt.current[i] < 0) landedAt.current[i] = t;
      // картинка карточки проявляется в момент посадки, модель держится под ней ещё 0,55 с
      setWait(els.cards, i, land < 1);
      // этот слой подхватывает товар, когда тот целиком вышел из короба (до этого его рисует сцена груза)
      const show = rise >= 1 && !(land >= 1 && t - landedAt.current[i] > 0.55);
      g.visible = show;
      if (!show) continue;

      // у каждого товара свой слой глубины (шаг ~0,35 м): в полёте они проходят друг перед другом, а не насквозь.
      // Положение на экране и итоговый размер от глубины не зависят — масштаб считается через неё же
      const D = sh.cam.dist * (0.72 + 0.06 * i);

      // карточка: центр кадра превью = точка модели (0; 0,32; 0), поза — как у камеры превью
      const r = b.slots[i];
      toWorld(r.left + r.width / 2, r.top + r.height / 2, D, v.c);
      v.m.lookAt(cam.position, v.c, v.up);
      v.q.setFromRotationMatrix(v.m).multiply(LAB_Q_INV);
      const sLand = r.width / LAB_FRAME_M / pxPerM(D);

      // ряд над грузом: тот же порядок, что на ленте каталога
      const k = i - (N - 1) / 2;
      toWorld(xLast - (N - 1 - i) * gap, f.top - f.height * 0.03 + k * k * 5, D, v.b);
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

      // свет поворачивается к ракурсу превью по мере посадки: при выходе из короба — как в сцене груза,
      // при подмене на картинку — как на рендере карточки
      if (!lit) {
        v.one.identity().slerp(v.q, l);
        scene.environmentRotation.setFromQuaternion(v.one);
        studio.current?.quaternion.copy(v.one);
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
  const container = useRef<HTMLDivElement>(null);
  const warm = useRef(0);
  const shown = useRef(false);

  useEffect(() => {
    const frame = document.querySelector<HTMLElement>('[data-hero-frame]');
    const layer = document.querySelector<HTMLElement>('[data-handoff-layer]');
    const view = layer?.closest<HTMLElement>('.stage-view');
    const slots = [...document.querySelectorAll<HTMLElement>('[data-catalog] .spin')].slice(0, N);
    if (!frame || !layer || !view || slots.length < N) return;
    const cards = slots.map((sl) => sl.closest('li'));
    setEls({ view, frame, slots, cards });
    setTarget(layer);
    return () => cards.forEach((_, i) => setWait(cards, i, false));
  }, []);

  // решает в цикле сцены, рисовать ли кадр; вне фазы передачи — карточки в предсказуемом состоянии
  const when = useCallback(() => {
    if (warm.current < 3) return true;
    const q = heroProgress.q;
    const on = q > ACTIVE_FROM && q < ACTIVE_TO;
    if (on !== shown.current && container.current) {
      shown.current = on;
      container.current.style.visibility = on ? 'visible' : 'hidden';
    }
    if (!on && els) els.cards.forEach((_, i) => setWait(els.cards, i, q < 0.5));
    return on;
  }, [els]);

  if (!els || !target) return null;
  return createPortal(
    <div ref={container} className="absolute inset-0" style={{ visibility: 'hidden' }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="never"
        camera={{ fov: 26, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <StageDriver when={when} />
        <Flights els={els} warm={warm} />
      </Canvas>
    </div>,
    target,
  );
}
