import { getDatabase } from "../client";
import { generateId } from "../id";
import { BottleEvent, MilkType } from "../types";

interface BottleRow {
  id: string;
  baby_id: string;
  ml: number | null;
  milk_type: string;
  needs_detail: number;
  stash_item_id: string | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: BottleRow): BottleEvent {
  return {
    id: row.id,
    babyId: row.baby_id,
    ml: row.ml,
    milkType: row.milk_type as MilkType,
    needsDetail: row.needs_detail === 1,
    stashItemId: row.stash_item_id,
    note: row.note,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bottleRepository = {
  listByBaby(babyId: string, limit = 200): BottleEvent[] {
    const rows = getDatabase().getAllSync<BottleRow>(
      "SELECT * FROM bottle_events WHERE baby_id = ? ORDER BY occurred_at DESC LIMIT ?;",
      [babyId, limit]
    );
    return rows.map(fromRow);
  },

  create(input: {
    babyId: string;
    ml: number | null;
    milkType: MilkType;
    stashItemId?: string | null;
    occurredAt?: Date;
  }): BottleEvent {
    const db = getDatabase();
    const now = new Date().toISOString();
    const event: BottleEvent = {
      id: generateId(),
      babyId: input.babyId,
      ml: input.ml,
      milkType: input.milkType,
      needsDetail: input.ml === null,
      stashItemId: input.stashItemId ?? null,
      note: null,
      occurredAt: (input.occurredAt ?? new Date()).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    db.runSync(
      "INSERT INTO bottle_events (id, baby_id, ml, milk_type, needs_detail, stash_item_id, note, occurred_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?);",
      [
        event.id,
        event.babyId,
        event.ml,
        event.milkType,
        event.needsDetail ? 1 : 0,
        event.stashItemId,
        event.occurredAt,
        event.createdAt,
        event.updatedAt,
      ]
    );
    return event;
  },

  update(
    id: string,
    patch: Partial<Pick<BottleEvent, "ml" | "milkType" | "occurredAt" | "note">>
  ): void {
    const db = getDatabase();
    const row = db.getFirstSync<BottleRow>("SELECT * FROM bottle_events WHERE id = ?;", [id]);
    if (!row) return;
    const current = fromRow(row);
    const next = { ...current, ...patch };
    const updatedAt = new Date().toISOString();
    db.runSync(
      "UPDATE bottle_events SET ml = ?, milk_type = ?, needs_detail = ?, occurred_at = ?, note = ?, updated_at = ? WHERE id = ?;",
      [next.ml, next.milkType, next.ml === null ? 1 : 0, next.occurredAt, next.note, updatedAt, id]
    );
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM bottle_events WHERE id = ?;", [id]);
  },
};
