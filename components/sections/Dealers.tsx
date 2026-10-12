import Link from 'next/link';

// Блок-ссылка для дилеров и оптовиков (бриф, решение 7).
export function Dealers() {
  return (
    <section aria-labelledby="dealers-title" className="wrap">
      <div className="reveal grid items-center gap-6 rounded-[24px] bg-ink p-8 text-white md:grid-cols-[1fr_auto] md:p-12">
        <div>
          <h2 id="dealers-title" className="title text-[clamp(1.8rem,3vw,3rem)]">
            Дилерам и оптовым покупателям
          </h2>
          <p className="mt-3 max-w-[56ch] text-graphite-soft">
            Особые условия для компаний, которые перепродают упаковку: цены от объёма, отгрузка на ваш склад, персональный менеджер.
          </p>
        </div>
        <Link href="/partneram" className="btn btn-primary" data-goal="cta_dealers">Условия для дилеров</Link>
      </div>
    </section>
  );
}
