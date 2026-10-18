// «По всей России»: маршруты со склада в Твери. Города — по реальным координатам в конической проекции
// Ламберта (как на картах России), без контура страны: только точки и дуги. Дуги прорисовываются со скроллом
// (CSS scroll-driven, без JS); без поддержки или при «уменьшить движение» карта показана целиком.
// Города — крупные узлы для наглядности масштаба, а не список обязательств по доставке.

const DEG = Math.PI / 180;
const P1 = 52 * DEG, P2 = 64 * DEG, P0 = 58 * DEG, L0 = 90 * DEG;
const n = Math.log(Math.cos(P1) / Math.cos(P2)) / Math.log(Math.tan(Math.PI / 4 + P2 / 2) / Math.tan(Math.PI / 4 + P1 / 2));
const F = (Math.cos(P1) * Math.pow(Math.tan(Math.PI / 4 + P1 / 2), n)) / n;
const rho = (lat: number) => F / Math.pow(Math.tan(Math.PI / 4 + (lat * DEG) / 2), n);
const RHO0 = rho(P0 / DEG);
function project(lon: number, lat: number) {
  const r = rho(lat), t = n * (lon * DEG - L0);
  return { x: r * Math.sin(t), y: RHO0 - r * Math.cos(t) };
}

type City = { name: string; lon: number; lat: number; label?: 'top' | 'bottom' | 'left' | 'right' };
const HUB: City = { name: 'Тверь', lon: 35.9, lat: 56.86 };
const CITIES: City[] = [
  { name: 'Санкт-Петербург', lon: 30.3, lat: 59.94, label: 'top' },
  { name: 'Москва', lon: 37.62, lat: 55.75, label: 'bottom' },
  { name: 'Калининград', lon: 20.5, lat: 54.71, label: 'left' },
  { name: 'Мурманск', lon: 33.08, lat: 68.97, label: 'top' },
  { name: 'Архангельск', lon: 40.54, lat: 64.54, label: 'top' },
  { name: 'Краснодар', lon: 38.97, lat: 45.04, label: 'bottom' },
  { name: 'Ростов-на-Дону', lon: 39.72, lat: 47.22 },
  { name: 'Нижний Новгород', lon: 44.0, lat: 56.33 },
  { name: 'Казань', lon: 49.11, lat: 55.8, label: 'top' },
  { name: 'Самара', lon: 50.1, lat: 53.2, label: 'bottom' },
  { name: 'Екатеринбург', lon: 60.6, lat: 56.84, label: 'top' },
  { name: 'Омск', lon: 73.37, lat: 54.98 },
  { name: 'Новосибирск', lon: 82.92, lat: 55.03, label: 'bottom' },
  { name: 'Красноярск', lon: 92.87, lat: 56.01, label: 'top' },
  { name: 'Иркутск', lon: 104.28, lat: 52.29, label: 'bottom' },
  { name: 'Якутск', lon: 129.73, lat: 62.03, label: 'top' },
  { name: 'Хабаровск', lon: 135.07, lat: 48.48, label: 'top' },
  { name: 'Владивосток', lon: 131.89, lat: 43.12, label: 'bottom' },
];
const LABELED = new Set(['Санкт-Петербург', 'Калининград', 'Мурманск', 'Краснодар', 'Казань', 'Екатеринбург', 'Новосибирск', 'Красноярск', 'Иркутск', 'Якутск', 'Владивосток']);

// вписываем проекцию в viewBox 1000 × 440 с полями
const W = 1000, H = 440, PAD = 40;
const raw = [HUB, ...CITIES].map((c) => project(c.lon, c.lat));
const minX = Math.min(...raw.map((p) => p.x)), maxX = Math.max(...raw.map((p) => p.x));
const minY = Math.min(...raw.map((p) => p.y)), maxY = Math.max(...raw.map((p) => p.y));
const k = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
const offX = (W - (maxX - minX) * k) / 2, offY = (H - (maxY - minY) * k) / 2;
const toView = (c: City) => {
  const p = project(c.lon, c.lat);
  return { x: offX + (p.x - minX) * k, y: H - (offY + (p.y - minY) * k) };
};

const hub = toView(HUB);
const routes = CITIES.map((c, i) => {
  const p = toView(c);
  const dx = p.x - hub.x, dy = p.y - hub.y;
  const len = Math.hypot(dx, dy);
  // дуга выгибается «вверх» относительно направления — как маршрут на карте авиалиний
  const bend = Math.min(90, len * 0.22) * (dx >= 0 ? -1 : 1);
  const cx = hub.x + dx / 2 + (-dy / len) * bend, cy = hub.y + dy / 2 + (dx / len) * bend;
  return { ...c, ...p, d: `M${hub.x.toFixed(1)} ${hub.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, i, len };
}).sort((a, b) => a.len - b.len);

const LABEL_OFFSET: Record<NonNullable<City['label']>, [number, number, 'start' | 'middle' | 'end']> = {
  top: [0, -14, 'middle'], bottom: [0, 24, 'middle'], left: [-12, 5, 'end'], right: [12, 5, 'start'],
};

export function RouteMap() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="route-map h-auto w-full overflow-visible" aria-hidden="true">
      {routes.map((r, idx) => (
        <path key={r.name} d={r.d} pathLength={1} className="route-arc" style={{ ['--i' as string]: idx }} />
      ))}
      {routes.map((r, idx) => {
        const [lx, ly, anchor] = LABEL_OFFSET[r.label ?? 'top'];
        return (
          <g key={r.name} className="route-city" style={{ ['--i' as string]: idx }}>
            <circle cx={r.x} cy={r.y} r={4} className="fill-lime" />
            <circle cx={r.x} cy={r.y} r={9} className="fill-lime/15" />
            {LABELED.has(r.name) && (
              <text x={r.x + lx} y={r.y + ly} textAnchor={anchor} className="fill-white/75 text-[13px] font-medium">{r.name}</text>
            )}
          </g>
        );
      })}
      {/* склад: пульсирующее кольцо */}
      <circle cx={hub.x} cy={hub.y} r={18} className="route-hub-pulse fill-none stroke-lime" />
      <circle cx={hub.x} cy={hub.y} r={7} className="fill-lime" />
      <text x={hub.x - 14} y={hub.y - 16} textAnchor="end" className="fill-lime font-display text-[15px] font-bold">Тверь · склад</text>
    </svg>
  );
}
