'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useLibraryMaterials, type Lib } from './materials';

// 17 товаров Kaspack как процедурные 3D-модели (бриф С7: 3D-рендеры в едином свете).
// Каждая модель ~ укладывается в куб 1×1×1, основание на y=0.

type P = { m: Lib };
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Рулон с вертикальной осью: тело + торцы с «витками» + гильза. */
function Roll({ m, r = 0.32, h = 0.85, core = 0.08, body, ends, y = 0 }: { m: Lib; r?: number; h?: number; core?: number; body: THREE.Material; ends?: THREE.Material; y?: number }) {
  const ringGeo = useMemo(() => new THREE.RingGeometry(core, r, 96, 6), [core, r]);
  return (
    <group position-y={y}>
      <mesh material={body} castShadow position-y={h / 2}>
        <cylinderGeometry args={[r, r, h, 96, 1, true]} />
      </mesh>
      <mesh geometry={ringGeo} material={ends ?? body} rotation-x={-Math.PI / 2} position-y={h} />
      <mesh geometry={ringGeo} material={ends ?? body} rotation-x={Math.PI / 2} position-y={0.001} />
      <mesh material={m.core} position-y={h / 2}>
        <cylinderGeometry args={[core, core, h + 0.03, 48, 1, true]} />
      </mesh>
      <mesh material={m.core} position-y={h / 2}>
        <cylinderGeometry args={[core - 0.012, core - 0.012, h + 0.031, 48, 1, true]} />
      </mesh>
    </group>
  );
}

/** Торцевые «витки»: концентрические кольца поверх торца. */
function WindRings({ r, core, y, mat }: { r: number; core: number; y: number; mat: THREE.Material }) {
  const rings = [];
  for (let rr = core + 0.02; rr < r; rr += 0.018) rings.push(rr);
  return (
    <group position-y={y + 0.0015} rotation-x={-Math.PI / 2}>
      {rings.map((rr) => (
        <mesh key={rr} material={mat}><ringGeometry args={[rr, rr + 0.002, 96]} /></mesh>
      ))}
    </group>
  );
}

export function StretchFilm({ m }: P) {
  return (
    <group>
      <Roll m={m} body={m.stretch} />
      <WindRings r={0.32} core={0.08} y={0.85} mat={m.filmSheet} />
      {/* хвост плёнки */}
      <mesh material={m.filmSheet} position={[0.36, 0.42, 0.18]} rotation-y={-0.6}>
        <planeGeometry args={[0.32, 0.78, 8, 8]} />
      </mesh>
    </group>
  );
}

export function BoppFilm({ m }: P) {
  return (
    <group rotation-z={Math.PI / 2} position={[0.42, 0.3, 0]}>
      <Roll m={m} r={0.3} h={0.84} core={0.075} body={m.bopp} />
      <WindRings r={0.3} core={0.075} y={0.84} mat={m.graphite} />
    </group>
  );
}

export function BubbleWrap({ m }: P) {
  // лист короткий и по ширине рулона: при любом ракурсе товар целиком стоит на ленте конвейера
  const bubbles = useMemo(() => {
    const g = new THREE.SphereGeometry(0.022, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const mesh = new THREE.InstancedMesh(g, m.bubble, 13 * 6);
    const o = new THREE.Object3D();
    let i = 0;
    for (let a = 0; a < 13; a++) for (let b = 0; b < 6; b++) {
      o.position.set(-0.33 + a * 0.054 + (b % 2) * 0.027, 0.003, 0.05 + b * 0.05);
      o.updateMatrix(); mesh.setMatrixAt(i++, o.matrix);
    }
    return mesh;
  }, [m]);
  return (
    <group>
      <group rotation-z={Math.PI / 2} position={[0.36, 0.24, -0.14]}>
        <Roll m={m} r={0.24} h={0.72} core={0.06} body={m.bubble} />
      </group>
      <mesh material={m.bubble} rotation-x={-Math.PI / 2} position={[0, 0.002, 0.23]}>
        <planeGeometry args={[0.72, 0.3]} />
      </mesh>
      <primitive object={bubbles} position={[0, 0.003, 0.05]} />
    </group>
  );
}

export function PvdFilm({ m }: P) {
  return (
    <group>
      <group rotation-z={Math.PI / 2} position={[0.45, 0.33, 0]}>
        <Roll m={m} r={0.33} h={0.9} core={0.07} body={m.pvd} />
        <WindRings r={0.33} core={0.07} y={0.9} mat={m.steel} />
      </group>
    </group>
  );
}

function CorrugatedEdge({ w, y, z, m }: { w: number; y: number; z: number; m: Lib }) {
  // видимый торец гофры: волна между двумя лайнерами
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const n = 60, amp = 0.007, len = w;
    s.moveTo(-len / 2, -0.009);
    for (let i = 0; i <= n; i++) s.lineTo(-len / 2 + (len * i) / n, Math.sin((i / n) * Math.PI * 28) * amp);
    s.lineTo(len / 2, -0.009);
    return new THREE.ShapeGeometry(s);
  }, [w]);
  return <mesh geometry={geo} material={m.core} position={[0, y, z]} />;
}

