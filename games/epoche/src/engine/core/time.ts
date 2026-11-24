export const TICKS_PER_SECOND = 10;

export function yearsPerTick(yearsPerMinute: number): number {
  return yearsPerMinute / (60 * TICKS_PER_SECOND);
}

export function formatYear(year: number): { value: number; era: "BCE" | "CE" } {
  return year < 0
    ? { value: Math.ceil(-year), era: "BCE" }
    : { value: Math.max(1, Math.floor(year)), era: "CE" };
}
