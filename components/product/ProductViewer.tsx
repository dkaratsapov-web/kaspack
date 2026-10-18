'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { asset } from '@/lib/env';

const ProductViewerScene = dynamic(() => import('./ProductViewerScene'), { ssr: false });

// 3D-просмотр товара в первом экране страницы. Сначала — рендер карточки (тот же ракурс и свет),
// поверх него после загрузки плавно проявляется живая модель: её можно покрутить мышью или пальцем.
// Без WebGL и при «уменьшить движение» остаётся картинка.
export function ProductViewer({ slug, title }: { slug: string; title: string }) {
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      if (!(c.getContext('webgl2') || c.getContext('webgl'))) return;
    } catch { return; }
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback;
    const id = ric ? ric(() => setLive(true), { timeout: 1500 }) : window.setTimeout(() => setLive(true), 400);
    return () => { if (!ric) clearTimeout(id); };
  }, []);

  return (
    <div className="relative aspect-square w-full">
      <img
        src={asset(`/catalog/${slug}.webp`)} alt={`${title}: 3D-визуализация`} width={480} height={480}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {live && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <ProductViewerScene slug={slug} onReady={() => setReady(true)} />
        </div>
      )}
      {ready && (
        <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-2 text-[13px] font-semibold text-ink-mute">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12a8 8 0 0 1 14.5-4.6M20 12a8 8 0 0 1-14.5 4.6" /><path d="M18.5 3.5v4h-4M5.5 20.5v-4h4" /></svg>
          Потяните, чтобы повернуть
        </p>
      )}
    </div>
  );
}
