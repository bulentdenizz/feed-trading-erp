import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { createSchema } from './schema';
import { AuthService } from '../services/AuthService';

let db: Database.Database | null = null;

export async function initDb(): Promise<Database.Database> {
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
      const authService = new AuthService(db);
      const passwordHash = await authService.hashPassword('Admin@123456');

      db.prepare(`
        INSERT INTO users (username, role, password_hash)
        VALUES ('admin', 'admin', ?)
      `).run(passwordHash);

      console.log("[DB] Admin user created with hashed password");
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