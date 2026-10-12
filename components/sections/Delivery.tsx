'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { FilmShader } from '../backgrounds/FilmShader';

const TruckScene = dynamic(() => import('@/components/three/TruckScene'), { ssr: false });

const POINTS = [
  { title: 'Свой автопарк', text: 'Возим сами, без транспортных компаний и перегрузов.' },
  { title: 'Вся Россия', text: 'Отгружаем со склада в Твери в любой регион.' },
  { title: 'Одной машиной', text: 'Плёнка, короба, поддоны и расходники приезжают вместе.' },
];

// Доставка v2: лаймовое поле, фура в фирменной ливрее проезжает сквозь гигантские слова.
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
      const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', end: 'center 45%', onUpdate: (s) => { progress.current = s.progress; } });
      progress.current = st.progress;
      kill = () => st.kill();
    })();
    return () => { io.disconnect(); kill?.(); };
  }, []);

  return (
    <section ref={section} id="delivery" aria-labelledby="delivery-title" className="chapter field-graphite on-dark isolate overflow-hidden">
      <FilmShader />
      <div className="wrap pt-24 md:pt-32">
        <h2 id="delivery-title" className="giant relative z-0 text-center text-[clamp(3rem,11vw,12.5rem)] text-lime">
          <span className="block">По всей</span>
          <span className="block">России</span>
        </h2>
      </div>
      {/* фура едет поверх нижней строки */}
      <div className="relative z-10 -mt-[clamp(3rem,6.5vw,7rem)] h-[clamp(240px,32vw,500px)]" aria-hidden="true">
        {/* разметка дороги: штрихи едут при скролле */}
        <div className="road-dash absolute inset-x-0 bottom-[16%] h-[3px] opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, var(--color-lime) 0 46px, transparent 46px 90px)', backgroundSize: '90px 3px' }} />
        {webgl && mount && <TruckScene progress={progress} />}
      </div>
      <div className="wrap relative z-20 pb-24 md:pb-32">
        <ul className="grid gap-8 border-t border-white/15 pt-8 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="reveal">
              <p className="font-display text-[clamp(1.3rem,2vw,1.9rem)] font-bold tracking-[-0.03em] text-white">{p.title}</p>
              <p className="mt-2 max-w-[34ch] text-[17px] text-graphite-soft">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
