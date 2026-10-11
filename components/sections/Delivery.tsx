'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const TruckScene = dynamic(() => import('@/components/three/TruckScene'), { ssr: false });

const POINTS = [
  { title: 'Собственный автопарк', text: 'Возим сами, без транспортных компаний и перегрузов.' },
  { title: 'По всей России', text: 'Отгружаем со склада в Твери в любой регион.' },
  { title: 'Комплект одной машиной', text: 'Плёнка, короба, поддоны и расходники приезжают вместе.' },
];

// Доставка (графитовый блок): фура в шевронах въезжает в кадр по скроллу (бриф, решение 16).
export function Delivery() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [mount, setMount] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) { setWebgl(false); return; } } catch { setWebgl(false); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMount(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { progress.current = 1; return () => io.disconnect(); }
    let kill: (() => void) | undefined;
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: el, start: 'top 85%', end: 'center 55%',
        onUpdate: (s) => { progress.current = s.progress; },
      });
      progress.current = st.progress;
      kill = () => st.kill();
    })();
    return () => { io.disconnect(); kill?.(); };
  }, []);

  return (
    <section ref={section} id="delivery" aria-labelledby="delivery-title" className="on-dark relative overflow-hidden bg-graphite text-graphite-ink">
      <div className="mx-auto max-w-[1360px] px-5 pt-24 md:px-8 md:pt-32">
        <div className="grid gap-8 lg:grid-cols-12">
          <h2 id="delivery-title" className="reveal text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white lg:col-span-5">
            Привезём своим транспортом
          </h2>
          <p className="reveal max-w-[46ch] text-graphite-soft lg:col-span-5 lg:col-start-8 lg:pt-2">
            Собственное производство и автопарк: отгружаем со склада в Твери и доставляем по всей России в согласованный день.
          </p>
        </div>
      </div>

      <div className="relative h-[clamp(240px,34vw,520px)]" aria-hidden="true">
        {webgl && mount && <TruckScene progress={progress} />}
      </div>

      <div className="mx-auto max-w-[1360px] px-5 pb-24 md:px-8 md:pb-32">
        <ul className="grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="reveal">
              <p className="font-display text-[17px] font-semibold text-white">{p.title}</p>
              <p className="mt-2 text-[15px] text-graphite-soft">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
