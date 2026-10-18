'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { LoadedPallet, STACK_TOP, type PalletState } from './LoadedPallet';
import { Studio } from './Studio';

export type LabelRefs = Record<'film' | 'strap' | 'tier' | 'pallet', HTMLElement | null>;
/** Порог разбора, после которого выноска слоя появляется. */
const SHOW_AT: Record<keyof LabelRefs, number> = { film: 0.18, strap: 0.38, tier: 0.58, pallet: 0.75 };
/** Плавающая шапка (капсула с отступом) перекрывает верх закреплённой сцены. */
const HEADER_PX = 88;

function Rig({ state, labels, guides }: { state: React.RefObject<PalletState>; labels: React.RefObject<LabelRefs>; guides?: React.RefObject<LabelRefs> }) {
  const group = useRef<THREE.Group>(null);
  const { camera, size, scene } = useThree();
  const v = useRef(new THREE.Vector3());
  const smooth = useRef(0);

  useFrame((s, dt) => {
    const st = state.current;
    if (!st || !group.current) return;
    // сглаживаем прогресс скролла — движение без рывков на колесе мыши
    smooth.current += (st.explode - smooth.current) * (1 - Math.pow(0.0005, dt));
    const e = smooth.current;
    st.wrap = 1;
    group.current.rotation.y = -0.65 + e * 0.35;

    // кадр растёт вместе с разбором
    const cam = camera as THREE.PerspectiveCamera;
    // вписываем груз в часть экрана под шапкой, с запасом под выноски сверху и снизу
    const height = STACK_TOP + 1.8 * THREE.MathUtils.smootherstep(e, 0, 1);
    const tan2 = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const hdr = Math.min(0.2, HEADER_PX / size.height);
    const vFit = (height * 1.42) / (1 - hdr) / tan2;
    const hFit = (2.2 / cam.aspect) / tan2;
    const dist = Math.max(vFit, hFit);
    // центр кадра выше центра груза на половину шапки: груз опускается и не уходит под неё
    const target = new THREE.Vector3(0, height * 0.5 + (dist * tan2 * hdr) / 2, 0);
    const dir = new THREE.Vector3(0, 0.32, 1).normalize();
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);

    // выноски: проецируем 3D-якоря в координаты экрана, без перерисовки React
    const L = labels.current;
    if (!L) return;
    (Object.keys(SHOW_AT) as (keyof LabelRefs)[]).forEach((k) => {
      const el = L[k];
      const anchor = scene.getObjectByName(`anchor-${k}`);
      if (!el || !anchor) return;
      anchor.getWorldPosition(v.current).project(cam);
      const x = (v.current.x * 0.5 + 0.5) * size.width;
      const y = (-v.current.y * 0.5 + 0.5) * size.height;
      const on = e > SHOW_AT[k];
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.dataset.on = on ? 'true' : 'false';
      // разметочная линия фона — на той же высоте, что и выноска
      const g = guides?.current?.[k];
      if (g) {
        g.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        g.dataset.on = el.dataset.on;
      }
    });
  });

  return (
    <group ref={group}>
      <LoadedPallet state={state} filmOpacity={0.1} />
    </group>
  );
}

export default function ExplodeScene({ state, labels, guides }: { state: React.RefObject<PalletState>; labels: React.RefObject<LabelRefs>; guides?: React.RefObject<LabelRefs> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ fov: 26, near: 0.1, far: 50, position: [0, 1.5, 6] }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; }}
      >
        <Suspense fallback={null}>
          <Studio dark />
          <Rig state={state} labels={labels} guides={guides} />
          <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={5} blur={2.6} far={2} resolution={512} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  );
}
