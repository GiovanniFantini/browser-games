export interface Cue {
  readonly id: string;
  readonly duration: number;
  readonly frequency: number;
  readonly kind: string;
  readonly priority: number;
}
export function cuePcm(cue: Cue, sampleRate = 24000): Float32Array {
  const out = new Float32Array(Math.ceil(cue.duration * sampleRate));
  let seed = 2711,
    phase = 0,
    low = 0,
    peak = 0;
  for (let i = 0; i < out.length; i++) {
    const u = i / (out.length - 1),
      t = i / sampleRate;
    seed = (1664525 * seed + 1013904223) >>> 0;
    low += 0.15 * ((seed / 4294967296) * 2 - 1 - low);
    const frequency =
      cue.frequency *
      (cue.kind === "rise"
        ? 0.7 + 0.6 * u
        : cue.kind === "fall"
          ? 1.4 - 0.9 * u
          : 1);
    phase += (2 * Math.PI * frequency) / sampleRate;
    let wave =
      Math.sin(phase) + 0.25 * Math.sin(phase * 2.01) * Math.exp(-t * 12);
    if (cue.kind === "noise") wave = low;
    if (cue.kind === "chime")
      wave = Math.sin(phase) + 0.3 * Math.sin(phase * 2.7);
    out[i] =
      wave *
      Math.sin(Math.PI * (cue.kind === "double" ? (u * 2) % 1 : u)) ** 2 *
      Math.exp(-u * (cue.kind === "chime" ? 2 : 1));
    peak = Math.max(peak, Math.abs(out[i]!));
  }
  const target = cue.priority === 3 ? 0.42 : cue.priority === 2 ? 0.32 : 0.22;
  if (peak)
    for (let i = 0; i < out.length; i++) out[i] = (out[i]! * target) / peak;
  out[0] = out[out.length - 1] = 0;
  return out;
}
export interface VoiceBudget {
  readonly priority: number;
  readonly at: number;
}
export function voiceSlot(
  voices: readonly VoiceBudget[],
  priority: number,
  max = 12,
  reserved = 3,
): number | "new" | "wait" | "drop" {
  const fullRegular =
    priority < 3 &&
    voices.filter((v) => v.priority < 3).length >= max - reserved;
  if (!fullRegular && voices.length < max) return "new";
  let index = -1;
  for (let i = 0; i < voices.length; i++) {
    const v = voices[i]!;
    if (
      v.priority < priority &&
      (index < 0 ||
        v.priority < voices[index]!.priority ||
        (v.priority === voices[index]!.priority && v.at < voices[index]!.at))
    )
      index = i;
  }
  return index >= 0 ? index : priority === 3 ? "wait" : "drop";
}
