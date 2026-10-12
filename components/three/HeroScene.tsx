'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Studio } from './Studio';
import * as THREE from 'three';
import { LoadedPallet, STACK_TOP, TOP_CARTONS, type PalletState } from './LoadedPallet';
import HeroHandoff from './HeroHandoff';
import { StageDriver } from './StageDriver';
import { heroProgress } from '@/lib/heroProgress';

// в сцене груз рисуется, пока первый экран не растворился полностью
const heroShown = () => heroProgress.q < 0.63;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

/*
 * Груз в сцене «первый экран → каталог» (q 0…1, см. HeroCatalogStage):
 *   0.00–0.10  плёнка сматывается
 *   0.04–0.14  лента и уголки уходят вверх
 *   0.09–0.22  клапаны верхних коробов раскрываются, камера заглядывает сверху
 * Дальше товары выезжают из коробов и встают на ленту каталога — это слой HeroHandoff.
 */
type Frame = { target: THREE.Vector3; dist: number };

function Rig({ state, reduced }: { state: React.RefObject<PalletState>; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const start = useRef<number | null>(null);
  const frame = useRef<Frame>({ target: new THREE.Vector3(0, STACK_TOP * 0.47, 0), dist: 5 });
  const { camera, size, gl } = useThree();
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

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
    // прогресс уже сглажен сценой HeroCatalogStage
    const q = reduced ? 0 : heroProgress.q;
    const cam = camera as THREE.PerspectiveCamera;

    // камера: с ростом q поднимается и чуть отъезжает — видно, как раскрываются короба
    const look = smooth(span(q, 0.06, 0.3));
    const { target, dist } = frame.current;
    tmp.dir.set(0, 0.38 + 0.2 * look, 1).normalize();
    cam.position.copy(target).addScaledVector(tmp.dir, dist * (1 + 0.22 * look));
    cam.lookAt(target);

    // намотка плёнки после интро; скролл сматывает её обратно
    const intro = reduced ? 1 : clamp01((t - 0.9) / 2.6);
    state.current.wrap = Math.min(intro, 1 - smooth(span(q, 0, 0.1)));
    state.current.strip = span(q, 0.04, 0.14);
    state.current.open = span(q, 0.09, 0.22);

    const k = 1 - Math.pow(0.001, dt); // демпфирование, не зависит от FPS
    const yaw = -0.6 + 0.22 * look + (reduced ? 0 : Math.sin(t * 0.22) * 0.1 * (1 - look) + pointer.current.x * 0.22);
    const pitch = reduced ? 0 : pointer.current.y * 0.05;
    group.current.rotation.y += (yaw - group.current.rotation.y) * k;
    group.current.rotation.x += (pitch - group.current.rotation.x) * k;
    group.current.updateMatrixWorld();

    // камера и верх коробов — для слоя передачи товаров в каталог
    const sh = heroProgress;
    cam.position.toArray(sh.cam.pos);
    cam.quaternion.toArray(sh.cam.quat);
    sh.cam.fov = cam.fov;
    sh.cam.dist = dist * (1 + 0.22 * look);
    sh.cam.ready = true;
    TOP_CARTONS.forEach((c, i) => group.current!.localToWorld(tmp.a.set(c[0], c[1], c[2])).toArray(sh.cartons[i]));
  });

  return (
    <>
      <group ref={group} rotation-y={-0.6}>
        <LoadedPallet state={state} />
      </group>
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

  // слой товаров подгружаем после намотки плёнки: первый экран не платит за них при загрузке
  useEffect(() => {
    if (!pinned || reduced) return;
    const id = setTimeout(() => setProducts(true), 3800);
    return () => clearTimeout(id);
  }, [pinned, reduced]);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, pinned ? 1.5 : 1.75]}
        frameloop={pinned ? 'never' : visible ? 'always' : 'never'}
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
          <Rig state={state} reduced={reduced} />
          {pinned && <StageDriver when={heroShown} />}
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={4.5} blur={2.4} far={1.6} resolution={512} color="#2b3a00" />
        </Suspense>
      </Canvas>
      {products && <HeroHandoff />}
    </div>
  );
}
