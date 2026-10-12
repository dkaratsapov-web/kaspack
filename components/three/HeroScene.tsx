'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Studio } from './Studio';
import * as THREE from 'three';
import { LoadedPallet, STACK_TOP, TOP_CARTONS, type PalletState } from './LoadedPallet';
import { ProductModel } from './products';
import { heroProgress } from '@/lib/heroProgress';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;

/*
 * Хореография по скроллу закреплённого первого экрана, q 0…1:
 *   0.00–0.16  плёнка сматывается
 *   0.08–0.24  лента и уголки уходят вверх
 *   0.16–0.36  клапаны верхних коробов раскрываются, камера заглядывает сверху
 *   0.30–0.80  из коробов один за другим поднимаются товары каталога и разлетаются по экрану
 *   0.84–1.00  товары падают вниз — туда, откуда приезжает лента каталога
 */
type Flight = { slug: string; carton: number; ndc: [number, number]; depth: number; size: number; spin: number };
const FLIGHTS: Flight[] = [
  { slug: 'strejch-plenka', carton: 0, ndc: [0.0, 0.42], depth: 0.84, size: 0.3, spin: 0.7 },
  { slug: 'skotch', carton: 1, ndc: [0.6, 0.66], depth: 0.9, size: 0.24, spin: -0.9 },
  { slug: 'gofrotara', carton: 2, ndc: [-0.32, 0.36], depth: 0.92, size: 0.26, spin: 0.5 },
  { slug: 'kabelnye-barabany', carton: 3, ndc: [0.95, 0.2], depth: 0.88, size: 0.3, spin: -0.6 },
  { slug: 'pakety-pvd-pnd-psd', carton: 0, ndc: [-0.62, 0.62], depth: 1.0, size: 0.28, spin: 0.8 },
  { slug: 'bopp-plenka', carton: 1, ndc: [0.3, 0.84], depth: 0.95, size: 0.26, spin: -0.7 },
  { slug: 'perchatki', carton: 2, ndc: [-0.12, 0.74], depth: 0.9, size: 0.22, spin: 1.0 },
  { slug: 'vozdushno-puzyrchataya-plenka', carton: 3, ndc: [-0.88, 0.3], depth: 1.02, size: 0.3, spin: -0.5 },
  { slug: 'strepping-lenta-i-peht-lenta-zashchitnye-ugolki', carton: 0, ndc: [0.98, 0.74], depth: 0.96, size: 0.26, spin: 0.6 },
  { slug: 'setki', carton: 1, ndc: [-0.4, 0.88], depth: 1.04, size: 0.26, spin: -0.8 },
];

type Frame = { target: THREE.Vector3; dist: number };

