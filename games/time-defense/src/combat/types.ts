import type { Point } from "../field/geometry";
import type { Traveller } from "../movement/traveller";

export interface EnemyDefinition {
  readonly id: string;
  readonly name: string;
  readonly charge: number;
  readonly physicalProtection: number;
  readonly sporeProtection: number;
  readonly reward: number;
  readonly support: boolean;
  readonly boss?: boolean;
  readonly stabilityLoss?: number;
  readonly instantDefeatOnEscape?: boolean;
}
export interface TimedEffect {
  readonly source: string;
  readonly node: string;
  readonly strength: number;
  readonly from: number;
  readonly until: number;
}
export interface CombatEnemy {
  readonly id: string;
  readonly definition: EnemyDefinition;
  readonly enteredAt: number;
  traveller: Traveller;
  charge: number;
  damageCompensation: number;
  state: "active" | "neutralized" | "escaped";
  slows: TimedEffect[];
  spores: TimedEffect[];
  reductions: TimedEffect[];
  celerity: TimedEffect[];
  rootFrom: number;
  rootUntil: number;
  rootProtectedUntil: number;
}
export interface CombatNode {
  readonly id: string;
  readonly damage: number;
  readonly range: number;
  readonly kind: string;
  readonly targets?: number;
  readonly penetration?: number;
  readonly area?: number;
  readonly duration?: number;
  readonly maxMarks?: number;
  readonly maxAreas?: number;
  readonly sharedReduction?: number;
  readonly reductionDuration?: number;
}
export interface AttackSnapshot {
  readonly id: number;
  readonly source: string;
  readonly node: CombatNode;
  readonly origin: Point;
  readonly targets: readonly string[];
  readonly point: Point;
}
export interface PendingImpact {
  readonly order: number;
  readonly attack: AttackSnapshot;
  readonly target: string;
  readonly started: number;
  readonly due: number;
}
export interface CombatArea extends Point {
  readonly id: number;
  readonly source: string;
  readonly node: string;
  readonly kind: "glue" | "cloud";
  readonly radius: number;
  readonly strength: number;
  readonly from: number;
  readonly until: number;
}
export interface CombatEvent {
  readonly type: "damage" | "neutralized" | "escaped" | "impact" | "miss";
  readonly at: number;
  readonly enemy: string;
  readonly source: string;
  readonly amount: number;
  readonly chargeAfter?:number;
}
