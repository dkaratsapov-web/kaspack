// Общее состояние сцены «первый экран → каталог» (десктоп с WebGL). Пишет HeroCatalogStage, уже сглаженное по времени.
// q — фаза раскрытия груза и передачи товаров 0…1; c — прогресс ленты каталога 0…1.
// cam и cartons пишет сцена груза каждый кадр — по ним слой товаров повторяет её камеру.
// renderers — 3D-слои, которые сцена рисует сама в своём единственном цикле кадров (после записи q),
// поэтому DOM и оба canvas всегда показывают один и тот же момент.
// Без React-рендеров и без three.js в основном бандле.
export const heroProgress = {
  q: 0,
  c: 0,
  trackX: 0,
  cam: { pos: [0, 1.2, 5], quat: [0, 0, 0, 1], fov: 26, dist: 5, ready: false },
  cartons: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] as number[][],
  onConveyor: null as null | ((c: number, distance: number) => void),
  renderers: new Set<(seconds: number) => void>(),
};

/** Сколько первых товаров каталога вылетает из груза и садится в свои карточки. */
export const HANDOFF_COUNT = 6;
