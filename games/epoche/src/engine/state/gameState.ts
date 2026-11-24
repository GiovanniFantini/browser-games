export interface AttributeState {
  readonly value: number;
  readonly pressure: number;
  readonly active: boolean;
  readonly history: readonly number[];
}

export interface PolicyState {
  readonly target: number;
  readonly effective: number;
  readonly changedAtYear: number;
}

export interface AttributeModifier {
  readonly id: string;
  readonly until: number;
  readonly effects: Readonly<Record<string, number>>;
}

export interface GameState {
  readonly eraOrigin?:
    { readonly tick: number; readonly year: number } | undefined;
  readonly modifiers?: readonly AttributeModifier[] | undefined;
  readonly version: 1;
  readonly seed: number;
  readonly rngState: number;
  readonly tick: number;
  readonly year: number;
  readonly eraId: string;
  readonly attributes: Readonly<Record<string, AttributeState>>;
  readonly policies: Readonly<Record<string, PolicyState>>;
  readonly population: number;
  readonly complexity: number;
  readonly complexityTierId: string;
  readonly influence: number;
  readonly legitimacy: number;
}

export function stateEntry<T>(
  entries: Readonly<Record<string, T>>,
  id: string,
): T {
  const value = Object.hasOwn(entries, id) ? entries[id] : undefined;
  if (value === undefined) throw new Error("Unknown state entry: " + id);
  return value;
}
