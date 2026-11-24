export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  getState(): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  }

  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    getState: () => state,
  };
}

export const restoreRng = createRng;
