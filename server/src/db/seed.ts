import Database from "better-sqlite3";

const DEFAULT_USER = {
  username: "alex",
  displayName: "Alex Sokolov",
  timezone: "Europe/Moscow",
};

export function seed(sqlite: Database.Database) {
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO users (username, display_name, timezone) VALUES (?, ?, ?)`,
    )
    .run(DEFAULT_USER.username, DEFAULT_USER.displayName, DEFAULT_USER.timezone);

  console.log("[seed] Default user ensured:", DEFAULT_USER.username);
}
