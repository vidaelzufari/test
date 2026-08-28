import * as SQLite from "expo-sqlite";
import { migrations, LATEST_SCHEMA_VERSION } from "./schema";

const DB_NAME = "nursing_queen.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (once) and migrates the local database. Every write in the app goes
 * through this connection so the data is durable across app kills — SQLite
 * commits are synchronous on disk per transaction, there is no in-memory
 * buffer to lose.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (dbInstance) return dbInstance;
  dbInstance = SQLite.openDatabaseSync(DB_NAME);
  dbInstance.execSync("PRAGMA journal_mode = WAL;");
  dbInstance.execSync("PRAGMA foreign_keys = ON;");
  runMigrations(dbInstance);
  return dbInstance;
}

function runMigrations(db: SQLite.SQLiteDatabase): void {
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version;");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= LATEST_SCHEMA_VERSION) return;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    db.withTransactionSync(() => {
      for (const statement of migration.statements) {
        db.execSync(statement);
      }
      db.execSync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}

/** Test-only: forces a fresh in-memory-equivalent handle on next getDatabase() call. */
export function __resetDatabaseForTests(): void {
  dbInstance = null;
}
