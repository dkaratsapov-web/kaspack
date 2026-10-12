// УТП первого экрана с анимированными иконками (cg-web-animate: ambient-петли, только transform/opacity,
// 6–9 с, разная фаза — не синхронно; при reduced motion — статика). Только подтверждённые факты.
const ITEMS = [
  {
    title: '6 производств',
    text: 'плёнка, гофра, поддоны, гранулы, этикетки, метизы',
    icon: (
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M6 42V22l10 6v-6l10 6v-6l10 6V10h6v32z" />
        <path d="M12 36h4M20 36h4M28 36h4" />
        <circle className="usp-smoke" cx="39" cy="6" r="2.4" fill="currentColor" stroke="none" />
        <circle className="usp-smoke usp-smoke-2" cx="41" cy="4" r="1.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Свой автопарк',
    text: 'возим сами по всей России',
    icon: (
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <g className="usp-truck">
          <path d="M4 12h24v20H4zM28 20h8l6 6v6H28z" />
          <circle cx="12" cy="35" r="3.5" fill="var(--color-lime)" />
          <circle cx="34" cy="35" r="3.5" fill="var(--color-lime)" />
        </g>
        <path className="usp-road" d="M2 44h44" strokeDasharray="6 5" />
      </svg>
    ),
  },
  {
    title: 'Ответ за 15 минут',
    text: 'Пн–Пт, 9:00–18:00 МСК',
    icon: (
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="24" cy="25" r="17" />
        <path d="M20 4h8" />
        <path className="usp-hand-m" d="M24 25V14" />
        <path className="usp-hand-h" d="M24 25h7" />
      </svg>
    ),
  },
  {
    title: 'Любой объём',
    text: 'от рулона до регулярных поставок',
    icon: (
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M6 30h16v14H6zM26 30h16v14H26z" />
        <path className="usp-box" d="M16 10h16v14H16z" />
        <path d="M14 37h0M34 37h0" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function HeroUsp() {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
      {ITEMS.map((it, i) => (
        <li key={it.title} className="fade-in flex flex-col gap-2.5" style={{ ['--d' as string]: `${500 + i * 90}ms` }}>
          <span className="usp-icon h-11 w-11 text-ink" aria-hidden="true" style={{ ['--i' as string]: i }}>{it.icon}</span>
          <span className="font-display text-[16px] font-bold leading-tight tracking-[-0.02em]">{it.title}</span>
          <span className="-mt-1 text-[14px] leading-snug text-ink/70">{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
