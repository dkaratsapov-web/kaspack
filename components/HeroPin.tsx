'use client';

import { useEffect, useRef } from 'react';
import { heroProgress } from '@/lib/heroProgress';

// Обёртка первого экрана. На десктопе с WebGL (класс kp-pin на <html>) первый экран залипает,
// а скролл раскрывает груз: из коробов вылетают товары каталога.
export function HeroPin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const hero = el.firstElementChild as HTMLElement | null;
      const dist = el.offsetHeight - (hero?.offsetHeight ?? innerHeight);
      const q = dist > 40 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / dist)) : 0;
      heroProgress.q = q;
      el.style.setProperty('--hq', q.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return <div ref={ref} className="hero-pin -mt-[var(--header-h)]">{children}</div>;
}
