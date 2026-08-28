import { getDatabase } from "../client";
import { generateId } from "../id";
import { MilkType, StashItem, StashLocation, StashStatus } from "../types";

interface StashRow {
  id: string;
  baby_id: string;
  ml: number;
  milk_type: string;
  pumped_at: string;
  location: string;
  status: string;
  thawed_at: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(row: StashRow): StashItem {
  return {
    id: row.id,
    babyId: row.baby_id,
    ml: row.ml,
    milkType: row.milk_type as MilkType,
    pumpedAt: row.pumped_at,
    location: row.location as StashLocation,
    status: row.status as StashStatus,
    thawedAt: row.thawed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const stashRepository = {
  listByBaby(babyId: string, statuses?: StashStatus[]): StashItem[] {
    const db = getDatabase();
    if (!statuses || statuses.length === 0) {
      return db
        .getAllSync<StashRow>("SELECT * FROM stash_items WHERE baby_id = ? ORDER BY pumped_at ASC;", [babyId])
        .map(fromRow);
    }
    const placeholders = statuses.map(() => "?").join(", ");
    return db
      .getAllSync<StashRow>(
        `SELECT * FROM stash_items WHERE baby_id = ? AND status IN (${placeholders}) ORDER BY pumped_at ASC;`,
        [babyId, ...statuses]
      )
      .map(fromRow);
  },

  create(input: {
    babyId: string;
    ml: number;
    milkType: MilkType;
    pumpedAt: Date;
    location: StashLocation;
  }): StashItem {
    const db = getDatabase();
    const now = new Date().toISOString();
    const item: StashItem = {
      id: generateId(),
      babyId: input.babyId,
      ml: input.ml,
      milkType: input.milkType,
      pumpedAt: input.pumpedAt.toISOString(),
      location: input.location,
      status: "available",
      thawedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    db.runSync(
      "INSERT INTO stash_items (id, baby_id, ml, milk_type, pumped_at, location, status, thawed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'available', NULL, ?, ?);",
      [item.id, item.babyId, item.ml, item.milkType, item.pumpedAt, item.location, item.createdAt, item.updatedAt]
    );
    return item;
  },

  setStatus(id: string, status: StashStatus, thawedAt?: Date | null): void {
    const db = getDatabase();
    const updatedAt = new Date().toISOString();
    db.runSync("UPDATE stash_items SET status = ?, thawed_at = ?, updated_at = ? WHERE id = ?;", [
      status,
      thawedAt === undefined ? null : thawedAt?.toISOString() ?? null,
      updatedAt,
      id,
    ]);
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM stash_items WHERE id = ?;", [id]);
  },
};
