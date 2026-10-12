'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { asset } from '@/lib/env';
import { Corrugation } from '../backgrounds/Corrugation';
import { LeadButton } from '@/components/LeadButton';

const OPTIONS = [
  {
    title: 'Короб под размер товара',
    text: 'Подберём марку картона и размер под вес и габариты вашей продукции.',
    facts: ['Т-21…Т-24', '3 и 5 слоёв', 'белый и бурый'],
    img: 'gofrotara', href: '/gofrotara',
  },
  {
    title: 'Логотип на скотче',
    text: 'Нанесём логотип или маркировку на скотч и упаковочные материалы.',
    facts: ['прозрачный и цветной', 'армированный', 'малярный'],
    img: 'skotch', href: '/skotch',
  },
  {
    title: 'Первичное или вторичное сырьё',
    text: 'Первичная плёнка прочнее, вторичная дешевле. Подскажем, какая подойдёт для ваших перевозок.',
    facts: ['125–500 мм', '17–23 мкм', 'ручная и машинная'],
    img: 'strejch-plenka', href: '/strejch-plenka',
  },
  {
    title: 'Поддоны с клеймом IPPC',
    text: 'Термообработка и клеймо IPPC/HT: такие поддоны принимают при экспортных поставках.',
    facts: ['хвоя, берёза, осина', '1–3 сорт', 'термообработка'],
    img: 'poddony-borta-brus', href: '/poddony-borta-brus',
  },
  {
    title: 'Барабаны в сборе или в разборе',
    text: 'Кабельные барабаны в том виде, в котором вам удобнее хранить и везти.',
    facts: ['№ 10', '№ 12', '№ 14'],
    img: 'kabelnye-barabany', href: '/kabelnye-barabany',
  },
];

// «Под ваш груз» v3: строки раскрываются в карточки (наведение на десктопе, тап на телефоне, фокус с клавиатуры).
export function Custom() {
  const id = useId();
  const [open, setOpen] = useState(0);

  return (
    <section id="custom" aria-labelledby="custom-title" className="chapter field-kraft grain relative isolate overflow-hidden">
      <Corrugation />
      <div className="wrap relative pb-28 pt-24 md:pb-40 md:pt-32">
        <h2 id="custom-title" className="giant drift-x text-[clamp(3rem,10vw,11rem)] text-kraft-ink">Под ваш груз</h2>
        <ul className="mt-12 border-t-2 border-kraft-ink md:mt-16" onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(-1)}>
          {OPTIONS.map((o, i) => {
            const isOpen = open === i;
            return (
              <li key={o.title} className="border-b border-kraft-ink/30" onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(i)}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${id}-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  onFocus={() => setOpen(i)}
                  className="group grid w-full gap-2 py-6 text-left md:grid-cols-12 md:items-baseline md:gap-8 md:py-8"
                >
                  <span className={`font-display text-[clamp(1.4rem,2.6vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] transition-transform duration-500 [transition-timing-function:var(--e-settle)] md:col-span-7 ${isOpen ? 'md:translate-x-4' : ''}`}>
                    {o.title}
                  </span>
                  <span className="flex items-start justify-between gap-6 text-[17px] text-kraft-ink/80 md:col-span-5">
                    <span className={`transition-opacity duration-300 ${isOpen ? 'md:opacity-0' : ''}`}>{o.text}</span>
                    <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-kraft-ink/40 transition-transform duration-300 ${isOpen ? 'rotate-45 bg-kraft-ink text-kraft' : ''}`}>
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" /></svg>
                    </span>
                  </span>
                </button>

                {/* карточка: анимируем grid-template-rows 0fr→1fr — без измерения высоты */}
                <div id={`${id}-${i}`} role="region" aria-label={o.title} className="custom-card grid" data-open={isOpen} inert={!isOpen}>
                  <div className="overflow-hidden">
                    <div className="mb-8 grid items-center gap-6 overflow-hidden rounded-[28px] bg-graphite p-6 text-white shadow-[0_40px_80px_-40px_rgb(42_31_20/0.7)] md:grid-cols-12 md:p-10">
                      <div className="md:col-span-6">
                        <p className="lead max-w-[38ch] text-graphite-ink">{o.text}</p>
                        <ul className="mt-6 flex flex-wrap gap-2">
                          {o.facts.map((f) => (
                            <li key={f} className="rounded-full bg-white/8 px-3.5 py-1.5 text-[14px] font-semibold text-lime tabular ring-1 ring-white/12">{f}</li>
                          ))}
                        </ul>
                        <div className="mt-8 flex flex-wrap gap-3">
                          <LeadButton source="custom" product={o.title} title="Рассчитать заказ">Рассчитать заказ</LeadButton>
                          <Link href={o.href} className="btn !text-white ring-1 ring-white/25">Подробнее</Link>
                        </div>
                      </div>
                      <div className="relative md:col-span-6">
                        <div aria-hidden="true" className="absolute inset-[12%] rounded-full bg-lime/25 blur-3xl" />
                        <img src={asset(`/catalog/${o.img}.webp`)} alt="" width={480} height={480} loading="lazy" className="custom-card-img relative mx-auto w-[min(100%,380px)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
