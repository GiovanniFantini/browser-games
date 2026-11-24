export type SoundMood = "calm" | "strained" | "war";
export type SoundCue =
  "enabled" | "event" | "crisis" | "era" | "war" | "ending";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: {
  voices: OscillatorNode[];
  envelopes: GainNode[];
  filter: BiquadFilterNode;
} | null = null;
const cues = new Set<OscillatorNode>();

const roots = [55, 61.74, 65.41, 58.27, 49, 73.42, 69.3, 77.78, 82.41, 92.5];
const cueNotes: Record<SoundCue, readonly number[]> = {
  enabled: [261.63, 392],
  event: [329.63, 246.94, 293.66],
  crisis: [164.81, 138.59, 110],
  era: [261.63, 329.63, 392, 523.25],
  war: [98, 110, 98],
  ending: [392, 293.66, 196],
};

export async function enableSound(): Promise<boolean> {
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);
    }
    if (context.state !== "running") await context.resume();
    return context.state === "running";
  } catch {
    return false;
  }
}

export function setSoundVolume(value: number): void {
  if (!context || !master) return;
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setTargetAtTime(value ** 1.5, context.currentTime, 0.025);
}

export function setSoundScene(stage: number, mood: SoundMood): void {
  if (!context || !master) return;
  const audio = context;
  const now = audio.currentTime;
  if (!ambient) {
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.connect(master);
    const voices = ["sine", "triangle"].map((type) => {
      const voice = audio.createOscillator();
      voice.type = type as OscillatorType;
      return voice;
    });
    const envelopes = voices.map((voice) => {
      const envelope = audio.createGain();
      envelope.gain.value = 0;
      voice.connect(envelope).connect(filter);
      voice.start(now);
      return envelope;
    });
    ambient = { voices, envelopes, filter };
  }
  const root = roots[stage] ?? roots[0]!;
  const interval = mood === "calm" ? 7 : mood === "strained" ? 3 : 6;
  ambient.voices[0]!.frequency.setTargetAtTime(root, now, 0.4);
  ambient.voices[1]!.frequency.setTargetAtTime(
    root * 2 ** (interval / 12),
    now,
    0.4,
  );
  ambient.filter.frequency.setTargetAtTime(
    mood === "war" ? 240 : 410 + stage * 35,
    now,
    0.4,
  );
  ambient.envelopes[0]!.gain.setTargetAtTime(0.045, now, 0.35);
  ambient.envelopes[1]!.gain.setTargetAtTime(
    mood === "calm" ? 0.021 : 0.032,
    now,
    0.35,
  );
}

export function playSound(cue: SoundCue): void {
  if (!context || !master || context.state !== "running") return;
  const audio = context;
  const output = master;
  cueNotes[cue].forEach((frequency, index) => {
    const start = audio.currentTime + index * (cue === "war" ? 0.12 : 0.16);
    const tone = audio.createOscillator();
    const envelope = audio.createGain();
    tone.type = cue === "crisis" || cue === "war" ? "triangle" : "sine";
    tone.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(0.13, start + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
    tone.connect(envelope).connect(output);
    cues.add(tone);
    tone.onended = () => {
      tone.disconnect();
      envelope.disconnect();
      cues.delete(tone);
    };
    tone.start(start);
    tone.stop(start + 0.74);
  });
}

export function stopSound(): void {
  if (!context || !master) return;
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0, now);
  for (const cue of cues) cue.stop(now);
  cues.clear();
  if (ambient) {
    for (const voice of ambient.voices) {
      voice.stop(now);
      voice.disconnect();
    }
    for (const envelope of ambient.envelopes) envelope.disconnect();
    ambient.filter.disconnect();
    ambient = null;
  }
}
