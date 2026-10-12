// Графитовое поле «Груза в разборе»: инженерный чертёж (motion-background: тихий фон, не спорит с текстом).
// Миллиметровка в две клетки гаснет к краям, мягкий свет за грузом, лёгкий параллакс от скролла.
// Разметочные линии слоёв живут отдельно (explode-guide) и едут вместе со слоями.
export function Blueprint() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(55%_65%_at_62%_48%,rgb(190_234_31/0.08),transparent_72%)]" />
      <div className="blueprint-grid bg-parallax absolute inset-x-0 -inset-y-[12%]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_60%_50%,transparent_45%,rgb(14_16_20/0.8)_100%)]" />
    </div>
  );
}
