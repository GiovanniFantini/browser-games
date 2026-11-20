import effects from "../../docs/dati-effetti-combattimento.json";
import type { CombatEnemy, TimedEffect } from "./types";

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
export const activeEffect = (effect: TimedEffect, time: number): boolean =>
  effect.from <= time && time < effect.until;
export const strongest = (items: readonly TimedEffect[], time: number): number =>
  Math.max(0, ...items.filter(effect => activeEffect(effect, time)).map(effect => effect.strength));
export function physicalDamage(base: number, protection: number, reduction = 0, penetration = 0): number {
  return base * (1 - clamp(protection - reduction - penetration, 0, 100) / 100);
}
export function movementMultiplier(enemy: CombatEnemy, time: number): number {
  if (enemy.rootFrom <= time && time < enemy.rootUntil) return 0;
  return (1 - clamp(strongest(enemy.slows, time), 0, effects.slowCap)) *
    Math.max(1, strongest(enemy.celerity, time));
}
export function renewEffect(items: TimedEffect[], next: TimedEffect): void {
  const existing = items.findIndex(effect => effect.source === next.source &&
    effect.node === next.node && effect.strength === next.strength);
  if (existing >= 0) items[existing] = next;
  else items.push(next);
}
export function integratedStrongest(items: readonly TimedEffect[], from: number, until: number): number {
  const boundaries = [...new Set([from, until, ...items.flatMap(effect =>
    [effect.from, effect.until].filter(time => time > from && time < until))])].sort((a,b) => a-b);
  let integral = 0;
  for (let i = 1; i < boundaries.length; i++) {
    const a = boundaries[i-1]!, b = boundaries[i]!;
    integral += strongest(items, (a+b)/2) * (b-a);
  }
  return integral;
}
export function compareEnemies(a: CombatEnemy, b: CombatEnemy): number {
  return (a.traveller.path.length-a.traveller.distance) - (b.traveller.path.length-b.traveller.distance) ||
    a.traveller.entryOrder-b.traveller.entryOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
