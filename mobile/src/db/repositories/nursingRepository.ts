import { getDatabase } from "../client";
import { generateId } from "../id";
import { NursingSession, NursingSide } from "../types";

interface NursingRow {
  id: string;
  baby_id: string;
  side: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: NursingRow): NursingSession {
  return {
    id: row.id,
    babyId: row.baby_id,
    side: row.side as NursingSide,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const nursingRepository = {
  listByBaby(babyId: string, limit = 200): NursingSession[] {
    const rows = getDatabase().getAllSync<NursingRow>(
      "SELECT * FROM nursing_sessions WHERE baby_id = ? ORDER BY started_at DESC LIMIT ?;",
      [babyId, limit]
    );
    return rows.map(fromRow);
  },

  getOpenSession(babyId: string): NursingSession | null {
    const row = getDatabase().getFirstSync<NursingRow>(
      "SELECT * FROM nursing_sessions WHERE baby_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1;",
      [babyId]
    );
    return row ? fromRow(row) : null;
  },

  /** Zero-friction capture: one tap, saved instantly, side defaults to "unknown" (editable later). */
  startSession(babyId: string, side: NursingSide = "unknown"): NursingSession {
    const db = getDatabase();
    const now = new Date().toISOString();
    const session: NursingSession = {
      id: generateId(),
      babyId,
      side,
      startedAt: now,
      endedAt: null,
      durationSeconds: null,
      note: null,
      createdAt: now,
      updatedAt: now,
    };
    db.runSync(
      "INSERT INTO nursing_sessions (id, baby_id, side, started_at, ended_at, duration_seconds, note, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?);",
      [session.id, session.babyId, session.side, session.startedAt, session.createdAt, session.updatedAt]
    );
    return session;
  },

  stopSession(sessionId: string, endedAt: Date = new Date()): NursingSession | null {
    const db = getDatabase();
    const row = db.getFirstSync<NursingRow>("SELECT * FROM nursing_sessions WHERE id = ?;", [sessionId]);
    if (!row) return null;
    const started = new Date(row.started_at).getTime();
    const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - started) / 1000));
    const updatedAt = new Date().toISOString();
    db.runSync(
      "UPDATE nursing_sessions SET ended_at = ?, duration_seconds = ?, updated_at = ? WHERE id = ?;",
      [endedAt.toISOString(), durationSeconds, updatedAt, sessionId]
    );
    return fromRow({ ...row, ended_at: endedAt.toISOString(), duration_seconds: durationSeconds, updated_at: updatedAt });
  },

  /** Logs an already-completed session (used for quick 5/10/15/20 min presets when nothing is open). */
  logCompletedSession(
    babyId: string,
    durationSeconds: number,
    side: NursingSide = "unknown",
    endedAt: Date = new Date()
  ): NursingSession {
    const db = getDatabase();
    const startedAt = new Date(endedAt.getTime() - durationSeconds * 1000);
    const now = new Date().toISOString();
    const session: NursingSession = {
      id: generateId(),
      babyId,
      side,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
      note: null,
      createdAt: now,
      updatedAt: now,
    };
    db.runSync(
      "INSERT INTO nursing_sessions (id, baby_id, side, started_at, ended_at, duration_seconds, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?);",
      [
        session.id,
        session.babyId,
        session.side,
        session.startedAt,
        session.endedAt,
        session.durationSeconds,
        session.createdAt,
        session.updatedAt,
      ]
    );
    return session;
  },

  update(
    id: string,
    patch: Partial<Pick<NursingSession, "side" | "startedAt" | "endedAt" | "durationSeconds" | "note">>
  ): void {
    const db = getDatabase();
    const row = db.getFirstSync<NursingRow>("SELECT * FROM nursing_sessions WHERE id = ?;", [id]);
    if (!row) return;
    const current = fromRow(row);
    const next = { ...current, ...patch };
    const updatedAt = new Date().toISOString();
    db.runSync(
      "UPDATE nursing_sessions SET side = ?, started_at = ?, ended_at = ?, duration_seconds = ?, note = ?, updated_at = ? WHERE id = ?;",
      [next.side, next.startedAt, next.endedAt, next.durationSeconds, next.note, updatedAt, id]
    );
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM nursing_sessions WHERE id = ?;", [id]);
  },
};
