'use client';

import { useEffect } from 'react';

// Один IntersectionObserver на страницу: элементы .reveal появляются один раз.
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal:not([data-visible])');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.setAttribute('data-visible', 'true'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