export function Corrugated({ m }: P) {
  const sheets = Array.from({ length: 9 }, (_, i) => i);
  return (
    <group>
      {sheets.map((i) => (
        <group key={i} position={[(i % 3) * 0.006 - 0.006, 0.012 + i * 0.026, (i % 2) * 0.008]}>
          <mesh material={m.kraft} castShadow>
            <boxGeometry args={[1, 0.022, 0.72]} />
          </mesh>
          <CorrugatedEdge w={0.99} y={0} z={0.3605} m={m} />
        </group>
      ))}
    </group>
  );
}

function Box({ m, size = [0.7, 0.5, 0.5] as [number, number, number], open = false }: { m: Lib; size?: [number, number, number]; open?: boolean }) {
  const [w, h, d] = size;
  return (
    <group>
      <RoundedBox args={size} radius={0.008} smoothness={3} position-y={h / 2} material={m.kraft} castShadow />
      <mesh material={m.stamp} position={[0, h * 0.45, d / 2 + 0.001]}>
        <planeGeometry args={[w * 0.6, w * 0.3]} />
      </mesh>
      {open ? (
        <group position-y={h}>
          <mesh material={m.kraft} position={[0, 0.002, d / 2 + 0.11]} rotation-x={-0.35}><boxGeometry args={[w * 0.98, 0.004, 0.24]} /></mesh>
          <mesh material={m.kraft} position={[0, 0.002, -d / 2 - 0.11]} rotation-x={0.35}><boxGeometry args={[w * 0.98, 0.004, 0.24]} /></mesh>
          <mesh material={m.kraft} position={[w / 2 + 0.11, 0.002, 0]} rotation-z={0.5}><boxGeometry args={[0.24, 0.004, d * 0.96]} /></mesh>
          <mesh material={m.kraft} position={[-w / 2 - 0.11, 0.002, 0]} rotation-z={-0.5}><boxGeometry args={[0.24, 0.004, d * 0.96]} /></mesh>
        </group>
      ) : (
        <mesh material={m.tape} position-y={h + 0.001}><boxGeometry args={[w + 0.004, 0.002, 0.05]} /></mesh>
      )}
    </group>
  );
}

export function Gofrotara({ m }: P) {
  return (
    <group>
      <group position={[-0.12, 0, -0.08]}><Box m={m} size={[0.62, 0.46, 0.46]} open /></group>
      <group position={[0.3, 0, 0.3]} rotation-y={-0.3}><Box m={m} size={[0.36, 0.28, 0.28]} /></group>
    </group>
  );
}

export function KraftPaper({ m }: P) {
  // как у плёнки: короткий отмотанный лист по ширине рулона, чтобы товар не выходил за ленту конвейера
  return (
    <group>
      <group rotation-z={Math.PI / 2} position={[0.36, 0.22, -0.14]}>
        <Roll m={m} r={0.22} h={0.72} core={0.05} body={m.kraftPaper} />
        <WindRings r={0.22} core={0.05} y={0.72} mat={m.core} />
      </group>
      <mesh material={m.kraftPaper} rotation-x={-Math.PI / 2} position={[0, 0.002, 0.23]} receiveShadow>
        <planeGeometry args={[0.72, 0.3]} />
      </mesh>
    </group>
  );
}

