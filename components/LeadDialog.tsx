'use client';

import { useEffect, useRef, useState } from 'react';
import type { LeadDialogOptions } from '@/lib/leadDialog';
import { LeadForm } from './LeadForm';
import { LogoMark } from './Logo';

// Поп-ап заявки на нативном <dialog>: ловушка фокуса, Esc, инертный фон и top-layer из коробки.
export function LeadDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [opts, setOpts] = useState<LeadDialogOptions>({ source: 'popup' });
  const [key, setKey] = useState(0);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpts((e as CustomEvent<LeadDialogOptions>).detail);
      setKey((k) => k + 1); // свежая форма при каждом открытии
      ref.current?.showModal();
      document.documentElement.style.overflow = 'hidden';
    };
    const dlg = ref.current;
    const onClose = () => { document.documentElement.style.overflow = ''; };
    window.addEventListener('kp:lead', onOpen);
    dlg?.addEventListener('close', onClose);
    return () => { window.removeEventListener('kp:lead', onOpen); dlg?.removeEventListener('close', onClose); };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="lead-dialog-title"
      className="lead-dialog m-auto w-[min(560px,calc(100vw-24px))] overflow-visible bg-transparent p-0 backdrop:bg-[rgb(22_24_28/0.62)] backdrop:backdrop-blur-sm"
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
    >
      <div className="relative overflow-hidden rounded-[28px] bg-canvas p-6 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)] md:p-9">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-lime/70 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-6">
            <LogoMark className="h-7 w-auto" color="var(--color-ink)" />
            <button type="button" onClick={() => ref.current?.close()} aria-label="Закрыть" className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-ink/15 transition-colors hover:bg-ink hover:text-white">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" /></svg>
            </button>
          </div>
          <h2 id="lead-dialog-title" className="mt-6 font-display text-[clamp(1.7rem,4vw,2.4rem)] font-bold leading-[1.02] tracking-[-0.04em]">
            {opts.title ?? 'Рассчитать заказ'}
          </h2>
          <p className="mt-3 text-ink-soft">
            {opts.product ? `${opts.product}. ` : ''}Оставьте телефон: менеджер подберёт упаковку и пришлёт стоимость с доставкой.
          </p>
          <div className="mt-6">
            <LeadForm key={key} source={opts.source} product={opts.product} layout="stack" />
          </div>
        </div>
      </div>
    </dialog>
  );
}
