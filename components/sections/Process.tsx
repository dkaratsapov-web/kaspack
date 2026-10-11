const STEPS = [
  { title: 'Заявка', text: 'Оставьте заявку, позвоните или напишите в WhatsApp.' },
  { title: 'Расчёт', text: 'Менеджер подберёт упаковку и пришлёт стоимость и сроки.' },
  { title: 'Производство', text: 'Изготовим под заказ или соберём комплект со склада.' },
  { title: 'Доставка', text: 'Привезём своим транспортом в согласованный день.' },
];

// Как проходит заказ: реальная последовательность, поэтому номера уместны.
export function Process() {
  return (
    <section id="process" aria-labelledby="process-title" className="mx-auto max-w-[1360px] px-5 py-24 md:px-8 md:py-32">
      <h2 id="process-title" className="reveal max-w-[20ch] text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
        Как проходит заказ
      </h2>
      <ol className="mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="reveal relative" style={{ transitionDelay: `${i * 70}ms` }}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display text-[15px] font-semibold text-lime tabular">{i + 1}</span>
              {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" aria-hidden="true" />}
            </div>
            <h3 className="mt-5 font-display text-[18px] font-semibold tracking-[-0.01em]">{s.title}</h3>
            <p className="mt-2 max-w-[30ch] text-ink-soft">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
