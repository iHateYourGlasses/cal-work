# AGENTS.md

## 1. Не трогать

| Файл | Почему |
|---|---|
| `openapi.yaml` | Автогенерация из `main.tsp` |
| `web/src/types/api.ts` | Автогенерация из `openapi.yaml` |
| `server/dist/` | Артефакт сборки (`make clean` удаляет) |
| `data.db*` | SQLite БД (игнорируется git) |

## 2. Автогенерируемые файлы

| Выходной файл | Источник | Команда |
|---|---|---|
| `openapi.yaml` | `main.tsp` | `make spec` |
| `web/src/types/api.ts` | `openapi.yaml` | `make types` (запускает `spec` + `openapi-typescript`) |
| `server/dist/` | `server/src/**/*.ts` | `cd server && npm run build` |

## 3. Как менять API

```
main.tsp → tsp compile . → openapi.yaml → openapi-typescript → web/src/types/api.ts
```

Единственный источник правды — `main.tsp`. Любое изменение API: правишь `main.tsp`, затем `make spec`, затем `make types`.

## 4. Ключевые директории

| Путь | Назначение |
|---|---|
| `main.tsp` / `tspconfig.yaml` | Единственный источник правды API + конфиг TypeSpec |
| `web/` | React SPA (Vite, порт 5173) |
| `web/src/api/client.ts` | Единственная точка вызова API (типизирован через `web/src/types/api.ts`) |
| `web/src/pages/` | Страницы: Dashboard, Availability, EventTypeCreate, EventTypeEdit, Booking, Bookings, Confirmed |
| `web/src/components/` | Переиспользуемые компоненты: Layout, AvailabilityEditor |
| `server/` | Express 5 API (порт 3000) |
| `server/src/app.ts` | Фабрика `createApp()` — возвращает `app` без `.listen()`, нужно для тестов |
| `server/src/db/` | `schema.ts` (Drizzle-типы), `index.ts` (raw SQL DDL + `getDb()`), `seed.ts` |
| `server/src/routes/` | Роуты: eventTypes, availability, booking + `__tests__/` |
| `server/src/services/` | Бизнес-логика: `slotService.ts` + `__tests__/` |
| `server/src/test/` | Хелперы: `setupTestDb()`, `createTestApp()` |
| `plans/` | `mvp-architecture.md` — схема БД, алгоритм слотов |
| `docs/` | `issues.md` — список задач |
| `CONTEXT.md` | Глоссарий домена |

## 5. Проверка изменений

```bash
make spec && cd server && npx tsc --noEmit && cd ../web && npm run build && make test
```

Линтера нет (ESLint/Prettier не настроены) — ориентироваться на `tsc`.

Пошагово:

| Что | Команда |
|---|---|
| TypeSpec | `make spec` |
| Типы сервера | `cd server && npx tsc --noEmit` |
| Типы + сборка фронтенда | `cd web && npm run build` |
| Автотесты бэкенда | `make test` (vitest + supertest) |
| Автотесты (watch) | `make test-watch` |
| Сброс БД | `make db-reset` |

### MCP-верификация (обязательно при изменениях фронтенда)

После успешной сборки выполнить через Chrome DevTools MCP-инструменты:

**1. Роутинг** — для каждого URL из таблицы ниже:
```
navigate_page → url
take_snapshot → сверить заголовок страницы с ожидаемым
list_console_messages → убедиться, что нет красных ошибок и 404 на критичных ресурсах
```

**2. Интерактивность форм:**
- **Event Type Create:** `fill` Title → `take_snapshot` → Slug автогенерирован
- **Availability:** `click` на Time Select → `evaluate_script` проверяет `[role="option"]` (48 опций: 00:00–23:30)

**3. Booking flow:**
- `navigate_page` → `/book/alex/:slug` → `take_snapshot`: есть дата и слоты
- `click` по слоту → `take_snapshot`: появилась форма гостя (2 текстовых поля + кнопка Confirm)

**4. Layout:**
- `/dashboard*`: `take_snapshot` → видна боковая панель (Event Types / Availability / Bookings)
- `/book/*`: `take_snapshot` → боковая панель скрыта

> **⚠ Prism-моки:** при прокси на `:4010` API возвращает значения-заглушки (`"string"`, `-9007199254740991`, `"2019-08-24T14:15:22Z"`). Для проверки с реальными данными — запустить `make dev-backend` и переключить прокси в `web/vite.config.ts` на `:3000`.

