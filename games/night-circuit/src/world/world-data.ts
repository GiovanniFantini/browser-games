import district from '../data/district.json';
import races from '../data/races.json';
import exploration from '../data/exploration.json';
import { streetPoint, streetSpawn } from './street-layout';

export const worldDistrict = {
  ...district,
  spawn: streetSpawn(district.spawn[0], district.spawn[2]),
  pois: district.pois.map((p) => ({ ...p, ...streetPoint(p.x, p.z) })),
};
export const worldRaces = {
  ...races,
  events: races.events.map((e) => ({
    ...e,
    meeting: { ...e.meeting, ...streetPoint(e.meeting.x, e.meeting.z) },
  })),
};
export const worldExploration = {
  ...exploration,
  collectibles: exploration.collectibles.map((p) => ({
    ...p,
    ...streetPoint(p.x, p.z),
  })),
};
