import data from '../data/district.json';
export function signalColor(
  node: number,
  vertical: boolean,
  time: number,
): 'green' | 'amber' | 'red' {
  const phase =
    (((time + (node % 3) * 2) % data.traffic.signalCycle) +
      data.traffic.signalCycle) %
    data.traffic.signalCycle;
  const local =
    (phase + (vertical ? 0 : data.traffic.signalCycle / 2)) %
    data.traffic.signalCycle;
  if (local < 9) return 'green';
  if (local < 10.5) return 'amber';
  return 'red';
}
