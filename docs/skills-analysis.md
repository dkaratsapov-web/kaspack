# Анализ установленных скиллов и плагинов

Дата: 11.10.2026. Метод: чтение всех SKILL.md, команд, агентов, хуков и скриптов. Исполнялись только офлайн-скрипты: поиск ui-ux-pro-max и `contrast_checker.py`. Задача, под которую оценивалось: редизайн B2B-сайта производителя промышленной упаковки (Тверь) в премиальный сайт с 3D и моушном при сохранении конверсии.

## 0. Коротко
- **Ядро для проекта.**
  - Правила и чек-листы: `claude-web-skills`, `frontend-design`, `cg-web-animate`, `motion-art-direction`.
  - Аудит: `a11y-audit`.
  - Маркетинг: `page-cro`, `copywriting`, `form-cro`, `seo-audit`, `site-architecture`, `schema-markup`.
  - Процесс: `superpowers` (brainstorming → writing-plans → executing-plans → verification).
  - Аудитор `audit-page.mjs` из `jmrsquared-standards/premium-web-design`.
- **Вредоносного кода и инъекций не найдено.** Есть побочные эффекты:
  - у superpowers и jmrsquared есть SessionStart-хуки;
  - jmrsquared пишет `~/.claude/.jmr-active` и читает `~/.zshrc` в поисках ключей Unsplash/Pexels;
  - ui-ux-pro-max/design читает `~/.claude/.env` и ходит во внешние AI-API (только при явном вызове).
- **Кириллица.** Многие рекомендуемые шрифты её не поддерживают: Bebas Neue, Archivo, Outfit, Barlow, Space Mono, Work Sans, Instrument Sans, Clash, Cabinet, Satoshi, General Sans.
- **Тире.** Правило «ноль em dash» не подходит для русского: тире там грамматическое. Запрещаем только декоративные конструкции.
- **Язык и поисковики.**
  - `headline_scorer.py` не понимает русский: нормальный заголовок получил 30/100.
  - SEO-скиллы ориентированы на Google и GA4, Яндекса нет.

## 1. Безопасность

| Где | Что | Серьёзность |
|---|---|---|
| superpowers (SessionStart) | Вставляет `using-superpowers` в обёртке `<EXTREMELY_IMPORTANT>` («If you think there is even a 1% chance a skill might apply… YOU ABSOLUTELY MUST invoke the skill»). В brainstorming есть HARD-GATE до одобрения дизайна. | Не вредоносно, но агрессивно меняет поведение |
| superpowers / visual companion | `server.cjs` на 127.0.0.1 с ключом, пишет в `.superpowers/brainstorm/` | Низкая: добавить в .gitignore |
| jmrsquared-standards (SessionStart + statusLine) | Подмешивает `jmr-standing-rules`, `jmr-build-test-lint-gate`, `jmr-plain-language` («Don't announce that you're following them»). Пишет `~/.claude/.jmr-active`. Требует обновлять CLAUDE.md. Гейт `yarn build/test/lint:fix` под чужой стек. | Средняя: **рекомендуется отключить** |
| jmrsquared / jmr-image.sh | `hydrate_key_from_zshrc`: grep по `~/.zshrc` на `UNSPLASH_*`/`PEXELS_API_KEY`, затем curl | Средняя |
| jmrsquared / jmr-generate-video.sh | Клонирует внешний репозиторий (закреплён по коммиту), `npx hyperframes`, venv в `~/.cache` | Не нужен |
| jmrsquared / premium-web-design | `find-photos.mjs` скрейпит Unsplash/Pexels, `study-site.mjs` открывает URL, `gltf.py` берёт `SKETCHFAB_TOKEN` | Сеть только по явному вызову |
| ui-ux-pro-max / design/logo/generate.py | Читает `.env` и ходит в Gemini/AtlasCloud/MuAPI | Средняя, только при вызове. `search.py` офлайн |
| lume / scaffold.js | `create-next-app@latest` без фиксации версии. В SKILL.md неверный путь | Не запускать |
| example-skills / web-artifacts-builder | Глобальная установка `pnpm` | Не нужен |
| marketing-skills | `seo_checker.py`, `conversion_audit.py` и др. делают GET только по переданному URL | Низкая |
| a11y-audit | Офлайн. В SKILL.md указаны `--fg/--bg`, а скрипт принимает позиционные аргументы | Баг документации |
| color-motion, motion-background | Ссылаются на несуществующие `scripts/*.sh` | Битые ссылки |

Поиск по шаблонам «ignore previous instructions», exfiltrat, `~/.ssh`, `curl | sh`, `base64 -d` ничего не нашёл.

## 2. Отдельные скиллы (`~/.claude/skills`)

