import { FilmShader } from '../backgrounds/FilmShader';
import { RouteMap } from '../backgrounds/RouteMap';

const POINTS = [
  { title: 'Свой автопарк', text: 'Возим сами, без транспортных компаний и перегрузов.' },
  { title: 'Вся Россия', text: 'Отгружаем со склада в Твери в любой регион.' },
  { title: 'Одной машиной', text: 'Плёнка, короба, поддоны и расходники приезжают вместе.' },
];

// Доставка v3: графитовое поле, гигантские слова и карта маршрутов со склада в Твери (вместо 3D-фуры).
export function Delivery() {
  return (
    <section id="delivery" aria-labelledby="delivery-title" className="chapter field-graphite on-dark isolate overflow-hidden">
      <FilmShader />
      <div className="wrap pt-24 md:pt-32">
        <h2 id="delivery-title" className="giant relative z-0 text-center text-[clamp(3rem,11vw,12.5rem)] text-lime">
          <span className="block">По всей</span>
          <span className="block">России</span>
        </h2>
      </div>
      {/* маршруты со склада: дуги прорисовываются со скроллом */}
      <div className="wrap relative z-10 mt-[clamp(1.5rem,4vw,4rem)] mb-[clamp(2rem,4vw,4rem)]">
        <RouteMap />
      </div>
      <div className="wrap relative z-20 pb-24 md:pb-32">
        <ul className="grid gap-8 border-t border-white/15 pt-8 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="reveal">
              <p className="font-display text-[clamp(1.3rem,2vw,1.9rem)] font-bold tracking-[-0.03em] text-white">{p.title}</p>
              <p className="mt-2 max-w-[34ch] text-[17px] text-graphite-soft">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
