import data from '../data/career.json';
import type { Profile, Result } from './profile';
import { aestheticScore } from '../tuning/appearance';

export const careerData = data;
export interface CareerState {
  started: boolean;
  fame: number;
  district: string;
  defeated: string[];
  wins: Record<string, number>;
  activeSponsor: string | null;
  sponsorProgress: number;
  sponsorsDone: string[];
  covers: string[];
  messages: { id: string; read: boolean }[];
}
const districts = data.districts.map((d) => d.id);
const rivals = data.rivals.map((r) => r.id);
const sponsors = data.sponsors.map((s) => s.id);
const covers = data.magazines.map((m) => m.id);
const messageIds = new Set([
  'welcome',
  'complete',
  'level-2',
  'level-3',
  ...rivals.map((id) => `rival-${id}`),
  ...districts.map((id) => `district-${id}`),
  ...sponsors.flatMap((id) => [`offer-${id}`, `ready-${id}`, `paid-${id}`]),
  ...covers.map((id) => `cover-${id}`),
]);
export function freshCareer(): CareerState {
  return {
    started: false,
    fame: 0,
    district: 'old-docks',
    defeated: [],
    wins: {},
    activeSponsor: null,
    sponsorProgress: 0,
    sponsorsDone: [],
    covers: [],
    messages: [],
  };
}
const integer = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
function ids(value: unknown, allowed: readonly string[]) {
  if (
    !Array.isArray(value) ||
    value.some((id) => typeof id !== 'string' || !allowed.includes(id)) ||
    new Set(value).size !== value.length
  )
    throw Error('Identificativi carriera non validi.');
  return [...value] as string[];
}
export function parseCareer(value: unknown): CareerState {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Carriera non valida.');
  const c = value as CareerState;
  const defeated = ids(c.defeated, rivals),
    done = ids(c.sponsorsDone, sponsors),
    claimed = ids(c.covers, covers);
  if (
    typeof c.started !== 'boolean' ||
    !integer(c.fame, 1e6) ||
    defeated.some((id, i) => id !== rivals[i]) ||
    !districts.includes(c.district) ||
    districts.indexOf(c.district) > defeated.length ||
    (c.activeSponsor !== null &&
      (!sponsors.includes(c.activeSponsor) ||
        done.includes(c.activeSponsor))) ||
    !integer(
      c.sponsorProgress,
      data.sponsors.find((s) => s.id === c.activeSponsor)?.target ?? 0,
    )
  )
    throw Error('Progressione carriera non valida.');
  if (!c.wins || typeof c.wins !== 'object' || Array.isArray(c.wins))
    throw Error('Vittorie non valide.');
  const wins: Record<string, number> = {};
  for (const [id, n] of Object.entries(c.wins)) {
    if (!districts.includes(id) || !integer(n, 1e6))
      throw Error('Vittorie non valide.');
    wins[id] = n;
  }
  if (
    !Array.isArray(c.messages) ||
    c.messages.length > messageIds.size ||
    new Set(c.messages.map((m) => m.id)).size !== c.messages.length ||
    c.messages.some((m) => !messageIds.has(m.id) || typeof m.read !== 'boolean')
  )
    throw Error('Messaggi non validi.');
  if (
    !c.started &&
    (c.fame ||
      defeated.length ||
      done.length ||
      claimed.length ||
      c.activeSponsor ||
      c.messages.length ||
      Object.keys(wins).length)
  )
    throw Error('Carriera non avviata incoerente.');
  return {
    started: c.started,
    fame: c.fame,
    district: c.district,
    defeated,
    wins,
    activeSponsor: c.activeSponsor,
    sponsorProgress: c.sponsorProgress,
    sponsorsDone: done,
    covers: claimed,
    messages: c.messages.map((m) => ({ id: m.id, read: m.read })),
  };
}
export function careerLevel(c: CareerState) {
  return 1 + data.levels.slice(1).filter((l) => c.fame >= l.fame).length;
}
export const districtUnlocked = (c: CareerState, id: string) =>
  districts.includes(id) && districts.indexOf(id) <= c.defeated.length;
