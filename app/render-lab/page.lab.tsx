'use client';

// Служебная страница для рендера превью товаров (собирается только при RENDER_LAB=1).
// /render-lab?slug=strejch-plenka&angle=0
import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ProductModel } from '@/components/three/products';
import { Studio } from '@/components/three/Studio';

function Cam({ angle }: { angle: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const a = THREE.MathUtils.degToRad(angle - 35);
    const dist = 3.3;
    camera.position.set(Math.sin(a) * dist, 1.55, Math.cos(a) * dist);
    camera.lookAt(0, 0.32, 0);
  }, [angle, camera]);
  return null;
}

export default function RenderLab() {
  const [q, setQ] = useState<{ slug: string; angle: number } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ({ slug: p.get('slug') || 'strejch-plenka', angle: Number(p.get('angle') || 0) });
    // скрипт рендера меняет ракурс без перезагрузки страницы
    (window as unknown as { setAngle: (a: number) => void }).setAngle = (a: number) => setQ((q) => (q ? { ...q, angle: a } : q));
  }, []);
  if (!q) return null;
  return (
    <div style={{ width: 640, height: 640, background: 'transparent' }}>
      <Canvas
        dpr={1}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ fov: 24, position: [0, 1.5, 3.3] }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.setClearColor(0x000000, 0); }}
      >
        <Suspense fallback={null}>
          <Studio />
          <Cam angle={q.angle} />
          <group position={[0, 0, 0]}><ProductModel slug={q.slug} /></group>
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={3} blur={2.4} far={1.2} resolution={512} color="#1c1f26" frames={1} />
        </Suspense>
      </Canvas>
      <div id="ready" />
    </div>
  );
}
