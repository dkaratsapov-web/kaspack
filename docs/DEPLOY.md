# Развёртывание сайта Kaspack

## Превью на GitHub Pages
Адрес: **https://dkaratsapov-web.github.io/kaspack/**

Один раз включить в репозитории: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Дальше каждый push в ветку запускает `.github/workflows/pages.yml`: сборка с `NEXT_PUBLIC_BASE_PATH=/kaspack` и публикация.
На превью форма работает в демо-режиме (сервера заявок нет) и честно сообщает об этом после отправки.

## Продакшен: VPS в РФ (152-ФЗ)
Требования: Ubuntu 22/24, Node.js 22, nginx, certbot.

```bash
# 1. Код и сборка
git clone https://github.com/dkaratsapov-web/kaspack.git /var/www/kaspack
cd /var/www/kaspack
npm ci
NEXT_PUBLIC_LEAD_ENDPOINT=/api/lead NEXT_PUBLIC_YM_ID=<номер_счётчика> npm run build   # → out/

# 2. Сервис заявок
cd server && npm ci --omit=dev && cd ..
sudo mkdir -p /etc/kaspack && sudo cp deploy/lead.env.example /etc/kaspack/lead.env   # заполнить токены
sudo cp deploy/kaspack-lead.service /etc/systemd/system/
sudo systemctl enable --now kaspack-lead

# 3. nginx + HTTPS
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kaspack.ru
sudo ln -s /etc/nginx/sites-available/kaspack.ru /etc/nginx/sites-enabled/
sudo certbot --nginx -d kaspack.ru -d www.kaspack.ru
sudo nginx -t && sudo systemctl reload nginx
```

### Куда уходят заявки (`/etc/kaspack/lead.env`)
| Канал | Переменные | Где взять |
|---|---|---|
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Бот у @BotFather, добавить в чат отдела продаж |
| amoCRM | `AMO_DOMAIN`, `AMO_TOKEN`, `AMO_PIPELINE_ID` | amoCRM → Настройки → Интеграции → «Создать интеграцию» → долгосрочный токен |
| Почта | `SMTP_*`, `LEAD_EMAIL_TO=info@kaspack.ru` | Пароль приложения почтового ящика |

Каналы независимы: заявка считается доставленной, если ушла хотя бы в один. В лог пишутся только статусы каналов, без персональных данных.

## SEO-миграция (перед переключением домена)
1. Выгрузить из Яндекс Вебмастера и Метрики текущие страницы и позиции.
2. Сверить slug трёх категорий, которые не подтверждены: «Гофротара», «Ящики для продуктов», «Метизы» (`lib/content.ts`, `slugVerified: false`). Для расхождений — 301 в nginx.
3. Старые адреса вида `/strejch-plenka` работают без изменений (nginx `try_files $uri.html`).
4. После запуска: переобход в Вебмастере, проверка 404 в логах nginx первые 2 недели.

## Обновление превью каталога (3D-рендеры)
```bash
RENDER_LAB=1 npx next dev -p 3100 &        # служебная страница /render-lab
node tools/render-products.cjs http://localhost:3100 /tmp/renders 24
python3 -I tools/build-sprites.py /tmp/renders public/catalog 24
```
