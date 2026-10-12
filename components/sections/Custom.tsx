'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
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

const N = OPTIONS.length;

// «Под ваш груз» v4. На десктопе блок закреплён: скролл листает разделы, слева список, справа карточка.
// На телефоне это аккордеон, раздел раскрывается тапом.
export function Custom() {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const desktop = matchMedia('(min-width: 1024px)');
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!desktop.matches) return;
      const dist = el.offsetHeight - innerHeight;
      if (dist <= 0) return;
      const p = Math.min(0.9999, Math.max(0, -el.getBoundingClientRect().top / dist)) * N;
      const i = Math.floor(p);
      setActive((prev) => (prev === i ? prev : i));
      list.current?.style.setProperty('--ip', (p - i).toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  // клик по разделу прокручивает к его отрезку; плавность задаёт html { scroll-behavior }
  const go = (i: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + ((el.offsetHeight - innerHeight) * (i + 0.5)) / N });
  };

  return (
    <section ref={section} id="custom" aria-labelledby="custom-title" className="chapter field-kraft grain relative lg:h-[360svh]">
      <div className="relative isolate overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col">
        <Corrugation />
        <div className="wrap relative flex w-full flex-1 flex-col pb-28 pt-24 md:pb-40 md:pt-32 lg:min-h-0 lg:pb-[6vh] lg:pt-[calc(var(--header-h)+3vh)]">
          <h2 id="custom-title" className="giant drift-x text-[clamp(3rem,10vw,11rem)] text-kraft-ink lg:text-[min(8.4vw,15vh,11rem)]">Под ваш груз</h2>

          {/* телефон и планшет: аккордеон */}
          <ul className="mt-12 border-t-2 border-kraft-ink md:mt-16 lg:hidden">
            {OPTIONS.map((o, i) => {
              const isOpen = open === i;
              return (
                <li key={o.title} className="border-b border-kraft-ink/30">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="grid w-full gap-2 py-6 text-left md:grid-cols-12 md:items-baseline md:gap-8 md:py-8"
                  >
                    <span className="font-display text-[clamp(1.4rem,2.6vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] md:col-span-7">{o.title}</span>
                    <span className="flex items-start justify-between gap-6 text-[17px] text-kraft-ink/80 md:col-span-5">
                      <span>{o.text}</span>
                      <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-kraft-ink/40 transition-transform duration-300 ${isOpen ? 'rotate-45 bg-kraft-ink text-kraft' : ''}`}>
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" /></svg>
                      </span>
                    </span>
                  </button>

                  {/* карточка: анимируем grid-template-rows 0fr→1fr — без измерения высоты */}
                  <div id={`${id}-${i}`} role="region" aria-label={o.title} className="custom-card grid" data-open={isOpen} inert={!isOpen}>
                    <div className="overflow-hidden">
                      <div className="mb-8">
                        <Card o={o} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* десктоп: блок стоит, разделы листаются скроллом */}
          <div className="mt-[3vh] hidden min-h-0 flex-1 grid-cols-12 items-center gap-10 lg:grid">
            <ul ref={list} className="col-span-5 flex flex-col border-t-2 border-kraft-ink">
              {OPTIONS.map((o, i) => {
                const on = i === active;
                return (
                  <li key={o.title} className="relative border-b border-kraft-ink/30">
                    <button
                      type="button"
                      aria-current={on ? 'true' : undefined}
                      aria-controls={`${id}-d${i}`}
                      onClick={() => go(i)}
                      className="flex w-full items-center justify-between gap-6 py-[1.9vh] text-left"
                    >
                      <span className={`font-display text-[clamp(1.25rem,1.9vw,2.1rem)] font-bold leading-[1.08] tracking-[-0.035em] transition-[color,translate] duration-500 [transition-timing-function:var(--e-settle)] ${on ? 'translate-x-3 text-kraft-ink' : 'text-kraft-ink/40 hover:text-kraft-ink/70'}`}>
                        {o.title}
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 190 88" className={`h-3 w-5 shrink-0 -rotate-90 transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-0'}`}><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
                    </button>
                    {/* прогресс внутри раздела */}
                    {on && <span aria-hidden="true" className="absolute -bottom-px left-0 h-[3px] w-full origin-left bg-kraft-ink" style={{ transform: 'scaleX(var(--ip, 0))' }} />}
                  </li>
                );
              })}
            </ul>

            <div className="relative col-span-7 grid">
              {OPTIONS.map((o, i) => (
                <div key={o.title} id={`${id}-d${i}`} role="region" aria-label={o.title} data-on={i === active} inert={i !== active} className="custom-panel col-start-1 row-start-1 self-start">
                  <Card o={o} desktop />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ o, desktop = false }: { o: (typeof OPTIONS)[number]; desktop?: boolean }) {
  return (
    <div className="grid items-center gap-6 overflow-hidden rounded-[28px] bg-graphite p-6 text-white shadow-[0_40px_80px_-40px_rgb(42_31_20/0.7)] md:grid-cols-12 md:p-10">
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
        <img src={asset(`/catalog/${o.img}.webp`)} alt="" width={480} height={480} loading="lazy" className={`custom-card-img relative mx-auto ${desktop ? 'w-[min(100%,38vh)]' : 'w-[min(100%,380px)]'}`} />
      </div>
    </div>
  );
}
