import Database, { type Database as SqliteDb } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { seed } from "./seed.js";

let _db: ReturnType<typeof drizzle<typeof schema>>;
let _sqlite: SqliteDb;

const DDL = `
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY NOT NULL,
    display_name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Moscow'
  );

  CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(username),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    minimum_booking_notice INTEGER NOT NULL DEFAULT 240,
    UNIQUE(user_id, slug)
  );

  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(username),
    slots TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS date_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(username),
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('blocked', 'custom')),
    start TEXT,
    end TEXT,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type_id INTEGER NOT NULL REFERENCES event_types(id),
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`;

const MIGRATION = `ALTER TABLE event_types ADD COLUMN minimum_booking_notice INTEGER NOT NULL DEFAULT 240`;

export function getDb() {
  if (!_db) {
    const dbPath = process.env.DB_PATH || "data.db";
    _sqlite = new Database(dbPath);
    if (dbPath !== ":memory:") {
      _sqlite.pragma("journal_mode = WAL");
    }
    _sqlite.exec(DDL);
    try {
      _sqlite.exec(MIGRATION);
    } catch {
      // column already exists
    }
    _db = drizzle(_sqlite, { schema });
    seed(_sqlite);
  }
  return _db;
}

export function getSqlite(): SqliteDb {
  getDb();
  return _sqlite!;
}
