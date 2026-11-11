import catalog from '../data/races.json';
import settings from '../data/modes.json';
export interface CupStanding {
  id: string;
  points: number;
  time: number;
  finishes: number;
}
export interface CupState {
  id: string;
  round: number;
  speedScale: number;
  rubberBand: number;
  standings: CupStanding[];
}
export function newCup(speedScale: number, rubberBand: number): CupState {
  return {
    id: crypto.randomUUID(),
    round: 0,
    speedScale,
    rubberBand,
    standings: [...catalog.drivers.map((d) => d.id), 'player'].map((id) => ({
      id,
      points: 0,
      time: 0,
      finishes: 0,
    })),
  };
}
export function advanceCup(
  cup: CupState,
  ranking: readonly {
    id: string;
    finishTime: number | null;
    retired: boolean;
  }[],
) {
  if (cup.round >= settings.cup.rounds.length)
    throw Error('Torneo già concluso.');
  ranking.forEach((r, i) => {
    const row = cup.standings.find((s) => s.id === r.id)!;
    if (!r.retired && r.finishTime !== null) {
      row.points += settings.cup.points[i];
      row.time += r.finishTime;
      row.finishes++;
    } else row.time += settings.cup.dnfPenalty;
  });
  cup.round++;
  cup.standings.sort(
    (a, b) =>
      b.points - a.points || a.time - b.time || a.id.localeCompare(b.id),
  );
}
export function parseCup(value: unknown): CupState | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object') throw Error('Torneo non valido.');
  const c = value as CupState,
    ids = [...catalog.drivers.map((d) => d.id), 'player'];
  if (
    typeof c.id !== 'string' ||
    !/^[a-zA-Z0-9-]{1,60}$/.test(c.id) ||
    !Number.isInteger(c.round) ||
    c.round < 0 ||
    c.round >= settings.cup.rounds.length ||
    !catalog.difficulties.some((d) => d.speedScale === c.speedScale) ||
    !catalog.recoveryOptions.some((d) => d.value === c.rubberBand) ||
    !Array.isArray(c.standings) ||
    c.standings.length !== ids.length ||
    new Set(c.standings.map((s) => s.id)).size !== ids.length
  )
    throw Error('Torneo non valido.');
  const standings = c.standings.map((s) => {
    if (
      !ids.includes(s.id) ||
      !Number.isInteger(s.points) ||
      s.points < 0 ||
      s.points > c.round * settings.cup.points[0] ||
      !Number.isFinite(s.time) ||
      s.time < 0 ||
      s.time > 86400 ||
      !Number.isInteger(s.finishes) ||
      s.finishes < 0 ||
      s.finishes > c.round
    )
      throw Error('Classifica torneo non valida.');
    return { id: s.id, points: s.points, time: s.time, finishes: s.finishes };
  });
  return {
    id: c.id,
    round: c.round,
    speedScale: c.speedScale,
    rubberBand: c.rubberBand,
    standings,
  };
}
