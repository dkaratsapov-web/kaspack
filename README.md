# Kaspack — новый сайт kaspack.ru

Next.js 16 · React 19 · React Three Fiber · Tailwind v4 · статический экспорт.

- **Превью:** https://dkaratsapov-web.github.io/kaspack/ (после включения Pages, см. `docs/DEPLOY.md`)
- `docs/BRIEF.md` — утверждённый бриф (v1.2)
- `docs/DEPLOY.md` — развёртывание: GitHub Pages и VPS в РФ, приём заявок (почта, Telegram, amoCRM)
- `docs/skills-analysis.md` — анализ установленных скиллов

## Разработка
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # статический сайт в out/
npm run inspect -- http://localhost:3000 --crawl 1   # скриншоты и аудит страниц
```

## Структура
- `app/` — страницы: главная, 17 категорий (`[slug]`), `/partneram`, политика ПДн
- `components/` — шапка, hero, секции главной (`sections/`), 3D-сцены (`three/`)
- `lib/content.ts` — все факты о компании и каталог (единый источник)
- `server/lead-server.mjs` — приём заявок на VPS
- `tools/` — сервис скриншотов, рендер 3D-превью каталога, генератор чертежей
