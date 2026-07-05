# AGENTS.md

## 1. Версии

| Компонент           | Версия | Где указано                               |
| ------------------- | ------ | ----------------------------------------- |
| TypeScript          | 6.0.3  | корень `package.json`, `web/package.json`, `server/package.json` |
| Node.js             | 22.22  | отсутствует `.nvmrc` — использовать эту   |
| React               | 19.2.7 | `web/package.json`                        |
| Mantine             | 9.4.1  | `web/package.json`                        |
| React Router        | 7.18.1 | `web/package.json`                        |
| Vite                | 8.1.3  | `web/package.json`                        |
| TypeSpec            | 1.13.0 | корень `package.json`                     |
| Express             | 5.2.1  | `server/package.json`                     |
| better-sqlite3      | 11.7.0 | `server/package.json`                     |
| Drizzle ORM         | 0.41.0 | `server/package.json`                     |
| drizzle-kit         | 0.30.6 | `server/package.json`                     |
| express-openapi-validator | 5.6.2 | `server/package.json`                |
| luxon               | 3.6.0  | `server/package.json`                     |
| dayjs               | 1.11.21| `web/package.json`                        |
| openapi-fetch       | 0.17.0 | `web/package.json`                        |
| @tabler/icons-react | 3.44.0 | `web/package.json`                        |

- Целевой стандарт: ES2022, ESM Modules (`"type": "module"` во всех трёх `package.json`).

## 2. Директории и назначение

### Существующие

| Путь                | Назначение                                                                      |
| ------------------- | ------------------------------------------------------------------------------- |
| `main.tsp`          | ⚠ Единственный источник правды API. Только тут редактировать модели и роуты.    |
| `tspconfig.yaml`    | Конфиг TypeSpec — указывает эмиттер `@typespec/openapi3` и выходной файл.       |
| `openapi.yaml`      | ⚠ АВТОГЕНЕРАЦИЯ из `main.tsp`. НЕ редактировать руками.                        |
| `web/`              | React SPA (Vite, порт 5173).                                                    |
| `web/public/`       | Статика: `openapi.yaml` (симлинк на корневой) и `swagger.html`.                 |
| `web/src/api/`      | Типизированная обёртка над `fetch` для вызовов API.                             |
| `web/src/types/`    | `api.ts` — автогенерация типов из OpenAPI (НЕ редактировать).                   |
| `web/src/pages/`    | Компоненты страниц: Dashboard, Availability, EventTypeCreate, Booking, Bookings, Confirmed. |
| `web/src/components/`| Переиспользуемые компоненты: Layout, AvailabilityEditor.                        |
| `server/`           | Express 5 API (порт 3000).                                                      |
| `server/src/`       | Исходный код бэкенда.                                                           |
| `server/src/db/`    | `schema.ts` (4 таблицы Drizzle), `index.ts` (подключение + CREATE TABLE), `seed.ts` (дефолтный юзер). |
| `server/drizzle.config.ts` | Конфиг drizzle-kit для CLI-команд.                                    |
| `plans/`            | `mvp-architecture.md` — схема БД, алгоритм слотов, план тестирования.           |
| `Makefile`          | Единая точка входа для команд разработки.                                       |

### НЕ трогать / игнорировать

| Путь      | Почему                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| `openapi.yaml` | Автогенерация.                                                             |
| `web/src/types/api.ts` | Автогенерация.                                                          |
| `server/dist/`   | Сборка `tsc` (артефакт, удаляется через `make clean`).         |
| `data.db*`       | SQLite БД (создаётся при старте сервера, игнорируется git).       |

## 3. Архитектурные правила и конвенции

- **Единственный источник правды:** `main.tsp`. Любое изменение API начинается с правки `main.tsp`, затем `make spec` для регенерации `openapi.yaml`.
- **Никогда не редактировать руками:** `openapi.yaml`, `web/src/types/api.ts`. Это автогенерируемые файлы.
- **Пайплайн кодогенерации (строгий порядок):**
  ```
  main.tsp → tsp compile . → openapi.yaml → openapi-typescript → web/src/types/api.ts
  ```
- **Vite Proxy:** `/api` → Prism `:4010` (dev против моков) или Express `:3000` (dev с реальным бэкендом). Конфиг: `web/vite.config.ts`.
- **Mantine CSS:** стили должны быть импортированы и в `index.css`, и в `main.tsx`. Обязательно. `postcss-preset-mantine` в `postcss.config.cjs`.
- **API клиент:** `web/src/api/client.ts` — единственная точка вызова API. Все запросы типизированы через `web/src/types/api.ts`.
- **Нет линтера:** ESLint/Prettier не настроены. При проверке кода ориентироваться на `tsc` и визуальное соответствие существующему стилю.
- **Бэкенд — schema-first:** express-openapi-validator валидирует все запросы и ответы против `openapi.yaml`. Роуты, определённые ДО `middleware()`, не валидируются (используется для `/api/health`).
- **Монтирование роутов:** `bookingRouter` монтируется на `"/api"` (содержит `/book/...` и `/bookings/...`), остальные — на полных путях (`"/api/event-types"`, `"/api/availability"`).

