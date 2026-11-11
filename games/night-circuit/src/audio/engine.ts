import { preferences } from '../core/preferences';
import { Soundscape } from './soundscape';
export class EngineAudio {
  private context?: AudioContext;
  private soundscape?: Soundscape;
  private master?: GainNode;
  private engineGain?: GainNode;
  private oscillator?: OscillatorNode;
  private overtone?: OscillatorNode;
  private filter?: BiquadFilterNode;
  private tireGain?: GainNode;
  private rumbleGain?: GainNode;
  private rumbleFilter?: BiquadFilterNode;
  private turbine?: OscillatorNode;
  private turbineGain?: GainNode;
  sound = 0;
  turbo = 0;
  muted = false;
  active = false;

  async start() {
    if (!this.context) {
      this.context = new AudioContext();
      const ctx = this.context;
      this.master = ctx.createGain();
      this.master.gain.value = 0.2;
      this.master.connect(ctx.destination);
      this.soundscape = new Soundscape(ctx, this.master);
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0;
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 700;
      this.oscillator = ctx.createOscillator();
      this.oscillator.type = 'sawtooth';
      this.overtone = ctx.createOscillator();
      this.overtone.type = 'triangle';
      this.oscillator.connect(this.engineGain);
      this.overtone.connect(this.engineGain);
      this.engineGain.connect(this.filter);
      this.filter.connect(this.master);
      this.oscillator.start();
      this.overtone.start();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const tireFilter = ctx.createBiquadFilter();
      tireFilter.type = 'bandpass';
      tireFilter.frequency.value = 1200;
      tireFilter.Q.value = 2;
      this.tireGain = ctx.createGain();
      this.tireGain.gain.value = 0;
      noise.connect(tireFilter);
      tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.master);
      this.rumbleFilter = ctx.createBiquadFilter();
      this.rumbleFilter.type = 'lowpass';
      this.rumbleGain = ctx.createGain();
      this.rumbleGain.gain.value = 0;
      noise.connect(this.rumbleFilter);
      this.rumbleFilter.connect(this.rumbleGain);
      this.rumbleGain.connect(this.filter);
      this.turbine = ctx.createOscillator();
      this.turbine.type = 'sine';
      this.turbine.frequency.value = 1200;
      this.turbineGain = ctx.createGain();
      this.turbineGain.gain.value = 0;
      this.turbine.connect(this.turbineGain);
      this.turbineGain.connect(this.master);
      this.turbine.start();
      noise.start();
    }
    this.master!.gain.value = this.muted ? 0 : 0.2 * preferences.master;
    await this.context.resume();
    this.active = true;
  }
  update(
    rpm: number,
    load: number,
    slip: number,
    boosting: boolean,
    speed = 0,
    collision = false,
    rain = false,
    impact = 0,
  ) {
    if (!this.context || !this.active) return;
    const time = this.context.currentTime;
    this.soundscape?.update(
      rpm,
      load,
      boosting,
      speed,
      collision,
      rain,
      impact,
      this.turbo,
    );
    this.master!.gain.setTargetAtTime(
      this.muted ? 0 : 0.2 * preferences.master,
      time,
      0.04,
    );
    this.rumbleFilter!.frequency.setTargetAtTime(
      120 + rpm * 0.18 + load * 500,
      time,
      0.08,
    );
    this.rumbleGain!.gain.setTargetAtTime(
      (0.015 + load * 0.025) * preferences.engine,
      time,
      0.08,
    );
    this.turbine!.frequency.setTargetAtTime(1200 + rpm * 0.5, time, 0.06);
    this.turbineGain!.gain.setTargetAtTime(
      Math.min(0.04, this.turbo * 0.018) * load * preferences.engine,
      time,
      0.08,
    );
    this.oscillator!.frequency.setTargetAtTime(rpm / 30, time, 0.04);
    this.overtone!.frequency.setTargetAtTime(
      rpm / (15 - this.turbo * 3) + 1,
      time,
      0.04,
    );
    this.engineGain!.gain.setTargetAtTime(
      (0.07 + load * 0.12) * preferences.engine,
      time,
      0.08,
    );
    this.filter!.frequency.setTargetAtTime(
      350 +
        this.sound * 800 +
        rpm * (0.14 + this.turbo * 0.03) +
        (boosting ? 1100 : 0),
      time,
      0.1,
    );
    this.tireGain!.gain.setTargetAtTime(
      Math.min(Math.max(slip - 2, 0) * 0.012, 0.12) * preferences.effects,
      time,
      0.05,
    );
  }
  async pause() {
    this.active = false;
    await this.context?.suspend();
  }
}
