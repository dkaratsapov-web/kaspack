// Светлые поля: крупные контуры шевронов плывут с разной скоростью при скролле (три плана глубины).
const SHAPES = [
  { cls: 'left-[-6%] top-[8%] w-[38vw] depth-1', stroke: 2 },
  { cls: 'right-[-10%] top-[40%] w-[52vw] depth-2', stroke: 1.4 },
  { cls: 'left-[30%] bottom-[-8%] w-[26vw] depth-3', stroke: 2.4 },
];

export function BoneDrift() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {SHAPES.map((s) => (
        <svg key={s.cls} viewBox="-10 -10 210 108" className={`absolute ${s.cls} text-ink/[0.06]`}>
          <polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="none" stroke="currentColor" strokeWidth={s.stroke} vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </div>
  );
}
