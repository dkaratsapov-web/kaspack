'use client';

import { useEffect, useState } from 'react';
import { company } from '@/lib/content';
import { LeadButton } from './LeadButton';

// Нижняя панель на телефоне после первого экрана: «Позвонить» и «Рассчитать».
export function MobileBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById('hero-title');
    const calc = document.getElementById('calc');
    if (!hero) return;
    let pastHero = false, atCalc = false;
    const update = () => setShow(pastHero && !atCalc);
    const io1 = new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); });
    const io2 = new IntersectionObserver(([e]) => { atCalc = e.isIntersecting; update(); }, { threshold: 0.2 });
    io1.observe(hero); if (calc) io2.observe(calc);
    return () => { io1.disconnect(); io2.disconnect(); };
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-line bg-canvas/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 md:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ transitionTimingFunction: 'var(--ease-out)' }}
      aria-hidden={!show}
    >
      <div className="grid grid-cols-2 gap-3">
        <a href={company.phoneHref} className="btn btn-ghost !min-h-[48px]" tabIndex={show ? 0 : -1} data-goal="cta_sticky_call">Позвонить</a>
        <LeadButton source="sticky_mobile" className="btn btn-primary !min-h-[48px]">Рассчитать</LeadButton>
      </div>
    </div>
  );
}
