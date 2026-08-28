import { getDatabase } from "../client";
import { generateId } from "../id";
import { WeightEntry } from "../types";

interface WeightRow {
  id: string;
  baby_id: string;
  weight_grams: number;
  measured_at: string;
  created_at: string;
}

function fromRow(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    babyId: row.baby_id,
    weightGrams: row.weight_grams,
    measuredAt: row.measured_at,
    createdAt: row.created_at,
  };
}

export const weightRepository = {
  listByBaby(babyId: string): WeightEntry[] {
    return getDatabase()
      .getAllSync<WeightRow>("SELECT * FROM weight_entries WHERE baby_id = ? ORDER BY measured_at ASC;", [babyId])
      .map(fromRow);
  },

  create(babyId: string, weightGrams: number, measuredAt: Date = new Date()): WeightEntry {
    const db = getDatabase();
    const entry: WeightEntry = {
      id: generateId(),
      babyId,
      weightGrams,
      measuredAt: measuredAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.runSync(
      "INSERT INTO weight_entries (id, baby_id, weight_grams, measured_at, created_at) VALUES (?, ?, ?, ?, ?);",
      [entry.id, entry.babyId, entry.weightGrams, entry.measuredAt, entry.createdAt]
    );
    return entry;
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM weight_entries WHERE id = ?;", [id]);
  },
};
