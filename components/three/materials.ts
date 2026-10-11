import * as THREE from 'three';
import { kraftTextures, stampTexture, woodTextures } from './textures';

// Общая библиотека PBR-материалов. Создаётся один раз на страницу.
let cache: ReturnType<typeof create> | null = null;

function knitTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efeee8';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    for (let x = 0; x < 256; x += 6) {
      g.fillStyle = `rgba(150,145,130,${0.12 + ((x * 7 + y * 13) % 10) / 60})`;
      g.beginPath(); g.ellipse(x + 3, y + 3, 2.2, 3, 0.5, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

function meshTexture(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = color;
  g.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 6);
  return t;
}

function create() {
  const kraft = kraftTextures();
  const wood = woodTextures();
  return {
    kraft: new THREE.MeshStandardMaterial({ map: kraft.map, bumpMap: kraft.bump, bumpScale: 0.6, roughness: 0.86 }),
    kraftPaper: new THREE.MeshStandardMaterial({ map: kraft.map, roughness: 0.78, color: '#e9d2a8' }),
    whiteBoard: new THREE.MeshStandardMaterial({ color: '#eceae3', roughness: 0.8, bumpMap: kraft.bump, bumpScale: 0.4 }),
    core: new THREE.MeshStandardMaterial({ color: '#9b7a52', roughness: 0.9, map: kraft.map }),
    wood: new THREE.MeshStandardMaterial({ map: wood.map, roughness: 0.92, color: '#f3e3c2' }),
    woodDark: new THREE.MeshStandardMaterial({ map: wood.map, roughness: 0.95, color: '#d4b98a' }),
    stretch: new THREE.MeshPhysicalMaterial({ color: '#f4f7ff', roughness: 0.18, transmission: 0.55, thickness: 0.4, transparent: true, opacity: 0.9, clearcoat: 1, clearcoatRoughness: 0.1 }),
    filmSheet: new THREE.MeshPhysicalMaterial({ color: '#eef3ff', roughness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 }),
    bopp: new THREE.MeshPhysicalMaterial({ color: '#cfd5dd', roughness: 0.22, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.05 }),
    pvd: new THREE.MeshPhysicalMaterial({ color: '#dfe9ef', roughness: 0.32, transmission: 0.35, thickness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    bubble: new THREE.MeshPhysicalMaterial({ color: '#f2f6ff', roughness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1, side: THREE.DoubleSide }),
    thermal: new THREE.MeshStandardMaterial({ color: '#f6f5f0', roughness: 0.55 }),
    tape: new THREE.MeshPhysicalMaterial({ color: '#c79a5a', roughness: 0.22, transmission: 0.35, thickness: 0.3, clearcoat: 0.9 }),
    tapeEdge: new THREE.MeshStandardMaterial({ color: '#a77d45', roughness: 0.45 }),
    lime: new THREE.MeshPhysicalMaterial({ color: '#beea1f', roughness: 0.4, clearcoat: 0.4 }),
    graphite: new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: '#d3d8de', roughness: 0.32, metalness: 0.85 }),
    cable: new THREE.MeshStandardMaterial({ color: '#23262c', roughness: 0.45 }),
    bag: new THREE.MeshPhysicalMaterial({ color: '#f5f7fa', roughness: 0.3, transparent: true, opacity: 0.82, side: THREE.DoubleSide, clearcoat: 0.6 }),
    bagPrint: new THREE.MeshStandardMaterial({ color: '#beea1f', roughness: 0.5, side: THREE.DoubleSide }),
    knit: new THREE.MeshStandardMaterial({ map: knitTexture(), roughness: 0.95, color: '#ffffff' }),
    knitCuff: new THREE.MeshStandardMaterial({ color: '#beea1f', roughness: 0.9 }),
    net: new THREE.MeshStandardMaterial({ map: meshTexture('#e2582b'), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.7 }),
    stamp: new THREE.MeshStandardMaterial({ map: stampTexture(), transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    burn: new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 1, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }),
  };
}

export function useLibraryMaterials() {
  if (!cache) cache = create();
  return cache;
}
export type Lib = ReturnType<typeof create>;
