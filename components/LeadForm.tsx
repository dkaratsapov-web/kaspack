'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { salesStatus } from '@/lib/content';
import { leadEndpoint } from '@/lib/env';
import { formatPhone, submitLead } from '@/lib/lead';

type Status = 'idle' | 'sending' | 'ok' | 'error';

// Короткая форма (бриф, решение 6): имя + телефон + согласие. Ошибки при уходе с поля.
export function LeadForm({ source, layout = 'inline', product }: { source: string; layout?: 'inline' | 'stack'; product?: string }) {
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [sla, setSla] = useState<string>('Перезвоним за 15 минут');

  useEffect(() => setSla(salesStatus().text), []);

  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {
    name: name.trim().length < 2 ? 'Укажите имя, чтобы менеджер знал, как к вам обращаться' : '',
    phone: phoneDigits.length !== 11 ? 'Введите телефон: 10 цифр после +7' : '',
    consent: !consent ? 'Нужно согласие на обработку данных' : '',
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ name: true, phone: true, consent: true });
    if (errors.name || errors.phone || errors.consent) return;
    setStatus('sending');
    const fd = new FormData(e.currentTarget);
    try {
      await submitLead({ name: name.trim(), phone: '+' + phoneDigits, consent, source, website: String(fd.get('website') ?? ''), products: product ? [product] : undefined });
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <div role="status" className="rounded-[var(--radius-card)] bg-surface p-5 shadow-[0_1px_0_var(--color-line)]">
        <p className="font-display text-lg">Заявка принята</p>
        <p className="mt-1 text-ink-soft">{sla}. Менеджер подберёт упаковку и пришлёт расчёт.</p>
        {!leadEndpoint && (
          <p className="mt-2 text-sm text-ink-mute">Это превью сайта: заявка никуда не отправлена.</p>
        )}
      </div>
    );
  }

  const inline = layout === 'inline';
  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${id}-sla`}>
      {/* honeypot для ботов */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Сайт <input name="website" aria-label="Не заполняйте это поле" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className={inline ? 'grid gap-3 sm:grid-cols-[1fr_1.1fr_auto]' : 'grid gap-3'}>
        <div>
          <label htmlFor={`${id}-name`} className="sr-only">Имя</label>
          <input
            id={`${id}-name`} className="field" placeholder="Имя" autoComplete="name" value={name}
            onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={!!show('name')} aria-describedby={show('name') ? `${id}-name-err` : undefined}
          />
          {show('name') && <p id={`${id}-name-err`} className="mt-1.5 text-sm text-danger">{show('name')}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="sr-only">Телефон</label>
          <input
            id={`${id}-phone`} className="field tabular" placeholder="+7 (___) ___-__-__" type="tel" inputMode="tel"
            autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
            onFocus={() => !phone && setPhone('+7')} onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            aria-invalid={!!show('phone')} aria-describedby={show('phone') ? `${id}-phone-err` : undefined}
          />
          {show('phone') && <p id={`${id}-phone-err`} className="mt-1.5 text-sm text-danger">{show('phone')}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'} data-goal={`cta_${source}`}>
          {status === 'sending' ? 'Отправляем…' : 'Получить расчёт'}
          <svg className="chev h-3 w-4" viewBox="0 0 190 88" aria-hidden="true"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-[13px] leading-snug text-ink-soft sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            onBlur={() => setTouched((t) => ({ ...t, consent: true }))}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--color-ink)]" aria-invalid={!!show('consent')}
          />
          <span>
            Согласен на <Link href="/politika-obrabotki-personalnyh-dannyh" className="underline decoration-ink/30 underline-offset-2">обработку персональных данных</Link>
            {show('consent') && <span className="block text-danger">{show('consent')}</span>}
          </span>
        </label>
        <p id={`${id}-sla`} className="flex shrink-0 items-center gap-2 font-medium text-ink">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-ink" aria-hidden="true" />
          {sla}
        </p>
      </div>
      {status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Не удалось отправить заявку. Позвоните нам: <a className="underline" href="tel:+78005504008">+7 (800) 550-40-08</a>
        </p>
      )}
    </form>
  );
}
