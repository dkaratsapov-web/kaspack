'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Studio } from './Studio';

// Фура Kaspack в фирменной ливрее (как на старом сайте): лаймовый полуприцеп с графитовой панелью и шевронами.
// Единицы — метры; вся машина масштабируется в сцене.

function chevron(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + 95 * s, y + 59 * s); g.lineTo(x + 190 * s, y); g.lineTo(x + 190 * s, y + 23 * s);
  g.lineTo(x + 95 * s, y + 88 * s); g.lineTo(x, y + 23 * s); g.closePath(); g.fill();
}

function trailerLivery() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 400;
  const g = c.getContext('2d')!;
  g.fillStyle = '#beea1f'; g.fillRect(0, 0, 2048, 400);
  // графитовая панель с логотипом
  g.fillStyle = '#20232a';
  g.beginPath(); g.roundRect(120, 34, 1640, 332, 18); g.fill();
  g.fillStyle = '#beea1f';
  chevron(g, 470, 140, 0.62);
  g.fillRect(470, 140 + 105 * 0.62, 190 * 0.62, 23 * 0.62);
  g.fillStyle = '#ffffff';
  g.font = '700 120px Arial, sans-serif'; g.textBaseline = 'middle';
  g.fillText('kaspack', 620, 186);
  g.font = '500 30px Arial, sans-serif'; g.fillStyle = '#c9cdd4';
  g.fillText('Производство промышленной упаковки', 1150, 172);
  g.fillText('+7 (800) 550-40-08', 1150, 214);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function cabLivery() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#20232a'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#beea1f';
  for (let i = 0; i < 4; i++) chevron(g, 60 + (i % 2) * 120, 60 + i * 110, 1.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function Wheel({ x, z, spin }: { x: number; z: number; spin: React.RefObject<THREE.Group[]> }) {
  return (
    <group position={[x, 0.5, z]} ref={(g) => { if (g && spin.current && !spin.current.includes(g)) spin.current.push(g); }}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.36, 40]} />
        <meshStandardMaterial color="#17181b" roughness={0.85} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-z={z > 0 ? 0.181 : -0.181}>
        <cylinderGeometry args={[0.3, 0.3, 0.01, 32]} />
        <meshStandardMaterial color="#b9bec6" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Truck({ progress }: { progress: React.RefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const mats = useMemo(() => {
    const paint = (map?: THREE.Texture, color = '#ffffff') =>
      new THREE.MeshPhysicalMaterial({ map, color, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 });
    return {
      trailerSide: paint(trailerLivery()),
      lime: paint(undefined, '#beea1f'),
      cab: paint(cabLivery()),
      graphite: paint(undefined, '#20232a'),
      glass: new THREE.MeshPhysicalMaterial({ color: '#2a3038', roughness: 0.08, metalness: 0.6, clearcoat: 1 }),
      chassis: new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.7 }),
      light: new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#fff2c0', emissiveIntensity: 0.6 }),
    };
  }, []);
  const last = useRef(0);

  useFrame(() => {
    const p = progress.current ?? 1;
    const x = THREE.MathUtils.lerp(-17, 0, 1 - Math.pow(1 - p, 3));
    if (root.current) root.current.position.x = x;
    const dx = x - last.current;
    last.current = x;
    wheels.current.forEach((w) => { w.rotation.z -= dx / 0.5; });
  });

  const L0 = -7.6, L1 = 6.0, TW = 2.5, TH = 2.7, TY = 1.25;
  return (
    <group ref={root}>
      {/* полуприцеп: борта с ливреей, крыша и торцы лаймовые */}
      <group position={[(L0 + L1) / 2, TY + TH / 2, 0]}>
        <RoundedBox args={[L1 - L0, TH, TW]} radius={0.06} smoothness={2} material={mats.lime} castShadow />
        <mesh material={mats.trailerSide} position-z={TW / 2 + 0.002}><planeGeometry args={[L1 - L0 - 0.1, TH - 0.1]} /></mesh>
        <mesh material={mats.trailerSide} position-z={-TW / 2 - 0.002} rotation-y={Math.PI}><planeGeometry args={[L1 - L0 - 0.1, TH - 0.1]} /></mesh>
      </group>
      <mesh material={mats.chassis} position={[(L0 + L1) / 2, TY - 0.12, 0]}><boxGeometry args={[L1 - L0, 0.24, 1.2]} /></mesh>
      <mesh material={mats.graphite} position={[-4.8, 0.95, TW / 2 - 0.05]}><boxGeometry args={[4.2, 0.18, 0.04]} /></mesh>
      {[-6.3, -5.0, -3.7].map((x) => [1.0, -1.0].map((z) => <Wheel key={`${x}${z}`} x={x} z={z} spin={wheels} />))}

      {/* тягач */}
      <mesh material={mats.chassis} position={[7.0, 0.95, 0]}><boxGeometry args={[4.4, 0.35, 1.1]} /></mesh>
      <group position={[8.15, 2.45, 0]}>
        <RoundedBox args={[2.1, 2.9, 2.45]} radius={0.14} smoothness={3} material={mats.graphite} castShadow />
        <mesh material={mats.cab} position={[0.0, -0.3, 1.226]}><planeGeometry args={[1.9, 1.9]} /></mesh>
        <mesh material={mats.cab} position={[0.0, -0.3, -1.226]} rotation-y={Math.PI}><planeGeometry args={[1.9, 1.9]} /></mesh>
        {/* лобовое и боковые стёкла */}
        <mesh material={mats.glass} position={[1.056, 0.55, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[2.1, 0.95]} /></mesh>
        <mesh material={mats.glass} position={[0.62, 0.62, 1.227]}><planeGeometry args={[0.7, 0.62]} /></mesh>
        <mesh material={mats.glass} position={[0.62, 0.62, -1.227]} rotation-y={Math.PI}><planeGeometry args={[0.7, 0.62]} /></mesh>
        <mesh material={mats.lime} position={[1.07, -1.05, 0]}><boxGeometry args={[0.08, 0.32, 2.3]} /></mesh>
        <mesh material={mats.light} position={[1.1, -0.75, 0.9]}><boxGeometry args={[0.02, 0.14, 0.38]} /></mesh>
        <mesh material={mats.light} position={[1.1, -0.75, -0.9]}><boxGeometry args={[0.02, 0.14, 0.38]} /></mesh>
      </group>
      {[8.3, 6.0, 4.9].map((x) => [1.0, -1.0].map((z) => <Wheel key={`c${x}${z}`} x={x} z={z} spin={wheels} />))}
    </group>
  );
}

export default function TruckScene({ progress }: { progress: React.RefObject<number> }) {
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
        camera={{ fov: 22, near: 0.1, far: 200, position: [12.5, 5.6, 21.5] }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1;
          camera.lookAt(0.4, 1.9, 0);
        }}
      >
        <Suspense fallback={null}>
          <Studio dark />
          <group scale={1}>
            <Truck progress={progress} />
          </group>
          <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={40} blur={2.2} far={4} resolution={1024} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  );
}
