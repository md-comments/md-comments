export interface PollManagerOptions {
  intervalMs?: number;
  minIntervalMs?: number;
}

export class CommentPollManager {
  private timer: ReturnType<typeof setInterval> | null = null;
  private isChecking = false;
  private lastCheckTime = 0;
  private visibilityListener: (() => void) | null = null;
  private focusListener: (() => void) | null = null;

  constructor(
    private checkFn: () => Promise<void>,
    private options: PollManagerOptions = {}
  ) {}

  public start(): void {
    if (this.timer) return;
    const interval = this.options.intervalMs ?? 30000;

    this.timer = setInterval(() => {
      void this.checkNow();
    }, interval);

    if (typeof document !== 'undefined' && document.addEventListener) {
      this.visibilityListener = () => {
        if (!document.hidden) {
          void this.checkNow();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityListener);
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
      this.focusListener = () => {
        void this.checkNow();
      };
      window.addEventListener('focus', this.focusListener);
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (
      this.visibilityListener &&
      typeof document !== 'undefined' &&
      document.removeEventListener
    ) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
    if (this.focusListener && typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('focus', this.focusListener);
      this.focusListener = null;
    }
  }

  public async checkNow(force = false): Promise<void> {
    if (this.isChecking) return;
    const now = Date.now();
    const minInterval = this.options.minIntervalMs ?? 10000;
    if (!force && now - this.lastCheckTime < minInterval) {
      return;
    }
    this.isChecking = true;
    this.lastCheckTime = now;
    try {
      await this.checkFn();
    } catch (err) {
      console.warn('[md-comments] poll check failed:', err);
    } finally {
      this.isChecking = false;
    }
  }

  public get running(): boolean {
    return this.timer !== null;
  }
}
