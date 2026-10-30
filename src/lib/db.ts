import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from './seed';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'small_business_brain.db');

// Global database instance to avoid multiple connection issues in development
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__dbInstance) {
    const db = new Database(DB_PATH);
    // Performance and integrity tuning
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run migrations and initial seed check
    seedDatabase(db, false);

    global.__dbInstance = db;
  }

  return global.__dbInstance;
}

export function reseedDatabase(): void {
  const db = getDb();
  seedDatabase(db, true);
}
