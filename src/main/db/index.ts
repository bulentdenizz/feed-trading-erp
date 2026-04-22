import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { createSchema } from './schema';

let db: Database.Database | null = null;

export function initDb() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'erp.db');

    console.log("[DB] Path:", dbPath);

    db = new Database(dbPath);

    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    console.log("[DB] Creating schema...");
    createSchema(db);

    console.log("[DB] Checking admin user...");

    const adminCheck = db
      .prepare("SELECT * FROM users WHERE username = 'admin'")
      .get();

    if (!adminCheck) {
      db.prepare(`
        INSERT INTO users (username, role, password_hash)
        VALUES ('admin', 'admin', 'temp_hash_1234')
      `).run();

      console.log("[DB] Admin user created");
    }

    console.log('[DB] Initialized successfully');
    return db;

  } catch (err) {
    console.error("[DB INIT ERROR]:", err);
    throw err;
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}