## 6. Маршруты и страницы

| URL | Компонент | Заголовок |
|---|---|---|
| `/dashboard` | DashboardPage | "Your Event Types" |
| `/dashboard/availability` | AvailabilityPage | "Availability" |
| `/dashboard/bookings` | BookingsPage | "Bookings" |
| `/dashboard/event-types/new` | EventTypeCreatePage | "New Event Type" |
| `/dashboard/event-types/:id/edit` | EventTypeEditPage | "Edit Event Type" |
| `/book/alex/:slug` | BookingPage | Название ивента |
| `/book/alex/:slug/confirmed/:bookingId` | ConfirmedPage | "You're booked!" |

## 7. Сервер (Express 5, порт 3000)

- `"moduleResolution": "NodeNext"` → все относительные импорты через `.js`: `import { foo } from "../db/index.js"`
- **schema-first:** express-openapi-validator валидирует все запросы/ответы против `openapi.yaml`. Роуты до `middleware()` не валидируются (`/api/health`).
- **Монтирование роутов:** `bookingRouter` на `"/api"` (содержит `/book/...` и `/bookings/...`), остальные на полных путях: `"/api/event-types"`, `"/api/availability"`
- **Hardcoded user:** `HARDCODED_USER = "alex"` в eventTypes/availability роутах. Бронирования ищут user по username из URL.

## 8. База данных (SQLite + Drizzle + better-sqlite3)

- Инициализация: `getDb()` — ленивый синглтон (соединение → DDL → seed при первом вызове)
- `DB_PATH` (дефолт `data.db`, тесты `:memory:`). WAL только для файловых БД.
- **⚠ Схема в ДВУХ файлах:** `schema.ts` (Drizzle-типы для запросов) + `index.ts` (raw SQL DDL для создания таблиц). Меняешь структуру — правь оба.
- **Миграции:** `ALTER TABLE` в try/catch в `index.ts` — игнорирует ошибку если колонка уже есть.
- `event_types.minimum_booking_notice` (дефолт 240 мин) — отсекает слишком близкие слоты
- Дефолтный юзер: `alex` / `Alex Sokolov` / `Europe/Moscow` (`INSERT OR IGNORE`)
- WAL → файлы `data.db-wal`, `data.db-shm` — чистить вместе с `data.db`

## 9. Фронтенд (React 19, Vite 8, порт 5173)

- **API-клиент:** только `web/src/api/client.ts`
- **Mantine CSS:** импорты ОБЯЗАТЕЛЬНЫ и в `index.css`, и в `main.tsx`. `postcss-preset-mantine` в `postcss.config.cjs`.
- **Vite proxy:** `/api` → `:4010` (Prism, моки) или `:3000` (Express). Конфиг: `web/vite.config.ts`.
- **EventTypeUpdate** не позволяет менять slug — задаётся только при создании.

## 10. Домен

См. `CONTEXT.md`. В коде:
- `EventType` / `event_types` = Meeting (шаблон встречи)
- `Booking` / `bookings` = подтверждённое бронирование
- `Availability` = недельные правила (дни + окна)
- `Slot` = вычисленный свободный интервал

## 11. Makefile

| Команда | Действие |
|---|---|
| `make spec` | `main.tsp` → `openapi.yaml` |
| `make types` | `spec` + `web/src/types/api.ts` |
| `make mock` | Prism mock :4010 |
| `make dev` | Vite :5173 |
| `make dev-backend` | Express :3000 (`tsx watch`) |
| `make build` | `types` + сборка server + web |
| `make test` | vitest |
| `make test-watch` | vitest watch |
| `make db-reset` | `rm data.db*` + `drizzle-kit push` |
| `make install` | `npm install` в корне, `server/` и `web/` |
| `make clean` | Удаляет `server/dist`, `web/dist`, все `node_modules` |

## 12. Версии

| Компонент | Версия |
|---|---|
| TypeScript | 6.0.3 |
| Node.js | 22.22 |
| React / Mantine | 19.2.7 / 9.4.1 |
| Vite / React Router | 8.1.3 / 7.18.1 |
| Express / Drizzle ORM | 5.2.1 / 0.41.0 |
| TypeSpec | 1.13.0 |
| luxon (сервер) / dayjs (фронт) | 3.6.0 / 1.11.21 |
