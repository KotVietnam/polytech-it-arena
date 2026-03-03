# PolyTech IT Arena

Монорепозиторий клуба соревнований `Blue Team vs Red Team`.
Состоит из:
- frontend (`React + Vite + TypeScript`)
- backend API (`Node.js + Express + Prisma + SQLite + AD auth`)

## Что реализовано

- Терминальная авторизация на `/` с командами `help/login/auth`
- Авторизация через backend:
  - `AUTH_MODE=ad` — проверка логина/пароля через Active Directory (LDAP)
  - `AUTH_MODE=mock` — локальный режим разработки
- JWT-сессия на клиенте
- Защищенные маршруты через роли (`USER` / `ADMIN`)
- Соревнования загружаются из БД (вместо заглушек)
- Архив соревнований загружается из БД
- Встроенная admin-панель `/admin`:
  - создание/удаление соревнований
  - создание/удаление архивных записей
  - управление ролями пользователей

## Структура

```text
.
├── src/                 # frontend
└── server/
    ├── src/             # backend API
    └── prisma/          # схема и seed
```

## Быстрый старт

Требования:
- Node.js 20+
- npm 10+

### 1. Frontend

```bash
npm install
npm run dev
```

Frontend по умолчанию: `http://localhost:5173`

### 2. Backend

```bash
npm --prefix server install
cp server/.env.example server/.env
```

Заполните `server/.env`:
- `DATABASE_URL` (по умолчанию `file:./dev.db`)
- `JWT_SECRET`
- режим `AUTH_MODE` (`ad` или `mock`)
- при `AUTH_MODE=ad`: `AD_URL`, `AD_BASE_DN`, `AD_BIND_*`, `AD_ADMIN_GROUP_DN`

Далее:

```bash
npm run server:migrate
npm run server:dev
```

Backend по умолчанию (локально): `http://127.0.0.1:4000`

## NPM команды

Frontend:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Backend:

```bash
npm run server:dev
npm run server:build
npm run server:migrate
npm run server:seed
```

`server:migrate` выполняет:
- инициализацию SQLite схемы (`server/prisma/init.sql`)
- seed данных соревнований (`server/prisma/seed.ts`)

## API (основное)

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/events`
- `GET /api/archives`
- `POST /api/admin/events` (ADMIN)
- `PATCH /api/admin/events/:id` (ADMIN)
- `DELETE /api/admin/events/:id` (ADMIN)
- `POST /api/admin/archives` (ADMIN)
- `PATCH /api/admin/archives/:id` (ADMIN)
- `DELETE /api/admin/archives/:id` (ADMIN)
- `GET /api/admin/users` (ADMIN)
- `PATCH /api/admin/users/:id/role` (ADMIN)

## Маршруты frontend

- `/` — терминал авторизации
- `/home` — главная
- `/calendar` — календарь соревнований
- `/archive` — архив
- `/admin` — панель администратора
- `/tracks/cybersecurity`
- `/tracks/networks`
- `/tracks/devops`
- `/tracks/sysadmin`
- `/tracks/:trackId/info`
- `/tracks/:trackId/news`

## Примечания по AD

- Роль `ADMIN` автоматически назначается, если пользователь входит в группу `AD_ADMIN_GROUP_DN`.
- Дополнительно роль можно менять через `/admin`.
- Для локальной разработки без AD используйте `AUTH_MODE=mock`.

## База данных

- Локально проект запускается на SQLite (`server/prisma/dev.db`) без внешних сервисов.
- Если нужен PostgreSQL в production, можно переключить datasource в [server/prisma/schema.prisma](/root/polytech-it-arena/server/prisma/schema.prisma) и обновить `DATABASE_URL`.

## Nginx + Build Deploy

Серверная схема:
- `nginx` отдает frontend build из `/var/www/polytech-it-arena`
- `nginx` проксирует `/api` на `127.0.0.1:4000`
- backend работает как `systemd`-сервис `polytech-it-arena-api`
- frontend обращается к API по относительному пути `/api` (без `:4000` в браузере)
- домен: `itarena.kotvietnam.kz`

Конфиги в репозитории:
- [ops/nginx/polytech-it-arena.conf](/root/polytech-it-arena/ops/nginx/polytech-it-arena.conf)
- [ops/systemd/polytech-it-arena-api.service](/root/polytech-it-arena/ops/systemd/polytech-it-arena-api.service)

Команды применения:

```bash
# build
npm run build
npm --prefix server run build
npm run server:migrate

# deploy frontend static
sudo mkdir -p /var/www/polytech-it-arena
sudo cp -a dist/. /var/www/polytech-it-arena/

# install backend service
sudo cp ops/systemd/polytech-it-arena-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now polytech-it-arena-api

# install nginx site
sudo cp ops/nginx/polytech-it-arena.conf /etc/nginx/sites-available/polytech-it-arena
sudo ln -sfn /etc/nginx/sites-available/polytech-it-arena /etc/nginx/sites-enabled/polytech-it-arena
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```
