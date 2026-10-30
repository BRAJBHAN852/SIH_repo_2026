import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from './seed';

// Ensure data directory exists
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : (process.env.DATA_DIR || path.join(process.cwd(), 'data'));

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create DATA_DIR:', err);
  }
}

const DB_PATH = path.join(DATA_DIR, 'small_business_brain.db');

// If running in a serverless environment like Vercel, copy the pre-seeded DB from the project root to /tmp if needed
const SEEDED_SOURCE = path.join(process.cwd(), 'data', 'small_business_brain.db');
if (process.env.VERCEL && !fs.existsSync(DB_PATH) && fs.existsSync(SEEDED_SOURCE)) {
  try {
    fs.copyFileSync(SEEDED_SOURCE, DB_PATH);
  } catch (err) {
    console.warn('Could not copy initial DB to /tmp, will initialize freshly:', err);
  }
}

// Global database instance to avoid multiple connection issues in development
declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__dbInstance) {
    let db: Database.Database;

    try {
      db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      seedDatabase(db, false);
    } catch (err) {
      console.error(`Database initialization at ${DB_PATH} failed, falling back to /tmp/data:`, err);
      const fallbackDir = path.join('/tmp', 'data');
      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
        } catch (e) {
          console.error('Could not create fallback directory:', e);
        }
      }
      const fallbackPath = path.join(fallbackDir, 'small_business_brain.db');
      if (fs.existsSync(SEEDED_SOURCE) && !fs.existsSync(fallbackPath)) {
        try {
          fs.copyFileSync(SEEDED_SOURCE, fallbackPath);
        } catch (e) {
          console.warn('Could not copy seeded db to fallback path:', e);
        }
      }
      db = new Database(fallbackPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      seedDatabase(db, false);
    }

    global.__dbInstance = db;
  }

  return global.__dbInstance;
}

export function reseedDatabase(): void {
  const db = getDb();
  seedDatabase(db, true);
}
