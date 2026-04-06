/**
 * FakeRaf — controllable requestAnimationFrame for tests.
 *
 * Usage:
 *   const raf = new FakeRaf();
 *   raf.install();       // replace window.requestAnimationFrame
 *   raf.tick();           // fire one pending callback
 *   raf.tickAll();        // fire all pending callbacks
 *   raf.tickFrames(10);   // fire 10 frames
 *   raf.uninstall();      // restore original
 */
export class FakeRaf {
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  private time = 0;
  private originalRaf: typeof window.requestAnimationFrame | null = null;
  private originalCaf: typeof window.cancelAnimationFrame | null = null;

  install(): void {
    this.originalRaf = window.requestAnimationFrame;
    this.originalCaf = window.cancelAnimationFrame;
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      const id = this.nextId++;
      this.callbacks.set(id, cb);
      return id;
    };
    window.cancelAnimationFrame = (id: number) => {
      this.callbacks.delete(id);
    };
  }

  /** Fire one pending callback. */
  tick(advanceMs = 16): void {
    this.time += advanceMs;
    const [id, cb] = this.callbacks.entries().next().value ?? [];
    if (id != null && cb) {
      this.callbacks.delete(id);
      cb(this.time);
    }
  }

  /** Fire all currently pending callbacks (one round). */
  tickAll(advanceMs = 16): void {
    this.time += advanceMs;
    const pending = [...this.callbacks.entries()];
    this.callbacks.clear();
    for (const [, cb] of pending) {
      cb(this.time);
    }
  }

  /** Fire N frames, each advancing time. */
  tickFrames(n: number, advanceMs = 40): void {
    for (let i = 0; i < n; i++) {
      this.tickAll(advanceMs);
    }
  }

  get pendingCount(): number {
    return this.callbacks.size;
  }

  uninstall(): void {
    if (this.originalRaf) window.requestAnimationFrame = this.originalRaf;
    if (this.originalCaf) window.cancelAnimationFrame = this.originalCaf;
    this.callbacks.clear();
    this.originalRaf = null;
    this.originalCaf = null;
  }
}
