'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { categories, families } from '@/lib/content';
import { CATEGORY_ICONS } from '@/components/icons/CategoryIcons';
import { BoneDrift } from '@/components/backgrounds/BoneDrift';

/*
 * Каталог сеткой: 17 категорий в три ряда (6 + 6 + 5) — весь ассортимент на одном экране.
 * Движение (cg-web-animate, уровень «микро»): при появлении блока иконки один раз прорисовываются линией
 * с шагом 35 мс; при наведении/фокусе у каждой своё короткое действие. Никаких бесконечных петель.
 * Без JS и при reduced motion иконки просто нарисованы.
 */
export function CatalogGrid() {
  const grid = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = grid.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.dataset.draw = 'wait';
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.dataset.draw = 'go';
      io.disconnect();
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="catalog" data-catalog aria-labelledby="catalog-title" className="chapter field-bone relative isolate overflow-hidden">
      <BoneDrift />
      {/* десктоп: весь блок — ровно один экран; три ряда делят высоту под заголовком поровну */}
      <div className="wrap flex flex-col pb-16 pt-24 lg:h-[100svh] lg:min-h-[620px] lg:pb-14 lg:pt-[calc(var(--header-h)+28px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 id="catalog-title" className="font-display text-[clamp(2rem,3.2vw,3.4rem)] font-bold leading-[0.98] tracking-[-0.045em]">17 видов упаковки и тары</h2>
          <p className="max-w-[40ch] text-[15px] text-ink-soft lg:text-right">Всё для отгрузки у одного поставщика. Выберите товар: характеристики, подбор и расчёт.</p>
        </div>

        <ul ref={grid} className="cat-grid mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-[clamp(16px,3vh,32px)] lg:min-h-0 lg:flex-1 lg:grid-cols-6 lg:grid-rows-3 lg:gap-[clamp(10px,1.4vh,16px)]">
          {categories.map((c, i) => (
            <li key={c.slug} className="min-h-0" style={{ ['--i' as string]: i }}>
              <Link
                href={`/${c.slug}`}
                className="cat-tile group relative flex h-full min-h-[148px] flex-col rounded-[20px] bg-surface p-4 shadow-[0_1px_0_var(--color-line)] lg:min-h-0 lg:p-[clamp(12px,1.8vh,20px)]"
                data-goal="category_open"
              >
                <span className="absolute right-4 top-4 font-display text-[12px] font-bold tabular text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                <span className="cat-icon-wrap block h-12 w-12 text-ink lg:h-[clamp(40px,8.6vh,84px)] lg:w-[clamp(40px,8.6vh,84px)]">{CATEGORY_ICONS[c.slug]}</span>
                <span className="mt-auto block pt-3">
                  <span className="block text-[12px] font-semibold text-ink-mute">{families[c.family]}</span>
                  <span className="mt-0.5 block font-display text-[15px] font-bold leading-[1.15] tracking-[-0.02em]">{c.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
