import { eventsById, traditionLifetime } from "@content/campaign/definitions";
import type { Doctrine, Family, GameEvent, HeritageSite, Tradition, Trait } from "@content/campaign/definitions";
import type { GameState } from "../state/gameState";

export type Pace = "standard" | "rapid";
export type GenesisChoices = [number, number, number, number];
export type Archetype = "river" | "hill" | "wood" | "coast";
export type Treaty = "none" | "trade" | "truce" | "alliance" | "tribute";
export type Objective = "raid" | "defend" | "tribute" | "conquer";

export interface Identity {
  name: string;
  archetype: Archetype;
  traits: Record<Trait, number>;
  revealed: Trait[];
}
export interface Region {
  id: number;
  column: number;
  row: number;
  terrain: "water" | "plain" | "woods" | "hills";
  owner: string | null;
}
export interface Rival {
  id: string;
  identity: Identity;
  core: GameState;
  relation: number;
  treaty: Treaty;
  truceUntil?: number | undefined;
}
export interface War {
  rival: string;
  objective: Objective;
  posture: number;
  commitment: number;
  front: number;
  fatigue: number;
  started: number;
}
export interface Crisis {
  family: Family;
  severity: number;
}
export interface ChronicleEntry {
  id: number;
  year: number;
  era: string;
  key: string;
  name?: string | undefined;
  nameKey?: string | undefined;
  eventKey?: string | undefined;
  setting?: number | undefined;
  consequenceKey?: string | undefined;
  result?: string | undefined;
}
export interface PendingEvent {
  id: string;
  openedAt: number;
}
export type Outcome =
  | { kind: "dark" }
  | { kind: "fragment"; names: [string, string] }
  | { kind: "conquest"; rival: string }
  | { kind: "collapse"; family: Family }
  | { kind: "extinction" | "transcendence" };

export interface DeferredCost {
  due: number;
  family: Family;
  source: string;
  points: number;
}

export interface Campaign {
  rules: "current" | "trial";
  version: 2;
  pace: Pace;
  id: string;
  seed: number;
  choices: GenesisChoices;
  random: number;
  core: GameState;
  identity: Identity;
  regions: Region[];
  rivals: Rival[];
  chronicle: ChronicleEntry[];
  heritage: HeritageSite[];
  renewedIn: Partial<Record<Tradition, number>>;
  sequence: number;
  crises: Crisis[];
  deferred: DeferredCost[];
  cooldowns: Record<string, number>;
  chain: { id: string; at: number }[];
  pending: PendingEvent | null;
  outcome: Outcome | null;
  war: War | null;
  doctrine: Doctrine;
  legacy: number;
  highestEra: number;
  dormantUntil: number | null;
  structuralProtection: number;
}

export function dormantTicks(campaign: Campaign): number {
  return Math.max(
    0,
    (campaign.dormantUntil ?? campaign.core.tick) - campaign.core.tick,
  );
}

export function remainingTradition(campaign: Campaign, site: Tradition) {
  return Math.max(0, traditionLifetime - (campaign.highestEra - (campaign.renewedIn[site] ?? campaign.highestEra)));
}

export function availableResponses(campaign: Campaign, event: GameEvent) {
  const severity = campaign.crises.find(crisis => crisis.family === event.family)?.severity ?? 0;
  return event.responses.filter(response => !response.requires || campaign.heritage.includes(response.requires))
    .map(response => response.overload && severity >= response.overload.at
      ? { ...response, recovery: 0, strain: { family: event.family, points: response.overload.points },
          consequenceKey: response.consequenceKey + ".overload" }
      : response);
}

export function responseRisk(campaign: Campaign, response: GameEvent["responses"][number]) {
  if (!response.strain) return null;
  const { family, points } = response.strain;
  const before = campaign.crises.find(crisis => crisis.family === family)?.severity ?? 0;
  return { family, before, after: Math.min(100, before + points) };
}

export function urgentDecision(campaign: Campaign): boolean {
  const event = eventsById.get(campaign.pending?.id ?? "");
  return !!event && ((campaign.rules === "trial" && event.id === "ledger") || event.decisive || availableResponses(campaign, event).some(response =>
    response.cost <= campaign.core.influence && responseRisk(campaign, response)?.after === 100
  ));
}

export function campaignActionBlock(
  campaign: Campaign,
): "decision" | "dormant" | null {
  if (urgentDecision(campaign) || campaign.outcome) return "decision";
  return dormantTicks(campaign) ? "dormant" : null;
}

export type CampaignAction =
  | { type: "RESPOND"; choice: number; eventId?: string; openedAt?: number }
  | { type: "ADVANCE" }
  | { type: "DOCTRINE"; doctrine: Doctrine }
  | {
      type: "PACT";
      rival: string;
      treaty: "trade" | "truce" | "alliance" | "aid";
    }
  | {
      type: "WAR";
      rival: string;
      objective: Objective;
      posture: number;
      commitment: number;
    }
  | { type: "WAR_POLICY"; posture: number; commitment: number }
  | { type: "PEACE" }
  | { type: "OUTCOME"; choice: number };

export type StartCampaign = {
  rules?: Campaign["rules"];
  id: string;
  seed: number;
  choices: GenesisChoices;
  inherited: number;
  pace?: Pace;
};

export type QueuedPolicy = { policyId: string; value: number };

export interface AbsenceReport {
  years: number;
  populationBefore: number;
  populationAfter: number;
  doctrineCost: number;
  awaySeconds: number;
  recoveredSeconds: number;
  speed: number;
  influenceBefore: number;
  influenceAfter: number;
  legitimacyBefore: number;
  legitimacyAfter: number;
  entries: number;
  stopped: boolean;
}
