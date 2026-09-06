import type { BrowserContext, Page, CDPSession } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface ActiveCoverageSession {
  session: CDPSession;
  targetName: string;
}

export class CoverageHelper {
  private sessions: ActiveCoverageSession[] = [];
  private outputDir: string;

  constructor(outputDir: string = './coverage/cdp') {
    this.outputDir = path.resolve(outputDir);
  }

  public async startPageCoverage(page: Page, targetName: string = 'page'): Promise<CDPSession> {
    const session = await page.context().newCDPSession(page);
    await session.send('Profiler.enable');
    await session.send('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: true,
    });
    this.sessions.push({ session, targetName });
    return session;
  }

  public async startServiceWorkerCoverage(context: BrowserContext): Promise<CDPSession | null> {
    let [worker] = context.serviceWorkers();
    if (!worker) {
      try {
        worker = await context.waitForEvent('serviceworker', { timeout: 5000 });
      } catch {
        return null;
      }
    }
    if (!worker) return null;

    try {
      const session = await context.newCDPSession(worker as any);
      await session.send('Profiler.enable');
      await session.send('Profiler.startPreciseCoverage', {
        callCount: true,
        detailed: true,
      });
      this.sessions.push({ session, targetName: 'service-worker' });
      return session;
    } catch (e: any) {
      console.warn('[CoverageHelper] Unable to attach CDP to service worker:', e.message);
      return null;
    }
  }

  public async stopAndCollect(): Promise<any[]> {
    fs.mkdirSync(this.outputDir, { recursive: true });
    const coverageEntries: any[] = [];

    for (const { session, targetName } of this.sessions) {
      try {
        const { result } = await session.send('Profiler.takePreciseCoverage');
        await session.send('Profiler.stopPreciseCoverage');
        await session.send('Profiler.disable');

        if (result && Array.isArray(result)) {
          coverageEntries.push(...result);
          const outFile = path.join(this.outputDir, `coverage-${targetName}-${Date.now()}.json`);
          fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
        }
      } catch (err: any) {
        console.warn(`[CoverageHelper] Failed to collect coverage for ${targetName}:`, err.message);
      }
    }

    this.sessions = [];
    return coverageEntries;
  }
}

export function createCoverageHelper(outputDir?: string): CoverageHelper {
  return new CoverageHelper(outputDir);
}
