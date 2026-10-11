'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { LoadedPallet, STACK_TOP, type PalletState } from './LoadedPallet';

// Студийный свет без HDRI-файлов (не зависим от CDN): софтбоксы из Lightformer.
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.4} position={[0, 5, 1]} scale={[8, 3, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} position={[-5, 2, 2]} scale={[3, 4, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.1} position={[5, 1.5, -1]} scale={[3, 3, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" color="#beea1f" intensity={0.6} position={[3, 3, -4]} scale={2} />
    </Environment>
  );
}

function Rig({ state, reduced }: { state: React.RefObject<PalletState>; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const start = useRef<number | null>(null);
  const { camera, size } = useThree();

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [reduced]);

  // Кадрирование: груз целиком в кадре при любом соотношении сторон
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const target = new THREE.Vector3(0, STACK_TOP * 0.47, 0);
    const vFit = (STACK_TOP * 1.32) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    const hFit = (1.95 / cam.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    const dist = Math.max(vFit, hFit);
    const dir = new THREE.Vector3(0.0, 0.38, 1).normalize();
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((s, dt) => {
    if (!group.current || !state.current) return;
    if (start.current === null) start.current = s.clock.elapsedTime;
    const t = s.clock.elapsedTime - start.current;
    // Намотка плёнки: стартует после интро логотипа, 2,6 с
    if (!reduced) state.current.wrap = Math.min(1, Math.max(0, (t - 0.9) / 2.6));
    const k = 1 - Math.pow(0.001, dt); // демпфирование, не зависит от FPS
    const yaw = -0.6 + (reduced ? 0 : Math.sin(t * 0.22) * 0.1 + pointer.current.x * 0.22);
    const pitch = reduced ? 0 : pointer.current.y * 0.05;
    group.current.rotation.y += (yaw - group.current.rotation.y) * k;
    group.current.rotation.x += (pitch - group.current.rotation.x) * k;
  });

  return (
    <group ref={group} rotation-y={-0.6}>
      <LoadedPallet state={state} />
    </group>
  );
}

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const state = useRef<PalletState>({ wrap: reduced ? 1 : 0, explode: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
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
          <directionalLight position={[2.5, 4.5, 3]} intensity={1.4} />
          <Rig state={state} reduced={reduced} />
          <ContactShadows position={[0, 0, 0]} opacity={0.42} scale={4.5} blur={2.6} far={1.6} resolution={512} color="#1c1f26" />
        </Suspense>
      </Canvas>
    </div>
  );
}
