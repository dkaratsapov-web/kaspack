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
const LAB_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(LAB_EYE, LAB_TARGET, new THREE.Vector3(0, 1, 0)));
const LAB_Q_INV = LAB_Q.clone().invert();
/** камера превью относительно точки модели (0; 0,32; 0), которую мы держим в начале координат */
const LAB_CAM_POS = LAB_EYE.clone().sub(LAB_TARGET);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
/** smootherstep: нулевые скорость и ускорение на концах — мягкий старт из короба и мягкая посадка */
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/*
 * Движение (animation-principles): один непрерывный путь на товар, без остановок между фазами.
 * Прогресс пути P = smootherstep(span(q, START, END)) — ускорение из короба, торможение в карточку.
 *   0 … PA   выход из короба строго вверх (рисует сцена груза, стенки и клапаны его закрывают)
 *   PA … 1   дуга: вверх → через высоту над грузом → вниз в карточку (кубическая кривая Безье,
 *            касательная в стыке вертикальная — скорость и направление непрерывны)
 * Вращение не зависит от времени: начальный разворот «раскручивается» к позе карточки (follow-through).
 * Тень проявляется под товаром перед посадкой (вторичное движение), подмена на картинку — в одном кадре.
 */
const START = (i: number) => 0.12 + i * 0.04;
const END = (i: number) => 0.7 + i * 0.035;
const PA = 0.14;
const LIFT = 0.42;
const SPIN = [1.5, -1.3, 1.2, -1.6, 1.3, -1.4];
const pathAt = (i: number, q: number) => smoother(span(q, START(i), END(i)));
/** поза «в полёте» до доворота к карточке: наклон и разворот гаснут к концу пути */
function idleEuler(i: number, P: number, e: THREE.Euler) {
  const k = 1 - P;
  return e.set(0.22 * k, i * 1.1 - 0.4 + SPIN[i] * k * k, 0.08 * k);
}
const ACTIVE_FROM = 0.08, ACTIVE_TO = 0.999;

type Box = { left: number; top: number; width: number; height: number };
type Els = { view: HTMLElement; frame: HTMLElement; slots: HTMLElement[]; cards: (HTMLElement | null)[] };

function setWait(cards: Els['cards'], i: number, wait: boolean) {
  const li = cards[i];
  if (!li) return;
  if (wait && !('wait' in li.dataset)) li.dataset.wait = '';
  else if (!wait && 'wait' in li.dataset) delete li.dataset.wait;
}

