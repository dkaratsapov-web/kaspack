'use client';

import { useEffect } from 'react';
import { LogoMark } from './Logo';

/** Выполняется до первой отрисовки: решает, показывать ли интро (первый визит, без reduced motion). */
export const introBootScript = `try{if(localStorage.getItem('kp_intro')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='1';localStorage.setItem('kp_intro','1')}}catch(e){}`;

// Интро (бриф С8): шеврон логотипа 0,8 с поверх уже отрисованной страницы, не блокирует клики.
export function Intro() {
  useEffect(() => {
    if (document.documentElement.dataset.intro !== '1') return;
    const t = setTimeout(() => { delete document.documentElement.dataset.intro; }, 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div aria-hidden="true" className="intro pointer-events-none fixed inset-0 z-[var(--z-intro)] place-items-center bg-canvas">
      <div className="intro-mark w-[92px]">
        <LogoMark className="h-auto w-full" />
      </div>
    </div>
  );
}
