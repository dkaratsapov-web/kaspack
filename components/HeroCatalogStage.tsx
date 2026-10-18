'use client';

import { useEffect, useRef } from 'react';
import { heroProgress } from '@/lib/heroProgress';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** px горизонтали ленты на 1 px скролла */
const SPEED = 1.9;
/** длина фазы «груз → каталог» в экранах скролла */
const PHASE = 1.8;
/** собственная частота пружины, рад/с: прогресс следует за скроллом с инерцией, без рывков скорости
 *  на шагах колеса и без перелёта (критическое затухание). Одинаково на 60 и 120 Гц */
const OMEGA = 6.5;

/*
 * Сцена «первый экран → каталог» (десктоп с WebGL; класс kp-pin на <html>).
 * Один закреплённый экран, внутри три слоя: каталог (снизу), первый экран, 3D-товары (сверху).
 * Пока сцена закреплена, ничего не скроллится — меняется только прогресс.
 * Один цикл кадров (bizarro: «one rAF loop»): прочитать scrollY → пружина (animation-principles) → записать в DOM только изменения
 * → нарисовать оба canvas. Размеры меряются только при ресайзе, в цикле layout не читается.
 *   q 0.00–0.30  плёнка, лента, клапаны; товары выезжают из коробов
 *   q 0.42–0.62  подложка первого экрана растворяется — остаётся светлый экран с товарами
 *   q 0.50–0.92  товары встают в свои карточки ленты (HeroHandoff), модель сменяется картинкой
 *   q 0.74–0.96  подъезжает заголовок, проявляются подписи и лента
 *   c 0…1        лента листается влево
 * На телефоне и при «уменьшить движение» это обычные блоки друг за другом.
 */
export function HeroCatalogStage({ children }: { children: React.ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (!document.documentElement.classList.contains('kp-pin') || !matchMedia('(min-width: 1024px)').matches) return;
    const hero = el.querySelector<HTMLElement>('[data-stage-hero]');
    const catalog = el.querySelector<HTMLElement>('[data-catalog]');
    const track = catalog?.querySelector<HTMLElement>('[data-track]');
    if (!hero || !catalog || !track) return;
    const hint = hero.querySelector<HTMLElement>('.scroll-hint-hero');
    const title = catalog.querySelector<HTMLElement>('[data-stage-title]');
    const fades = [...catalog.querySelectorAll<HTMLElement>('[data-stage-fade]')];
    el.dataset.staged = '';
    // якорь «Каталог» ведёт в момент, когда каталог уже собран, а не в начало сцены
    catalog.removeAttribute('id');
    if (anchor.current) anchor.current.id = 'catalog';

    let top = 0, A = 0, C = 0, dist = 0;
    const measure = () => {
      A = innerHeight * PHASE;
      dist = Math.max(0, track.scrollWidth - innerWidth + 80);
      C = dist / SPEED;
      el.style.height = `${innerHeight + A + C}px`;
      top = el.getBoundingClientRect().top + scrollY;
      if (anchor.current) anchor.current.style.top = `${A + 120}px`;
      // зона «каталог на экране» для подсветки пункта в шапке: с момента, когда заголовок подъехал
      if (zone.current) { zone.current.style.top = `${A * 0.8}px`; zone.current.style.bottom = '0'; zone.current.style.display = 'block'; }
    };

    const s = { q: 0, vq: 0, c: 0, vc: 0, first: true };
    const out = { fade: -1, cq: -1, hint: -1, c: -1 };
    let raf = 0, last = 0, running = false;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.25, (now - last) / 1000) : 0;
      last = now;
      const y = scrollY - top;
      const tq = clamp01(y / A), tc = clamp01((y - A) / Math.max(1, C));
      // первый кадр — сразу в текущее положение (перезагрузка посреди страницы), дальше — пружина
      if (s.first) { s.q = tq; s.c = tc; s.first = false; }
      for (let left = dt; left > 1e-6; left -= 1 / 240) {
        const h = Math.min(left, 1 / 240);
        s.vq += (OMEGA * OMEGA * (tq - s.q) - 2 * OMEGA * s.vq) * h;
        s.q += s.vq * h;
        s.vc += (OMEGA * OMEGA * (tc - s.c) - 2 * OMEGA * s.vc) * h;
        s.c += s.vc * h;
      }
      if (Math.abs(tq - s.q) < 1e-4 && Math.abs(s.vq) < 1e-3) { s.q = tq; s.vq = 0; }
      if (Math.abs(tc - s.c) < 1e-4 && Math.abs(s.vc) < 1e-3) { s.c = tc; s.vc = 0; }
      heroProgress.q = clamp01(s.q);
      heroProgress.c = clamp01(s.c);

      // запись в DOM — только когда значение изменилось
      const fade = Math.round(smooth(span(heroProgress.q, 0.42, 0.62)) * 1000) / 1000;
      if (fade !== out.fade) {
        out.fade = fade;
        hero.style.opacity = String(1 - fade);
        hero.style.visibility = fade >= 1 ? 'hidden' : '';
        hero.style.pointerEvents = fade > 0.4 ? 'none' : '';
      }
      const hintOpacity = Math.round(clamp01(1 - heroProgress.q * 12) * 1000) / 1000;
      if (hint && hintOpacity !== out.hint) { out.hint = hintOpacity; hint.style.opacity = String(hintOpacity); }
      const cq = Math.round(smooth(span(heroProgress.q, 0.76, 0.97)) * 1000) / 1000;
      if (cq !== out.cq) {
        out.cq = cq;
        if (title) {
          title.style.opacity = String(cq);
          title.style.transform = cq >= 1 ? '' : `translate3d(${((1 - cq) * 32).toFixed(2)}vw,0,0)`;
        }
        fades.forEach((f) => { f.style.opacity = String(cq); });
      }
      if (heroProgress.c !== out.c) { out.c = heroProgress.c; heroProgress.onConveyor?.(heroProgress.c, dist); }

      // 3D-слои рисуются в этом же кадре, уже с новым q
      const seconds = now / 1000;
      heroProgress.renderers.forEach((render) => render(seconds));
    };
    const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    // цикл крутится, только пока сцена рядом с экраном
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '200px' });
    const onResize = () => { measure(); out.c = -1; };
    measure();
    io.observe(el);
    addEventListener('resize', onResize);
    // шрифты и картинки могут сдвинуть ширину ленты — перемеряем, когда страница догрузилась
    addEventListener('load', onResize);
    return () => { stop(); io.disconnect(); removeEventListener('resize', onResize); removeEventListener('load', onResize); };
  }, []);

  return (
    <div ref={stage} className="stage relative -mt-[var(--header-h)]">
      <div ref={anchor} aria-hidden="true" className="pointer-events-none absolute left-0 h-px w-px" />
      <div ref={zone} data-catalog-zone aria-hidden="true" className="pointer-events-none absolute left-0 hidden w-px" />
      <div className="stage-view">
        {children}
        <div data-handoff-layer aria-hidden="true" className="handoff-layer" />
      </div>
    </div>
  );
}
