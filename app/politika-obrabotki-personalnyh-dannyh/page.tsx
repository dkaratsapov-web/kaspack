import type { Metadata } from 'next';
import { company } from '@/lib/content';

export const metadata: Metadata = { title: 'Политика обработки персональных данных — Kaspack', robots: { index: false } };

// ШАБЛОН: текст политики должен утвердить юрист заказчика (152-ФЗ). Здесь структура и обязательные разделы.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[760px] px-5 pb-24 pt-10 md:px-8">
      <h1 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">Политика обработки персональных данных</h1>
      <p className="mt-4 rounded-[12px] bg-lime/40 p-4 text-[15px]">Черновик для согласования с юристом. Не является окончательной редакцией.</p>
      <div className="mt-8 grid gap-6 text-ink-soft [&_h2]:font-display [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-ink">
        <section><h2>1. Оператор</h2><p>{company.legalName}, ИНН {company.inn}, ОГРН {company.ogrn}. Контакт по вопросам персональных данных: {company.email}.</p></section>
        <section><h2>2. Какие данные мы обрабатываем</h2><p>Имя, номер телефона, а также сведения о заказе, которые вы указываете в формах сайта.</p></section>
        <section><h2>3. Цели обработки</h2><p>Обратная связь по заявке, расчёт стоимости и заключение договора поставки.</p></section>
        <section><h2>4. Правовое основание</h2><p>Согласие субъекта персональных данных, которое вы даёте, отмечая соответствующее поле в форме.</p></section>
        <section><h2>5. Хранение и защита</h2><p>Данные обрабатываются и хранятся на серверах, расположенных на территории Российской Федерации.</p></section>
        <section><h2>6. Отзыв согласия</h2><p>Вы можете отозвать согласие, написав на {company.email}.</p></section>
      </div>
    </article>
  );
}
