// Крафтовое поле: гофрослой (волны между лайнерами) и волокна картона; параллакс от скролла.
const FLUTE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='40' viewBox='0 0 64 40'><path d='M0 20 C 8 4, 24 4, 32 20 S 56 36, 64 20' fill='none' stroke='#2a1f14' stroke-opacity='.10' stroke-width='2'/><path d='M0 2 H64 M0 38 H64' stroke='#2a1f14' stroke-opacity='.06' stroke-width='2'/></svg>`,
);

export function Corrugation() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="bg-parallax flute-drift absolute -inset-y-[25%] inset-x-0"
        style={{ backgroundImage: `url("data:image/svg+xml,${FLUTE}")`, backgroundSize: '64px 40px' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-kraft)_0%,transparent_22%,transparent_78%,var(--color-kraft)_100%)]" />
    </div>
  );
}
