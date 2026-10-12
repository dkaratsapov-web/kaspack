'use client';

import { openLead, type LeadDialogOptions } from '@/lib/leadDialog';

// Кнопка-CTA: открывает поп-ап с формой. Без JS остаётся ссылкой на калькулятор (#calc).
export function LeadButton({
  children, className = 'btn btn-primary', onBeforeOpen, ...opts
}: LeadDialogOptions & { children: React.ReactNode; className?: string; onBeforeOpen?: () => void }) {
  return (
    <a
      href="/#calc"
      className={className}
      onClick={(e) => { e.preventDefault(); onBeforeOpen?.(); openLead(opts); }}
      aria-haspopup="dialog"
    >
      {children}
    </a>
  );
}
