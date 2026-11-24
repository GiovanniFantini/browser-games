import {previewHearing} from "@engine/campaign/reckoning";
import { checkCampaignSeed } from "./holdout";
import { createRng } from "@engine/core/rng";
import { pathToFileURL } from "node:url";
import { loadCampaignContent } from "@content/campaign/index";
import {
  campaignEras,
  campaignTiming,
  eventsById,
} from "@content/campaign/definitions";
import type { ContentBundle } from "@content/schema";
import {
  applyCampaignAction,
  createCampaign,
  stepCampaign,
} from "@engine/campaign/campaign";
import { responsesFor } from "@engine/campaign/events";
import type { Campaign, Pace } from "@engine/campaign/model";
import { progression } from "@engine/campaign/progression";
import { reformRoutes } from "@engine/campaign/qualification";
import { eraNumber } from "@engine/campaign/world";
import type { SetPolicyCommand } from "@engine/core/commands";
import { previewPolicyChange } from "@engine/systems/policies";

export const profiles = [
  "prudence",
  "growth",
  "defence",
  "fixed",
  "passive",
] as const;
type Profile = (typeof profiles)[number];
export const responseStrategies = ["first", "random", "cautious", "foresight", "wait", "spend", "heritage", "ordinary"] as const;
export type ResponseStrategy = typeof responseStrategies[number];

type NarrativeProfile = {
  initial?: Campaign;
  rules?: Campaign["rules"];
  onDecision?: (state: Campaign) => void;
  onAdvance?: (before: Campaign, after: Campaign) => void;
  route: 0 | 1;
  extended: boolean;
  withoutFutureHeritage?: boolean;
  withoutDeferredCosts?: boolean;
  response?: ResponseStrategy;
};

export function rankResponses(before: Campaign, event: NonNullable<ReturnType<typeof eventsById.get>>,
  available: ReturnType<typeof responsesFor>, strategy: ResponseStrategy) {
  const severity = (family: string) => before.crises.find(crisis => crisis.family === family)?.severity ?? 0;
  const due = (family: string) => before.deferred.filter(entry => entry.family === family)
    .reduce((total, entry) => total + entry.points, 0);
  const closeToAdvance = before.core.tick - (before.core.eraOrigin?.tick ?? 0) >= campaignEras[eraNumber(before.core.eraId)]!.minTicks * campaignTiming(before.pace).tickScale * 0.8;
  const score = (option: typeof available[number]) => {
    const immediate = (option.strain ? severity(option.strain.family) + option.strain.points : 0)
      - Math.min(severity(event.family), option.recovery);
    if (strategy === "foresight") {
      const debt = option.defer;
      const fatal = debt && due(debt.family) + debt.points >= 100;
      return immediate + (debt?.points ?? 0) + (fatal ? 100 : 0)
        - (option.repay ? Math.min(option.repay.points, due(option.repay.family)) : 0);
    }
    if (strategy === "spend" && closeToAdvance) return immediate - 100 * option.cost;
    if (option.requires && strategy === "heritage") return immediate - 200;
    if (option.requires && strategy === "ordinary") return immediate + 200;
    return immediate;
  };
  available.sort((a, b) => score(a) - score(b) || a.cost - b.cost);
}

export function shouldWait(current: Campaign) {
  return current.deferred.some(entry =>
      current.crises.some(crisis => crisis.family === entry.family && crisis.severity > 0))
      && (current.core.tick - (current.core.eraOrigin?.tick ?? 0)) < (campaignEras[eraNumber(current.core.eraId)]!.minTicks + 1500) * campaignTiming(current.pace).tickScale;
}

type Encounters = {
  ticks: number[];
  opened: Set<string>;
  followUps: Set<string>;
  chosen: Set<string>;
};

