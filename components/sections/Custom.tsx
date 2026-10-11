const OPTIONS = [
  { title: 'Короб под размер товара', text: 'Подберём марку картона и размер под вес и габариты вашей продукции.' },
  { title: 'Логотип на скотче', text: 'Нанесём логотип или маркировку на скотч и упаковочные материалы.' },
  { title: 'Первичное или вторичное сырьё', text: 'Первичная плёнка прочнее, вторичная дешевле. Подскажем, какая подойдёт.' },
  { title: 'Поддоны с клеймом IPPC', text: 'Термообработка для экспортных поставок.' },
  { title: 'Барабаны в сборе или в разборе', text: '№ 10, 12, 14 в том виде, в котором удобнее хранить и везти.' },
];

// «Под ваш груз» v2: крафтовое поле — цвет гофрокартона, крупные строки вместо карточек.
export function Custom() {
  return (
    <section id="custom" aria-labelledby="custom-title" className="field-kraft grain relative isolate">
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-24 md:px-10 md:pb-40 md:pt-32">
        <h2 id="custom-title" className="giant reveal text-[clamp(3rem,10vw,11rem)] text-kraft-ink">Под ваш груз</h2>
        <ul className="mt-12 border-t-2 border-kraft-ink md:mt-16">
          {OPTIONS.map((o) => (
            <li key={o.title} className="reveal grid gap-2 border-b border-kraft-ink/30 py-6 md:grid-cols-12 md:items-baseline md:gap-8 md:py-8">
              <h3 className="font-display text-[clamp(1.4rem,2.6vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] md:col-span-7">{o.title}</h3>
              <p className="text-[17px] text-kraft-ink/80 md:col-span-4 md:col-start-9">{o.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
