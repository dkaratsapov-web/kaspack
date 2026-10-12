// Лаймовое поле: шевроны из знака логотипа и ливреи фуры, тон в тон (motion-background: CSS, без JS).
// Внешний слой — параллакс от скролла (scroll-driven), внутренний — медленный бесшовный дрейф.
const chevronTile = (color: string) =>
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='96' viewBox='0 0 120 96'><polygon points='10,18 60,49 110,18 110,32 60,63 10,32' fill='${color}'/></svg>`,
  );

export function ChevronField({ color = '#a9d10f', fade = 'var(--color-lime)' }: { color?: string; fade?: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="bg-parallax absolute -inset-y-[20%] inset-x-0">
        <div
          className="chevron-drift absolute inset-0 opacity-70"
          style={{ backgroundImage: `url("data:image/svg+xml,${chevronTile(color)}")`, backgroundSize: '120px 96px' }}
        />
      </div>
      {/* мягкое затемнение к центру: узор читается по краям, текст остаётся чистым */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 35% 45%, ${fade} 35%, transparent 80%)` }} />
    </div>
  );
}
