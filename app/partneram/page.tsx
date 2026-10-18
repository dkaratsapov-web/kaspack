import type { Metadata } from 'next';
import { LeadForm } from '@/components/LeadForm';

export const metadata: Metadata = {
  title: 'Дилерам и оптовым покупателям — Kaspack',
  description: 'Условия для дилеров и оптовых покупателей упаковки Kaspack: цены от объёма, отгрузка на ваш склад, персональный менеджер.',
};

// Условия партнёрской программы — заполнить с заказчиком (бриф: «нужно от заказчика»).
const TERMS = [
  { t: 'Цены от объёма', d: 'Стоимость зависит от объёма и регулярности закупок. Менеджер пришлёт условия под ваш объём.' },
  { t: 'Отгрузка на ваш склад', d: 'Доставляем собственным транспортом по всей России.' },
  { t: 'Персональный менеджер', d: 'Один контакт по всем заказам, остаткам и отгрузкам.' },
  { t: '17 видов упаковки', d: 'Плёнки, гофротара, поддоны, барабаны, расходники и метизы у одного поставщика.' },
];

export default function PartnersPage() {
  return (
    <section className="wrap pb-24 pt-10">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 className="text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.03em]">Дилерам и оптовым покупателям</h1>
          <p className="mt-5 max-w-[48ch] text-[18px] text-ink-soft">
            Работаем с компаниями, которые перепродают упаковку. Оставьте контакты, и менеджер расскажет об условиях партнёрства.
          </p>
          <div className="mt-8 max-w-[40rem]"><LeadForm source="dealers" /></div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
          {TERMS.map((x) => (
            <li key={x.t} className="rounded-[var(--radius-card)] bg-surface p-6 shadow-[0_1px_0_var(--color-line)]">
              <p className="font-display text-[17px] font-semibold">{x.t}</p>
              <p className="mt-2 text-ink-soft">{x.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
