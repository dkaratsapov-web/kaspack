'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LabelRefs } from '@/components/three/ExplodeScene';
import { Blueprint } from '../backgrounds/Blueprint';
import { EXPLODE_OFFSET, STACK_TOP, type PalletState } from '@/components/three/LoadedPallet';
import { LeadForm } from '@/components/LeadForm';

const ExplodeScene = dynamic(() => import('@/components/three/ExplodeScene'), { ssr: false });

const LAYERS: { key: keyof LabelRefs; title: string; spec: string; href: string; side: 'left' | 'right' }[] = [
  { key: 'film', title: 'Стрейч-плёнка', spec: '17–23 мкм, ручная и машинная', href: '/strejch-plenka', side: 'right' },
  { key: 'strap', title: 'Стреппинг-лента и уголки', spec: 'ПП и ПЭТ, разрыв до 1 т', href: '/strepping-lenta-i-peht-lenta-zashchitnye-ugolki', side: 'right' },
  { key: 'tier', title: 'Гофрокороба и скотч', spec: 'Т-21…Т-24, логотип на скотче', href: '/gofrotara', side: 'right' },
  { key: 'pallet', title: 'Поддон с клеймом IPPC', spec: 'Термообработка для экспорта', href: '/poddony-borta-brus', side: 'right' },
];
// Слово-глава за грузом (fizzi «INTO / THE / FUTURE»): сменяется по мере разбора
const CHAPTERS = [
  { at: 0, word: 'Груз' },
  { at: 0.16, word: 'Плёнка' },
  { at: 0.36, word: 'Лента' },
  { at: 0.56, word: 'Короба' },
  { at: 0.76, word: 'Поддон' },
];
const BASE_MM = Math.round(STACK_TOP * 1000);
const SPREAD_MM = Math.round(EXPLODE_OFFSET.film * 1000);

