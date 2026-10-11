'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { kraftTextures, stampTexture, woodTextures } from './textures';

// Груз на европоддоне 1200×800: каждый слой — товар Kaspack (бриф, концепция «Груз в сборе»).
// Единицы — метры, ось Y вверх.
export const W = 1.2, D = 0.8, PH = 0.144, BH = 0.3, TIERS = 3;
export const STACK_TOP = PH + BH * TIERS;

export type PalletState = { wrap: number; explode: number };

/** Насколько поднимается каждый слой при разборе (м). */
export const EXPLODE_OFFSET: Record<string, number> = {
  pallet: 0, tier1: 0.34, tier2: 0.68, tier3: 1.02, strap: 1.42, film: 1.8,
};

function useMaterials() {
  return useMemo(() => {
    const kraft = kraftTextures();
    const kraftMap = kraft.map.clone(); kraftMap.repeat.set(1.2, 0.6); kraftMap.needsUpdate = true;
    const wood = woodTextures();
    const woodMap = wood.map; woodMap.repeat.set(1, 1);
    return {
      kraft: new THREE.MeshStandardMaterial({ map: kraftMap, bumpMap: kraft.bump, bumpScale: 0.6, roughness: 0.86, color: '#ffffff' }),
      tape: new THREE.MeshPhysicalMaterial({ color: '#a8824f', roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.3, transparent: true, opacity: 0.88 }),
      wood: new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.92, color: '#f3e3c2' }),
      woodEnd: new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.95, color: '#d9c294' }),
      strap: new THREE.MeshPhysicalMaterial({ color: '#beea1f', roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35 }),
      corner: new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.62 }),
      film: new THREE.MeshPhysicalMaterial({
        color: '#e8f0ff', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.26,
        clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6,
      }),
      stamp: new THREE.MeshStandardMaterial({ map: stampTexture(), transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    };
  }, []);
}

type M = ReturnType<typeof useMaterials>;

function Board({ size, position, material }: { size: [number, number, number]; position: [number, number, number]; material: THREE.Material }) {
  return (
    <mesh position={position} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Pallet({ m }: { m: M }) {
  const parts: React.ReactNode[] = [];
  const bw = 0.1;
  for (let i = 0; i < 3; i++) parts.push(<Board key={`b${i}`} size={[W, 0.022, bw]} position={[0, 0.011, -D / 2 + bw / 2 + (i * (D - bw)) / 2]} material={m.wood} />);
  const xs = [-W / 2 + 0.0725, 0, W / 2 - 0.0725];
  const zs = [-D / 2 + 0.05, 0, D / 2 - 0.05];
  xs.forEach((x, i) => zs.forEach((z, j) => parts.push(<Board key={`k${i}${j}`} size={[0.145, 0.078, 0.1]} position={[x, 0.061, z]} material={m.woodEnd} />)));
  xs.forEach((x, i) => parts.push(<Board key={`s${i}`} size={[0.145, 0.022, D]} position={[x, 0.111, 0]} material={m.wood} />));
  const tops = 7;
  for (let i = 0; i < tops; i++) {
    const w = i % 3 === 0 ? 0.145 : 0.1;
    parts.push(<Board key={`t${i}`} size={[W, 0.022, w]} position={[0, 0.133, -D / 2 + w / 2 + i * ((D - w) / (tops - 1))]} material={m.wood} />);
  }
  return <group>{parts}</group>;
}

function Carton({ position, m, stamp }: { position: [number, number, number]; m: M; stamp: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.594, BH - 0.006, 0.394]} radius={0.01} smoothness={3} material={m.kraft} castShadow receiveShadow />
      {/* скотч по шву клапанов и загибы на торцы */}
      <mesh material={m.tape} position={[0, BH / 2 - 0.002, 0]}>
        <boxGeometry args={[0.6, 0.002, 0.048]} />
      </mesh>
      <mesh material={m.tape} position={[0.298, BH / 2 - 0.04, 0]}>
        <boxGeometry args={[0.002, 0.08, 0.048]} />
      </mesh>
      <mesh material={m.tape} position={[-0.298, BH / 2 - 0.04, 0]}>
        <boxGeometry args={[0.002, 0.08, 0.048]} />
      </mesh>
      {stamp && (
        <mesh material={m.stamp} position={[0, -0.01, 0.1975]}>
          <planeGeometry args={[0.36, 0.18]} />
        </mesh>
      )}
    </group>
  );
}

function Tier({ t, m }: { t: number; m: M }) {
  const y = PH + t * BH + BH / 2;
  return (
    <group>
      {[-0.3, 0.3].map((x) =>
        [-0.2, 0.2].map((z) => <Carton key={`${x}${z}`} position={[x, y, z]} m={m} stamp={z > 0} />),
      )}
    </group>
  );
}

