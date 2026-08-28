export type NursingSide = "left" | "right" | "both" | "unknown";
export type MilkType = "breast_milk" | "formula";
export type StashLocation = "counter" | "fridge" | "freezer";
export type StashStatus = "available" | "thawed" | "used" | "discarded";

export interface Baby {
  id: string;
  name: string;
  photoUri: string | null;
  dateOfBirth: string; // ISO date (yyyy-MM-dd)
  sortOrder: number;
  createdAt: string; // ISO datetime
}

export interface WeightEntry {
  id: string;
  babyId: string;
  weightGrams: number;
  measuredAt: string; // ISO datetime
  createdAt: string;
}

export interface NursingSession {
  id: string;
  babyId: string;
  side: NursingSide;
  startedAt: string; // ISO datetime
  endedAt: string | null; // null while in progress
  durationSeconds: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PumpEvent {
  id: string;
  babyId: string;
  startedAt: string;
  leftMl: number | null;
  rightMl: number | null;
  totalMl: number | null;
  needsDetail: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BottleEvent {
  id: string;
  babyId: string;
  ml: number | null;
  milkType: MilkType;
  needsDetail: boolean;
  stashItemId: string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StashItem {
  id: string;
  babyId: string;
  ml: number;
  milkType: MilkType;
  pumpedAt: string;
  location: StashLocation;
  status: StashStatus;
  thawedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