// Кульминация v2: графитовое поле-чертёж (миллиметровка + разметка слоёв), закреплённая сцена, гигантское слово-глава и счётчик высоты в мм.
export function Explode() {
  const section = useRef<HTMLElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const state = useRef<PalletState>({ wrap: 1, explode: 0 });
  const labels = useRef<LabelRefs>({ film: null, strap: null, tier: null, pallet: null });
  const guides = useRef<LabelRefs>({ film: null, strap: null, tier: null, pallet: null });
  const [mount, setMount] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [interactive, setInteractive] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = matchMedia('(min-width: 1024px)').matches;
    let webgl = false;
    try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch {}
    if (!webgl) setInteractive(false);

    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMount(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el);

    const apply = (e: number) => {
      state.current.explode = e;
      const smooth = e * e * e * (e * (e * 6 - 15) + 10);
      if (readout.current) readout.current.textContent = (BASE_MM + Math.round(SPREAD_MM * smooth)).toLocaleString('ru-RU');
      let idx = 0;
      CHAPTERS.forEach((c, i) => { if (e >= c.at) idx = i; });
      setChapter((prev) => (prev === idx ? prev : idx));
    };

    if (reduced || !desktop) { apply(1); return () => io.disconnect(); }

    let kill: (() => void) | undefined;
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => {
          apply(Math.min(1, Math.max(0, (self.progress - 0.05) / 0.78)));
          if (self.progress > 0.9) (window as unknown as { ym?: (...a: unknown[]) => void }).ym?.(0, 'reachGoal', 'explode_complete');
        },
      });
      kill = () => st.kill();
    })();
    return () => { io.disconnect(); kill?.(); };
  }, []);

  return (
    <section ref={section} id="explode" aria-labelledby="explode-title" className="chapter field-graphite on-dark lg:h-[340vh]">
      <div className="relative isolate overflow-hidden lg:sticky lg:top-0 lg:h-[100svh]">
        <Blueprint />
        {/* разметка слоёв: пунктир на высоте каждого слоя, едет вместе с ним */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
          {LAYERS.map((l) => (
            <div key={l.key} ref={(el) => { guides.current[l.key] = el; }} data-on="false" className="explode-guide absolute left-[36%] right-0 top-0 h-px" />
          ))}
        </div>
        {/* слово-глава: верхняя полоса над грузом, справа от колонки с текстом — заголовок всегда читается целиком */}
        <p
          aria-hidden="true"
          key={chapter}
          className="giant chapter-word pointer-events-none absolute inset-x-0 bottom-[3%] z-0 whitespace-nowrap text-center text-[clamp(3.5rem,17vw,8rem)] text-white/[0.07] lg:bottom-auto lg:left-[36%] lg:right-[clamp(20px,3.4vw,64px)] lg:top-[calc(var(--header-h)+3vh)] lg:text-right lg:text-[min(11vw,24vh,15rem)] lg:text-[#beea1f]/[0.16]"
        >
          {CHAPTERS[chapter].word}
        </p>

        <div className="wrap relative z-10 grid h-full lg:grid-cols-12">
          <div className="flex flex-col justify-end pb-6 pt-24 lg:col-span-4 lg:pb-16">
            <h2 id="explode-title" className="title text-[clamp(2rem,3.6vw,3.6rem)] text-white">
              Каждый слой этого груза есть у нас
            </h2>
            <p className="lead mt-5 max-w-[32ch] text-graphite-soft">
              Поддон, короба, скотч, лента, уголки и плёнка. Один поставщик, один договор, одна машина.
            </p>
            <ul className="mt-6 grid gap-0 lg:sr-only">
              {LAYERS.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3">
                    <span className="font-semibold text-white">{l.title}</span>
                    <span className="text-right text-sm text-graphite-soft">{l.spec}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* открытая форма: расчёт комплекта прямо здесь, без поп-апа */}
            <div className="mt-7 max-w-[34rem] rounded-[20px] bg-white/95 p-3 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] md:p-4">
              <p className="mb-3 px-1 font-display text-[17px] font-bold tracking-[-0.02em]">Рассчитаем комплект для вашей отгрузки</p>
              <LeadForm source="explode" layout="pair" product="Комплект для отгрузки" />
            </div>
          </div>

          <div className="relative -mx-5 h-[min(115vw,600px)] md:-mx-10 lg:col-span-6 lg:mx-0 lg:h-full">
            {interactive && mount && <ExplodeScene state={state} labels={labels} guides={guides} />}
            <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
              {LAYERS.map((l) => (
                <div key={l.key} ref={(el) => { labels.current[l.key] = el; }} data-on="false" className="explode-label absolute left-0 top-0">
                  <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full bg-lime shadow-[0_0_0_4px_rgb(190_234_31/0.25)]" />
                  <span className={`absolute top-0 h-px w-14 bg-lime/70 ${l.side === 'left' ? 'right-0' : 'left-0'}`} />
                  <span className={`absolute top-0 w-[220px] ${l.key === 'film' ? '-translate-y-[calc(100%-6px)]' : '-translate-y-1/2'} rounded-[14px] border border-white/10 bg-graphite-2/90 px-4 py-3 backdrop-blur ${l.side === 'left' ? 'right-16' : 'left-16'}`}>
                    <span className="block text-[15px] font-semibold text-white">{l.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-graphite-soft">{l.spec}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* счётчик в единицах клиента (side-8-group: «глубина в метрах») */}
          <div className="hidden flex-col items-end justify-end pb-16 text-right lg:col-span-2 lg:flex" aria-hidden="true">
            <p className="text-[13px] font-semibold text-graphite-soft">Высота груза, мм</p>
            <p className="mt-1 font-display text-[clamp(2rem,3vw,3.2rem)] font-bold tabular tracking-[-0.04em] text-lime">
              <span ref={readout}>{BASE_MM.toLocaleString('ru-RU')}</span>
            </p>
            <div className="mt-6 h-40 w-px bg-white/15" />
            <p className="mt-3 text-[13px] text-graphite-soft">Европоддон 1200 × 800</p>
          </div>
        </div>
      </div>
    </section>
  );
}
