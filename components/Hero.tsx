import { HeroVisual } from './HeroVisual';
import { LeadForm } from './LeadForm';

// Hero v2 (frontend-design: «типографика как картинка»; премиум-корпус: fizzi/tripletta — объект перекрывает буквы).
// Слои: лаймовое поле → гигантские слова → 3D-груз (canvas) → форма.
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="field-lime grain relative isolate -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]">
      <div className="relative mx-auto min-h-[max(calc(100svh-var(--header-h)),700px)] max-w-[1600px] px-5 md:px-10">
        <h1 id="hero-title" className="giant giant-rise relative z-0 pt-[clamp(1rem,3vh,2.5rem)] text-[11.4vw] lg:text-[min(8.7vw,15.5vh,11rem)] text-ink">
          <span>Упакуем</span>
          <span className="lg:pl-[0.35em]">отгрузку</span>
          <span>целиком</span>
          <span className="sr-only">: от поддона до плёнки</span>
        </h1>

        {/* 3D-груз поверх букв */}
        <div className="pointer-events-none relative z-10 -mx-5 -my-4 h-[88vw] max-h-[520px] md:-mx-10 lg:absolute lg:inset-auto lg:bottom-[-2%] lg:left-[50%] lg:right-[-3%] lg:top-[19%] lg:m-0 lg:h-auto lg:max-h-none" aria-hidden="true">
          <HeroVisual />
        </div>

        <div className="relative z-20 grid gap-6 pb-10 lg:absolute lg:bottom-10 lg:left-10 lg:mt-0 lg:w-[min(46rem,52%)] lg:pb-0">
          <p className="lead max-w-[34ch] font-medium" aria-hidden="true">
            От поддона до плёнки: 17 видов упаковки собственного производства. Доставляем своим транспортом по всей России.
          </p>
          <div className="rounded-[20px] bg-white/90 p-3 shadow-[0_30px_60px_-30px_rgb(30_33_39/0.45)] backdrop-blur md:p-4">
            <LeadForm source="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