export function ThermalRolls({ m }: P) {
  const pos: [number, number, number][] = [[-0.2, 0, 0], [0.18, 0, -0.05], [0, 0, 0.26], [-0.02, 0.2, 0.02]];
  return (
    <group>
      {pos.map((p, i) => (
        <group key={i} position={p} rotation-x={i === 3 ? 0.0 : 0}>
          <Roll m={m} r={0.16} h={0.2} core={0.03} body={m.thermal} />
          <WindRings r={0.16} core={0.03} y={0.2} mat={m.whiteBoard} />
        </group>
      ))}
    </group>
  );
}

export function Pallet({ m }: P) {
  const W = 1, D = 0.67, s = 1 / 1.2;
  const parts: React.ReactNode[] = [];
  const xs = [-W / 2 + 0.06, 0, W / 2 - 0.06], zs = [-D / 2 + 0.042, 0, D / 2 - 0.042];
  for (let i = 0; i < 3; i++) parts.push(<mesh key={`b${i}`} material={m.wood} position={[0, 0.009, zs[i]]}><boxGeometry args={[W, 0.018, 0.083]} /></mesh>);
  xs.forEach((x, i) => zs.forEach((z, j) => parts.push(<mesh key={`k${i}${j}`} material={m.woodDark} position={[x, 0.05, z]} castShadow><boxGeometry args={[0.12, 0.065, 0.083]} /></mesh>)));
  xs.forEach((x, i) => parts.push(<mesh key={`s${i}`} material={m.wood} position={[x, 0.092, 0]}><boxGeometry args={[0.12, 0.018, D]} /></mesh>));
  for (let i = 0; i < 7; i++) {
    const w = i % 3 === 0 ? 0.12 : 0.083;
    parts.push(<mesh key={`t${i}`} material={m.wood} position={[0, 0.11, -D / 2 + w / 2 + i * ((D - w) / 6)]} castShadow><boxGeometry args={[W, 0.018, w]} /></mesh>);
  }
  return (
    <group scale={s * 1.15}>
      <group>{parts}</group>
      {/* клеймо IPPC/HT на торце шашки */}
      <mesh material={m.burn} position={[W / 2 - 0.06, 0.05, D / 2 + 0.0005]}>
        <planeGeometry args={[0.08, 0.04]} />
      </mesh>
    </group>
  );
}

export function CableDrum({ m }: P) {
  const R = 0.46, L = 0.5, rc = 0.2;
  const seams = [-0.3, -0.15, 0, 0.15, 0.3];
  return (
    <group position-y={R} rotation-y={0.55}>
      {[-L / 2, L / 2].map((x) => (
        <group key={x} position-x={x}>
          <mesh material={m.wood} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[R, R, 0.04, 72]} /></mesh>
          {/* швы досок щеки */}
          {seams.map((zz) => (
            <mesh key={zz} material={m.woodDark} position={[x > 0 ? 0.0205 : -0.0205, 0, zz]}>
              <boxGeometry args={[0.002, 2 * Math.sqrt(R * R - zz * zz) * 0.98, 0.004]} />
            </mesh>
          ))}
          <mesh material={m.graphite} position-x={x > 0 ? 0.021 : -0.021} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.05, 0.05, 0.002, 32]} /></mesh>
        </group>
      ))}
      <mesh material={m.woodDark} rotation-z={Math.PI / 2}><cylinderGeometry args={[rc, rc, L, 48]} /></mesh>
      {/* намотанный кабель */}
      <mesh material={m.cable} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.36, 0.36, L - 0.045, 72]} /></mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} material={m.cable} position-x={-L / 2 + 0.045 + i * 0.041} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.36, 0.02, 10, 72]} />
        </mesh>
      ))}
    </group>
  );
}

