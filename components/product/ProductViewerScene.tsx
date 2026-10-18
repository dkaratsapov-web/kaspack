'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ProductModel } from '@/components/three/products';
import { Studio } from '@/components/three/Studio';

// Камера и свет — как в render-lab (рендеры карточек): модель совпадает с картинкой, которая была под ней.
const LAB_DIST = 3.3, LAB_HEIGHT = 1.55, LAB_AZIMUTH = -35;

/** Поворот перетаскиванием (с инерцией), через пару секунд без касаний — медленный сам-поворот. */
function Turntable({ slug, onReady }: { slug: string; onReady?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const drag = useRef({ on: false, x: 0, vel: 0, angle: 0, idle: 0 });
  const reduced = useRef(false);
  const frames = useRef(0);

  useEffect(() => {
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a = THREE.MathUtils.degToRad(LAB_AZIMUTH);
    camera.position.set(Math.sin(a) * LAB_DIST, LAB_HEIGHT, Math.cos(a) * LAB_DIST);
    camera.lookAt(0, 0.32, 0);
    const el = gl.domElement;
    const d = drag.current;
    const down = (e: PointerEvent) => { d.on = true; d.x = e.clientX; d.vel = 0; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => {
      if (!d.on) return;
      const dx = e.clientX - d.x;
      d.x = e.clientX;
      d.angle += dx * 0.012;
      d.vel = dx * 0.012;
      d.idle = 0;
    };
    const up = () => { d.on = false; el.style.cursor = 'grab'; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    // вертикальный скролл страницы пальцем не блокируем — крутим только по горизонтали
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [camera, gl]);

  useFrame((_, dt) => {
    const d = drag.current;
    if (!d.on) {
      d.vel *= Math.pow(0.04, dt);
      d.angle += d.vel;
      d.idle += dt;
      if (!reduced.current && d.idle > 2.5) d.angle += dt * 0.25 * Math.min(1, (d.idle - 2.5) / 1.5);
    }
    if (group.current) group.current.rotation.y = d.angle;
    if (++frames.current === 3) onReady?.();
  });

  return (
    <group ref={group}>
      <ProductModel slug={slug} />
    </group>
  );
}

export default function ProductViewerScene({ slug, onReady }: { slug: string; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 24, position: [0, 1.5, 3.3] }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
    >
      <Suspense fallback={null}>
        <Studio />
        <Turntable slug={slug} onReady={onReady} />
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={3} blur={2.4} far={1.2} resolution={512} color="#1c1f26" />
      </Suspense>
    </Canvas>
  );
}