export function message(c: CareerState, id: string) {
  if (!messageIds.has(id)) throw Error('Messaggio sconosciuto.');
  if (!c.messages.some((m) => m.id === id))
    c.messages.unshift({ id, read: false });
}
export function refreshCareer(c: CareerState) {
  if (!c.started) return;
  if (careerLevel(c) >= 2) message(c, 'level-2');
  if (careerLevel(c) >= 3) message(c, 'level-3');
  const rival = data.rivals[c.defeated.length];
  if (rival && c.fame >= rival.fame) message(c, `rival-${rival.id}`);
  for (const s of data.sponsors)
    if (c.fame >= s.fame) message(c, `offer-${s.id}`);
}
export function startCareer(p: Profile) {
  if (p.career.started) return;
  p.career.started = true;
  message(p.career, 'welcome');
  refreshCareer(p.career);
}
export function travel(p: Profile, id: string) {
  if (!p.career.started || !districtUnlocked(p.career, id))
    throw Error('Quartiere ancora chiuso.');
  p.career.district = id;
}
export function raceLock(p: Profile, event: string): string | null {
  const rival = data.rivals.find((r) => r.event === event);
  if (rival) {
    if (
      !p.career.started ||
      data.rivals.indexOf(rival) !== p.career.defeated.length ||
      p.career.fame < rival.fame
    )
      return 'Sfida del rivale non ancora disponibile.';
  }
  const district = data.districts.find((d) => event === `career-${d.id}`);
  if (
    district &&
    (!p.career.started || !districtUnlocked(p.career, district.id))
  )
    return 'Quartiere ancora chiuso.';
  return null;
}
export function careerRace(
  p: Profile,
  result: Omit<Result, 'reward'>,
  district: string,
) {
  const c = p.career;
  if (
    !c.started ||
    result.time === null ||
    (result.event.startsWith('cup-') && result.event !== 'cup-docks')
  )
    return;
  const style = aestheticScore(
    p.cars.find((car) => car.id === p.activeCar)!.appearance,
  );
  const rival = data.rivals.find((r) => r.event === result.event);
  if (rival && result.position !== 1) return;
  c.fame = Math.min(
    1e6,
    c.fame +
      (rival ? 80 : result.position === 1 ? 60 : 40) +
      Math.floor(style * 4),
  );
  if (result.position === 1)
    c.wins[district] = Math.min(1e6, (c.wins[district] ?? 0) + 1);
  if (rival && data.rivals[c.defeated.length]?.id === rival.id) {
    c.defeated.push(rival.id);
    const next = data.districts[c.defeated.length];
    if (next) message(c, `district-${next.id}`);
    else message(c, 'complete');
  }
  const s = data.sponsors.find((s) => s.id === c.activeSponsor);
  if (
    s &&
    (s.kind === 'finish' ||
      (s.kind === 'drift' &&
        result.event.startsWith('drift-') &&
        result.position === 1))
  ) {
    c.sponsorProgress = Math.min(s.target, c.sponsorProgress + 1);
    if (c.sponsorProgress === s.target) message(c, `ready-${s.id}`);
  }
  refreshCareer(c);
}
export function acceptSponsor(p: Profile, id: string) {
  const c = p.career,
    s = data.sponsors.find((s) => s.id === id);
  if (
    !c.started ||
    !s ||
    c.activeSponsor ||
    c.sponsorsDone.includes(id) ||
    c.fame < s.fame
  )
    throw Error('Contratto non disponibile.');
  c.activeSponsor = id;
  c.sponsorProgress = 0;
}
export function recordSpeed(p: Profile, speedKmh: number) {
  const c = p.career,
    s = data.sponsors.find(
      (s) => s.id === c.activeSponsor && s.kind === 'speed',
    );
  if (
    s &&
    Number.isFinite(speedKmh) &&
    speedKmh >= s.target &&
    c.sponsorProgress < s.target
  ) {
    c.sponsorProgress = s.target;
    message(c, `ready-${s.id}`);
  }
}
export function claimSponsor(p: Profile) {
  const c = p.career,
    s = data.sponsors.find((s) => s.id === c.activeSponsor);
  if (!s || c.sponsorProgress < s.target)
    throw Error('Obiettivo non completato.');
  p.credits = Math.min(1e9, p.credits + s.reward);
  c.fame = Math.min(1e6, c.fame + s.reputation);
  c.sponsorsDone.push(s.id);
  c.activeSponsor = null;
  c.sponsorProgress = 0;
  message(c, `paid-${s.id}`);
  refreshCareer(c);
}
export function coverLock(p: Profile, id: string): string | null {
  const m = data.magazines.find((m) => m.id === id),
    c = p.career;
  if (!c.started || !m || c.covers.includes(id))
    return 'Servizio non disponibile.';
  const style = aestheticScore(
    p.cars.find((car) => car.id === p.activeCar)!.appearance,
  );
  return c.fame < m.fame || style < m.style
    ? `Servono ${m.fame} REP e indice estetico ${m.style}.`
    : null;
}
export function claimCover(p: Profile, id: string) {
  const lock = coverLock(p, id);
  if (lock) throw Error(lock);
  const m = data.magazines.find((m) => m.id === id)!;
  p.career.covers.push(id);
  p.credits = Math.min(1e9, p.credits + m.reward);
  p.career.fame = Math.min(1e6, p.career.fame + m.reputation);
  message(p.career, `cover-${id}`);
  refreshCareer(p.career);
}
export function messageText(id: string): { title: string; body: string } {
  if (id === 'welcome')
    return {
      title: 'Una firma nuova',
      body: 'Nemi ti aspetta ai moli. Guadagna 90 REP, poi apri la sua sfida. I risultati e l’aspetto applicato della tua auto aumentano la reputazione. I negozi del bacino sono già aperti.',
    };
  if (id === 'complete')
    return {
      title: 'Le quattro firme',
      body: 'Hai battuto i quattro rivali. Tutti i quartieri sono accessibili. Sponsor, copertine e gare restano disponibili.',
    };
  if (id.startsWith('level-'))
    return {
      title: `Livello ${id.slice(-1)} raggiunto`,
      body: 'Nuovi componenti e un nuovo modello sono disponibili in garage. I pezzi che possedevi restano utilizzabili.',
    };
  for (const r of data.rivals)
    if (id === `rival-${r.id}`)
      return {
        title: `Invito di ${r.name}`,
        body: `${r.profile} La sfida è disponibile nel telefono.`,
      };
  for (const d of data.districts)
    if (id === `district-${d.id}`)
      return {
        title: `Accesso a ${d.name}`,
        body: `${d.description} Garage, officine e ritrovi del settore sono aperti. Viaggia dal telefono per raggiungerli.`,
      };
  for (const s of data.sponsors)
    if (id.endsWith(s.id))
      return {
        title: s.name,
        body: id.startsWith('offer-')
          ? s.description
          : id.startsWith('ready-')
            ? 'Obiettivo raggiunto. Apri Sponsor per riscuotere il premio.'
            : 'Premio ricevuto. Il contratto è concluso.',
      };
  for (const m of data.magazines)
    if (id === `cover-${m.id}`)
      return {
        title: `Copertina / ${m.name}`,
        body: 'Servizio fotografico completato, copertina esportata e premio ricevuto.',
      };
  return { title: 'Port Riders', body: '' };
}
