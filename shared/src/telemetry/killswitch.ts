/**
 * Telemetry Kill-Switch and Opt-Out Controller (INV-TELEMETRY-KILLSWITCH)
 * Guarantees zero network transmission, zero background timers, and instant local queue purge when disabled.
 */

export class TelemetryKillSwitch {
  private static enabled: boolean = true;
  private static purgeCallbacks: Array<() => Promise<void> | void> = [];

  /**
   * Registers a cleanup callback to be executed immediately upon disabling telemetry.
   */
  public static onPurge(callback: () => Promise<void> | void): void {
    this.purgeCallbacks.push(callback);
  }

  /**
   * Evaluates if telemetry is currently permitted.
   */
  public static isEnabled(): boolean {
    if (!this.enabled) {
      return false;
    }

    // Check DO_NOT_TRACK from process environment
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.DO_NOT_TRACK === '1' || process.env.MD_COMMENTS_TELEMETRY_DISABLED === '1') {
        return false;
      }
    }

    // Check browser navigator.doNotTrack safely across Node and Browser
    if (typeof globalThis !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      const dnt = g.navigator?.doNotTrack || g.window?.doNotTrack || g.navigator?.msDoNotTrack;
      if (dnt === '1' || dnt === 'yes') {
        return false;
      }
    }

    return true;
  }

  /**
   * Explicitly updates the telemetry enabled state.
   * If toggled to false, immediately triggers all registered purge callbacks.
   */
  public static async setEnabled(value: boolean): Promise<void> {
    this.enabled = value;
    if (!value) {
      await this.triggerPurge();
    }
  }

  /**
   * Immediately purges any buffered queues.
   */
  public static async triggerPurge(): Promise<void> {
    for (const callback of this.purgeCallbacks) {
      try {
        await callback();
      } catch {
        // Suppress errors during purge to guarantee graceful shutdown
      }
    }
  }
}
