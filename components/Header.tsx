'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { company, nav } from '@/lib/content';
import { LogoMark } from './Logo';
import { LeadButton } from './LeadButton';
import { Messengers } from './Messengers';
import { CatalogMenu } from './CatalogMenu';

/*
 * Шапка v3 (claude-web-skills, часть 4): плавающая + динамическая.
 * Плавающая — графитовая капсула с отступами от краёв: одинаково читается на лайме, графите, крафте и светлом поле.
 * Динамическая — с назначением: при скролле вниз уезжает и освобождает экран под 3D-сцены, при скролле вверх
 * возвращается. Всегда видна в первых 80 px, при открытом меню и при фокусе внутри.
 * Фирменная деталь — лаймовая «лента» под активным разделом (как стреппинг на грузе), едет к текущему пункту.
 */
const SECTIONS: { href: string; selector: string }[] = [
  { href: '/#catalog', selector: '[data-catalog]' },
  { href: '/#production', selector: '#production' },
  { href: '/#delivery', selector: '#delivery' },
  { href: '/#contacts', selector: '#contacts' },
];

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Header() {
  const [visible, setVisible] = useState(true);
  const [top, setTop] = useState(true);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tapeRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const focusInside = useRef(false);
  // выпадающий каталог: открытие с задержкой 80 мс (не мигает при проходе курсора), закрытие — 320 мс (курсор успевает дойти до панели по диагонали)
  const [cat, setCat] = useState(false);
  const catTimer = useRef(0);
  const catBtn = useRef<HTMLButtonElement>(null);
  const catZone = useRef<HTMLLIElement>(null);
  const hoverCat = (next: boolean) => {
    clearTimeout(catTimer.current);
    catTimer.current = window.setTimeout(() => setCat(next), next ? 80 : 320);
  };
  const closeCat = () => { clearTimeout(catTimer.current); setCat(false); };

  useEffect(() => { openRef.current = open; }, [open]);

  // скрытие/появление: один пассивный слушатель, сведённый в rAF, с «мёртвой зоной» 12 px
  useEffect(() => {
    let previous = scrollY, frame = 0, accumulated = 0, direction = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      frame = 0;
      const current = scrollY;
      const delta = current - previous;
      const next = Math.sign(delta);
      accumulated = next === direction ? accumulated + Math.abs(delta) : Math.abs(delta);
      direction = next;
      setTop(current < 24);
      if (current < 80 || reduced.matches || openRef.current || focusInside.current) setVisible(true);
      else if (accumulated >= 12) { setVisible(direction < 0); accumulated = 0; }
      previous = current;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // активный раздел — по IntersectionObserver, линия посередине экрана
  useEffect(() => {
    // на внутренних страницах активен пункт самой страницы (например, «Дилерам»)
    const page = nav.find((n) => !n.href.includes('#') && pathname.startsWith(n.href));
    setActive(page ? page.href : null);
    // в общей сцене с первым экраном каталог лежит под ним — активен он только с момента, когда собран
    const staged = document.documentElement.classList.contains('kp-pin') && matchMedia('(min-width: 1024px)').matches;
    const pick = (selector: string) => document.querySelector<HTMLElement>(staged && selector === '[data-catalog]' ? '[data-catalog-zone]' : selector);
    const targets = SECTIONS.map((s) => ({ ...s, el: pick(s.selector) })).filter((s) => s.el);
    if (page || !targets.length) return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      const hit = targets.find((t) => seen.get(t.el!));
      setActive(hit ? hit.href : null);
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => io.observe(t.el!));
    return () => io.disconnect();
  }, [pathname]);

  // «лента» под активным пунктом: позиция и ширина без перерисовки React
  useEffect(() => {
    const tape = tapeRef.current, list = listRef.current;
    if (!tape || !list) return;
    const place = () => {
      // позиция пункта — относительно списка (у ссылки offsetParent — её li)
      const item = active ? list.querySelector<HTMLElement>(`a[href="${active}"]`)?.closest('li') : null;
      if (!item) { tape.style.opacity = '0'; return; }
      tape.style.opacity = '1';
      tape.style.transform = `translateX(${item.offsetLeft}px)`;
      tape.style.width = `${item.offsetWidth}px`;
    };
    place();
    addEventListener('resize', place);
    return () => removeEventListener('resize', place);
  }, [active]);

  // мобильное меню: модальный слой — фон inert, фокус внутри и по кругу, Escape, возврат фокуса, скролл заблокирован
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const main = document.getElementById('main');
    main?.setAttribute('inert', '');
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setOpen(false);
      if (e.key !== 'Tab' || !panelRef.current) return;
      // кнопка «Закрыть» в шапке — часть круга фокуса (меню лежит под шапкой)
      const nodes = [triggerRef.current, ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(Boolean) as HTMLElement[];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      main?.removeAttribute('inert');
      trigger?.focus();
    };
  }, [open]);

  const shown = visible || open;

  // каталог закрывается при смене страницы, когда шапка уезжает, по Escape и клику мимо
  useEffect(() => { closeCat(); }, [pathname]);
  useEffect(() => { if (!shown) closeCat(); }, [shown]);
  useEffect(() => {
    if (!cat) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeCat(); catBtn.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!catZone.current?.contains(t) && !document.getElementById('catalog-menu')?.contains(t)) closeCat();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [cat]);

  return (
    <>
      <header className="pointer-events-none sticky top-0 z-[var(--z-header)] h-[var(--header-h)]">
        <div
          className={`site-header wrap relative pt-3 transition-transform duration-[220ms] [transition-timing-function:var(--e-settle)] ${shown ? 'translate-y-0' : '-translate-y-[calc(100%+48px)]'}`}
          onFocusCapture={() => { focusInside.current = true; setVisible(true); }}
          onBlurCapture={() => { focusInside.current = false; }}
        >
          <div
            ref={capsuleRef}
            data-top={top ? 'true' : 'false'}
            className="header-capsule pointer-events-auto flex h-[60px] items-center justify-between gap-4 rounded-[20px] pl-4 pr-2 text-bone xl:gap-6"
          >
            <Link href="/" aria-label="Kaspack, на главную" className="header-logo flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-2">
              <LogoMark className="header-logo-mark h-[22px] w-auto" />
              <span className="font-display text-[21px] font-semibold tracking-[-0.02em]">kaspack</span>
            </Link>

            <nav aria-label="Основная навигация" className="hidden min-w-0 lg:block">
              <ul ref={listRef} className="relative flex items-center">
                {/* лента активного раздела */}
                <span ref={tapeRef} aria-hidden="true" className="header-tape pointer-events-none absolute inset-y-1 left-0 rounded-[10px] opacity-0" />
                {nav.map((item) => {
                  const on = active === item.href;
                  const isCat = item.href === '/#catalog';
                  return (
                    <li
                      key={item.href}
                      ref={isCat ? catZone : undefined}
                      className={`relative flex items-center ${isCat ? "after:absolute after:inset-x-0 after:top-full after:h-3 after:content-['']" : ''}`}
                      onPointerEnter={isCat ? (e) => { if (e.pointerType === 'mouse') hoverCat(true); } : undefined}
                      onPointerLeave={isCat ? (e) => { if (e.pointerType === 'mouse') hoverCat(false); } : undefined}
                    >
                      <Link
                        href={item.href}
                        aria-current={on ? (item.href.includes('#') ? 'location' : 'page') : undefined}
                        onClick={isCat ? closeCat : undefined}
                        className={`header-link relative flex h-11 items-center rounded-[10px] text-[14.5px] font-medium transition-colors duration-200 ${isCat ? 'pl-3.5 pr-7' : 'px-3.5'} ${on ? 'text-ink' : cat && isCat ? 'text-bone' : 'text-bone/70'}`}
                      >
                        {item.label}
                      </Link>
                      {/* раскрытие с клавиатуры и тапом: сама ссылка по-прежнему ведёт к каталогу на главной */}
                      {isCat && (
                        <button
                          ref={catBtn}
                          type="button"
                          aria-expanded={cat}
                          aria-controls="catalog-menu"
                          aria-label="Разделы каталога"
                          onClick={() => setCat((v) => !v)}
                          className={`header-link absolute right-1 top-1/2 grid h-7 w-6 -translate-y-1/2 place-items-center rounded-md ${on ? 'text-ink' : 'text-bone/70'}`}
                        >
                          <svg aria-hidden="true" viewBox="0 0 190 88" className={`h-[6px] w-[11px] transition-transform duration-200 ${cat ? 'rotate-180' : ''}`}><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Messengers tone="dark" className="hidden xl:flex" />
              {/* телефон и почта столбиком: ширина капсулы не растёт */}
              <div className="hidden flex-col items-start px-1 leading-tight xl:flex">
                <a href={company.phoneHref} className="header-phone whitespace-nowrap rounded-md px-2 text-[14.5px] font-semibold tabular text-bone" data-goal="tel_click">
                  {company.phone}
                </a>
                <a href={`mailto:${company.email}`} className="header-phone rounded-md px-2 text-[12.5px] font-medium text-bone/60 transition-colors hover:text-bone" data-goal="email_click">
                  {company.email}
                </a>
              </div>
              <LeadButton source="header" className="btn btn-primary header-cta hidden !min-h-[44px] !rounded-[14px] !px-4 !text-[14.5px] sm:inline-flex">
                Рассчитать заказ
              </LeadButton>
              <button
                ref={triggerRef}
                type="button"
                className="header-menu flex h-11 items-center gap-2.5 rounded-[14px] px-3.5 text-[14.5px] font-semibold text-bone lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((v) => !v)}
              >
                <span aria-hidden="true" className="relative block h-3 w-4">
                  <span className={`absolute left-0 top-0 h-[2px] w-4 rounded bg-current transition-transform duration-200 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
                  <span className={`absolute bottom-0 left-0 h-[2px] w-4 rounded bg-current transition-transform duration-200 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
                </span>
                {open ? 'Закрыть' : 'Меню'}
              </button>
            </div>
          </div>
          {cat && (
            <CatalogMenu
              id="catalog-menu"
              pathname={pathname}
              onPointerEnter={() => hoverCat(true)}
              onPointerLeave={() => hoverCat(false)}
              onNavigate={closeCat}
            />
          )}
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="mobile-menu fixed inset-0 z-[35] flex flex-col overflow-y-auto bg-graphite px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(var(--header-h)+1rem)] text-bone lg:hidden"
        >
          <nav aria-label="Мобильная навигация">
            <ul>
              {nav.map((item, i) => (
                <li key={item.href} className="mobile-menu-item border-b border-white/10" style={{ animationDelay: `${40 + i * 40}ms` }}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-[64px] items-center justify-between font-display text-[clamp(1.6rem,7vw,2.2rem)] font-bold tracking-[-0.03em]">
                    {item.label}
                    <svg aria-hidden="true" viewBox="0 0 190 88" className="h-3 w-5 -rotate-90 text-lime"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-3 pt-10">
            <LeadButton source="menu" onBeforeOpen={() => setOpen(false)}>Рассчитать заказ</LeadButton>
            <a href={company.phoneHref} className="btn tabular !text-bone ring-1 ring-white/20">{company.phone}</a>
            <a href={`mailto:${company.email}`} className="text-center text-[15px] font-medium text-bone/70" data-goal="email_click">{company.email}</a>
            <Messengers tone="dark" size="lg" className="mt-2 justify-center gap-3" />
          </div>
        </div>
      )}
    </>
  );
}
