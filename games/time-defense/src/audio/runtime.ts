import catalog from "../../docs/dati-segnali.json";
import forestUrl from "../../art-source/audio45/atlas-forest.mp3?url";
import wetlandUrl from "../../art-source/audio45/atlas-wetland.mp3?url";
import bossUrl from "../../art-source/audio45/atlas-boss.mp3?url";
import { cuePcm, voiceSlot } from "./synthesis";
import type { Preferences } from "../profile/model";
export type MusicTheme = "forest" | "wetland" | "boss";
interface Voice {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
  readonly priority: number;
  readonly at: number;
}
const urls: Record<MusicTheme, string> = {
  forest: forestUrl,
  wetland: wetlandUrl,
  boss: bossUrl,
};
export class GameAudio {
  private uiContext: AudioContext | null = null;
  private uiMaster: GainNode | null = null;
  private uiVoice: Voice | null = null;
  private uiToken = 0;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private music: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private tracks = new Map<MusicTheme, Promise<AudioBuffer>>();
  private voices: Voice[] = [];
  private pendingCritical: string[] = [];
  private current: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    theme: MusicTheme;
  } | null = null;
  private theme: MusicTheme = "forest";
  private listeners = new Set<() => void>();
  private wanted = false;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private epoch = 0;
  private musicRequest = 0;
  private readyPromise: Promise<void> = Promise.resolve();
  private duckUntil = 0;
  private scene = "menu";
  private preferences: Pick<Preferences, "music" | "effects" | "muted"> = {
    music: 0.35,
    effects: 0.6,
    muted: false,
  };
  enabled = false;
  error = "";
  listening: false | "music" | "effect" = false;
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit(): void {
    for (const fn of this.listeners) fn();
  }
  get running(): boolean {
    return this.context?.state === "running" && this.wanted;
  }
  get status(): string {
    return (
      this.error ||
      (!this.enabled
        ? "Audio non attivato."
        : this.preferences.muted
          ? "Audio silenziato."
          : this.listening
            ? "Ascolto di prova. La partita resta ferma."
            : this.running
              ? "Audio attivo."
              : "Audio pronto. Ripartirà con la partita; puoi ascoltare una prova.")
    );
  }
  setPreferences(p: Preferences): void {
    const old = this.preferences;
    this.preferences = { music: p.music, effects: p.effects, muted: p.muted };
    if (
      old.music !== p.music ||
      old.effects !== p.effects ||
      old.muted !== p.muted
    ) {
      this.apply();
      if (this.wanted && !this.listening) this.ensureMusic();
      this.emit();
    }
  }
  private ramp(
    param: AudioParam,
    value: number,
    seconds = 0.02,
    context = this.context!,
  ): void {
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }
  private apply(): void {
    if (this.uiContext && this.uiMaster)
      this.ramp(
        this.uiMaster.gain,
        this.preferences.muted
          ? 0
          : this.preferences.effects * catalog.mix.masterGain,
        0.02,
        this.uiContext,
      );
    if (!this.context || !this.master || !this.effects || !this.music) return;
    this.ramp(
      this.master.gain,
      this.preferences.muted ? 0 : catalog.mix.masterGain,
    );
    this.ramp(this.effects.gain, this.preferences.effects);
    const now = this.context.currentTime;
    this.ramp(
      this.music.gain,
      this.preferences.music * (now < this.duckUntil ? 0.35 : 1),
    );
    if (now < this.duckUntil) {
      this.music.gain.setValueAtTime(
        this.preferences.music * 0.35,
        this.duckUntil,
      );
      this.music.gain.linearRampToValueAtTime(
        this.preferences.music,
        this.duckUntil + 0.15,
      );
    }
  }
  private fail(): void {
    this.error = "Audio non disponibile. Puoi continuare a giocare.";
    this.enabled = false;
    this.wanted = false;
    this.epoch++;
    this.stopMusic();
    this.clearVoices();
    const old = this.context;
    this.context = null;
    this.master = this.effects = this.music = null;
    this.tracks.clear();
    this.stopUI(true);
    const ui = this.uiContext;
    this.uiContext = null;
    this.uiMaster = null;
    if (ui) void ui.close().catch(() => {});
    if (old) void old.close().catch(() => {});
    this.emit();
  }
  async activate(menu = false): Promise<void> {
    try {
      if (!this.context || this.context.state === "closed") {
        this.context = new AudioContext({ latencyHint: "interactive" });
        this.master = this.context.createGain();
        this.effects = this.context.createGain();
        this.music = this.context.createGain();
        this.master.gain.value = 0;
        this.effects.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(this.context.destination);
        for (const cue of catalog.audio) {
          const samples = cuePcm(cue),
            buffer = this.context.createBuffer(1, samples.length, 24000);
          buffer.getChannelData(0).set(samples);
          this.buffers.set(cue.id, buffer);
        }
        this.context.addEventListener("statechange", () => this.emit());
      }
      this.enabled = true;
      this.error = "";
      this.apply();
      if (menu) this.resume("menu", "forest");
      else this.pause();
      this.emit();
    } catch {
      this.fail();
    }
  }
  resume(scene = "active", theme: MusicTheme = this.theme): void {
    if (
      !this.enabled ||
      !this.context ||
      document.hidden ||
      !document.hasFocus()
    )
      return;
    if (this.pauseTimer !== null) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    this.scene = scene;
    this.theme = theme;
    this.wanted = true;
    this.apply();
    this.listening = false;
    const token = ++this.epoch;
    this.readyPromise = this.context
      .resume()
      .then(() => {
        if (this.wanted && token === this.epoch) {
          this.ensureMusic();
          this.drainCritical();
          this.emit();
        }
      })
      .catch(() => this.fail());
  }
  pause(immediate = false): void {
    this.stopUI(immediate);
    this.wanted = false;
    const token = ++this.epoch;
    if (this.pauseTimer !== null) clearTimeout(this.pauseTimer);
    if (this.context && this.enabled) {
      const ctx = this.context;
      const stop = () => {
        this.pauseTimer = null;
        if (!this.wanted && token === this.epoch)
          void ctx
            .suspend()
            .then(() => this.emit())
            .catch(() => this.fail());
      };
      if (immediate) stop();
      else {
        if (this.master) this.ramp(this.master.gain, 0, 0.01);
        this.pauseTimer = setTimeout(stop, 12);
      }
    }
  }
  enterField(): void {
    this.stopListening();
    this.clearVoices();
    this.stopMusic();
    this.pause();
    this.scene = "preparation";
  }
  menu(): void {
    this.stopListening();
    this.clearVoices();
    this.stopMusic();
    if (
      this.enabled &&
      document.visibilityState === "visible" &&
      document.hasFocus()
    )
      this.resume("menu", "forest");
    else this.pause(true);
  }
  setGameState(phase: string, enabled: boolean, theme: MusicTheme): void {
    if (this.listening) return;
    if (theme !== this.theme) {
      this.theme = theme;
      if (this.wanted && !this.listening) this.ensureMusic();
    }
    if (!enabled || phase === "paused") {
      if (this.wanted) this.pause();
      return;
    }
    if (phase === "active" && !this.wanted) this.resume("active", theme);
    if (phase === "won" || phase === "lost") this.scene = "result";
  }
  private async track(theme: MusicTheme): Promise<AudioBuffer> {
    const context = this.context!;
    let entry = this.tracks.get(theme);
    if (!entry) {
      entry = (async () => {
        const response = await fetch(urls[theme]);
        if (!response.ok) throw new Error("Music unavailable");
        return context.decodeAudioData(await response.arrayBuffer());
      })();
      this.tracks.set(theme, entry);
      entry.catch(() => this.tracks.delete(theme));
    }
    return entry;
  }
  private ensureMusic(): void {
    if (
      !this.enabled ||
      !this.context ||
      !this.wanted ||
      this.listening ||
      this.scene === "result" ||
      this.preferences.music === 0 ||
      this.preferences.muted ||
      this.current?.theme === this.theme
    )
      return;
    const theme = this.theme,
      request = ++this.musicRequest;
    void this.track(theme)
      .then((buffer) => {
        if (
          request !== this.musicRequest ||
          !this.wanted ||
          this.listening ||
          this.scene === "result" ||
          theme !== this.theme
        )
          return;
        this.startMusic(buffer, theme, true);
        for (const key of this.tracks.keys())
          if (this.tracks.size > 2 && key !== theme) this.tracks.delete(key);
      })
      .catch(() => {
        if (!this.enabled) return;
        this.error =
          "La musica non è stata caricata. Gli effetti restano disponibili.";
        this.emit();
      });
  }
  private startMusic(
    buffer: AudioBuffer,
    theme: MusicTheme,
    loop: boolean,
  ): void {
    if (!this.context || !this.music) return;
    const ctx = this.context,
      now = ctx.currentTime,
      old = this.current,
      source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain);
    gain.connect(this.music);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.25);
    source.start(now);
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 0.25);
      old.source.stop(now + 0.25);
    }
    this.current = { source, gain, theme };
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
      if (this.current?.source === source) {
        this.current = null;
        if (!loop) this.stopListening();
      }
    });
    this.error = "";
    this.emit();
  }
  private stopMusic(): void {
    this.musicRequest++;
    const old = this.current;
    this.current = null;
    if (old) {
      try {
        const now = this.context!.currentTime;
        old.gain.gain.cancelScheduledValues(now);
        old.gain.gain.setValueAtTime(old.gain.gain.value, now);
        old.gain.gain.linearRampToValueAtTime(0, now + 0.01);
        old.source.stop(now + 0.01);
      } catch {
        /* Already stopped. */
      }
    }
  }
  private clearVoices(): void {
    this.pendingCritical = [];
    for (const voice of this.voices) {
      try {
        const now = this.context!.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.linearRampToValueAtTime(0, now + 0.01);
        voice.source.stop(now + 0.01);
      } catch {
        /* Already stopped. */
      }
    }
    this.voices = [];
  }
  play(id: string): void {
    if (
      !this.enabled ||
      !this.context ||
      !this.wanted ||
      this.preferences.muted ||
      this.preferences.effects === 0
    )
      return;
    const epoch = this.epoch;
    if (this.context.state !== "running") {
      void this.readyPromise.then(() => {
        if (
          this.wanted &&
          epoch === this.epoch &&
          this.context?.state === "running"
        ) {
          try {
            this.playNow(id);
          } catch {
            this.fail();
          }
        }
      });
      return;
    }
    try {
      this.playNow(id);
    } catch {
      this.fail();
    }
  }
  private playNow(id: string): void {
    const ctx = this.context!,
      cue = catalog.audio.find((c) => c.id === id),
      buffer = this.buffers.get(id);
    if (!cue || !buffer || !this.effects) return;
    const slot = voiceSlot(
      this.voices,
      cue.priority,
      catalog.mix.maxVoices,
      catalog.mix.criticalReserve,
    );
    if (slot === "drop") return;
    if (slot === "wait") {
      if (this.pendingCritical.length < 64) this.pendingCritical.push(id);
      return;
    }
    let at = ctx.currentTime;
    if (typeof slot === "number") {
      const old = this.voices.splice(slot, 1)[0]!;
      at += 0.01;
      old.gain.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.gain.setValueAtTime(old.gain.gain.value, ctx.currentTime);
      old.gain.gain.linearRampToValueAtTime(0, at);
      old.source.stop(at);
    }
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = catalog.mix.voiceGain;
    source.connect(gain);
    gain.connect(this.effects);
    const voice = { source, gain, priority: cue.priority, at };
    this.voices.push(voice);
    source.addEventListener("ended", () => {
      const i = this.voices.indexOf(voice);
      if (i >= 0) this.voices.splice(i, 1);
      source.disconnect();
      gain.disconnect();
      if (this.listening === "effect" && this.voices.length === 0)
        this.stopListening();
      else this.drainCritical();
    });
    source.start(at);
    if (cue.priority === 3 && this.music) {
      this.duckUntil = Math.max(this.duckUntil, at + buffer.duration);
      this.apply();
    }
  }
  private stopUI(immediate = false): void {
    this.uiToken++;
    const voice = this.uiVoice;
    this.uiVoice = null;
    if (voice && this.uiContext) {
      const now = this.uiContext.currentTime;
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(
          immediate ? 0 : voice.gain.gain.value,
          now,
        );
        voice.gain.gain.linearRampToValueAtTime(
          0,
          now + (immediate ? 0 : 0.01),
        );
        voice.source.stop(now + (immediate ? 0 : 0.01));
      } catch {
        /* Already ended. */
      }
    }
    const context = this.uiContext,
      token = this.uiToken;
    if (context) {
      if (immediate) void context.suspend().catch(() => {});
      else
        setTimeout(() => {
          if (token === this.uiToken) void context.suspend().catch(() => {});
        }, 12);
    }
  }
  uiCue(id: string): void {
    if (
      !this.enabled ||
      this.preferences.muted ||
      this.preferences.effects === 0 ||
      this.listening ||
      document.visibilityState !== "visible"
    )
      return;
    if (this.wanted) {
      this.play(id);
      return;
    }
    const buffer = this.buffers.get(id);
    if (!buffer) return;
    this.stopUI();
    const token = ++this.uiToken;
    try {
      if (!this.uiContext) {
        this.uiContext = new AudioContext({ latencyHint: "interactive" });
        this.uiMaster = this.uiContext.createGain();
        this.uiMaster.gain.value = 0;
        this.uiMaster.connect(this.uiContext.destination);
      }
      const context = this.uiContext;
      void context
        .resume()
        .then(() => {
          if (token !== this.uiToken || !this.uiMaster) return;
          this.apply();
          const source = context.createBufferSource(),
            gain = context.createGain();
          source.buffer = buffer;
          gain.gain.value = catalog.mix.voiceGain;
          source.connect(gain);
          gain.connect(this.uiMaster);
          const voice = { source, gain, priority: 1, at: context.currentTime };
          this.uiVoice = voice;
          source.addEventListener("ended", () => {
            source.disconnect();
            gain.disconnect();
            if (this.uiVoice === voice) {
              this.uiVoice = null;
              void context.suspend().catch(() => {});
            }
          });
          source.start();
        })
        .catch(() => {});
    } catch {
      /* Optional click feedback never changes the game. */
    }
  }
  private drainCritical(): void {
    if (!this.wanted || this.context?.state !== "running") return;
    while (
      this.pendingCritical.length &&
      this.voices.length < catalog.mix.maxVoices
    )
      this.playNow(this.pendingCritical.shift()!);
  }
  end(won: boolean): void {
    if (!this.enabled) return;
    this.stopMusic();
    this.clearVoices();
    this.scene = "result";
    this.wanted = true;
    if (this.context) {
      this.readyPromise = this.context
        .resume()
        .then(() => {
          if (this.scene === "result") this.play(won ? "victory" : "defeat");
        })
        .catch(() => this.fail());
    }
  }
  async previewMusic(): Promise<void> {
    if (!this.enabled || !this.context) return;
    this.stopListening();
    this.stopUI(true);
    this.clearVoices();
    this.stopMusic();
    this.listening = "music";
    this.emit();
    this.wanted = true;
    const epoch = ++this.epoch;
    try {
      await this.context.resume();
      this.apply();
      const buffer = await this.track(this.theme);
      if (epoch === this.epoch && this.listening === "music")
        this.startMusic(buffer, this.theme, false);
    } catch {
      this.error = "La musica non è stata caricata. Puoi riprovare.";
      this.emit();
    }
  }
  async previewEffect(): Promise<void> {
    if (!this.enabled || !this.context) return;
    this.stopListening();
    this.stopUI(true);
    this.clearVoices();
    this.stopMusic();
    this.listening = "effect";
    this.wanted = true;
    const epoch = ++this.epoch;
    try {
      await this.context.resume();
      this.apply();
      if (this.listening === "effect" && epoch === this.epoch)
        this.playNow("ui-build");
      this.emit();
    } catch {
      this.fail();
    }
  }
  stopListening(): void {
    if (!this.listening) return;
    this.listening = false;
    this.clearVoices();
    this.stopMusic();
    this.pause();
    this.emit();
  }
}
