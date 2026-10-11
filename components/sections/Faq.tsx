import { company } from '@/lib/content';

const QA = [
  { q: 'Какой минимальный заказ?', a: 'Работаем с заказами любого объёма: от нескольких рулонов до регулярных поставок по договору.' },
  { q: 'Как быстро вы ответите на заявку?', a: `За ${company.responseMinutes} минут в рабочее время: ${company.hours.days} с ${company.hours.from}:00 до ${company.hours.to}:00 ${company.hours.tz}. Заявки, оставленные вечером и в выходные, обрабатываем утром следующего рабочего дня.` },
  { q: 'Доставляете в мой регион?', a: 'Да, доставляем по всей России собственным транспортом. Стоимость и срок доставки менеджер рассчитает вместе с заказом.' },
  { q: 'Сделаете упаковку нестандартного размера?', a: 'Да. Гофрокороба изготавливаем под размеры вашего товара, кабельные барабаны поставляем в сборе или в разборе, поддоны делаем с термообработкой IPPC.' },
  { q: 'Можно нанести наш логотип?', a: 'Да, наносим логотип и маркировку на скотч и упаковочные материалы.' },
  { q: 'Можно получить презентацию компании?', a: 'Да. Напишите менеджеру или оставьте заявку: пришлём презентацию с ассортиментом и условиями.' },
];

// Ответы на возражения (page-cro: objection handling). Нативный <details> — работает без JS.
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-[1360px] px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <h2 id="faq-title" className="reveal title lg:col-span-4">
          Частые вопросы
        </h2>
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {QA.map((x) => (
            <details key={x.q} className="faq group/faq">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-[17px] font-semibold tracking-[-0.01em]">
                {x.q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--color-line)]" aria-hidden="true">
                  <svg className="faq-chev h-2 w-3.5" viewBox="0 0 190 88"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 text-ink-soft">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
