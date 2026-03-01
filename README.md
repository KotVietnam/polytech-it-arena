# PolyTech IT Arena

Фронтенд-проект клуба соревнований `Blue Team vs Red Team` для колледжа.
Сайт выполнен в стиле cyber-terminal: вход через терминал, далее доступ к страницам треков и календарю событий.

## Технологии

- Vite
- React 19 + TypeScript
- Tailwind CSS
- React Router v6
- Без backend (данные статические, готовы к дальнейшей интеграции API)

## Основные возможности

- Терминальная авторизация на главной странице (`/`)
- Вход по командам `login` + `auth`
- Главная страница клуба с карточками компетенций
- Календарь событий с таймлайном
- Отдельные страницы треков:
  - CyberSecurity
  - Networks
  - DevOps
  - SysAdmin
- Страницы по трекам:
  - полезная информация
  - новости
- Сетка-фон и тематические анимации в общем стиле проекта

## Быстрый старт

Требования:

- Node.js 20+
- npm 10+

Установка и запуск:

```bash
npm install
npm run dev
```

После запуска откройте:

```text
http://localhost:5173
```

## Доступные команды npm

```bash
npm run dev      # dev-сервер
npm run build    # production build
npm run preview  # локальный просмотр production build
npm run lint     # проверка линтером
```

## Маршруты

- `/` — терминал авторизации
- `/home` — главная страница
- `/calendar` — календарь событий
- `/tracks/cybersecurity`
- `/tracks/networks`
- `/tracks/devops`
- `/tracks/sysadmin`
- `/tracks/:trackId/info` — полезная информация по треку
- `/tracks/:trackId/news` — новости трека

## Команды в терминале авторизации

- `help` — список команд
- `login` — запуск экрана ввода логина/пароля
- `auth` — вход на сайт после `login`
- `status` — состояние полей авторизации
- `clear` — очистка терминала

Пасхалки:

- `matrix`
- `coffee`
- `xyzzy`
- `sudo rm -rf /`

## Структура проекта

```text
src/
  components/
  context/
  data/
  pages/
    tracks/
  types/
  utils/
  App.tsx
  main.tsx
  index.css
```

## Сборка и деплой

Сборка:

```bash
npm run build
```

Артефакты будут в папке `dist/`.

Пример `nginx` для SPA:

```nginx
location / {
  root /var/www/polytech-it-arena;
  try_files $uri $uri/ /index.html;
}
```

## Примечание

Сессия авторизации хранится в `sessionStorage`.
Если нужно принудительно выйти, закройте вкладку/браузер или очистите данные сайта.
