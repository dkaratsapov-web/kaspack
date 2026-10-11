import { company } from '@/lib/content';

const mapQuery = encodeURIComponent(company.address);

export function Contacts() {
  return (
    <section id="contacts" aria-labelledby="contacts-title" className="mx-auto max-w-[1360px] px-5 pb-24 md:px-8 md:pb-32">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="reveal rounded-[24px] bg-surface p-8 shadow-[0_1px_0_var(--color-line)] md:p-10 lg:col-span-5">
          <h2 id="contacts-title" className="title">Контакты</h2>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="text-[14px] text-ink-mute">Телефон, WhatsApp</dt>
              <dd className="mt-1"><a href={company.phoneHref} className="font-display text-[22px] font-semibold tracking-[-0.02em] tabular" data-goal="tel_click">{company.phone}</a></dd>
            </div>
            <div>
              <dt className="text-[14px] text-ink-mute">Почта</dt>
              <dd className="mt-1"><a href={`mailto:${company.email}`} className="text-[18px] font-semibold" data-goal="mail_click">{company.email}</a></dd>
            </div>
            <div>
              <dt className="text-[14px] text-ink-mute">Производство и склад</dt>
              <dd className="mt-1 text-[17px]">{company.address}</dd>
            </div>
            <div>
              <dt className="text-[14px] text-ink-mute">Отдел продаж</dt>
              <dd className="mt-1 text-[17px]">{company.hours.days}, {company.hours.from}:00–{company.hours.to}:00 {company.hours.tz}</dd>
            </div>
          </dl>
          <p className="mt-8 border-t border-line pt-6 text-[14px] leading-relaxed text-ink-soft">
            {company.legalName} · ИНН {company.inn} · ОГРН {company.ogrn}
          </p>
        </div>
        <div className="reveal relative min-h-[360px] overflow-hidden rounded-[24px] bg-surface-2 lg:col-span-7">
          <iframe
            title={`Карта: ${company.address}`}
            src={`https://yandex.ru/map-widget/v1/?text=${mapQuery}&z=15`}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0 grayscale-[35%]"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://yandex.ru/maps/?text=${mapQuery}`}
            target="_blank"
            rel="noopener"
            className="btn btn-dark absolute bottom-4 left-4 !min-h-[44px]"
          >
            Открыть в Яндекс Картах
          </a>
        </div>
      </div>
    </section>
  );
}
