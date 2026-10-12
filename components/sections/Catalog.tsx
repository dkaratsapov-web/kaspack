'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { categories, families } from '@/lib/content';
import { asset } from '@/lib/env';
import { BoneDrift } from '../backgrounds/BoneDrift';

// Каталог v2 — «конвейер» (premium-web-design: section system 6, горизонтальная глава от вертикального скролла).
// Десктоп: секция залипает, лента с 17 товарами едет влево. Телефон: нативная горизонтальная прокрутка со snap.
export function Catalog() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const belt = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const el = section.current, tr = track.current;
    if (!el || !tr) return;
    const desktop = matchMedia('(min-width: 1024px)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!desktop || reduced) return;

    const SPEED = 1.9; // px горизонтали на 1 px скролла
    let distance = 0, frame = 0;
    const measure = () => {
      distance = Math.max(0, tr.scrollWidth - window.innerWidth + 80);
      setHeight(window.innerHeight + distance / SPEED);
    };
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (-rect.top * SPEED) / Math.max(1, distance)));
      tr.style.transform = `translate3d(${(-p * distance).toFixed(1)}px,0,0)`;
      if (belt.current) belt.current.style.backgroundPositionX = `${(-p * distance).toFixed(1)}px`;
      const i = Math.min(categories.length, Math.max(1, Math.round(p * (categories.length - 1)) + 1));
      setIndex((prev) => (prev === i ? prev : i));
    };
    // один пассивный слушатель, сведённый в rAF (claude-web-skills 4.4)
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    measure(); update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', measure);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', measure); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <section
      ref={section}
      id="catalog"
      aria-labelledby="catalog-title"
      className="chapter field-bone"
      style={height ? { height } : undefined}
    >
      {/* подсказка на кромке листа: видна под первым экраном, уходит вместе со скроллом */}
      <p aria-hidden="true" className="scroll-hint-sheet pointer-events-none absolute inset-x-0 top-2.5 z-20 hidden items-center justify-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft lg:flex">
        Листайте вниз
        <svg viewBox="0 0 190 88" className="scroll-cue h-2.5 w-4 text-ink"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
      </p>
      <div className="relative isolate overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center">
        <BoneDrift />
        <div className="wrap flex w-full items-end justify-between gap-8 pt-24 lg:pt-20">
          <h2 id="catalog-title" className="title max-w-[14ch]">17 видов упаковки на одной ленте</h2>
          <p className="hidden shrink-0 font-display text-[clamp(2rem,3.4vw,3.4rem)] font-bold tabular tracking-[-0.04em] lg:block" aria-hidden="true">
            {String(index).padStart(2, '0')}<span className="text-ink/25"> / {categories.length}</span>
          </p>
        </div>

        <div className="relative mt-8 lg:mt-10">
          <ul
            ref={track}
            className="relative z-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:px-10 lg:snap-none lg:gap-8 lg:overflow-visible lg:will-change-transform"
          >
            {categories.map((c, i) => (
              <li key={c.slug} className="group w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[min(30vw,460px)]">
                <Link href={`/${c.slug}`} className="block" data-goal="category_open">
                  <div className="spin relative aspect-square">
                    <img
                      src={asset(`/catalog/${c.slug}.webp`)}
                      alt=""
                      width={480}
                      height={480}
                      loading={i < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="spin-still absolute inset-0 h-full w-full object-contain transition-[transform,opacity] duration-500 [transition-timing-function:var(--e-settle)] group-hover:-translate-y-2"
                    />
                    <span aria-hidden="true" className="spin-sprite absolute inset-0" style={{ ['--spin' as string]: `url(${asset(`/catalog/${c.slug}-spin.webp`)})` }} />
                  </div>
                  <p className="mt-3 text-[14px] font-semibold text-ink-mute tabular">{String(i + 1).padStart(2, '0')} · {families[c.family]}</p>
                  <h3 className="mt-1.5 font-display text-[clamp(1.25rem,1.6vw,1.65rem)] font-bold leading-[1.08] tracking-[-0.03em]">{c.title}</h3>
                  <p className="mt-2 max-w-[32ch] text-[15px] text-ink-soft">{c.spec}</p>
                </Link>
              </li>
            ))}
          </ul>
          {/* лента конвейера с роликами — едет вместе с товарами */}
          <div
            ref={belt}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[calc(min(30vw,460px)*0.86)] z-0 hidden h-5 bg-ink lg:block"
            style={{ backgroundImage: 'radial-gradient(circle at 12px 10px, #4a4f58 0 5px, transparent 6px)', backgroundSize: '48px 20px' }}
          />
        </div>
      </div>
    </section>
  );
}