export function FoodCrate({ m }: P) {
  const W = 0.8, D = 0.5, H = 0.36;
  const slats: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const y = 0.05 + i * 0.12;
    slats.push(<mesh key={`f${i}`} material={m.wood} position={[0, y, D / 2]} castShadow><boxGeometry args={[W, 0.07, 0.012]} /></mesh>);
    slats.push(<mesh key={`b${i}`} material={m.wood} position={[0, y, -D / 2]}><boxGeometry args={[W, 0.07, 0.012]} /></mesh>);
    slats.push(<mesh key={`l${i}`} material={m.wood} position={[-W / 2, y, 0]}><boxGeometry args={[0.012, 0.07, D]} /></mesh>);
    slats.push(<mesh key={`r${i}`} material={m.wood} position={[W / 2, y, 0]}><boxGeometry args={[0.012, 0.07, D]} /></mesh>);
  }
  for (let i = 0; i < 4; i++) slats.push(<mesh key={`d${i}`} material={m.woodDark} position={[0, 0.01, -D / 2 + 0.06 + i * 0.125]}><boxGeometry args={[W, 0.012, 0.09]} /></mesh>);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) slats.push(<mesh key={`c${x}${z}`} material={m.woodDark} position={[x * (W / 2 - 0.025), H / 2, z * (D / 2 - 0.025)]}><boxGeometry args={[0.04, H, 0.04]} /></mesh>);
  return <group rotation-y={0.2}>{slats}</group>;
}

export function Tape({ m }: P) {
  return (
    <group rotation-x={-Math.PI / 2} position-y={0.1}>
      <group rotation-x={Math.PI / 2}>
        <Roll m={m} r={0.3} h={0.2} core={0.2} body={m.tape} ends={m.tapeEdge} y={-0.1} />
        <WindRings r={0.3} core={0.2} y={0.1} mat={m.core} />
      </group>
    </group>
  );
}

export function Strapping({ m }: P) {
  const coil = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 600; i++) {
      const t = (i / 600) * Math.PI * 2 * 14, r = 0.18 + (i / 600) * 0.14;
      pts.push(v(Math.cos(t) * r, (i / 600) * 0.004, Math.sin(t) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1200, 0.006, 4, false);
  }, []);
  return (
    <group>
      <group position={[0, 0, 0]}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} material={m.lime} position-y={0.03 + i * 0.012} castShadow>
            <torusGeometry args={[0.18 + i * 0.0001, 0.006, 4, 1]} />
          </mesh>
        ))}
        <mesh material={m.lime} position-y={0.1} castShadow><cylinderGeometry args={[0.33, 0.33, 0.18, 96, 1, true]} /></mesh>
        <mesh material={m.lime} position-y={0.19} rotation-x={-Math.PI / 2}><ringGeometry args={[0.16, 0.33, 96]} /></mesh>
        <mesh material={m.core} position-y={0.1}><cylinderGeometry args={[0.16, 0.16, 0.19, 64, 1, true]} /></mesh>
        <primitive object={new THREE.Mesh(coil, m.lime)} visible={false} />
      </group>
    </group>
  );
}

function bagShape() {
  const s = new THREE.Shape();
  const w = 0.3, h = 0.46, r = 0.02;
  s.moveTo(-w + r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r);
  s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, r); s.quadraticCurveTo(-w, 0, -w + r, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, h - 0.06, 0.07, 0.022, 0, Math.PI * 2, false, 0);
  s.holes.push(hole);
  return new THREE.ShapeGeometry(s, 24);
}

export function Bags({ m }: P) {
  const geo = useMemo(bagShape, []);
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={geo} material={m.bag} rotation-x={-Math.PI / 2} position={[(i % 2) * 0.02 - 0.05, 0.004 + i * 0.006, 0.18 - (i % 3) * 0.015]} rotation-z={(i - 3) * 0.04} />
      ))}
      <mesh geometry={geo} material={m.bag} position={[0.12, 0, -0.18]} rotation-x={-0.25}>
      </mesh>
      <mesh material={m.bagPrint} position={[0.12, 0.13, -0.165]} rotation-x={-0.25}>
        <planeGeometry args={[0.14, 0.05]} />
      </mesh>
    </group>
  );
}

export function NetSleeve({ m }: P) {
  return (
    <group>
      <group rotation-z={Math.PI / 2} position={[0.4, 0.2, -0.1]}>
        <mesh material={m.net} position-y={0.4}><cylinderGeometry args={[0.2, 0.2, 0.8, 48, 1, true]} /></mesh>
        <mesh material={m.core} position-y={0.4}><cylinderGeometry args={[0.06, 0.06, 0.84, 32, 1, true]} /></mesh>
      </group>
      {/* сетка с «содержимым» (луковицы) */}
      <group position={[-0.05, 0, 0.3]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 1.7) * 0.09, 0.07 + (i % 3) * 0.07, Math.sin(i * 1.7) * 0.09]} castShadow>
            <sphereGeometry args={[0.07, 24, 16]} />
            <meshStandardMaterial color="#c58b45" roughness={0.6} />
          </mesh>
        ))}
        <mesh material={m.net} position-y={0.14}><sphereGeometry args={[0.19, 32, 24]} /></mesh>
      </group>
    </group>
  );
}