function Strapping({ m }: { m: M }) {
  const t = 0.004, w = 0.016, h = STACK_TOP - PH;
  const cw = 0.055;
  return (
    <group>
      {[-0.32, 0.32].map((x) => (
        <group key={x}>
          <Board size={[w, h, t]} position={[x, PH + h / 2, D / 2 + 0.007]} material={m.strap} />
          <Board size={[w, h, t]} position={[x, PH + h / 2, -D / 2 - 0.007]} material={m.strap} />
          <Board size={[w, t, D + 0.018]} position={[x, STACK_TOP + 0.004, 0]} material={m.strap} />
        </group>
      ))}
      {([[1, 1], [-1, 1], [1, -1], [-1, -1]] as const).map(([sx, sz]) => {
        const x = (sx * W) / 2, z = (sz * D) / 2;
        return (
          <group key={`${sx}${sz}`}>
            <Board size={[cw, h, 0.004]} position={[x - (sx * cw) / 2, PH + h / 2, z + sz * 0.004]} material={m.corner} />
            <Board size={[0.004, h, cw]} position={[x + sx * 0.004, PH + h / 2, z - (sz * cw) / 2]} material={m.corner} />
          </group>
        );
      })}
    </group>
  );
}

/** Спиральная лента стрейч-плёнки; drawRange управляет «намоткой». */
function useFilmGeometry() {
  return useMemo(() => {
    const perSpin = 180, turns = 5.5, total = Math.round(perSpin * turns);
    const bandH = 0.27, yStart = PH + 0.01, yEnd = STACK_TOP + 0.012 - bandH;
    const pos = new Float32Array((total + 1) * 2 * 3);
    const uv = new Float32Array((total + 1) * 2 * 2);
    for (let i = 0; i <= total; i++) {
      const turn = i / perSpin;
      const pad = 0.016 + turn * 0.0015; // каждый виток чуть дальше от груза — без мерцания слоёв
      const r = 0.035;
      const hw = W / 2 + pad, hd = D / 2 + pad;
      const path = new THREE.Path();
      path.moveTo(-hw + r, hd);
      path.lineTo(hw - r, hd); path.quadraticCurveTo(hw, hd, hw, hd - r);
      path.lineTo(hw, -hd + r); path.quadraticCurveTo(hw, -hd, hw - r, -hd);
      path.lineTo(-hw + r, -hd); path.quadraticCurveTo(-hw, -hd, -hw, -hd + r);
      path.lineTo(-hw, hd - r); path.quadraticCurveTo(-hw, hd, -hw + r, hd);
      const p = path.getPointAt((i % perSpin) / perSpin);
      const y = yStart + ((yEnd - yStart) * i) / total;
      pos.set([p.x, y, p.y, p.x, y + bandH, p.y], i * 6);
      uv.set([i / perSpin, 0, i / perSpin, 1], i * 4);
    }
    const idx: number[] = [];
    for (let i = 0; i < total; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return { geo, total };
  }, []);
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function LoadedPallet({ state }: { state: React.RefObject<PalletState> }) {
  const m = useMaterials();
  const { geo, total } = useFilmGeometry();
  const layers = useRef<Record<string, THREE.Group | null>>({});
  const lastWrap = useRef(-1);

  useFrame(() => {
    const s = state.current;
    if (!s) return;
    const e = smooth(Math.min(1, Math.max(0, s.explode)));
    for (const [k, g] of Object.entries(layers.current)) {
      if (!g) continue;
      g.position.y = EXPLODE_OFFSET[k] * e;
    }
    if (layers.current.film) layers.current.film.rotation.y = -0.22 * e;
    if (layers.current.strap) layers.current.strap.rotation.y = 0.1 * e;
    const w = Math.round(ease(Math.min(1, Math.max(0, s.wrap))) * total);
    if (w !== lastWrap.current) { geo.setDrawRange(0, w * 6); lastWrap.current = w; }
  });

  const ref = (k: string) => (g: THREE.Group | null) => { layers.current[k] = g; };
  return (
    <group>
      <group ref={ref('pallet')}><Pallet m={m} /><group name="anchor-pallet" position={[W / 2, 0.07, D / 2]} /></group>
      <group ref={ref('tier1')}><Tier t={0} m={m} /></group>
      <group ref={ref('tier2')}><Tier t={1} m={m} /></group>
      <group ref={ref('tier3')}><Tier t={2} m={m} /><group name="anchor-tier" position={[W / 2, PH + BH * 2.5, D / 2]} /></group>
      <group ref={ref('strap')}><Strapping m={m} /><group name="anchor-strap" position={[0.32, STACK_TOP, D / 2]} /></group>
      <group ref={ref('film')}>
        <mesh geometry={geo} material={m.film} renderOrder={2} />
        <group name="anchor-film" position={[-W / 2 - 0.02, PH + BH * 1.6, D / 2 + 0.02]} />
      </group>
    </group>
  );
}