| Скилл | Оценка | Суть и ключевые правила |
|---|---|---|
| **claude-web-skills** | высокая, основной регламент | Design read и три шкалы (база 8/6/4; для B2B-производителя ~5-6/5-6/4-5). Стек Next.js + Tailwind v4 + motion/react, GSAP только для pin/scrub. Типографика: максимум 2 семейства, не Inter по умолчанию. Цвет: 6 ролей, 1 акцент, одна серая семья, ловушки AI-purple и cream+brass. Вёрстка: `min-h-[100svh]`, не больше 2 зигзагов подряд. Hero: ≤4 текстовых элемента. Список AI-штампов. 5 систем навигации. Моушн: таблица частоты, transform/opacity/clip-path, easing-токены, длительности. Скроллителлинг: одна кульминация, сигнатурный приём (пример: SVG-чертёж, рисующийся по скроллу). Редизайн: SEO-миграция как главный риск, не менять URL молча. Финальный чек-лист |
| **lume** | средняя | Awwwards-подход (landonorris.com, igloo.inc), 6 эмоциональных направлений, 15 готовых компонентов в references, мобильные бюджеты. Конфликтует с остальными: кастомный курсор, прелоадер, «премиум = тёмный», шрифты без кириллицы, заголовки 8–20rem. Брать как библиотеку техник |
| **cg-web-animate** | высокая | «Every animation must have a reason». 4 уровня (Hero 500–1200 мс, Section 400–900, Component 120–350, Micro 100–250). Дерево выбора технологии. Моушн-токены. Карта плотности анимации. Нативный скролл по умолчанию. §48 «AI Animation Slop». Бренд-профили (Finance: сдержанно и предсказуемо) |
| **animate** | средняя | Курс Emil Kowalski для React/Framer Motion: вход 200–300 мс, выход ~75% от входа, пружины snappy 400/30 и gentle 200/20 |
| **animation-principles** | средне-высокая | Кривые: вход (0.16,1,0.3,1), выход (0.7,0,0.84,0), перемещение (0.65,0,0.35,1). Stagger 40–80 мс, группа ≤ 700 мс. Правило 1/3 |
| **motion-art-direction** | высокая | «Define the motion language first». Персоналии Corporate (200–400 мс) и Premium (350–600 мс, без overshoot). «Two eases maximum», «One wow moment». Для B2B: Calm+Sharp (0.22,1,0.36,1), база 0,4 с, stagger 60 мс, сдвиг ≤ 24px |
| **motion-background** | средняя | CSS mesh, GLSL fbm на Three.js, частицы, бесшовные циклы, пауза вне экрана. Риск штампа: использовать только для фактуры материалов |
| **color-motion** | средняя | OKLCH, `@property`, «slow is premium», grain 3–5%. Половина скилла про AE и видео |
| creative-direction, kinetic-typography, logo-animation, transitions, shot-composition | низкая–средняя | Структура брифа, текстовая анимация hero, анимация знака, композиция 3D-кадров |
| cinematic-video, remotion-video/motion, motion-design | низкая | Промо-ролик из 3D-сцены (этап 2) |
| after-effects, beat-sync, beat-sync-editing, social-video | нерелевантно | — |

## 3. Плагины

### example-skills (Anthropic)
- **frontend-design (высокая).**
  - Уникальность из «industry, materials, vernacular».
  - 5 кластеров штампов:
    - cream + serif + terracotta;
    - near-black + кислотный акцент;
    - broadsheet;
    - SaaS-карточки;
    - ALL-CAPS eyebrow, «A · B · C», «WORD — fragment», mono-метки, «→» в кнопках.
  - «A single orchestrated moment».
  - Два прохода: токены и вайрфреймы, затем самокритика по скриншотам.
- **webapp-testing (средне-высокая).** Тестирование на Playwright.
- **pdf/xlsx (низко-средняя).** Пригодятся для прайсов.
- Остальное нерелевантно. brand-guidelines заточен под бренд Anthropic.

### marketing-skills (48 скиллов)
- **page-cro (высокая).**
  - 7 измерений: ценность за 5 секунд, заголовок, CTA, иерархия, доверие, возражения, трение.
  - Скрипт `conversion_audit.py`.
- **copywriting (высокая).** Ясность, конкретика, без выдуманной статистики. Структура страницы, формула CTA. headline_scorer только для английского.
- **form-cro (высокая).** 3–5 полей. Телефон — главная причина брошенных форм. Валидация on blur. `form_field_analyzer.py`.
- **seo-audit, site-architecture, schema-markup (высокая).** CWV, структура URL и 301, разметка Organization/LocalBusiness/Product/Breadcrumb/FAQ. Нет Яндекса.
- **Средняя ценность.**
  - marketing-context, marketing-psychology, local-seo-manager (адаптировать под Яндекс Бизнес и 2ГИС).
  - **free-tool-strategy**: калькулятор расхода стрейча или подбор короба как лид-магнит.
  - analytics-tracking (перевести на Метрику), ab-test-setup, competitor-alternatives, copy-editing, aeo, programmatic-seo.
- **Нерелевантно.** ASO, paid-ads, x-twitter, youtube, paywall, signup, onboarding, referral, webinar.