function gloveShape() {
  const s = new THREE.Shape();
  // контур рабочей перчатки (ладонь вниз), единицы ~ метры, масштаб 1:1.6
  const pts: [number, number][] = [
    [-0.09, 0], [0.09, 0], [0.1, 0.12], [0.13, 0.16], [0.19, 0.2], [0.2, 0.23], [0.17, 0.24], [0.11, 0.2],
    [0.1, 0.33], [0.085, 0.345], [0.07, 0.33], [0.065, 0.24], [0.06, 0.37], [0.045, 0.385], [0.03, 0.37],
    [0.022, 0.25], [0.018, 0.38], [0.0, 0.395], [-0.015, 0.38], [-0.02, 0.25], [-0.03, 0.36], [-0.047, 0.375],
    [-0.062, 0.36], [-0.065, 0.24], [-0.07, 0.31], [-0.085, 0.325], [-0.1, 0.31], [-0.1, 0.12],
  ];
  s.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => s.lineTo(...p));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.012, bevelSegments: 6, curveSegments: 8 });
}

export function Gloves({ m }: P) {
  const geo = useMemo(gloveShape, []);
  return (
    <group scale={1.6}>
      <mesh geometry={geo} material={m.knit} rotation-x={-Math.PI / 2} position={[-0.08, 0.02, 0.2]} rotation-z={0.25} castShadow />
      <mesh geometry={geo} material={m.knit} rotation-x={-Math.PI / 2} position={[0.1, 0.06, 0.15]} rotation-z={-0.35} castShadow />
      <mesh material={m.knitCuff} rotation-x={-Math.PI / 2} position={[-0.067, 0.035, 0.21]} rotation-z={0.25}>
        <boxGeometry args={[0.2, 0.035, 0.035]} />
      </mesh>
    </group>
  );
}

export function Nails({ m }: P) {
  const inst = useMemo(() => {
    const shaft = new THREE.CylinderGeometry(0.008, 0.008, 0.3, 10);
    const tip = new THREE.ConeGeometry(0.008, 0.03, 10);
    tip.translate(0, -0.165, 0);
    const head = new THREE.CylinderGeometry(0.02, 0.02, 0.006, 20);
    head.translate(0, 0.153, 0);
    const geos = [shaft, tip, head];
    const n = 70;
    const meshes = geos.map((g) => new THREE.InstancedMesh(g, m.steel, n));
    const o = new THREE.Object3D();
    let seed = 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 0.42;
      o.position.set(Math.cos(ang) * rad, 0.012 + (0.42 - rad) * 0.25 * r(), Math.sin(ang) * rad);
      o.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.5);
      o.updateMatrix();
      meshes.forEach((mm) => mm.setMatrixAt(i, o.matrix));
    }
    meshes.forEach((mm) => { mm.castShadow = true; });
    return meshes;
  }, [m]);
  return <group>{inst.map((mm, i) => <primitive key={i} object={mm} />)}</group>;
}

export const productModels: Record<string, (p: P) => React.ReactElement> = {
  'strejch-plenka': StretchFilm,
  'bopp-plenka': BoppFilm,
  'vozdushno-puzyrchataya-plenka': BubbleWrap,
  'plenki-pvd-pnd': PvdFilm,
  gofrokarton: Corrugated,
  gofrotara: Gofrotara,
  'kraft-bumaga': KraftPaper,
  'cheki-i-termocheki': ThermalRolls,
  'poddony-borta-brus': Pallet,
  'kabelnye-barabany': CableDrum,
  'yashchiki-dlya-produktov': FoodCrate,
  skotch: Tape,
  'strepping-lenta-i-peht-lenta-zashchitnye-ugolki': Strapping,
  'pakety-pvd-pnd-psd': Bags,
  setki: NetSleeve,
  perchatki: Gloves,
  metizy: Nails,
};

export function ProductModel({ slug }: { slug: string }) {
  const m = useLibraryMaterials();
  const Model = productModels[slug];
  return Model ? <Model m={m} /> : null;
}
