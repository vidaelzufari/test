import { getDatabase } from "../client";
import { generateId } from "../id";
import { Baby } from "../types";

interface BabyRow {
  id: string;
  name: string;
  photo_uri: string | null;
  date_of_birth: string;
  sort_order: number;
  created_at: string;
}

function fromRow(row: BabyRow): Baby {
  return {
    id: row.id,
    name: row.name,
    photoUri: row.photo_uri,
    dateOfBirth: row.date_of_birth,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export const babyRepository = {
  listAll(): Baby[] {
    const rows = getDatabase().getAllSync<BabyRow>(
      "SELECT * FROM babies ORDER BY sort_order ASC, created_at ASC;"
    );
    return rows.map(fromRow);
  },

  getById(id: string): Baby | null {
    const row = getDatabase().getFirstSync<BabyRow>("SELECT * FROM babies WHERE id = ?;", [id]);
    return row ? fromRow(row) : null;
  },

  create(input: { name: string; dateOfBirth: string; photoUri?: string | null }): Baby {
    const db = getDatabase();
    const existingCount = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM babies;"
    )?.count ?? 0;
    const baby: Baby = {
      id: generateId(),
      name: input.name,
      photoUri: input.photoUri ?? null,
      dateOfBirth: input.dateOfBirth,
      sortOrder: existingCount,
      createdAt: new Date().toISOString(),
    };
    db.runSync(
      "INSERT INTO babies (id, name, photo_uri, date_of_birth, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?);",
      [baby.id, baby.name, baby.photoUri, baby.dateOfBirth, baby.sortOrder, baby.createdAt]
    );
    return baby;
  },

  update(id: string, patch: Partial<Pick<Baby, "name" | "dateOfBirth" | "photoUri" | "sortOrder">>): void {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return;
    const next = { ...current, ...patch };
    db.runSync(
      "UPDATE babies SET name = ?, photo_uri = ?, date_of_birth = ?, sort_order = ? WHERE id = ?;",
      [next.name, next.photoUri, next.dateOfBirth, next.sortOrder, id]
    );
  },

  delete(id: string): void {
    getDatabase().runSync("DELETE FROM babies WHERE id = ?;", [id]);
  },
};
