'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categories, families, type Category } from '@/lib/content';
import { asset } from '@/lib/env';

type Fam = keyof typeof families | 'all';

function Card({ c }: { c: Category }) {
  const [ready, setReady] = useState(false);
  const preload = () => {
    if (ready) return;
    const img = new Image();
    img.onload = () => setReady(true);
    img.src = asset(`/catalog/${c.slug}-spin.webp`);
  };
  return (
    <li className="group" data-spin-ready={ready || undefined} onPointerEnter={preload}>
      <Link
        href={`/${c.slug}`}
        className="flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-3 shadow-[0_1px_0_var(--color-line),0_10px_30px_-24px_rgb(24_27_33/0.35)] transition-shadow duration-200"
        data-goal="category_open"
      >
        <div className="spin relative aspect-square overflow-hidden rounded-[12px] bg-canvas">
          <img
            src={asset(`/catalog/${c.slug}.webp`)}
            alt=""
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="spin-still absolute inset-0 h-full w-full object-contain"
          />
          <span
            aria-hidden="true"
            className="spin-sprite absolute inset-0"
            style={{ ['--spin' as string]: `url(${asset(`/catalog/${c.slug}-spin.webp`)})` }}
          />
        </div>
        <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-4">
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-[-0.01em]">{c.title}</h3>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{c.spec}</p>
          <span className="mt-auto flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-lime-ink">
            Подробнее
            <svg className="h-2 w-3 -rotate-90" viewBox="0 0 190 88" aria-hidden="true"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
          </span>
        </div>
      </Link>
    </li>
  );
}

export function Catalog() {
  const [fam, setFam] = useState<Fam>('all');
  const list = fam === 'all' ? categories : categories.filter((c) => c.family === fam);
  const tabs: [Fam, string][] = [['all', 'Все'], ...(Object.entries(families) as [Fam, string][])];

  return (
    <section id="catalog" aria-labelledby="catalog-title" className="mx-auto max-w-[1360px] px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-28">
      <div className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="catalog-title" className="max-w-[18ch] text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            17 видов упаковки от одного поставщика
          </h2>
          <p className="mt-4 max-w-[52ch] text-ink-soft">
            Закупайте всё для отгрузки в одном месте: один договор, один менеджер, одна доставка.
          </p>
        </div>
        <div role="group" aria-label="Фильтр по типу упаковки" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={fam === k}
              onClick={() => setFam(k)}
              className={`h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors duration-150 ${
                fam === k ? 'bg-ink text-white' : 'bg-surface text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((c) => <Card key={c.slug} c={c} />)}
      </ul>
    </section>
  );
}
