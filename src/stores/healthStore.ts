import { createStore } from './createStore';
import type { SystemHealthReport } from '../types';
import { getSystemHealth } from '../services/health/healthService';

interface HealthState {
  report: SystemHealthReport | null;
  isChecking: boolean;
  lastError: string | null;

  check: () => Promise<void>;
}

// Service health for the Administration modal (ADM-005). Not persisted: a stale report from a
// previous visit would be misleading, so the panel always re-checks when it opens.
export const useHealthStore = createStore<HealthState>((set) => {
  let inFlight: AbortController | null = null;

  return {
    report: null,
    isChecking: false,
    lastError: null,

    check: async () => {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      set({ isChecking: true, lastError: null });

      try {
        const report = await getSystemHealth({ signal: controller.signal });
        if (inFlight === controller) set({ report, isChecking: false });
      } catch (err) {
        if (controller.signal.aborted) return;
        set({ isChecking: false, lastError: err instanceof Error ? err.message : 'Health check failed' });
      } finally {
        if (inFlight === controller) inFlight = null;
      }
    },
  };
});
