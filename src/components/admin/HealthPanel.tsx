import React, { useEffect, useState } from 'react';
import { RefreshCwIcon, AlertCircleIcon } from '../ui/Icons';
import { useHealthStore } from '../../stores/healthStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { ServiceHealth, ServiceStatus, SystemHealthReport } from '../../types';
import { StatusGlyph, type StatusTone } from './StatusGlyph';

const AUTO_REFRESH_MS = 30_000;

const STATUS_TONE: Record<ServiceStatus, StatusTone> = {
  operational: 'success',
  degraded: 'warning',
  down: 'danger',
  unknown: 'muted',
};

const STATUS_WORD: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Unavailable',
  unknown: 'Unknown',
};

// Service health for administrators (ADM-005, NFR-OPS-005). Checks when opened and every 30 s
// while it stays open; each status is a glyph plus a word, never colour alone.
export const HealthPanel: React.FC = () => {
  const isMobile = useIsMobile(720);
  const report = useHealthStore((s) => s.report);
  const isChecking = useHealthStore((s) => s.isChecking);
  const lastError = useHealthStore((s) => s.lastError);
  const check = useHealthStore((s) => s.check);
  const now = useNow(5000);

  useEffect(() => {
    void check();
    const timer = setInterval(() => {
      if (!document.hidden) void check();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [check]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-5) var(--space-4)' : 'var(--space-6) var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div>
          <h4 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>System health</h4>
          <p aria-live="polite" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {report ? `${summarize(report)} · checked ${formatAgo(now - report.checkedAt)}` : 'Checking services…'}
          </p>
        </div>
        <button type="button" className="text-action" onClick={() => void check()} disabled={isChecking} style={{ flexShrink: 0, minHeight: isMobile ? '44px' : undefined }}>
          <RefreshCwIcon size={13} className={isChecking ? 'is-spinning' : undefined} />
          {isChecking ? 'Checking…' : 'Check now'}
        </button>
      </div>

      {lastError && (
        <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircleIcon size={14} />
          {lastError}
        </p>
      )}

      {report && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {report.services.map((service) => (
            <HealthRow key={service.id} service={service} isMobile={isMobile} />
          ))}
        </ul>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-5)', lineHeight: 1.5 }}>
        Until the EgSA gateway is deployed, these checks run from this browser. Once <code>GET /api/health</code> responds, its report is shown instead.
      </p>
    </div>
  );
};

const HealthRow: React.FC<{ service: ServiceHealth; isMobile: boolean }> = ({ service, isMobile }) => {
  const status = (
    <span className="health-status">
      <StatusGlyph tone={STATUS_TONE[service.status]} />
      {service.statusLabel || STATUS_WORD[service.status]}
    </span>
  );
  const latency = service.latencyMs !== undefined && (
    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{service.latencyMs} ms</span>
  );

  return (
    <li className="health-row" data-status={service.status}>
      {!isMobile && status}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)' }}>{service.name}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{service.detail}</div>
        {isMobile && <div style={{ marginTop: 'var(--space-2)' }}>{status}</div>}
      </div>
      {latency}
    </li>
  );
};

function summarize(report: SystemHealthReport): string {
  const unavailable = report.services.filter((s) => s.status === 'down').length;
  const notReporting = report.services.filter((s) => s.status === 'unknown').length;
  let text: string;
  if (report.overall === 'down') text = `${unavailable} service${unavailable === 1 ? '' : 's'} unavailable`;
  else if (report.overall === 'degraded') text = 'Some services degraded';
  else if (report.overall === 'operational') text = notReporting > 0 ? 'Reporting services operational' : 'All systems operational';
  else text = 'No services reporting';
  if (notReporting > 0 && report.overall !== 'unknown') text += ` · ${notReporting} not reporting`;
  return text;
}

function formatAgo(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  return `${Math.floor(seconds / 60)} min ago`;
}

// Re-renders every `intervalMs` so relative times stay current.
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
