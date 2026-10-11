import { InViewVideo } from '../InViewVideo';

const DIRECTIONS = ['Стрейч-плёнка', 'Переработка гранул ПНД и ПВД', 'Поддоны', 'Гофрокартон', 'Этикетки', 'Метизы'];

// Производство: 6 направлений + реальные видео заказчика (бриф, решение 13).
export function Production() {
  return (
    <section id="production" aria-labelledby="production-title" className="bg-surface">
      <div className="mx-auto max-w-[1360px] px-5 py-24 md:px-8 md:py-32">
        <div className="reveal max-w-[46rem]">
          <h2 id="production-title" className="text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Шесть направлений собственного производства
          </h2>
          <p className="mt-5 max-w-[52ch] text-ink-soft">
            Делаем упаковку сами, поэтому держим сроки и цену без посредников.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <figure className="reveal relative overflow-hidden rounded-[var(--radius-card)] bg-graphite lg:col-span-7">
            <div className="aspect-[16/10]"><InViewVideo src="/video/pallets.mp4" poster="/video/pallets.webp" label="Цех производства поддонов Kaspack" /></div>
            <figcaption className="absolute bottom-3 left-3 rounded-[10px] bg-graphite/80 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur">Цех поддонов</figcaption>
          </figure>
          <div className="grid gap-4 lg:col-span-5">
            <figure className="reveal relative overflow-hidden rounded-[var(--radius-card)] bg-graphite">
              <div className="aspect-[16/10] lg:aspect-auto lg:h-full"><InViewVideo src="/video/corrugated.mp4" poster="/video/corrugated.webp" label="Линия производства гофрокартона Kaspack" /></div>
              <figcaption className="absolute bottom-3 left-3 rounded-[10px] bg-graphite/80 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur">Гофролиния</figcaption>
            </figure>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          {DIRECTIONS.map((d) => (
            <li key={d} className="reveal flex items-start gap-2.5 border-t border-line pt-4 text-[15px] font-semibold leading-snug">
              <span className="mt-[7px] h-1.5 w-3 shrink-0 rounded-full bg-lime" aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
