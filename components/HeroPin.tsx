'use client';

import { useEffect, useRef } from 'react';
import { heroProgress } from '@/lib/heroProgress';

// Обёртка первого экрана. На десктопе с WebGL (класс kp-pin на <html>) первый экран залипает,
// а скролл раскрывает груз и передаёт товары в каталог.
// handoff-track — слой для товаров: абсолютный на всю обёртку, внутри sticky-лист высотой с первый экран.
// Он закреплён и отпускается ровно вместе с первым экраном, а потом скроллится вместе со страницей.
// Поэтому товары никогда не отстают от коробов и карточек (в отличие от fixed-слоя, который ждёт JS).
export function HeroPin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const hero = el.querySelector('section');
      if (hero && layer.current) layer.current.style.height = `${hero.offsetHeight}px`;
    };
    const update = () => {
      raf = 0;
      const hero = el.querySelector('section');
      const dist = el.offsetHeight - (hero?.offsetHeight ?? innerHeight);
      const q = dist > 40 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / dist)) : 0;
      heroProgress.q = q;
      el.style.setProperty('--hq', q.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    measure();
    update();
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} className="hero-pin relative -mt-[var(--header-h)]">
      <div aria-hidden="true" className="handoff-track pointer-events-none absolute inset-0 z-30 hidden">
        <div ref={layer} data-handoff-layer className="sticky top-0 h-[100svh]" />
      </div>
      {children}
    </div>
  );
}
