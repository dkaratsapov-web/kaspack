'use client';

import Link from 'next/link';
import { categories, company, families } from '@/lib/content';
import { asset } from '@/lib/env';

const FAMILIES = Object.keys(families) as (keyof typeof families)[];

/*
 * Выпадающий каталог шапки (claude-web-skills, часть 4: мега-меню).
 * 17 категорий по четырём семействам — как они лежат в производстве, с превью из каталога главной.
 * Панель рендерится только открытой: превью грузятся при первом наведении, а не вместе со страницей.
 */
export function CatalogMenu({ id, pathname, onPointerEnter, onPointerLeave, onNavigate }: {
  id: string;
  pathname: string;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onNavigate: () => void;
}) {
  return (
    // pt-2 — «мостик»: курсор идёт от пункта к панели, не попадая в пустоту
    <div id={id} className="catalog-menu pointer-events-auto absolute hidden lg:block inset-x-[clamp(20px,3.4vw,64px)] top-full pt-2" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <div className="header-capsule rounded-[20px] p-3 text-bone">
        <div className="grid grid-cols-4 gap-1">
          {FAMILIES.map((f) => (
            <div key={f} className="min-w-0">
              <p className="px-3 pb-2 pt-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-bone/45">{families[f]}</p>
              <ul>
                {categories.filter((c) => c.family === f).map((c) => {
                  const on = pathname === `/${c.slug}`;
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`/${c.slug}`}
                        onClick={onNavigate}
                        aria-current={on ? 'page' : undefined}
                        className={`catalog-menu-link group flex items-center gap-3 rounded-[14px] p-2 ${on ? 'bg-white/[0.08]' : ''}`}
                        data-goal="menu_category"
                      >
                        <span className="relative h-11 w-11 shrink-0 rounded-[11px] bg-white/[0.06]">
                          <img src={asset(`/catalog/${c.slug}.webp`)} alt="" width={44} height={44} decoding="async" className="absolute inset-0 h-full w-full scale-[1.15] object-contain transition-transform duration-300 [transition-timing-function:var(--e-settle)] group-hover:scale-[1.3]" />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-[14.5px] font-semibold leading-tight ${on ? 'text-lime' : 'text-bone'}`}>{c.title}</span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-bone/50">{c.spec}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/[0.08] px-3 pb-1 pt-3 text-[13.5px]">
          <span className="text-bone/55">Не нашли нужное? Позвоните, подскажем: <a href={company.phoneHref} className="font-semibold text-bone underline decoration-white/25 underline-offset-2 hover:decoration-lime" data-goal="tel_click">{company.phone}</a></span>
          <Link href="/#catalog" onClick={onNavigate} className="font-semibold text-lime hover:underline">Весь каталог на главной</Link>
        </div>
      </div>
    </div>
  );
}
