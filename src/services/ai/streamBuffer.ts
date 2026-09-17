import type { TokenStats } from '../../types';

export interface StreamUpdateCallback {
  (content: string, isDone: boolean, stats?: TokenStats): void;
}

/**
 * SmoothStreamBuffer coordinates 60fps token pacing using requestAnimationFrame,
 * turning erratic network chunks into silky, fluid character/word flow.
 */
export class SmoothStreamBuffer {
  private queue: string = '';
  private displayedText: string = '';
  private isDone: boolean = false;
  private animFrameId: number | null = null;
  private lastStats?: TokenStats;
  private onUpdate: StreamUpdateCallback;

  constructor(onUpdate: StreamUpdateCallback) {
    this.onUpdate = onUpdate;
  }

  append(chunk: string, done: boolean, stats?: TokenStats) {
    this.queue += chunk;
    if (done) {
      this.isDone = true;
      this.lastStats = stats;
    }
    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = () => {
    if (this.queue.length > 0) {
      // Dynamic pacing based on backlog depth:
      // Small backlog: 1-2 characters per frame for natural typewriter rhythm
      // Medium backlog: 3-4 characters
      // Deep backlog: dynamically drains so it never lags behind large responses
      let drainCount = 1;
      if (this.queue.length > 60) {
        drainCount = Math.ceil(this.queue.length / 8);
      } else if (this.queue.length > 25) {
        drainCount = 3;
      } else if (this.queue.length > 8) {
        drainCount = 2;
      }

      const nextSlice = this.queue.slice(0, drainCount);
      this.queue = this.queue.slice(drainCount);
      this.displayedText += nextSlice;

      const finished = this.isDone && this.queue.length === 0;
      this.onUpdate(this.displayedText, finished, finished ? this.lastStats : undefined);
    }

    if (this.queue.length > 0 || !this.isDone) {
      this.animFrameId = requestAnimationFrame(this.tick);
    } else {
      // Buffer completely drained
      this.onUpdate(this.displayedText, true, this.lastStats);
      this.animFrameId = null;
    }
  };

  flushAndStop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.queue.length > 0) {
      this.displayedText += this.queue;
      this.queue = '';
    }
    this.onUpdate(this.displayedText, true, this.lastStats);
  }

  abort() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.queue = '';
  }
}
