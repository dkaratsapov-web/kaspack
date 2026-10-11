const OPTIONS = [
  { title: 'Гофрокороб под размер товара', text: 'Подберём марку картона и размер короба под вес и габариты вашей продукции.' },
  { title: 'Логотип на скотче и упаковке', text: 'Нанесём логотип или маркировку на скотч и упаковочные материалы.' },
  { title: 'Плёнка из первичного или вторичного сырья', text: 'Первичная прочнее, вторичная дешевле. Подскажем, какая подойдёт для ваших перевозок.' },
  { title: 'Поддоны с термообработкой IPPC', text: 'Ставим клеймо IPPC/HT: такие поддоны принимают при экспортных поставках.' },
  { title: 'Барабаны в сборе или в разборе', text: 'Кабельные барабаны № 10, 12, 14 в том виде, в котором вам удобнее хранить и везти.' },
];

// «Под ваш груз» (бриф 8.2, п.6): снимает возражение «не сделают под нас».
export function Custom() {
  return (
    <section id="custom" aria-labelledby="custom-title" className="mx-auto max-w-[1360px] px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="reveal lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 id="custom-title" className="text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
              Сделаем под ваш груз
            </h2>
            <p className="mt-5 max-w-[42ch] text-ink-soft">
              Стандартная упаковка подходит не всем. Производим под задачу и комплектуем заказ так, как удобно вашему складу.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-line border-y border-line lg:col-span-7">
          {OPTIONS.map((o) => (
            <li key={o.title} className="reveal grid gap-2 py-7 sm:grid-cols-[1fr_1.1fr] sm:gap-8">
              <h3 className="font-display text-[18px] font-semibold leading-snug tracking-[-0.01em]">{o.title}</h3>
              <p className="text-ink-soft">{o.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