function Rig({ state, reduced, products }: { state: React.RefObject<PalletState>; reduced: boolean; products: boolean }) {
  const group = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const start = useRef<number | null>(null);
  const frame = useRef<Frame>({ target: new THREE.Vector3(0, STACK_TOP * 0.47, 0), dist: 5 });
  const warm = useRef(0);
  const { camera, size, gl } = useThree();
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [reduced]);

  // Кадрирование: груз целиком в рамке hero-frame (десктоп) или во всём canvas (телефон).
  // Canvas на десктопе во весь экран — setViewOffset сдвигает «кадр груза» в правую часть.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const c = gl.domElement.getBoundingClientRect();
    const f = document.querySelector<HTMLElement>('[data-hero-frame]')?.getBoundingClientRect();
    const inFrame = !!f && f.width > 0 && c.width > 0;
    const rw = inFrame ? f!.width : c.width, rh = inFrame ? f!.height : c.height;
    cam.aspect = rw / rh;
    const tan = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    frame.current.dist = Math.max((STACK_TOP * 1.12) / tan, (1.7 / cam.aspect) / tan);
    if (inFrame) cam.setViewOffset(rw, rh, -(f!.left - c.left), -(f!.top - c.top), c.width, c.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size, gl]);

  useFrame((s, dt) => {
    if (!group.current || !state.current) return;
    if (start.current === null) start.current = s.clock.elapsedTime;
    const t = s.clock.elapsedTime - start.current;
    const q = reduced ? 0 : heroProgress.q;
    const cam = camera as THREE.PerspectiveCamera;

    // камера: с ростом q поднимается и чуть отъезжает — видно, как раскрываются короба
    const look = smooth(span(q, 0.12, 0.4));
    const { target, dist } = frame.current;
    tmp.dir.set(0, 0.38 + 0.2 * look, 1).normalize();
    cam.position.copy(target).addScaledVector(tmp.dir, dist * (1 + 0.22 * look));
    cam.lookAt(target);

    // намотка плёнки после интро; скролл сматывает её обратно
    const intro = reduced ? 1 : clamp01((t - 0.9) / 2.6);
    state.current.wrap = Math.min(intro, 1 - smooth(span(q, 0, 0.16)));
    state.current.strip = span(q, 0.08, 0.24);
    state.current.open = span(q, 0.16, 0.36);

    const k = 1 - Math.pow(0.001, dt); // демпфирование, не зависит от FPS
    const yaw = -0.6 + 0.22 * look + (reduced ? 0 : Math.sin(t * 0.22) * 0.1 * (1 - look) + pointer.current.x * 0.22);
    const pitch = reduced ? 0 : pointer.current.y * 0.05;
    group.current.rotation.y += (yaw - group.current.rotation.y) * k;
    group.current.rotation.x += (pitch - group.current.rotation.x) * k;
    group.current.updateMatrixWorld();

    // товары: из короба → вверх → по дуге в свою точку экрана → вниз, к ленте каталога
    if (!products) return;
    warm.current++;
    FLIGHTS.forEach((fl, i) => {
      const g = items.current[i];
      if (!g) return;
      const s0 = 0.3 + i * 0.042;
      const rise = span(q, s0, s0 + 0.09);
      const fly = span(q, s0 + 0.06, s0 + 0.24);
      const drop = span(q, 0.84 + i * 0.01, 0.96 + i * 0.004);
      // первые кадры после монтирования рисуем всё — шейдеры компилируются до скролла
      g.visible = warm.current < 4 || (rise > 0 && drop < 1);
      if (!g.visible) return;

      const [cx, cy, cz] = TOP_CARTONS[fl.carton];
      const origin = group.current!.localToWorld(tmp.a.set(cx, cy - 0.26, cz));
      const lifted = tmp.b.copy(origin).setY(origin.y + 0.5 * easeOut(rise));
      // точка в кадре: луч через NDC всего canvas на глубине depth × расстояние до груза
      tmp.dir.set(fl.ndc[0], fl.ndc[1], 0.5).unproject(cam).sub(cam.position).normalize();
      const goal = tmp.c.copy(cam.position).addScaledVector(tmp.dir, dist * fl.depth);
      const f = easeInOut(fly);
      g.position.lerpVectors(lifted, goal, f);
      g.position.y += Math.sin(Math.PI * f) * 0.28 - easeIn(drop) * 3.2;
      const sc = (0.2 + (fl.size * 1.6 - 0.2) * f) * (1 - 0.25 * drop);
      g.scale.setScalar(warm.current < 4 ? 0.001 : sc);
      g.rotation.set(
        Math.sin(i * 1.7) * 0.35 * f + drop * 1.4 * fl.spin,
        fl.spin * (q * 5 + rise * 1.2) + i,
        Math.cos(i * 2.3) * 0.25 * f,
      );
    });
  });

  return (
    <>
      <group ref={group} rotation-y={-0.6}>
        <LoadedPallet state={state} />
      </group>
      {products && FLIGHTS.map((fl, i) => (
        <group key={fl.slug} ref={(o) => { items.current[i] = o; }} visible={false}>
          <group position={[0, -0.5, 0]}>
            <ProductModel slug={fl.slug} />
          </group>
        </group>
      ))}
    </>
  );
}

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [pinned] = useState(() => typeof window !== 'undefined' && document.documentElement.classList.contains('kp-pin') && matchMedia('(min-width: 1024px)').matches);
  const [products, setProducts] = useState(false);
  const state = useRef<PalletState>({ wrap: reduced ? 1 : 0, explode: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // товары подгружаем после намотки плёнки: первый экран не платит за них при загрузке
  useEffect(() => {
    if (!pinned || reduced) return;
    const id = setTimeout(() => setProducts(true), 3800);
    return () => clearTimeout(id);
  }, [pinned, reduced]);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, pinned ? 1.5 : 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ fov: 26, near: 0.1, far: 40, position: [0, 1.2, 5] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          onReady?.();
        }}
      >
        <Suspense fallback={null}>
          <Studio />
          <Rig state={state} reduced={reduced} products={products} />
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={4.5} blur={2.4} far={1.6} resolution={512} color="#2b3a00" />
        </Suspense>
      </Canvas>
    </div>
  );
}
