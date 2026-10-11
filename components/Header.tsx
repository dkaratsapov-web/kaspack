'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { company, nav } from '@/lib/content';
import { Logo } from './Logo';

// Прилипающая шапка (бриф С12). После первого экрана становится компактнее и получает разделитель.
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Мобильное меню: Escape закрывает, фокус возвращается на кнопку, скролл заблокирован
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-px" />
      <header
        className={`sticky top-0 z-[var(--z-header)] transition-[background-color,box-shadow] duration-200 ${
          scrolled ? 'bg-canvas/92 shadow-[0_1px_0_var(--color-line),0_8px_24px_-16px_rgb(24_27_33/0.25)] backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1360px] items-center justify-between gap-6 px-5 transition-[height] duration-200 md:px-8 ${
            scrolled ? 'h-[64px]' : 'h-[var(--header-h)]'
          }`}
        >
          <Link href="/" aria-label="Kaspack, на главную" className="shrink-0 rounded-md">
            <Logo compact={scrolled} onLime={!scrolled} />
          </Link>

          <nav aria-label="Основная навигация" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link rounded-lg px-3 py-2 text-[15px] font-medium text-ink-soft transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <a href={company.phoneHref} className="hidden text-[15px] font-semibold tabular md:block" data-goal="tel_click">
              {company.phone}
            </a>
            <a href="#calc" className="btn btn-dark hidden !min-h-[44px] sm:inline-flex" data-goal="cta_header">
              Рассчитать заказ
            </a>
            <button
              ref={triggerRef}
              type="button"
              className="btn btn-ghost !min-h-[44px] !px-3.5 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? 'Закрыть' : 'Меню'}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="fixed inset-x-0 bottom-0 top-[64px] z-[var(--z-overlay)] overflow-y-auto bg-canvas px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 lg:hidden"
        >
          <nav aria-label="Мобильная навигация">
            <ul className="divide-y divide-line">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-[56px] items-center font-display text-xl">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 grid gap-3">
            <a href="#calc" onClick={() => setOpen(false)} className="btn btn-primary">Рассчитать заказ</a>
            <a href={company.phoneHref} className="btn btn-ghost tabular">{company.phone}</a>
          </div>
        </div>
      )}
    </>
  );
}
