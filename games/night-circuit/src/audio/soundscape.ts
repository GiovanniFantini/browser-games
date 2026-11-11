import radio from '../data/radio.json';
import { preferences as p } from '../core/preferences';
/** All voices are synthesized locally and expire after their envelope. */
export class Soundscape {
  private readonly music: GainNode;
  private readonly effects: GainNode;
  private readonly ambience: GainNode;
  private readonly noise: AudioBuffer;
  private next = 0;
  private beat = 0;
  private station = -1;
  private impactAt = 0;
  private lastLoad = 0;
  private lastRpm = 0;
  private wasBoost = false;
  constructor(
    private readonly ctx: AudioContext,
    master: GainNode,
  ) {
    this.music = ctx.createGain();
    this.effects = ctx.createGain();
    this.ambience = ctx.createGain();
    this.music.gain.value = p.station === 3 ? 0 : p.music * 0.55;
    this.effects.gain.value = p.effects;
    this.music.connect(master);
    this.effects.connect(master);
    this.ambience.connect(this.effects);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter();
    source.buffer = this.noise;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 550;
    source.connect(filter);
    filter.connect(this.ambience);
    source.start();
    this.ambience.gain.value = 0.01;
  }
  private tone(
    time: number,
    freq: number,
    duration: number,
    volume: number,
    wave: OscillatorType = 'sine',
    target = freq,
  ) {
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, time);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(10, target),
      time + duration,
    );
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(volume, time + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(this.music);
    o.start(time);
    o.stop(time + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private hiss(
    time: number,
    duration: number,
    volume: number,
    freq: number,
    destination = this.effects,
  ) {
    const s = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    s.buffer = this.noise;
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(volume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    s.connect(f);
    f.connect(g);
    g.connect(destination);
    s.start(time);
    s.stop(time + duration + 0.01);
    s.onended = () => {
      s.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
  update(
    rpm: number,
    load: number,
    boost: boolean,
    speed: number,
    collision: boolean,
    rain: boolean,
    impact = 0,
    turbo = 0,
  ) {
    const now = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(
      p.station === 3 ? 0 : p.music * 0.55,
      now,
      0.04,
    );
    this.effects.gain.setTargetAtTime(p.effects, now, 0.04);
    this.ambience.gain.setTargetAtTime(
      rain ? 0.05 : 0.006 + Math.min(Math.abs(speed), 50) * 0.0002,
      now,
      0.1,
    );
    const strength = Math.max(collision ? Math.abs(speed) : 0, impact);
    if (strength > 1 && now > this.impactAt) {
      this.hiss(now, 0.2, Math.min(0.8, strength * 0.025), 140);
      this.impactAt = now + 0.4;
    }
    if (this.wasBoost && !boost) this.hiss(now, 0.32, 0.3, 2800);
    if (boost && !this.wasBoost) this.hiss(now, 0.22, 0.35, 1600);
    if (turbo > 0 && this.turboRelease(load, rpm))
      this.hiss(now, 0.18, 0.17, 3600);
    if (this.lastRpm - rpm > 900 && this.lastLoad > 0.3)
      this.hiss(now, 0.09, 0.12, 100);
    this.wasBoost = boost;
    this.lastRpm = rpm;
    this.lastLoad = load;
    if (this.station !== p.station) {
      this.station = p.station;
      this.beat = 0;
      this.next = now + 0.05;
    }
    if (p.station === 3) return;
    const station = radio.stations[p.station];
    const step = 60 / station.bpm / 4;
    if (this.next < now - 0.1) this.next = now + 0.025;
    while (this.next < now + 0.16) {
      const b = this.beat % 16,
        t = this.next,
        root = station.root;
      if (station.kick.includes(b)) this.tone(t, 140, 0.17, 0.7, 'sine', 40);
      if (station.snare.includes(b)) this.hiss(t, 0.12, 0.25, 1600, this.music);
      if (b % 2 === 0) this.hiss(t, 0.04, 0.08, 6500, this.music);
      this.tone(
        t,
        root * 2 ** (station.notes[b] / 12),
        step * 1.8,
        0.075,
        station.wave as OscillatorType,
      );
      if (b % 4 === 0) {
        this.tone(
          t,
          (root / 2) * 2 ** (station.notes[b] / 12),
          step * 3,
          0.22,
          'triangle',
        );
        for (const interval of [0, 3, 7])
          this.tone(
            t,
            root * 2 ** ((station.notes[b] + interval + 12) / 12),
            step * 3.6,
            0.025,
            'sine',
          );
      }
      this.beat++;
      this.next += step;
    }
  }
  private turboRelease(load: number, rpm: number) {
    return this.lastLoad > 0.65 && load < 0.15 && rpm > 2800;
  }
}
