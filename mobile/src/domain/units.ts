export type VolumeUnit = "ml" | "oz";

const ML_PER_OZ = 29.5735;

/** Rounds to a sensible display precision per unit (whole ml, one decimal oz). */
export function mlToDisplay(ml: number, unit: VolumeUnit): number {
  if (unit === "ml") return Math.round(ml);
  return Math.round((ml / ML_PER_OZ) * 10) / 10;
}

export function displayToMl(value: number, unit: VolumeUnit): number {
  if (unit === "ml") return Math.round(value);
  return Math.round(value * ML_PER_OZ);
}

export function formatVolume(ml: number, unit: VolumeUnit): string {
  const value = mlToDisplay(ml, unit);
  return `${value} ${unit}`;
}
