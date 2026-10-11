import { InViewVideo } from '../InViewVideo';

const DIRECTIONS = ['Стрейч-плёнка', 'Переработка гранул ПНД и ПВД', 'Поддоны', 'Гофрокартон', 'Этикетки', 'Метизы'];

// Производство v2: графитовое поле, реальные видео во всю ширину, направления крупным списком.
export function Production() {
  return (
    <section id="production" aria-labelledby="production-title" className="field-bone relative">
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-24 md:px-10 md:pb-36 md:pt-32">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 id="production-title" className="title reveal lg:col-span-7">Шесть собственных производств</h2>
          <p className="lead reveal text-ink-soft lg:col-span-4 lg:col-start-9">Делаем упаковку сами, поэтому держим сроки и цену без посредников.</p>
        </div>

        <div className="mt-14 grid gap-3 md:grid-cols-12">
          <figure className="reveal relative overflow-hidden rounded-[18px] md:col-span-8">
            <div className="aspect-[16/9]"><InViewVideo src="/video/pallets.mp4" poster="/video/pallets.webp" label="Цех производства поддонов Kaspack" /></div>
            <figcaption className="absolute bottom-4 left-4 font-display text-[clamp(1.2rem,2vw,1.8rem)] font-bold tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.5)]">Цех поддонов</figcaption>
          </figure>
          <figure className="reveal relative overflow-hidden rounded-[18px] md:col-span-4">
            <div className="aspect-[16/9] md:aspect-auto md:h-full"><InViewVideo src="/video/corrugated.mp4" poster="/video/corrugated.webp" label="Линия производства гофрокартона Kaspack" /></div>
            <figcaption className="absolute bottom-4 left-4 font-display text-[clamp(1.2rem,2vw,1.8rem)] font-bold tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.5)]">Гофролиния</figcaption>
          </figure>
        </div>

        <ul className="mt-16 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {DIRECTIONS.map((d) => (
            <li key={d} className="reveal flex items-baseline gap-4 border-t border-ink/15 py-5">
              <span className="h-[3px] w-5 shrink-0 translate-y-[-0.3em] rounded-full bg-ink" aria-hidden="true" />
              <span className="font-display text-[clamp(1.15rem,1.6vw,1.5rem)] font-bold leading-tight tracking-[-0.03em]">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
