export function stableStringify(
  value: unknown,
  excludedKeys: readonly string[] = [],
): string {
  const excluded = new Set(excludedKeys);
  function normalize(item: unknown): unknown {
    if (typeof item === "number" && Number.isFinite(item)) {
      return Number(item.toFixed(6));
    }
    if (Array.isArray(item)) return item.map(normalize);
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item)
          .filter(([key]) => !excluded.has(key))
          .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
          .map(([key, entry]) => [key, normalize(entry)]),
      );
    }
    return item;
  }
  return JSON.stringify(normalize(value));
}

export function hashState(state: object): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(
    stableStringify(state, ["history"]),
  )) {
    hash = Math.imul(hash ^ byte, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
