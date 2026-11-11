export const FIXED_DT = 1 / 60;

export class FixedLoop {
  private previous = 0;
  private accumulator = 0;
  private running = false;
  private frame = 0;

  constructor(
    private readonly step: (dt: number) => void,
    private readonly render: (alpha: number, dt: number) => void,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.previous = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.accumulator = 0;
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const renderElapsed = Math.max((now - this.previous) / 1000, 0.001);
    const elapsed = Math.min(renderElapsed, 0.1);
    this.previous = now;
    this.accumulator += elapsed;
    while (this.accumulator >= FIXED_DT) {
      this.step(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
    this.render(this.accumulator / FIXED_DT, renderElapsed);
    this.frame = requestAnimationFrame(this.tick);
  };
}
