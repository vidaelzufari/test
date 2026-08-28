/**
 * Versioned migrations, applied in order via PRAGMA user_version. Never edit
 * a migration that has shipped — append a new one instead, so upgrades from
 * every prior installed version stay correct.
 */
export interface Migration {
  version: number;
  statements: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS babies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        photo_uri TEXT,
        date_of_birth TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS weight_entries (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        weight_grams INTEGER NOT NULL,
        measured_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_weight_entries_baby ON weight_entries(baby_id, measured_at);`,
      `CREATE TABLE IF NOT EXISTS nursing_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        side TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_nursing_baby_started ON nursing_sessions(baby_id, started_at);`,
      `CREATE TABLE IF NOT EXISTS pump_events (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        left_ml REAL,
        right_ml REAL,
        total_ml REAL,
        needs_detail INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_pump_baby_started ON pump_events(baby_id, started_at);`,
      `CREATE TABLE IF NOT EXISTS bottle_events (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        ml REAL,
        milk_type TEXT NOT NULL,
        needs_detail INTEGER NOT NULL DEFAULT 0,
        stash_item_id TEXT REFERENCES stash_items(id) ON DELETE SET NULL,
        note TEXT,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_bottle_baby_occurred ON bottle_events(baby_id, occurred_at);`,
      `CREATE TABLE IF NOT EXISTS stash_items (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
        ml REAL NOT NULL,
        milk_type TEXT NOT NULL,
        pumped_at TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        thawed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_stash_baby_status ON stash_items(baby_id, status, pumped_at);`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1]?.version ?? 0;
