import { winterRules, type Remedy } from "@content/campaign/winter";
import { campaignBalance, type Family } from "@content/campaign/definitions";
import type { ContentBundle } from "@content/schema";
import type { Campaign } from "./model";
import { appendLog, advanceEra, settleDeferred } from "./progression";
import { eraNumber } from "./world";

type Hearing = NonNullable<Campaign["reckoning"]>;
function debts(state: Campaign, target: number) {
  return state.deferred.filter((cost) => cost.due <= target);
}
export function needsHearing(c: Campaign, target: number) {
  return (
    winterRules(c.rules) &&
    (eraNumber(c.core.eraId) < 2 ||
      debts(c, target).some((cost) => cost.source === "remedy.renew")) &&
    (debts(c, target).length > 0 || (target === 1 && !!c.marks.barter))
  );
}
export function openHearing(
  c: Campaign,
  target: number,
  kind: Hearing["kind"],
) {
  const hearing = { token: c.sequence + 1, target, kind };
  const next = appendLog(c, "log.hearing", { offered: offers(c, hearing) });
  return { ...next, reckoning: hearing };
}
function offers(c: Campaign, hearing: Hearing): Remedy[] {
  const { target, kind } = hearing;
  if (kind === "ledger")
    return [
      "carry",
      ...(c.marks.table ? (["condone"] as const) : []),
      ...(c.marks.table === 3 ? (["renew"] as const) : []),
      ...(c.marks.clan ? (["returnClan"] as const) : []),
      ...(c.marks.barter ? (["share"] as const) : []),
    ];
  if (target === 1 && c.marks.barter) {
    const food = debts(c, target)
      .filter((item) => item.family === "food")
      .reduce((sum, item) => sum + item.points, 0);
    return food +
      (c.crises.find((item) => item.family === "food")?.severity ?? 0) >=
      100
      ? ["isolate", "care", "seeds"]
      : ["isolate", "care"];
  }
  const due = debts(c, target);
  return due.some((cost) => cost.family === "food")
    ? ["carry", "seeds", "departure"]
    : ["carry", "levy"];
}
function change(c: Campaign, family: Family, points: number): Campaign {
  const before = c.crises.find((v) => v.family === family)?.severity ?? 0;
  const severity = Math.max(0, Math.min(100, before + points));
  return {
    ...c,
    crises: [
      ...c.crises.filter((v) => v.family !== family),
      ...(severity ? [{ family, severity }] : []),
    ],
  };
}
function adjust(c: Campaign, remedy: Remedy, h: Hearing) {
  let next: Campaign = { ...c, marks: { ...c.marks } };
  let population = 1;
  const pay = (family: Family, amount: number) => {
    next.deferred = next.deferred.flatMap((entry) => {
      if (entry.due > h.target || entry.family !== family || amount <= 0)
        return [entry];
      const used = Math.min(entry.points, amount);
      amount -= used;
      return used < entry.points
        ? [{ ...entry, points: entry.points - used }]
        : [];
    });
  };
  switch (remedy) {
    case "seeds":
      pay("food", 60);
      next.marks.field = h.target + 1;
      break;
    case "departure":
      pay("food", 70);
      population = 0.8;
      next = change(next, "clans", 15);
      next.marks.clan = Math.max(3,h.target+1);
      break;
    case "levy": {
      const due = debts(next, h.target);
      const largest = [...due].sort((a, b) => b.points - a.points)[0];
      if (largest) pay(largest.family, 35);
      population = 0.85;
      next = change(next, largest?.family === "clans" ? "food" : "clans", 18);
      break;
    }
    case "isolate":
      next = change(change(next, "health", -20), "clans", 22);
      next.marks.hut = 3;
      break;
    case "care":
      next = change(change(next, "health", -20), "food", 18);
      next.marks.unseeded = 3;
      break;
    case "condone":
      delete next.marks.table;
      next = change(change(next, "food", 17), "clans", -20);
      break;
    case "renew":
      next.marks.table = 5;
      next = change(next, "food", 12);
      break;
    case "returnClan":
      delete next.marks.clan;
      next.marks.unseeded = 4;
      population = 1.15;
      next = change(next, "food", 15);
      break;
    case "share":
      delete next.marks.barter;
      population = 1.12;
      next = change(change(next, "health", -12), "food", 14);
      break;
    case "carry":
      if (h.kind === "ledger") {
        next = change(next, "clans", 13);
        if (c.marks.barter) {
          // Families already sheltered at the thaw can settle on the stored provisions.
          population = 1.03;
          delete next.marks.barter;
        }
      }
      break;
  }
  if (h.kind === "ledger" && remedy === "renew") {
    next.deferred = [
      ...next.deferred,
      { due: h.target + 2, family: "food", points: 18, source: "remedy.renew" },
    ];
  }
  if ((remedy === "isolate" || remedy === "care") && next.winterStock > 0) {
    population += next.winterStock / 150;
    next.winterStock = 0;
  }
  return { next, population };
}
export function previewHearing(c: Campaign) {
  const h = c.reckoning;
  if (!h) return [];
  return offers(c, h).map((id) => {
    const { next, population } = adjust(c, id, h);
    const crises = next.crises.map((item) => ({ ...item }));
    if (h.kind !== "ledger")
      for (const entry of debts(next, h.target)) {
        const existing = crises.find((v) => v.family === entry.family);
        if (existing)
          existing.severity = Math.min(100, existing.severity + entry.points);
        else
          crises.push({
            family: entry.family,
            severity: Math.min(100, entry.points),
          });
      }
    return {
      id,
      crises,
      population,
      fatal: crises.some((v) => v.severity >= 100),
    };
  });
}
export function resolveHearing(
  c: Campaign,
  token: number,
  remedy: Remedy,
  content: ContentBundle,
): Campaign {
  const h = c.reckoning;
  if (!h || h.token !== token || !offers(c, h).includes(remedy)) return c;
  const cleared = { ...c, reckoning: null };
  const entered =
    h.kind === "advance" ? advanceEra(cleared, content, false) : cleared;
  if (h.kind === "advance" && entered === cleared) return c;
  const { next, population } = adjust(entered, remedy, h);
  const modified = appendLog(
    {
      ...next,
      core: {
        ...next.core,
        population: Math.max(10, next.core.population * population),
        influence:
          h.kind === "advance"
            ? Math.min(next.core.influence, Math.max(6, c.core.influence))
            : next.core.influence,
      },
    },
    "log.remedy",
    { nameKey: "remedy." + remedy },
  );
  if (h.kind === "ledger" && c.rules === "winterStudy")
    modified.studyFinished = true;
  const settled = h.kind === "ledger" ? modified : settleDeferred(modified);
  const fatal = settled.crises.find((item) => item.severity >= 100);
  if (!settled.outcome && fatal)
    return appendLog(
      { ...settled, legacy: settled.legacy + campaignBalance.legacyStructural, outcome: { kind: "collapse", family: fatal.family } },
      "log.collapse",
      { nameKey: "family." + fatal.family },
    );
  return settled;
}
