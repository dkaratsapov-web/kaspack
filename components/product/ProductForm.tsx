'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { salesStatus } from '@/lib/content';
import { leadEndpoint } from '@/lib/env';
import { formatPhone, submitLead } from '@/lib/lead';
import type { FormField } from '@/lib/products';

type Status = 'idle' | 'sending' | 'ok' | 'error';
type Values = Record<string, string | string[]>;

/*
 * Гибкая форма заявки под товар (form-cro): поля задаёт конфиг страницы.
 * Обязательны только имя, телефон и согласие — всё про товар необязательно и выбирается в один тап (чипы),
 * поэтому форма не отпугивает, а менеджер получает готовые параметры для расчёта.
 */
export function ProductForm({ product, source, fields }: { product: string; source: string; fields: FormField[] }) {
  const id = useId();
  const [values, setValues] = useState<Values>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [sla, setSla] = useState('Перезвоним за 15 минут');

  useEffect(() => setSla(salesStatus().text), []);

  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {
    name: name.trim().length < 2 ? 'Укажите имя, чтобы менеджер знал, как к вам обращаться' : '',
    phone: phoneDigits.length !== 11 ? 'Введите телефон: 10 цифр после +7' : '',
    consent: !consent ? 'Нужно согласие на обработку данных' : '',
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '');

  const toggle = (f: Extract<FormField, { kind: 'chips' }>, option: string) => {
    setValues((v) => {
      const cur = v[f.id];
      if (f.multiple) {
        const list = Array.isArray(cur) ? cur : [];
        return { ...v, [f.id]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option] };
      }
      return { ...v, [f.id]: cur === option ? '' : option };
    });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ name: true, phone: true, consent: true });
    if (errors.name || errors.phone || errors.consent) return;
    setStatus('sending');
    const fd = new FormData(e.currentTarget);
    // параметры товара — парами «подпись: значение», комментарий отдельно
    const details: [string, string][] = [];
    let comment = '';
    for (const f of fields) {
      const v = values[f.id];
      const text = Array.isArray(v) ? v.join(', ') : (v ?? '').trim();
      if (!text) continue;
      if (f.kind === 'textarea') { comment = text; continue; }
      const unit = f.kind === 'number' ? (f.units ? units[f.id] ?? f.units[0] : f.unit ?? '') : '';
      details.push([f.label, unit ? `${text} ${unit}` : text]);
    }
    try {
      await submitLead({
        name: name.trim(), phone: '+' + phoneDigits, consent, source, website: String(fd.get('website') ?? ''),
        products: [product], details, comment,
      });
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <div role="status" className="rounded-[20px] bg-surface p-6">
        <p className="font-display text-xl font-bold tracking-[-0.02em]">Заявка принята</p>
        <p className="mt-2 text-ink-soft">{sla}. Менеджер посчитает {product.toLowerCase()} с доставкой и перезвонит.</p>
        {!leadEndpoint && <p className="mt-2 text-sm text-ink-mute">Это превью сайта: заявка никуда не отправлена.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${id}-sla`} className="grid gap-5">
      {/* honeypot для ботов */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Сайт <input name="website" aria-label="Не заполняйте это поле" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {/* поля товара в две колонки: короткие парами, текст и широкие (wide) на всю строку */}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {fields.map((f) => {
        const fid = `${id}-${f.id}`;
        const span = f.wide || f.kind === 'textarea' ? 'sm:col-span-2' : '';
        if (f.kind === 'chips') {
          const cur = values[f.id];
          return (
            <fieldset key={f.id} className={`min-w-0 ${span}`}>
              <legend className="mb-2 text-[14px] font-semibold text-ink">{f.label}{f.hint && <span className="ml-2 font-normal text-ink-mute">{f.hint}</span>}</legend>
              <div className="flex flex-wrap gap-1.5">
                {f.options.map((o) => {
                  const on = Array.isArray(cur) ? cur.includes(o) : cur === o;
                  return (
                    <label key={o} className={`chip px-3 ${on ? 'chip-on' : ''}`}>
                      <input
                        type={f.multiple ? 'checkbox' : 'radio'} name={fid} value={o} checked={on}
                        onChange={() => toggle(f, o)} onClick={() => { if (!f.multiple && on) toggle(f, o); }}
                        className="sr-only"
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        }
        if (f.kind === 'number') {
          return (
            <div key={f.id} className={`min-w-0 ${span}`}>
              <label htmlFor={fid} className="mb-2 block text-[14px] font-semibold text-ink">{f.label}{f.hint && <span className="ml-2 font-normal text-ink-mute">{f.hint}</span>}</label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    id={fid} className="field tabular pr-12" inputMode="numeric" placeholder={f.placeholder}
                    value={(values[f.id] as string) ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 7) }))}
                  />
                  {f.unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-ink-mute">{f.unit}</span>}
                </div>
                {f.units && (
                  <div className="flex shrink-0 gap-2" role="group" aria-label={`${f.label}: единица`}>
                    {f.units.map((u) => {
                      const on = (units[f.id] ?? f.units![0]) === u;
                      return (
                        <button key={u} type="button" aria-pressed={on} onClick={() => setUnits((x) => ({ ...x, [f.id]: u }))} className={`chip px-3 ${on ? 'chip-on' : ''}`}>{u}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={f.id} className={`min-w-0 ${span}`}>
            <label htmlFor={fid} className="mb-2 block text-[14px] font-semibold text-ink">{f.label} <span className="font-normal text-ink-mute">(необязательно)</span></label>
            {f.kind === 'textarea' ? (
              <textarea id={fid} rows={2} className="field min-h-[84px] resize-y py-3" placeholder={f.placeholder} value={(values[f.id] as string) ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value.slice(0, 600) }))} />
            ) : (
              <input id={fid} className="field" placeholder={f.placeholder} value={(values[f.id] as string) ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value.slice(0, 200) }))} />
            )}
          </div>
        );
      })}
      </div>

      <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
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
        <button type="submit" className="btn btn-primary sm:col-span-2" disabled={status === 'sending'} data-goal={`cta_${source}`}>
          {status === 'sending' ? 'Отправляем…' : 'Получить расчёт'}
          <svg className="chev h-3 w-4" viewBox="0 0 190 88" aria-hidden="true"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
        </button>
      </div>

      <div className="flex flex-col gap-2 text-[13px] leading-snug text-ink-soft">
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
        <p id={`${id}-sla`} className="flex items-center gap-2 font-medium text-ink">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-ink" aria-hidden="true" />
          {sla}
        </p>
      </div>
      {status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          Не удалось отправить заявку. Позвоните нам: <a className="underline" href="tel:+78005504008">+7 (800) 550-40-08</a>
        </p>
      )}
    </form>
  );
}
