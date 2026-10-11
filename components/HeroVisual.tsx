'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// 3D подгружается после первой отрисовки текста и формы (LCP — заголовок, не сцена).
export function HeroVisual() {
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!webgl()) return;
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback;
    const id = ric ? ric(() => setMount(true), { timeout: 1200 }) : window.setTimeout(() => setMount(true), 300);
    return () => { if (!ric) clearTimeout(id); };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionTimingFunction: 'var(--ease-out)' }}
      >
        {mount && <HeroScene onReady={() => setReady(true)} />}
      </div>
    </div>
  );
}
