import type { ReactNode } from 'react';

/*
 * Линейные иконки 17 категорий (48×48, обводка currentColor 2.2, лаймовые детали — класс ci-accent).
 * Все контуры с pathLength=1: при появлении сетки они прорисовываются линией (cat-grid в globals.css).
 * У каждой иконки своя группа ci-* — её короткое движение при наведении на плитку:
 * короб открывает клапаны, барабан проворачивается, гвоздь забивается и т. д.
 */
const L = { pathLength: 1 } as const;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" className="cat-icon h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, ReactNode> = {
  // рулон стоя + хвост плёнки, который отматывается
  'strejch-plenka': (
    <Svg>
      <path {...L} d="M10 10a8 3 0 0 0 16 0a8 3 0 0 0-16 0z" />
      <path {...L} d="M10 10v27a8 3 0 0 0 16 0V10" />
      <path {...L} d="M15.5 10a2.5 1 0 0 0 5 0a2.5 1 0 0 0-5 0z" className="ci-accent" />
      <g className="ci-unroll"><path {...L} d="M26 15l14 2v19l-14 2" /></g>
    </Svg>
  ),
  // рулон лёжа, по нему пробегает блик
  'bopp-plenka': (
    <Svg>
      <path {...L} d="M12 15h24a5 9 0 0 1 0 18H12" />
      <path {...L} d="M12 15a5 9 0 0 0 0 18a5 9 0 0 0 0-18z" />
      <path {...L} d="M12 20.5a2 3.5 0 0 0 0 7a2 3.5 0 0 0 0-7z" className="ci-accent" />
      <path {...L} d="M20 20h13" className="ci-accent ci-shine" />
    </Svg>
  ),
  // лист с пузырями — пузыри по очереди «вспухают»
  'vozdushno-puzyrchataya-plenka': (
    <Svg>
      <path {...L} d="M6 12h36v24H6z" />
      {[14, 24, 34].flatMap((x, i) => [18, 30].map((y, j) => (
        <circle key={`${x}${y}`} {...L} cx={x} cy={y} r="3.4" className={`ci-bubble ${(i + j) % 2 ? 'ci-accent' : ''}`} style={{ ['--b' as string]: i * 2 + j }} />
      )))}
    </Svg>
  ),
  // рулон и полотно волной
  'plenki-pvd-pnd': (
    <Svg>
      <path {...L} d="M10 8h28a4 4 0 0 1 0 8H10a4 4 0 0 1 0-8z" />
      <path {...L} d="M10 8a4 4 0 0 0 0 8" className="ci-accent" />
      <g className="ci-wave"><path {...L} d="M12 16v22c4-2.5 8 2.5 12 0s8 2.5 12 0V16" /></g>
      <path {...L} d="M18 22v10M30 22v10" className="ci-accent" />
    </Svg>
  ),
  // стопка листов с гофрой на торце — листы ложатся друг на друга
  gofrokarton: (
    <Svg>
      <g className="ci-sheet ci-sheet-3"><path {...L} d="M6 14h36v6H6z" /></g>
      <g className="ci-sheet ci-sheet-2"><path {...L} d="M6 22h36v6H6z" /></g>
      <g className="ci-sheet ci-sheet-1"><path {...L} d="M6 30h36v6H6z" /></g>
      <path {...L} d="M8 33c2-3 4 3 6 0s4 3 6 0 4 3 6 0 4 3 6 0 4 3 6 0" className="ci-accent" />
    </Svg>
  ),
  // короб: клапаны открываются
  gofrotara: (
    <Svg>
      <path {...L} d="M8 20h32v20H8z" />
      <path {...L} d="M20 28h8" className="ci-accent" />
      <g className="ci-flap-l"><path {...L} d="M8 20l-4-8h16l4 8" /></g>
      <g className="ci-flap-r"><path {...L} d="M40 20l4-8H28l-4 8" /></g>
    </Svg>
  ),
  // рулон крафта и лист, который вытягивается
  'kraft-bumaga': (
    <Svg>
      <circle {...L} cx="14" cy="16" r="8" />
      <circle {...L} cx="14" cy="16" r="3" className="ci-accent" />
      <g className="ci-pull"><path {...L} d="M14 24h26v16H20" /></g>
    </Svg>
  ),
  // кассовая лента: чек выезжает из рулона
  'cheki-i-termocheki': (
    <Svg>
      <circle {...L} cx="24" cy="12" r="7" />
      <circle {...L} cx="24" cy="12" r="2.4" className="ci-accent" />
      <g className="ci-receipt">
        <path {...L} d="M16 19v21l2.7-2 2.7 2 2.6-2 2.7 2 2.6-2 2.7 2V19" />
        <path {...L} d="M20 26h8M20 31h6" className="ci-accent" />
      </g>
    </Svg>
  ),
  // поддон: доски и бобышки, при наведении «приседает» под грузом
  'poddony-borta-brus': (
    <Svg>
      <g className="ci-load"><path {...L} d="M14 10h20v10H14z" className="ci-accent" /></g>
      <path {...L} d="M4 22h40M4 27h40" />
      <path {...L} d="M6 27v8h7v-8M20.5 27v8h7v-8M35 27v8h7v-8" />
      <path {...L} d="M4 35h40" />
    </Svg>
  ),
  // барабан с щекой и спицами — проворачивается
  'kabelnye-barabany': (
    <Svg>
      <g className="ci-spin">
        <circle {...L} cx="24" cy="24" r="17" />
        <circle {...L} cx="24" cy="24" r="4" className="ci-accent" />
        <path {...L} d="M24 7v13M24 28v13M7 24h13M28 24h13" />
      </g>
    </Svg>
  ),
  // ящик из реек, фрукты подпрыгивают
  'yashchiki-dlya-produktov': (
    <Svg>
      <circle {...L} cx="18" cy="17" r="5" className="ci-accent ci-fruit" />
      <circle {...L} cx="29" cy="16" r="5" className="ci-accent ci-fruit ci-fruit-2" />
      <path {...L} d="M6 22h36v18H6z" />
      <path {...L} d="M6 28h36M6 34h36" />
    </Svg>
  ),
  // рулон скотча с отмотанной лентой
  skotch: (
    <Svg>
      <g className="ci-spin">
        <circle {...L} cx="20" cy="22" r="13" />
        <circle {...L} cx="20" cy="22" r="6" className="ci-accent" />
      </g>
      <g className="ci-pull"><path {...L} d="M33 22v16h9" /></g>
    </Svg>
  ),
  // бухта ленты и стянутый ею пакет
  'strepping-lenta-i-peht-lenta-zashchitnye-ugolki': (
    <Svg>
      <path {...L} d="M8 14h32v24H8z" />
      <g className="ci-strap"><path {...L} d="M18 10v32M30 10v32" className="ci-accent" /></g>
      <path {...L} d="M8 20l6-6M40 20l-6-6M8 32l6 6M40 32l-6 6" />
    </Svg>
  ),
  // пакет с вырубной ручкой — покачивается
  'pakety-pvd-pnd-psd': (
    <Svg>
      <g className="ci-swing">
        <path {...L} d="M11 8h26l3 32H8z" />
        <path {...L} d="M20 14a4 3 0 0 0 8 0" className="ci-accent" />
        <path {...L} d="M14 30h20" />
      </g>
    </Svg>
  ),
  // сетка-мешок с клипсой — сетка растягивается
  setki: (
    <Svg>
      <path {...L} d="M21 6h6l-1 5h-4z" className="ci-accent" />
      <g className="ci-stretch">
        <path {...L} d="M22 11C10 16 9 34 16 41h16c7-7 6-25-6-30" />
        <path {...L} d="M14 20l18 18M12 30l10 10M20 14l16 16M28 14L13 32M34 20L19 38M37 30l-8 9" />
      </g>
    </Svg>
  ),
  // рабочая перчатка — машет
  perchatki: (
    <Svg>
      <g className="ci-wave-hand">
        <path {...L} d="M17 41v-4c-4-3-8-9-9-13a2.2 2.2 0 0 1 4-2l5 6V11a2 2 0 0 1 4 0v9V8a2 2 0 0 1 4 0v12V9a2 2 0 0 1 4 0v11v-7a2 2 0 0 1 4 0v14c0 5-2 8-4 10v4z" />
        <path {...L} d="M17 37h16" className="ci-accent" />
      </g>
    </Svg>
  ),
  // гвоздь забивается в брусок
  metizy: (
    <Svg>
      <g className="ci-nail">
        <path {...L} d="M18 8h12" className="ci-accent" />
        <path {...L} d="M24 8v22l-1.5 3" />
      </g>
      <path {...L} d="M6 32h36v8H6z" />
    </Svg>
  ),
};
