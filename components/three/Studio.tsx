'use client';

import { Environment, Lightformer } from '@react-three/drei';

// Единый студийный свет для всех 3D-сцен и рендеров (без HDRI-файлов и CDN).
export function Studio({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={dark ? 1.6 : 2.4} position={[0, 5, 1]} scale={[8, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={dark ? 1.2 : 1.6} position={[-5, 2, 2]} scale={[3, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={dark ? 1.4 : 1.1} position={[5, 1.5, -1]} scale={[3, 3, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="rect" intensity={dark ? 0.8 : 1.2} position={[0, 1, 6]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={0.5} position={[0, -3, 0]} scale={[10, 10, 1]} rotation-x={-Math.PI / 2} />
        <Lightformer form="ring" color="#beea1f" intensity={dark ? 1.2 : 0.6} position={[3, 3, -4]} scale={2} />
      </Environment>
      <directionalLight position={[2.5, 4.5, 3]} intensity={dark ? 1.1 : 1.4} />
    </>
  );
}
