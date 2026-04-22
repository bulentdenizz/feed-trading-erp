import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

let db: Database.Database | null = null;

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'erp.db');

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // TODO: Schema oluştur (Section 3'teki SQL'i buraya kopyala)

  console.log('[DB] Initialized:', dbPath);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}