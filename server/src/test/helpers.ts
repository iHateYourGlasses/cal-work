import { getSqlite } from "../db/index.js";
import { createApp } from "../app.js";
import { seed } from "../db/seed.js";

export function setupTestDb() {
  const sqlite = getSqlite();
  sqlite.exec(`
    DELETE FROM bookings;
    DELETE FROM date_overrides;
    DELETE FROM availability;
    DELETE FROM event_types;
    DELETE FROM users;
  `);
  seed(sqlite);
}

export function createTestApp() {
  return createApp({ validateResponses: false });
}
