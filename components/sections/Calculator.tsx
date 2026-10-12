'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { categories, company, salesStatus } from '@/lib/content';
import { leadEndpoint } from '@/lib/env';
import { formatPhone, submitLead } from '@/lib/lead';

// Калькулятор (бриф, решение 6): товары чипами + объём + имя + телефон. Все CTA сайта ведут сюда (#calc).
export function Calculator() {
  const id = useId();
  const [picked, setPicked] = useState<string[]>([]);
  const [volume, setVolume] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [sla, setSla] = useState('Перезвоним за 15 минут');
  useEffect(() => setSla(salesStatus().text), []);

  const digits = phone.replace(/\D/g, '');
  const err = {
    name: name.trim().length < 2 ? 'Укажите имя' : '',
    phone: digits.length !== 11 ? 'Введите телефон: 10 цифр после +7' : '',
    consent: !consent ? 'Нужно согласие на обработку данных' : '',
  };
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (err.name || err.phone || err.consent) return;
    setStatus('sending');
    const fd = new FormData(e.currentTarget);
    try {
      await submitLead({
        name: name.trim(), phone: '+' + digits, consent, source: 'calc', website: String(fd.get('website') ?? ''),
        products: picked.map((s) => categories.find((c) => c.slug === s)?.title ?? s), volume: volume.trim(),
      });
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="calc" aria-labelledby="calc-title" className="wrap py-24 md:py-32">
      <div className="grid gap-10 rounded-[28px] bg-surface p-6 shadow-[0_1px_0_var(--color-line),0_30px_60px_-40px_rgb(24_27_33/0.35)] md:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
        <div className="lg:col-span-4">
          <h2 id="calc-title" className="title text-[clamp(2.2rem,3.4vw,3.6rem)]">
            Рассчитать заказ
          </h2>
          <p className="mt-5 max-w-[38ch] text-ink-soft">
            Отметьте товары и примерный объём. Менеджер посчитает стоимость и сроки с доставкой.
          </p>
          <div className="mt-8 rounded-[var(--radius-card)] bg-lime p-5 text-ink">
            <p className="font-display text-[22px] font-semibold tracking-[-0.02em]">{company.responseMinutes} минут</p>
            <p className="mt-1 text-[15px] leading-snug">
              время ответа в рабочие часы: <span className="whitespace-nowrap">{company.hours.days}, {company.hours.from}:00–{company.hours.to}:00 {company.hours.tz}</span>
            </p>
          </div>
          <p className="mt-6 text-[15px] text-ink-soft">
            Удобнее позвонить?{' '}
            <a href={company.phoneHref} className="font-semibold text-ink tabular underline decoration-ink/30 underline-offset-4" data-goal="tel_click">{company.phone}</a>
            <br />
            Или напишите в{' '}
            <a href={company.whatsappHref} className="font-semibold text-ink underline decoration-ink/30 underline-offset-4" data-goal="wa_click" target="_blank" rel="noopener">WhatsApp</a>
          </p>
        </div>

        <div className="lg:col-span-8">
          {status === 'ok' ? (
            <div role="status" className="flex h-full flex-col justify-center rounded-[var(--radius-card)] bg-canvas p-8">
              <p className="font-display text-2xl font-semibold">Заявка принята</p>
              <p className="mt-2 max-w-[48ch] text-ink-soft">{sla}. Менеджер уточнит детали и пришлёт расчёт.</p>
              {!leadEndpoint && <p className="mt-3 text-sm text-ink-mute">Это превью сайта: заявка никуда не отправлена.</p>}
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>Сайт <input name="website" aria-label="Не заполняйте это поле" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <fieldset>
                <legend className="text-[15px] font-semibold">Что нужно</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = picked.includes(c.slug);
                    return (
                      <label key={c.slug} className={`chip ${on ? 'chip-on' : ''}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.slug)} />
                        {c.title}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                  <label htmlFor={`${id}-vol`} className="text-[15px] font-semibold">Объём <span className="font-normal text-ink-mute">(необязательно)</span></label>
                  <input id={`${id}-vol`} className="field mt-2" placeholder="Например: 200 рулонов стрейча в месяц" value={volume} onChange={(e) => setVolume(e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`${id}-name`} className="text-[15px] font-semibold">Имя</label>
                  <input id={`${id}-name`} className="field mt-2" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={touched && !!err.name} />
                  {touched && err.name && <p className="mt-1.5 text-sm text-danger">{err.name}</p>}
                </div>
                <div>
                  <label htmlFor={`${id}-phone`} className="text-[15px] font-semibold">Телефон</label>
                  <input
                    id={`${id}-phone`} className="field tabular mt-2" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__"
                    value={phone} onFocus={() => !phone && setPhone('+7')} onChange={(e) => setPhone(formatPhone(e.target.value))} aria-invalid={touched && !!err.phone}
                  />
                  {touched && err.phone && <p className="mt-1.5 text-sm text-danger">{err.phone}</p>}
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn btn-primary w-full" disabled={status === 'sending'} data-goal="cta_calc">
                    {status === 'sending' ? 'Отправляем…' : 'Получить расчёт'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 text-[13px] text-ink-soft sm:flex-row sm:items-start sm:justify-between">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--color-ink)]" aria-invalid={touched && !!err.consent} />
                  <span>
                    Согласен на <Link href="/politika-obrabotki-personalnyh-dannyh" className="underline decoration-ink/30 underline-offset-2">обработку персональных данных</Link>
                    {touched && err.consent && <span className="block text-danger">{err.consent}</span>}
                  </span>
                </label>
                <p className="flex items-center gap-2 font-medium text-ink">
                  <span className="h-2 w-2 rounded-full bg-lime-ink" aria-hidden="true" />{sla}
                </p>
              </div>
              {status === 'error' && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  Не удалось отправить. Позвоните: <a className="underline" href={company.phoneHref}>{company.phone}</a>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
