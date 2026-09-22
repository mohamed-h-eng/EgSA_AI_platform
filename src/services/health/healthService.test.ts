import { describe, expect, it } from 'vitest';
import { overallStatus } from './healthService';
import type { ServiceHealth, ServiceStatus } from '../../types';

const svc = (status: ServiceStatus): ServiceHealth => ({ id: status, name: status, status, detail: '', checkedAt: 0 });

describe('overallStatus (ADM-005)', () => {
  it('is the worst status among reporting services', () => {
    expect(overallStatus([svc('operational'), svc('degraded')])).toBe('degraded');
    expect(overallStatus([svc('degraded'), svc('down'), svc('operational')])).toBe('down');
    expect(overallStatus([svc('operational'), svc('operational')])).toBe('operational');
  });

  it('ignores services that do not report', () => {
    expect(overallStatus([svc('operational'), svc('unknown')])).toBe('operational');
  });

  it('is unknown when nothing reports', () => {
    expect(overallStatus([svc('unknown')])).toBe('unknown');
    expect(overallStatus([])).toBe('unknown');
  });
});
