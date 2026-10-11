import { HeroVisual } from './HeroVisual';
import { LeadForm } from './LeadForm';
import { facts } from '@/lib/content';

// Первый экран (бриф: С1 «индустриальный премиум», решение 4 — заголовок, решение 6 — форма в hero).
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1360px] px-5 md:px-8 lg:min-h-[min(calc(100svh-var(--header-h)-104px),800px)] lg:grid-cols-12 lg:gap-8">
        <div className="relative z-10 flex flex-col justify-center pb-6 pt-8 lg:col-span-6 lg:pb-16 lg:pt-6">
          <p className="fade-in mb-6 flex items-center gap-2.5 text-[14px] font-semibold text-ink-soft" style={{ ['--d' as string]: '120ms' }}>
            <span className="h-[3px] w-6 rounded-full bg-lime" aria-hidden="true" />
            Собственное производство в Твери
          </p>
          <h1
            id="hero-title"
            className="line-rise text-[clamp(1.9rem,2.85vw,2.8rem)] font-semibold leading-[1.1] tracking-[-0.03em] lg:[&>span]:whitespace-nowrap"
          >
            <span>Упакуем отгрузку</span>
            <span>целиком: от поддона</span>
            <span>до плёнки</span>
          </h1>
          <p className="fade-in mt-6 max-w-[34rem] text-[18px] leading-relaxed text-ink-soft" style={{ ['--d' as string]: '320ms' }}>
            Стрейч-плёнка, гофротара, поддоны, метизы и ещё 13 видов упаковки от производителя. Доставка своим транспортом по всей России.
          </p>
          <div className="fade-in mt-9 max-w-[40rem]" style={{ ['--d' as string]: '440ms' }}>
            <LeadForm source="hero" />
          </div>
        </div>

        {/* 3D-груз: на десктопе занимает правую часть, на мобильном — блок под текстом */}
        <div className="relative -mx-5 h-[min(78vw,460px)] md:-mx-8 lg:col-span-6 lg:mx-0 lg:h-auto">
          <div className="absolute inset-0 lg:-right-[6vw]">
            <HeroVisual />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <ul className="grid grid-cols-2 gap-y-6 border-t border-line py-7 md:grid-cols-4">
          {facts.map((f) => (
            <li key={f.label} className="pr-6">
              <p className="font-display text-[22px] font-semibold tracking-[-0.02em] tabular">{f.value}</p>
              <p className="mt-1 text-[14px] leading-snug text-ink-soft">{f.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
