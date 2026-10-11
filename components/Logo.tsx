// ВРЕМЕННО: знак воссоздан по скриншоту старого сайта. Заменить на вектор заказчика (бриф, «нужно от заказчика»).
export function LogoMark({ className = '', color = 'var(--color-lime)' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 190 128" className={className} aria-hidden="true" focusable="false">
      <polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill={color} />
      <rect x="0" y="105" width="190" height="23" fill={color} />
    </svg>
  );
}

export function Logo({ tone = 'dark', compact = false, onLime = false }: { tone?: 'dark' | 'light'; compact?: boolean; onLime?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-[26px] w-auto shrink-0" color={onLime ? 'var(--color-ink)' : 'var(--color-lime)'} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[23px] font-semibold tracking-[-0.02em] ${tone === 'light' ? 'text-white' : 'text-ink'}`}
        >
          kaspack
        </span>
        {!compact && (
          <span className={`mt-1 hidden text-[11px] font-medium sm:block ${tone === 'light' ? 'text-graphite-soft' : 'text-ink-mute'}`}>
            Производство промышленной упаковки
          </span>
        )}
      </span>
    </span>
  );
}
