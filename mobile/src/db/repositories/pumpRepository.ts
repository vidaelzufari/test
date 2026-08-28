import { getDatabase } from "../client";
import { generateId } from "../id";
import { PumpEvent } from "../types";

interface PumpRow {
  id: string;
  baby_id: string;
  started_at: string;
  left_ml: number | null;
  right_ml: number | null;
  total_ml: number | null;
  needs_detail: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: PumpRow): PumpEvent {
  return {
    id: row.id,
    babyId: row.baby_id,
    startedAt: row.started_at,
    leftMl: row.left_ml,
    rightMl: row.right_ml,
    totalMl: row.total_ml,
    needsDetail: row.needs_detail === 1,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const pumpRepository = {
  listByBaby(babyId: string, limit = 200): PumpEvent[] {
    const rows = getDatabase().getAllSync<PumpRow>(
      "SELECT * FROM pump_events WHERE baby_id = ? ORDER BY started_at DESC LIMIT ?;",
      [babyId, limit]
    );
    return rows.map(fromRow);
  },

  /** Instant save with no ml yet — the detail screen is always dismissible. */
  logPending(babyId: string, startedAt: Date = new Date()): PumpEvent {
    const db = getDatabase();
    const now = new Date().toISOString();
    const event: PumpEvent = {
      id: generateId(),
      babyId,
      startedAt: startedAt.toISOString(),
      leftMl: null,
      rightMl: null,
      totalMl: null,
      needsDetail: true,
      note: null,
      createdAt: now,
      updatedAt: now,
    };
    db.runSync(
      "INSERT INTO pump_events (id, baby_id, started_at, left_ml, right_ml, total_ml, needs_detail, note, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, NULL, 1, NULL, ?, ?);",
      [event.id, event.babyId, event.startedAt, event.createdAt, event.updatedAt]
    );
    return event;
  },

  addDetail(id: string, leftMl: number | null, rightMl: number | null): void {
    const db = getDatabase();
    const totalMl = (leftMl ?? 0) + (rightMl ?? 0);
    const updatedAt = new Date().toISOString();
    db.runSync(
      "UPDATE pump_events SET left_ml = ?, right_ml = ?, total_ml = ?, needs_detail = 0, updated_at = ? WHERE id = ?;",
      [leftMl, rightMl, totalMl, updatedAt, id]
    );
  },

  update(
    id: string,
    patch: Partial<Pick<PumpEvent, "startedAt" | "leftMl" | "rightMl" | "note">>
  ): void {
    const db = getDatabase();
    const row = db.getFirstSync<PumpRow>("SELECT * FROM pump_events WHERE id = ?;", [id]);
    if (!row) return;
    const current = fromRow(row);
    const next = { ...current, ...patch };
    const totalMl = next.leftMl !== null || next.rightMl !== null ? (next.leftMl ?? 0) + (next.rightMl ?? 0) : null;
    const needsDetail = totalMl === null;
    const updatedAt = new Date().toISOString();
    db.runSync(
      "UPDATE pump_events SET started_at = ?, left_ml = ?, right_ml = ?, total_ml = ?, needs_detail = ?, note = ?, updated_at = ? WHERE id = ?;",
      [next.startedAt, next.leftMl, next.rightMl, totalMl, needsDetail ? 1 : 0, next.note, updatedAt, id]
    );
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM pump_events WHERE id = ?;", [id]);
  },
};