## 4. База данных (SQLite + Drizzle)

- Таблицы создаются на уровне модуля (`server/src/db/index.ts`), при первом импорте — **не** внутри `initDb()`. Достаточно `import` из `db/index.ts`, чтобы БД была готова.
- Drizzle-схема в `server/src/db/schema.ts` — **источник типов** для запросов, но **не для создания таблиц** (создание — raw SQL в `index.ts`). Если меняешь структуру БД, правь **оба** файла: `index.ts` (raw SQL) и `schema.ts` (Drizzle-типы).
- Дефолтный юзер: `alex` / `Alex Sokolov` / `Europe/Moscow` (seed.ts, upsert через `INSERT OR IGNORE`).
- WAL-режим включён → создаются файлы `data.db-wal` и `data.db-shm` рядом с `data.db`. Все три нужно чистить при сбросе БД.

## 5. Автогенерируемые файлы

| Файл                      | Источник        | Команда обновления       | Примечание                                 |
| ------------------------- | --------------- | ------------------------ | ------------------------------------------ |
| `openapi.yaml`            | `main.tsp`      | `make spec`              | Компиляция TypeSpec.                       |
| `web/src/types/api.ts`    | `openapi.yaml`  | `make types`             | Запускает `spec` + `openapi-typescript`.   |
| `server/dist/`            | `tsc`           | `cd server && npm run build` | Артефакт сборки бэкенда.                   |

## 6. Команды проверки

| Что проверяем                    | Команда                                          |
| -------------------------------- | ------------------------------------------------ |
| Компиляция TypeSpec              | `make spec`                                      |
| Типы сервера (TypeScript)        | `cd server && npx tsc --noEmit`                  |
| Сборка фронтенда (tsc + Vite)    | `cd web && npm run build`                        |
| Сборка сервера (tsc → dist/)     | `cd server && npm run build`                     |
| Runtime-валидация API            | `express-openapi-validator` (включён в `server/src/index.ts`, валидирует все запросы/ответы против `openapi.yaml`) |
| Автотесты бэкенда                | `make test` (vitest + supertest)                 |
| Полная кодогенерация             | `make types`                                     |
| TypeSpec watch                   | `make spec-watch`                                |
| Сброс БД                         | `make db-reset`                                  |

Золотое правило проверки изменений:
```bash
make spec && cd server && npx tsc --noEmit && cd ../web && npm run build
```

### Автоматизированная проверка в браузере

После успешной сборки выполнить проверку через Chrome DevTools MCP-инструменты:

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

| URL | Компонент | Заголовок |
|---|---|---|
| `/dashboard` | DashboardPage | "Your Event Types" |
| `/dashboard/availability` | AvailabilityPage | "Availability" |
| `/dashboard/bookings` | BookingsPage | "Bookings" |
| `/dashboard/event-types/new` | EventTypeCreatePage | "New Event Type" |
| `/book/alex/:slug` | BookingPage | Название ивента |
| `/book/alex/:slug/confirmed/:bookingId` | ConfirmedPage | "You're booked!" |

> **⚠ Prism-моки:** при прокси на `:4010` API возвращает значения-заглушки из OpenAPI-примера (`"string"`, `-9007199254740991`, `"2019-08-24T14:15:22Z"`). Это ожидаемо. Для проверки с реальными данными — запустить `make dev-backend` и переключить прокси в `web/vite.config.ts` на `:3000`.

## 7. Dev Workflow

### Против моков (Prism) — фронтенд без бэкенда

```bash
make spec-watch   # T1: автоперекомпиляция TypeSpec
make mock         # T2: Prism mock server на :4010
make dev          # T3: Vite dev server (прокси /api → :4010)
```

### С реальным бэкендом — полный стек

```bash
make spec-watch   # T1: TypeSpec watch
make dev-backend  # T2: Express на :3000 (создаёт data.db, сеет юзера)
make dev          # T3: Vite dev server (сменить прокси в vite.config.ts с :4010 на :3000)
```

## 8. Makefile reference

| Команда         | Действие                                              |
| --------------- | ----------------------------------------------------- |
| `make spec`     | Компиляция `main.tsp` → `openapi.yaml`                |
| `make types`    | `spec` + генерация `web/src/types/api.ts`             |
| `make mock`     | Prism mock server на `:4010`                          |
| `make dev`      | Vite dev server (`:5173`, прокси `/api` → `:4010`)    |
| `make dev-backend` | Express dev server (`:3000`, `tsx watch`)          |
| `make build`    | Полная сборка: `types` + `server/` + `web/`           |
| `make test`     | `cd server && npm test` (vitest)                      |
| `make db-reset` | Удаляет `data.db*` + `drizzle-kit push`               |
| `make install`  | `npm install` в корне, `server/` и `web/`             |