function chooseRoute(
  campaign: Campaign,
  profile: Profile,
  content: ContentBundle,
): readonly (readonly [string, number])[] {
  const core = campaign.core;
  const stage = eraNumber(core.eraId);
  const info = campaignEras[stage]!;
  const priority = (attribute: string) => {
    const value = core.attributes[attribute]?.value ?? 10;
    const safe = ["health", "sustenance", "environment", "cohesion"].includes(
      attribute,
    );
    if (attribute === "knowledge")
      return Math.max(0.3, info.knowledge - value + 0.8);
    if (attribute === "innovation" && stage === 9)
      return Math.max(1, 12 - value);
    if (profile === "growth" && attribute === "prosperity") return 1.2;
    if (profile === "defence" && attribute === "stability") return 0.9;
    return safe ? Math.max(0.1, (11 - value) * 0.28) : 0.15;
  };
  return reformRoutes(stage)
    .map((route) => {
      const positions = route.map(
        ([id, direction]) => [id, direction === "right" ? 76 : 24] as const,
      );
      const score = positions.reduce(
        (sum, [id, value]) =>
          sum +
          (previewPolicyChange(core, content, id, value)?.effects.reduce(
            (effect, { attribute, deltaTarget }) =>
              effect + deltaTarget * priority(attribute),
            0,
          ) ?? 0),
        0,
      );
      return { positions, score };
    })
    .sort((left, right) => right.score - left.score)[0]!.positions;
}