### product-skills
- ux-researcher-designer (персоны, CJM), ui-design-system (генератор токенов), competitive-teardown — средняя ценность.
- landing-page-generator — низкая: его образец «Centered Gradient Dark SaaS» и есть штамп.
- Остальное нерелевантно.

### a11y-audit (высокая)
- `a11y_scanner.py`: 20+ типов нарушений.
- `contrast_checker.py FG BG`: проверка `#A16207` на `#FAFAF9` дала 4,71:1, AA пройден.
- Справочники WCAG 2.2.

### ui-ux-pro-max: высокая как сырьё, низкая как готовый вердикт
- База: 79 стилей, 192 палитры, 74 пары шрифтов, каталог google-fonts с поднаборами (удобно проверять кириллицу), 119 UX-правил, 17 GSAP-пресетов.
- Запуск с `python3 -I` требует обёртки с `sys.path.insert`.
- **Что вернул поиск по запросам «industrial B2B manufacturing premium» и «B2B industrial manufacturer»:**
  - паттерн Trust & Authority + Conversion;
  - промышленные палитры: графит + охра `#A16207`, сталь + сигнальный оранжевый `#EA580C`, navy + `#0369A1`;
  - стиль Liquid Glass и пару Cormorant + Montserrat — мимо задачи.
- **Кириллица по каталогу google-fonts.**
  - Есть: Geologica, Onest, Inter Tight, IBM Plex, Wix Madefor, Manrope, Golos Text, Unbounded, Tektur, JetBrains Mono, Fira.
  - Нет: Bebas Neue, Archivo, Outfit, Barlow, Work Sans, Space Mono.

### superpowers (процесс)
- brainstorming: HARD-GATE до одобрения.
- writing-plans: план с Global Constraints.
- executing-plans: ледж решений.
- **verification-before-completion: «NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE»** — высокая ценность.

### motion-design-studio (frankx)
- site-motion-excellence-director: 10 шагов, «still-frame gate», мобильная версия как отдельная хореография.
- Рубрики: excellence gate (12 категорий, цель ≥ 45) и motion quality (7 категорий, ≥ 18).
- web-motion-auditor.

### bizarro / creative-development (средняя, с оговорками)
- **Полезно:**
  - первый кадр без мерцания, WebGL стартует за постером;
  - reveal через `data-reveal` и общий IntersectionObserver;
  - один rAF-цикл, сглаживание через damp.
- **Спорно для B2B:** «не жертвовать анимацией ради LCP», «WebGL на каждой странице».

### jmrsquared-standards (в целом низкая)
- 30 скиллов под tRPC, Supabase, SST и React Native.
- **Ценен только premium-web-design:** таблица «Instant fails» с порогами и Playwright-аудитор `audit-page.mjs` (~4000 строк).
- Запуск аудитора: `PW_DIR=/home/user/kaspack node <skill>/scripts/audit-page.mjs <url> ./.audit`.

## 4. Конфликты и решения для Kaspack

| Тема | Решение |
|---|---|
| Easing выходов | ease-out, на 25–40% короче входа; ускорение только для элементов, уходящих за экран |
| Плавный скролл (Lenis) | Нативный скролл |
| Курсор, прелоадер | Без кастомного курсора; без прелоадера; интро поверх отрисованного контента |
| Тёмная тема | Светлая база и одна тёмная секция-кульминация |
| Шрифты | Только с кириллицей: Geologica + Onest |
| Em dash | Грамматическое тире разрешено, декоративное нет |
| Производительность | Core Web Vitals в приоритете, WebGL лениво и с фолбэком |
| Цифры | Только реальные данные от заказчика |

## 5. Пайплайн
0. Отключить jmrsquared-standards (или игнорировать его гейт). Учесть HARD-GATE superpowers.
1. Бриф: brainstorming, claude-web-skills §1 и §8.1, marketing-context, ux-researcher-designer, competitive-teardown.
2. Аудит старого сайта: claude-web-skills §8.3, seo-audit + site-architecture (301-карта, Яндекс), page-cro + conversion_audit, a11y-audit, `tools/site-inspector`.
3. Визуальное направление: frontend-design (токены, вайрфреймы, проверка штампов), ui-ux-pro-max как сырьё, color-motion (OKLCH).
4. Моушн: motion-art-direction (Calm+Sharp), animation-principles, cg-web-animate (уровни, карта плотности), claude-web-skills §5–6 (одна signature move), SITE_MOTION_SPEC.
5. Тексты и конверсия: copywriting, page-cro, form-cro, free-tool-strategy.
6. План: writing-plans.
7. Реализация: executing-plans, claude-web-skills, техники lume, schema-markup.
8. Проверка: site-inspector и `audit-page.mjs`, a11y-audit, рубрики моушна (≥ 45 / ≥ 18), чек-лист claude-web-skills §12, seo_checker, verification-before-completion.