/** Мягкая контактная тень под товаром — как ContactShadows на рендерах карточек. */
function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(28,31,38,0.9)');
    grad.addColorStop(0.4, 'rgba(28,31,38,0.5)');
    grad.addColorStop(1, 'rgba(28,31,38,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** Выход из короба внутри сцены груза: та же формула позы, что у слоя полёта в момент подхвата. */
export function HeroRisers() {
  const items = useRef<(THREE.Group | null)[]>([]);
  const warm = useRef(0);
  const e = useMemo(() => new THREE.Euler(), []);

  useFrame(() => {
    const q = heroProgress.q;
    // прогрев: шейдеры товаров компилируются сразу, а не в момент подъёма
    const warming = warm.current < 3;
    if (warming) warm.current++;
    for (let i = 0; i < N; i++) {
      const g = items.current[i];
      if (!g) continue;
      const P = pathAt(i, q);
      g.visible = warming || (P > 0 && P < PA);
      if (!g.visible) continue;
      const c = heroProgress.cartons[i % 4];
      g.position.set(c[0], c[1] - 0.2 + LIFT * (P / PA), c[2]);
      g.scale.setScalar(warming ? 1e-4 : 0.24);
      g.quaternion.setFromEuler(idleEuler(i, P, e));
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

/*
 * Каждый летящий товар рисуется своей камерой, направленной прямо на него, — камерой превью карточки
 * (fov 24°, 3,3 м), в свой квадрат экрана. Общая камера смотрит на карточки сбоку, вне оптической оси:
 * её перспектива заваливала вертикали, и при подмене модель не совпадала с картинкой.
 * Здесь же в момент посадки кадр — ровно рендер карточки (та же камера, поза, свет, размер квадрата =
 * ширина карточки), а в момент выхода из короба — тот же вид, что даёт общая камера сцены груза.
 */
function Flights({ els, warm }: { els: Els; warm: React.RefObject<number> }) {
  const { camera, scene, size, gl } = useThree();
  const items = useRef<(THREE.Group | null)[]>([]);
  const shadows = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const studio = useRef<THREE.Group>(null);
  const bounds = useRef<{ frame: Box; slots: Box[] } | null>(null);
  const shadowMap = useShadowTexture();
  const labCam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(24, 1, 0.05, 30);
    c.position.copy(LAB_CAM_POS);
    c.lookAt(0, 0, 0);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    return c;
  }, []);
  const v = useMemo(() => ({
    b0: new THREE.Vector3(), b1: new THREE.Vector3(), b2: new THREE.Vector3(), b3: new THREE.Vector3(), p: new THREE.Vector3(), ndc: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0), m: new THREE.Matrix4(), qLand: new THREE.Quaternion(), qh: new THREE.Quaternion(), qWorld: new THREE.Quaternion(),
    look: new THREE.Quaternion(), rel: new THREE.Quaternion(), env: new THREE.Quaternion(), envFrom: new THREE.Quaternion(), e: new THREE.Euler(),
    passes: [] as { i: number; dist: number; x: number; y: number; side: number; rel: THREE.Quaternion; env: THREE.Quaternion; shadow: number }[],
  }), []);

  // замеры относительно закреплённого экрана (canvas занимает его целиком); лента — без текущего сдвига.
  // Перемеряем после загрузки шрифтов: ширина подписей двигает карточки
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
    document.fonts?.ready.then(measure);
    addEventListener('resize', measure);
    addEventListener('load', measure);
    return () => { removeEventListener('resize', measure); removeEventListener('load', measure); };
  }, [els, size]);

  // приоритет 1: R3F не рисует кадр сам — рисуем товары по одному, каждый своей камерой
  useFrame(() => {
    const W = size.width, H = size.height;
    gl.autoClear = false;
    gl.setScissorTest(false);
    gl.setViewport(0, 0, W, H);
    gl.clear();

    // прогрев: первые кадры рисуем все товары (крошечными) — шейдеры и текстуры готовы до скролла
    if (warm.current < 3) {
      warm.current++;
      items.current.forEach((g) => { if (g) { g.visible = true; g.scale.setScalar(1e-4); } });
      gl.render(scene, labCam);
      return;
    }
    const sh = heroProgress;
    const b = bounds.current;
    if (!sh.cam.ready || !b || !b.frame.width) return;
    const f = b.frame;
    const cam = camera as THREE.PerspectiveCamera;

    // общая камера сцены груза: по ней считаем траекторию и место товара на экране
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
    v.passes.length = 0;

    for (let i = 0; i < N; i++) {
      const P = pathAt(i, q);
      // карточка ждёт, пока товар не сядет; в момент посадки — картинка вместо модели в том же кадре
      setWait(els.cards, i, P < 1);
      if (P < PA || P >= 1) continue;

      // у каждого товара свой слой глубины: в полёте они проходят друг перед другом, а не насквозь
      const D = sh.cam.dist * (0.72 + 0.06 * i);
      const r = b.slots[i];
      toWorld(r.left + r.width / 2, r.top + r.height / 2, D, v.b3);
      v.m.lookAt(cam.position, v.b3, v.up);
      v.qLand.setFromRotationMatrix(v.m).multiply(LAB_Q_INV);
      const sLand = r.width / LAB_FRAME_M / pxPerM(D);

      // дуга: над коробом (продолжение подъёма) → высота над грузом в порядке ленты → карточка
      const c = sh.cartons[i % 4];
      v.b0.set(c[0], c[1] - 0.2 + LIFT, c[2]);
      v.b1.copy(v.b0).addScaledVector(v.up, 0.75);
      const k = i - (N - 1) / 2;
      toWorld(xLast - (N - 1 - i) * gap, f.top - f.height * 0.05 + k * k * 4, D, v.b2);
      const t = (P - PA) / (1 - PA);
      const u = 1 - t;
      v.p.set(0, 0, 0)
        .addScaledVector(v.b0, u * u * u)
        .addScaledVector(v.b1, 3 * u * u * t)
        .addScaledVector(v.b2, 3 * u * t * t)
        .addScaledVector(v.b3, t * t * t);
      const scale = 0.24 + (sLand - 0.24) * smoother(t);

      // поза в мире: разворот гаснет, во второй половине пути — доворот в позу карточки
      const w = smoother(span(P, 0.3, 1));
      v.qh.setFromEuler(idleEuler(i, P, v.e));
      v.qWorld.slerpQuaternions(v.qh, v.qLand, w);

      // та же поза в «пространстве превью»: камера превью смотрит на товар так же, как общая камера
      v.m.lookAt(cam.position, v.p, v.up);
      v.look.setFromRotationMatrix(v.m);
      const rel = new THREE.Quaternion().copy(LAB_Q).multiply(v.look.clone().invert()).multiply(v.qWorld);
      // свет: при выходе из короба — как в сцене груза, к посадке — как на рендере карточки
      v.envFrom.copy(LAB_Q).multiply(v.look.clone().invert());
      const env = new THREE.Quaternion().slerpQuaternions(v.envFrom, new THREE.Quaternion(), w);

      // место и размер квадрата на экране
      v.ndc.copy(v.p).project(cam);
      const cx = (v.ndc.x * 0.5 + 0.5) * W, cy = (-v.ndc.y * 0.5 + 0.5) * H;
      const dist = v.p.distanceTo(cam.position);
      const side = pxPerM(dist) * scale * LAB_FRAME_M;
      v.passes.push({ i, dist, x: cx - side / 2, y: H - cy - side / 2, side, rel, env, shadow: 0.3 * smoother(span(P, 0.82, 1)) });
    }

    // дальние первыми: ближний товар ложится поверх
    v.passes.sort((a, z) => z.dist - a.dist);
    items.current.forEach((g) => { if (g) g.visible = false; });
    gl.setScissorTest(true);
    for (const pass of v.passes) {
      const g = items.current[pass.i];
      if (!g) continue;
      g.visible = true;
      g.position.set(0, 0, 0);
      g.scale.setScalar(1);
      g.quaternion.copy(pass.rel);
      const sm = shadows.current[pass.i];
      if (sm) sm.opacity = pass.shadow;
      scene.environmentRotation.setFromQuaternion(pass.env);
      studio.current?.quaternion.copy(pass.env);
      gl.setViewport(pass.x, pass.y, pass.side, pass.side);
      gl.setScissor(pass.x, pass.y, pass.side, pass.side);
      gl.clearDepth();
      gl.render(scene, labCam);
      g.visible = false;
    }
    gl.setScissorTest(false);
  }, 1);

  return (
    <>
      <group ref={studio}><Studio /></group>
      {SLUGS.map((slug, i) => (
        <group key={slug} ref={(o) => { items.current[i] = o; }} visible={false}>
          <group position={[0, -0.32, 0]}>
            <ProductModel slug={slug} />
            <mesh rotation-x={-Math.PI / 2} position-y={0.003} renderOrder={-1}>
              <planeGeometry args={[1.05, 1.05]} />
              <meshBasicMaterial ref={(m) => { shadows.current[i] = m; }} map={shadowMap} transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
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
        dpr={[1, 1.25]}
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
