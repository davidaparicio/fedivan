import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || "./fedivan.db";
const db = new Database(path.resolve(dbPath));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    platform TEXT PRIMARY KEY,
    credentials_json TEXT NOT NULL,
    meta_json TEXT DEFAULT '{}'
  )
`);

export function getAccount(platform: string) {
  const row = db.prepare("SELECT * FROM accounts WHERE platform = ?").get(platform) as
    | { platform: string; credentials_json: string; meta_json: string }
    | undefined;
  if (!row) return null;
  return {
    platform: row.platform,
    credentials: JSON.parse(row.credentials_json),
    meta: JSON.parse(row.meta_json),
  };
}

export function upsertAccount(
  platform: string,
  credentials: Record<string, unknown>,
  meta: Record<string, unknown> = {}
) {
  db.prepare(
    `INSERT INTO accounts (platform, credentials_json, meta_json)
     VALUES (?, ?, ?)
     ON CONFLICT(platform) DO UPDATE SET credentials_json = excluded.credentials_json, meta_json = excluded.meta_json`
  ).run(platform, JSON.stringify(credentials), JSON.stringify(meta));
}

export function deleteAccount(platform: string) {
  db.prepare("DELETE FROM accounts WHERE platform = ?").run(platform);
}

export default db;
