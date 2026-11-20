import type { Point } from "../field/geometry";
export interface WaveGroup {
  readonly enemy: string;
  readonly count: number;
  readonly start: number;
  readonly interval: number;
  readonly path: string;
  readonly pack?: string;
}
export interface WaveDefinition {
  readonly id: string;
  readonly name: string;
  readonly bonus: number;
  readonly groups: readonly WaveGroup[];
  readonly newEnemy?: string;
}
export interface WaveRoute {
  readonly id: string;
  readonly name: string;
  readonly points: readonly Point[];
  readonly allowedEnemies: readonly string[] | null;
}
export interface BossRequirement {
  readonly enemy: string;
  readonly count: number;
  readonly wave: number;
  readonly mustSpawn: boolean;
  readonly mustNeutralize: boolean;
  readonly escape: string;
}
export interface WaveLevel {
  readonly id: string;
  readonly name: string;
  readonly budget: number;
  readonly stability: number;
  readonly slots: readonly (Point & {readonly id:string})[];
  readonly firstEntryTowers: readonly string[];
  readonly routes: readonly WaveRoute[];
  readonly waves: readonly WaveDefinition[];
  readonly bossRequirement?: BossRequirement;
}
export type SessionPhase = "preparation" | "active" | "paused" | "intermission" | "won" | "lost";
export interface WaveResult {
  readonly outcome: "won" | "lost";
  readonly level: string;
  readonly stability: number;
  readonly initialStability: number;
  readonly cleared: number;
  readonly reason: string;
}
export interface WaveEvent {
  readonly type: "started" | "paused" | "resumed" | "returning" | "cleared" | "won" | "lost" | "speed" | "boss";
  readonly message: string;
}