export function runCampaign(
  content: ContentBundle,
  seed: number,
  profile: Profile,
  cap = 47000,
  pace: Pace = "rapid",
  narrative?: NarrativeProfile,
) {
  checkCampaignSeed(seed);
  let current = narrative?.initial ?? createCampaign(content, {
    id: "sim-" + seed,
    rules: narrative?.rules ?? "current",
    seed,
    choices: [
      10 + (seed % 81),
      15 + ((seed * 7) % 71),
      20 + ((seed * 13) % 61),
      25 + ((seed * 17) % 51),
    ],
    inherited: 0,
    pace,
  });
  const responseRng = createRng(seed ^ 0x51ac87);
  const remediesUsed: string[]=[];
  const selectRemedy=(state:Campaign)=>{
    if(!state.reckoning)return state;
    const options=previewHearing(state);
    const score=(v:typeof options[number])=>(v.fatal?10000:0)+Math.max(0,...v.crises.map(c=>c.severity))
      + (1-v.population)*100 + (narrative?.response==="foresight" && v.id==="renew"?18:0);
    const selected=narrative?.response==="random"?options[responseRng.int(0,options.length-1)]!:
      narrative?.response==="first"?options[0]!:options.sort((a,b)=>score(a)-score(b))[0]!;
    remediesUsed.push(selected.id);
    return applyCampaignAction(state,{type:"RECKON",token:state.reckoning.token,remedy:selected.id},content);
  };
  const fallbackRng = createRng(seed ^ 0x5c81c37);
  const futureDecisions: {
    event: string;
    tick: number;
    severity: number;
    choice: number;
    unlocked: string[];
    affordable: string[];
    used: string | null;
  }[] = [];
  const choiceCounts: Record<number, number> = {};
  let delayedCollapse: { before: number; sources: typeof current.deferred } | null = null;
  const affordableCounts: Record<number, number> = {};
  let firstUnavailable = 0;
  const path = [current.core.eraId];
  const arrived: Campaign[] = [current];
  const plans = new Map<string, ReturnType<typeof chooseRoute>>();
  const structural: string[] = [];
  const encounters = new Map<string, Encounters>();
  let milestones = 0;
  let qualifiedReforms = 0;
  let peakCrisis = 0;
  let bronzeRivalLead: number | null = null;
  const timing = campaignTiming(pace);
  for (
    let i = 0;
    i < cap &&
    current.outcome?.kind !== "transcendence" &&
    current.outcome?.kind !== "extinction" &&
    current.outcome?.kind !== "collapse";
    i++
  ) {
    for (const { severity } of current.crises)
      peakCrisis = Math.max(peakCrisis, severity);
    if(current.reckoning)current=selectRemedy(current);
    if(current.studyFinished || current.outcome?.kind==="collapse")break;
    if (current.rules === "trial" && current.pending?.id === "ledger") break;
    if (current.pending) {
      const before = current;
      if (narrative) {
        const era = current.core.eraId;
        let evidence = encounters.get(era);
        if (!evidence) {
          evidence = {
            ticks: [],
            opened: new Set(),
            followUps: new Set(),
            chosen: new Set(),
          };
          encounters.set(era, evidence);
        }
        narrative.onDecision?.(current);
        const event = eventsById.get(current.pending.id)!;
        evidence.ticks.push(current.core.tick);
        evidence.opened.add(event.id);
        const entry = current.chronicle.at(-1);
        if (entry?.key === "log.event" && entry.result === "followUp")
          evidence.followUps.add(event.id);
        const visible = responsesFor(current, event, content.attributes);
        choiceCounts[visible.length] = (choiceCounts[visible.length] ?? 0) + 1;
        const available = visible.filter(({ cost }) => cost <= current.core.influence);
        affordableCounts[available.length] = (affordableCounts[available.length] ?? 0) + 1;
        if (!available.length)
          throw new Error("No available narrative response: " + event.id);
        if (available[0]!.choice !== 0) firstUnavailable++;
        if (narrative.response && !["first","random"].includes(narrative.response)) {
          rankResponses(before, event, available, narrative.response);
        } else if (!narrative.response) {
          available.sort(
            (left, right) =>
              Number(Boolean(right.followUp)) -
                Number(Boolean(left.followUp)) || left.cost - right.cost,
          );
        }
        const index =
          narrative.response === "random"
            ? responseRng.int(0, available.length - 1)
            : 0;
        let selected = available[index]!;
        if (era === "future" && narrative.withoutFutureHeritage && selected.requires) {
          const ordinary = available.filter(option => !option.requires);
          selected = narrative.response === "random"
            ? ordinary[fallbackRng.int(0, ordinary.length - 1)]!
            : ordinary[0]!;
        }
        if (era === "future") {
          futureDecisions.push({
            event: event.id, tick: current.core.tick, choice: selected.choice,
            severity: before.crises.find(crisis => crisis.family === event.family)?.severity ?? 0,
            unlocked: visible.flatMap(option => option.requires ?? []),
            affordable: available.flatMap(option => option.requires ?? []),
            used: selected.requires ?? null,
          });
        }
        const { choice, followUp } = selected;
        current = applyCampaignAction(
          before,
          { type: "RESPOND", choice },
          content,
        );
        if (current === before)
          throw new Error("Response rejected: " + event.id);
        if (narrative.withoutDeferredCosts) current = { ...current, deferred: [] };
        if (followUp) evidence.chosen.add(followUp);
      } else {
        current = applyCampaignAction(
          current,
          {
            type: "RESPOND",
            choice:
              profile === "growth" ||
              (profile === "defence" && current.core.legitimacy < 52)
                ? 1
                : 0,
          },
          content,
        );
        if (current === before)
          current = applyCampaignAction(
            current,
            { type: "RESPOND", choice: eventsById.get(before.pending!.id)!.fallbackIndex },
            content,
          );
      }
    }
    if (current.outcome?.kind === "collapse") {
      peakCrisis = 100;
      break;
    }
    if (current.outcome) {
      structural.push(current.outcome.kind);
      current = applyCampaignAction(
        current,
        { type: "OUTCOME", choice: 0 },
        content,
      );
    }
    if (current.war && current.war.front > -40)
      current = applyCampaignAction(current, { type: "PEACE" }, content);
    const phase = current.core.eraId;
    const stage = eraNumber(phase);
    const ageBeforeAdvance =
      current.core.tick - (current.core.eraOrigin?.tick ?? 0);
    const minimumStay = narrative?.extended
      ? stage < 2
        ? 3_800
        : 1_300
      : campaignEras[stage]!.minTicks;
    const stillPromised =
      narrative &&
      !narrative.response &&
      current.chain.some(({ id }) => eventsById.get(id)?.era === stage);
    const progress =
      ageBeforeAdvance >= minimumStay * timing.tickScale && !stillPromised
        ? progression(current)
        : null;
    const waitingForRecovery = narrative?.response === "wait" && shouldWait(current);
    if (progress?.ready && !waitingForRecovery) {
      const next = selectRemedy(applyCampaignAction(current, { type: "ADVANCE" }, content));
      if (next.core.eraId !== phase) {
        narrative?.onAdvance?.(current, next);
        path.push(next.core.eraId);
        arrived.push(next);
        const route = progress.reforms.find((item) =>
          item.every(({ met }) => met),
        );
        if (!route) throw new Error("Era advanced without effective reforms");
        qualifiedReforms += route.length;
        milestones++;
        if (next.core.eraId === "bronze")
          bronzeRivalLead = Math.max(
            ...next.rivals.map((rival) => eraNumber(rival.core.eraId) - 2),
          );
      }
      if (next.outcome?.kind === "collapse") {
        const family = next.outcome.family;
        delayedCollapse = {
          before: current.crises.find(crisis => crisis.family === family)?.severity ?? 0,
          sources: current.deferred.filter(entry => entry.family === family && entry.due <= eraNumber(next.core.eraId)),
        };
        peakCrisis = 100;
      }
      current = next;
      if (current.outcome?.kind === "collapse") break;
      if (current.pending) continue;
      if (current.outcome?.kind === "transcendence") {
        const route = progress.reforms.find((item) =>
          item.every(({ met }) => met),
        );
        if (!route) throw new Error("Ending reached without effective reforms");
        qualifiedReforms += route.length;
        milestones++;
        break;
      }
    }
    const origin = current.core.eraOrigin?.tick ?? 0;
    const age = current.core.tick - origin;
    const phaseInfo = campaignEras[eraNumber(current.core.eraId)]!;
    if (
      (profile === "fixed" || profile === "passive") &&
      age >= (phaseInfo.minTicks + 480) * timing.tickScale
    )
      break;
    const key = current.core.eraId + ":" + origin;
    const commands: SetPolicyCommand[] = [];
    if (profile !== "passive" && age % (70 * timing.tickScale) === 0) {
      let order = plans.get(key);
      if (!order) {
        order =
          profile === "fixed"
            ? phaseInfo.policyIds.map((id) => [id, 78] as const)
            : narrative
              ? (
                  reformRoutes(eraNumber(current.core.eraId))[
                    narrative.route
                  ] ?? reformRoutes(eraNumber(current.core.eraId))[0]!
                ).map(
                  ([id, direction]) =>
                    [id, direction === "right" ? 76 : 24] as const,
                )
              : chooseRoute(current, profile, content);
        plans.set(key, order);
      }
      for (const [policyId, value] of order) {
        if (current.core.policies[policyId]?.target === value) continue;
        commands.push({
          type: "SET_POLICY",
          policyId,
          value,
          tick: current.core.tick + 1,
        });
      }
    }
    current = stepCampaign(current, commands, content).campaign;
  }
  return {
    current, remediesUsed,
    path,
    arrived,
    structural,
    milestones,
    qualifiedReforms,
    peakCrisis,
    bronzeRivalLead,
    firstUnavailable,
    choiceCounts,
    affordableCounts,
    delayedCollapse,
    futureDecisions,
    encounters: Object.fromEntries(
      Array.from(encounters, ([era, value]) => [
        era,
        {
          ticks: value.ticks,
          opened: Array.from(value.opened),
          followUps: Array.from(value.followUps),
          chosen: Array.from(value.chosen),
        },
      ]),
    ),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const pace: Pace = process.argv.includes("--standard") ? "standard" : "rapid";
  const content = loadCampaignContent(pace);
  const seeds = Number(process.argv[2] ?? 3);
  checkCampaignSeed(Math.min(seeds,1100));
  if (!Number.isInteger(seeds) || seeds <= 0)
    throw new Error("Invalid seed count");
  const comparison = process.argv.includes("--compare");
  const selection: readonly Profile[] = comparison
    ? ["prudence", "fixed", "passive"]
    : pace === "standard"
      ? ["prudence"]
      : profiles.slice(0, 3);
  const results = selection.flatMap((profile) =>
    Array.from({ length: seeds }, (_, index) => {
      const seed = index + 1;
      const {
        current,
        path,
        structural,
        milestones,
        qualifiedReforms,
        peakCrisis,
        bronzeRivalLead,
      } = runCampaign(
        content,
        seed,
        profile,
        22000 * campaignTiming(pace).tickScale,
        pace,
      );
      return {
        profile,
        seed,
        eras: new Set(path).size,
        tick: current.core.tick,
        age: current.core.eraId,
        ending: current.outcome?.kind ?? "open",
        population: Math.round(current.core.population),
        peakCrisis: Math.round(peakCrisis),
        legacy: current.legacy,
        milestones,
        qualifiedReforms,
        bronzeRivalLead,
        changes: structural.join(", "),
      };
    }),
  );
  console.table(results);
  if (
    !results.some(({ ending }) => ending === "transcendence") ||
    (comparison &&
      results.some(
        ({
          profile,
          ending,
          milestones,
          qualifiedReforms,
          eras,
          bronzeRivalLead,
        }) =>
          profile === "prudence"
            ? ending !== "transcendence" ||
              milestones !== 10 ||
              qualifiedReforms !== 19 ||
              bronzeRivalLead === null ||
              bronzeRivalLead > 2
            : eras > (profile === "fixed" ? 2 : 1),
      ))
  )
    process.exitCode = 1;
}
