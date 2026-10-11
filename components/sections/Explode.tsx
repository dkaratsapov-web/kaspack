'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LabelRefs } from '@/components/three/ExplodeScene';
import type { PalletState } from '@/components/three/LoadedPallet';

const ExplodeScene = dynamic(() => import('@/components/three/ExplodeScene'), { ssr: false });

const LAYERS: { key: keyof LabelRefs; title: string; spec: string; href: string; side: 'left' | 'right' }[] = [
  { key: 'film', title: 'Стрейч-плёнка', spec: '17–23 мкм, ручная и машинная', href: '/strejch-plenka', side: 'left' },
  { key: 'strap', title: 'Стреппинг-лента и уголки', spec: 'ПП и ПЭТ, разрыв до 1 т', href: '/strepping-lenta-i-peht-lenta-zashchitnye-ugolki', side: 'right' },
  { key: 'tier', title: 'Гофрокороба и скотч', spec: 'Т-21…Т-24, логотип на скотче', href: '/gofrotara', side: 'right' },
  { key: 'pallet', title: 'Поддон с клеймом IPPC', spec: 'Термообработка для экспорта', href: '/poddony-borta-brus', side: 'right' },
];

// Кульминация (бриф: «Груз в разборе»). Секция «залипает», скролл разбирает груз на слои.
export function Explode() {
  const section = useRef<HTMLElement>(null);
  const state = useRef<PalletState>({ wrap: 1, explode: 0 });
  const labels = useRef<LabelRefs>({ film: null, strap: null, tier: null, pallet: null });
  const [mount, setMount] = useState(false);
  const [interactive, setInteractive] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = matchMedia('(min-width: 1024px)').matches;
    let webgl = false;
    try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
    if (!webgl) { setInteractive(false); return; }

    // монтируем сцену заранее, когда секция приближается
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMount(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el);

    if (reduced || !desktop) {
      state.current.explode = 1; // статичный «разобранный» вид без скролл-анимации
      return () => io.disconnect();
    }

    let kill: (() => void) | undefined;
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          state.current.explode = Math.min(1, Math.max(0, (self.progress - 0.06) / 0.72));
          if (self.progress > 0.9) (window as unknown as { ym?: (...a: unknown[]) => void }).ym?.(0, 'reachGoal', 'explode_complete');
        },
      });
      kill = () => st.kill();
    })();
    return () => { io.disconnect(); kill?.(); };
  }, []);

  return (
    <section
      ref={section}
      id="explode"
      aria-labelledby="explode-title"
      className="on-dark relative bg-graphite text-graphite-ink lg:h-[300vh]"
    >
      <div className="mx-auto grid max-w-[1360px] px-5 md:px-8 lg:sticky lg:top-0 lg:h-[100svh] lg:grid-cols-12 lg:gap-8">
        <div className="relative z-10 flex flex-col justify-center pt-20 lg:col-span-4 lg:py-16">
          <h2 id="explode-title" className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
            Всё, из чего собрана эта отгрузка, есть у нас
          </h2>
          <p className="mt-5 max-w-[40ch] text-graphite-soft">
            Поддон, короба, скотч, лента, уголки и плёнка. Закажите комплект у одного производителя и получите всё одной машиной.
          </p>
          <ul className="mt-8 grid gap-3 lg:sr-only">
            {LAYERS.map((l) => (
              <li key={l.key}>
                <Link href={l.href} className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="font-semibold text-white">{l.title}</span>
                  <span className="text-right text-sm text-graphite-soft">{l.spec}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <a href="#calc" className="btn btn-primary" data-goal="cta_explode">
              Рассчитать заказ
              <svg className="chev h-3 w-4" viewBox="0 0 190 88" aria-hidden="true"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
            </a>
          </div>
        </div>

        <div className="relative -mx-5 h-[min(110vw,560px)] md:-mx-8 lg:col-span-8 lg:mx-0 lg:h-auto">
          {interactive && mount && <ExplodeScene state={state} labels={labels} />}
          {/* выноски слоёв (только десктоп; на мобильном — список слева) */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            {LAYERS.map((l) => (
              <div
                key={l.key}
                ref={(el) => { labels.current[l.key] = el; }}
                data-on="false"
                className="explode-label absolute left-0 top-0"
              >
                <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full bg-lime shadow-[0_0_0_4px_rgb(190_234_31/0.25)]" />
                <span
                  className={`absolute top-0 h-px w-14 bg-lime/70 ${l.side === 'left' ? 'right-0' : 'left-0'}`}
                />
                <span
                  className={`absolute top-0 w-[220px] -translate-y-1/2 rounded-[12px] border border-white/10 bg-graphite-2/90 px-4 py-3 backdrop-blur ${
                    l.side === 'left' ? 'right-16' : 'left-16'
                  }`}
                >
                  <span className="block text-[14px] font-semibold text-white">{l.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-graphite-soft">{l.spec}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
