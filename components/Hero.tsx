import { HeroVisual } from './HeroVisual';
import { ChevronField } from './backgrounds/ChevronField';
import { LeadForm } from './LeadForm';
import { HeroUsp } from './HeroUsp';

// Hero v2 (frontend-design: «типографика как картинка»; премиум-корпус: fizzi/tripletta — объект перекрывает буквы).
// Слои: лаймовое поле → гигантские слова → 3D-груз (canvas) → форма.
// v4: на десктопе экран — часть сцены HeroCatalogStage: груз раскрывается, подложка растворяется, товары встают на ленту каталога.
export function Hero() {
  return (
    // секция не обрезает содержимое: груз на десктопе выходит за низ первого экрана и встаёт на край каталога.
    // Лаймовое поле и шевроны — отдельный обрезанный слой под контентом.
    <section data-stage-hero aria-labelledby="hero-title" className="relative pt-[var(--header-h)] text-ink">
        <div aria-hidden="true" className="field-lime grain pointer-events-none absolute inset-0 isolate overflow-hidden">
          <ChevronField />
        </div>
        <div className="wrap relative min-h-[max(calc(100svh-var(--header-h)),700px)]">
          <h1 id="hero-title" className="giant giant-rise relative z-0 pt-[clamp(1rem,3vh,2.5rem)] text-[11.4vw] lg:text-[min(8.7vw,15.5vh,11rem)] text-ink">
            <span>Упакуем</span>
            <span className="lg:pl-[0.35em]">отгрузку</span>
            <span>целиком</span>
            <span className="sr-only">: от поддона до плёнки</span>
          </h1>

          {/* 3D-груз поверх букв. Canvas шире рамки (раскрытые клапаны и подъём камеры не упираются в край),
              а сам груз кадрируется в hero-frame; по той же рамке слой товаров повторяет камеру груза. */}
          <div className="pointer-events-none relative z-10 -mx-5 -my-4 h-[88vw] max-h-[520px] md:-mx-10 lg:absolute lg:inset-auto lg:bottom-[-30svh] lg:left-[36%] lg:right-[calc(50%-50vw)] lg:top-[calc(-1*var(--header-h))] lg:z-[25] lg:m-0 lg:h-auto lg:max-h-none" aria-hidden="true">
            <HeroVisual />
          </div>
          {/* рамка груза уходит ниже первого экрана: поддон стоит на краю светлого листа каталога и отбрасывает на него тень */}
          <div data-hero-frame aria-hidden="true" className="pointer-events-none hidden lg:absolute lg:bottom-[-17svh] lg:left-[49%] lg:right-[-4%] lg:top-[17%] lg:block" />

          <div className="relative z-20 grid gap-6 pb-10 lg:absolute lg:bottom-20 lg:left-[clamp(20px,3.4vw,64px)] lg:mt-0 lg:w-[min(46rem,52%)] lg:pb-0">
            <HeroUsp />
            <div className="rounded-[20px] bg-white/90 p-3 shadow-[0_30px_60px_-30px_rgb(30_33_39/0.45)] backdrop-blur md:p-4">
              <LeadForm source="hero" />
            </div>
          </div>
        </div>

        {/* подсказка на время закрепления; гаснет с первыми пикселями скролла */}
        <p aria-hidden="true" className="scroll-hint-hero pointer-events-none absolute inset-x-0 bottom-5 z-20 items-center justify-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/75">
          Листайте вниз
          <svg viewBox="0 0 190 88" className="scroll-cue h-2.5 w-4 text-ink"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
        </p>
    </section>
  );
}
