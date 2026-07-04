.PHONY: spec spec-watch types mock dev dev-backend build test test-watch install clean db-reset swagger all

# ─── TypeSpec ──────────────────────────────────────────────

spec:           ## Compile main.tsp → openapi.yaml (symlinked to web/public/)
	npx tsp compile .

spec-watch:     ## Watch mode: auto-recompile on change
	npx tsp compile . --watch

# ─── TypeScript Types ──────────────────────────────────────

types: spec     ## Generate TS types from openapi.yaml → web/src/types/api.ts
	npx openapi-typescript openapi.yaml -o web/src/types/api.ts

# ─── Mock Server ───────────────────────────────────────────

mock: spec      ## Start Prism mock server on port 4010
	npx @stoplight/prism-cli mock openapi.yaml --port 4010

# ─── Development ───────────────────────────────────────────

dev: spec       ## Start frontend dev server (requires `make mock` in another terminal)
	cd web && npm run dev

dev-backend:    ## Start Express backend on :3000
	cd server && npm run dev

# ─── Build ─────────────────────────────────────────────────

build: types    ## Build TypeScript for both server and web
	cd server && npm run build
	cd web && npm run build

# ─── Testing ───────────────────────────────────────────────

test:           ## Run all tests
	cd server && npm test

test-watch:     ## Run tests in watch mode
	cd server && npm run test:watch

# ─── API Docs ──────────────────────────────────────────────

swagger: spec   ## Open Swagger UI at http://localhost:5173/swagger.html
	@echo "Open http://localhost:5173/swagger.html (requires 'make dev')"

# ─── Maintenance ───────────────────────────────────────────

install:        ## Install all dependencies (root + server + web)
	npm install
	cd server && npm install
	cd web && npm install

clean:          ## Remove build artifacts and dependencies
	rm -rf server/dist web/dist
	rm -rf node_modules server/node_modules web/node_modules

db-reset:       ## Reset SQLite database (delete data.db)
	rm -f server/data.db server/data.db-wal server/data.db-shm
	cd server && npx drizzle-kit push

# ─── All-in-One ────────────────────────────────────────────

all: types mock dev  ## Start the full stack: types → mock → frontend
