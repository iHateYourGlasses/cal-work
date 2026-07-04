# AGENTS.md

## 1. Версии

| Компонент               | Версия    | Где указано                                |
| ----------------------- | --------- | ------------------------------------------ |
| TypeScript              | 6.0.3     | корень `package.json`, `web/package.json`  |
| Node.js                 | 22.22     | отсутствует `.nvmrc` — использовать эту    |
| React                   | 19.2.7    | `web/package.json`                         |
| Mantine                 | 9.4.1     | `web/package.json`                         |
| React Router            | 7.18.1    | `web/package.json`                         |
| Vite                    | 8.1.3     | `web/package.json`                         |
| TypeSpec                | 1.13.0    | корень `package.json`                      |
| Express (запланировано) | 5.2.1     | корень `package.json`                      |
| dayjs                   | 1.11.21   | `web/package.json`                         |
| openapi-fetch           | 0.17.0    | `web/package.json`                         |
| @tabler/icons-react     | 3.44.0    | `web/package.json`                         |

- Целевой стандарт: ES2022, ESM Modules (`"type": "module"` в обоих `package.json`).

## 2. Директории и назначение

### Существующие

| Путь              | Назначение                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| `main.tsp`        | ⚠ Единственный источник правды API. Только тут редактировать модели и роуты.   |
| `tspconfig.yaml`  | Конфиг TypeSpec — указывает эмиттер `@typespec/openapi3` и выходной файл.       |
| `openapi.yaml`    | ⚠ АВТОГЕНЕРАЦИЯ из `main.tsp`. НЕ редактировать руками.                        |
| `web/`            | React SPA — единственное работающее приложение.                                 |
| `web/public/`     | Статика: `openapi.yaml` (симлинк на корневой) и `swagger.html`.                 |
| `web/src/`        | Исходный код фронтенда.                                                         |
| `web/src/api/`    | Типизированная обёртка над `fetch` для вызовов API.                             |
| `web/src/types/`  | `api.ts` — автогенерация типов из OpenAPI (НЕ редактировать).                   |
| `web/src/pages/`  | Компоненты страниц: Dashboard, Availability, EventTypeCreate, Booking, ConfirmedPage. |
| `web/src/components/` | Переиспользуемые компоненты: Layout, AvailabilityEditor.                    |
| `plans/`          | Архитектурный план MVP: схема БД, алгоритм слотов, план тестирования.           |
| `Makefile`        | Единая точка входа для команд разработки.                                       |

### НЕ трогать / игнорировать

| Путь   | Почему                                                                          |
| ------ | ------------------------------------------------------------------------------- |
| `dist/`| Старые скомпилированные артефакты pre-TypeSpec-сервера. Игнорировать.           |

### Запланированное (НЕ существует)

| Путь     | Что будет                                     |
| -------- | --------------------------------------------- |
| `server/`| Express 5 + SQLite (Drizzle) + `luxon`        |

## 3. Архитектурные правила и конвенции

- **Единственный источник правды:** `main.tsp`. Любое изменение API начинается с правки `main.tsp`, затем `make spec` для регенерации `openapi.yaml`.
- **Никогда не редактировать руками:** `openapi.yaml`, `web/src/types/api.ts`. Это автогенерируемые файлы. Тикет работает через `main.tsp`.
- **Пайплайн кодогенерации (строгий порядок):**
  ```
  main.tsp → tsp compile . → openapi.yaml → openapi-typescript → web/src/types/api.ts
  ```
- **Фронтенд первым:** `server/` ещё не существует. Вся разработка ведётся с Prism mock-сервером (порт 4010). Реальный бэкенд — после того, как фронтенд заработает end-to-end против моков.
- **Vite Proxy:** `/api` → Prism `:4010` (dev), позже → Express `:3000`. Конфиг: `web/vite.config.ts`.
- **Mantine CSS:** стили должны быть импортированы и в `index.css`, и в `main.tsx`. Обязательно. `postcss-preset-mantine` в `postcss.config.cjs`.
- **API клиент:** `web/src/api/client.ts` — единственная точка вызова API. Все запросы типизированы через `web/src/types/api.ts`.
- **Нет линтера:** ESLint/Prettier не настроены. При проверке кода ориентироваться на `tsc` и визуальное соответствие существующему стилю.
- **Нет тестов:** фреймворк тестирования не настроен (сервер запланирован). Проверка качества — `cd web && npm run build` (TypeScript + Vite билд проходят без ошибок).

## 4. Автогенерируемые файлы

| Файл                      | Источник        | Команда обновления       | Примечание                                 |
| ------------------------- | --------------- | ------------------------ | ------------------------------------------ |
| `openapi.yaml`            | `main.tsp`      | `make spec`              | Компиляция TypeSpec.                       |
| `web/src/types/api.ts`    | `openapi.yaml`  | `make types`             | Запускает `spec` + `openapi-typescript`.   |
| `dist/`                   | —               | —                        | Устаревший — игнорировать.                 |

Кратко: после изменения `main.tsp` → `make types` (перегенерирует и OpenAPI-спеку, и TS-типы).

## 5. Команды проверки

| Что проверяем             | Команда                                       |
| ------------------------- | --------------------------------------------- |
| Компиляция TypeSpec       | `make spec`                                   |
| Типы фронтенда (TypeScript) | `cd web && npx tsc`                         |
| Сборка фронтенда (tsc + Vite) | `cd web && npm run build`                |
| Полная кодогенерация      | `make types`                                  |
| Тикет-компиляция (watch)  | `make spec-watch`                             |

**Нет доступных команд для:**
- линтера (не настроен);
- тестов (`server/` не существует, `make test` сломается);
- `make install`, `make build`, `make db-reset` (все ссылаются на отсутствующий `server/`).

Золотое правило проверки изменений: `make spec && cd web && npm run build`.

## 6. Dev Workflow (3 терминала)

```bash
make spec-watch   # T1: автоперекомпиляция TypeSpec
make mock         # T2: Prism mock server на :4010
make dev          # T3: Vite dev server (прокси /api → :4010)
```
