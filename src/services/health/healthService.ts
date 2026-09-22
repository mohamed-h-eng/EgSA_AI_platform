import type { AIConfiguration, ServiceHealth, ServiceStatus, SystemHealthReport } from '../../types';
import { useDocumentStore } from '../../stores/documentStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { fetchAvailableModels } from '../ai/apiProvider';
import { ROLES, ROLE_LABEL, defaultProfile, resolveModelTarget } from '../ai/modelProfiles';

const CHECK_TIMEOUT_MS = 5000;

// Single swap-in point for service health (ADM-005, NFR-OPS-005). The admin panel only depends on
// SystemHealthReport, so once the gateway serves GET /api/health in that shape its report is used
// as-is and the derived checks below become dead code.
//
// Until then the report is assembled in the browser: the gateway probe (which detects that the
// gateway isn't deployed yet), a model-list request per model profile endpoint (no tokens are
// spent, unlike testEndpointConnection), and the knowledge index state from documentStore.
export async function getSystemHealth(options: { signal?: AbortSignal } = {}): Promise<SystemHealthReport> {
  const { signal } = options;

  const gateway = await probeGateway(signal);
  if (gateway.report) return gateway.report;

  const models = await checkModelProfiles(signal);
  const checkedAt = Date.now();
  const all: ServiceHealth[] = [
    ...models,
    checkKnowledgeIndex(),
    gateway.row,
    {
      id: 'retrieval',
      name: 'Embeddings / retrieval',
      status: 'unknown',
      detail: 'Reported by the gateway once connected',
      checkedAt,
    },
  ];
  return { overall: overallStatus(all), services: all, checkedAt };
}

// Worst status among the services that report one; 'unknown' only when nothing reports.
export function overallStatus(services: ServiceHealth[]): ServiceStatus {
  const reporting = services.filter((s) => s.status !== 'unknown');
  if (reporting.length === 0) return 'unknown';
  if (reporting.some((s) => s.status === 'down')) return 'down';
  if (reporting.some((s) => s.status === 'degraded')) return 'degraded';
  return 'operational';
}

async function probeGateway(signal?: AbortSignal): Promise<{ row: ServiceHealth; report?: SystemHealthReport }> {
  const started = Date.now();
  const row = (status: ServiceStatus, detail: string, statusLabel?: string): ServiceHealth => ({
    id: 'gateway',
    name: 'EgSA Gateway / API',
    status,
    statusLabel,
    latencyMs: status === 'unknown' ? undefined : Date.now() - started,
    detail,
    checkedAt: Date.now(),
  });
  const notDeployed = () => ({
    row: row('unknown', 'Gateway not deployed yet: the browser talks to the model directly', 'Not connected'),
  });

  try {
    const res = await withTimeout(fetch('/api/health', { headers: { Accept: 'application/json' }, signal }), signal);
    // The Vite dev server (and a plain static host) answer unknown paths with index.html.
    if (!(res.headers.get('content-type') || '').includes('application/json')) return notDeployed();
    if (!res.ok) return { row: row('down', `GET /api/health returned HTTP ${res.status}`) };

    const body = (await res.json()) as Partial<SystemHealthReport>;
    const gatewayRow = row('operational', 'GET /api/health');
    if (!Array.isArray(body.services)) {
      return { row: { ...gatewayRow, status: 'degraded', detail: 'GET /api/health answered in an unexpected shape' } };
    }
    const services = [gatewayRow, ...body.services];
    return { row: gatewayRow, report: { overall: overallStatus(services), services, checkedAt: Date.now() } };
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err instanceof TimeoutError) return { row: row('down', `No response within ${CHECK_TIMEOUT_MS / 1000} s`) };
    return notDeployed();
  }
}

// One row per role's default profile (CHAT-006): "General model", "Coding model". Each distinct
// endpoint is asked for its model list once (GET …/models, no tokens spent).
async function checkModelProfiles(signal?: AbortSignal): Promise<ServiceHealth[]> {
  const { aiConfig, profiles } = useSettingsStore.getState();
  const listings = new Map<string, Promise<ModelListing>>();
  const listModels = (endpoint: string) => {
    if (!listings.has(endpoint)) listings.set(endpoint, fetchModelList(endpoint, aiConfig, signal));
    return listings.get(endpoint)!;
  };

  return Promise.all(
    ROLES.map(async (role): Promise<ServiceHealth> => {
      const profile = defaultProfile(profiles, role);
      const base = { id: `model-${role}`, name: `${ROLE_LABEL[role]} model` };
      const target = resolveModelTarget(profile, aiConfig);

      if (target.mode === 'demo') {
        return { ...base, status: 'unknown', statusLabel: 'Demo mode', detail: `${profile.name}: mock provider, no live model connected`, checkedAt: Date.now() };
      }
      if (target.mode === 'unconfigured') {
        return { ...base, status: 'degraded', detail: `${profile.name}: no model set (Settings → Models)`, checkedAt: Date.now() };
      }

      const where = `${profile.name}: ${target.modelId} at ${target.endpointUrl}`;
      const listing = await listModels(target.endpointUrl);
      if (!listing.ok) {
        return { ...base, status: 'down', latencyMs: listing.latencyMs, detail: `${where}: ${listing.error}`, checkedAt: Date.now() };
      }
      if (listing.models.length > 0 && !listing.models.includes(target.modelId)) {
        return { ...base, status: 'degraded', latencyMs: listing.latencyMs, detail: `${where}: model not offered by this endpoint`, checkedAt: Date.now() };
      }
      return { ...base, status: 'operational', latencyMs: listing.latencyMs, detail: where, checkedAt: Date.now() };
    })
  );
}

type ModelListing = { ok: true; models: string[]; latencyMs: number } | { ok: false; error: string; latencyMs?: number };

async function fetchModelList(endpoint: string, aiConfig: AIConfiguration, signal?: AbortSignal): Promise<ModelListing> {
  const started = Date.now();
  // Its own controller so a timeout also cancels the request, not just stops waiting for it.
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const result = await withTimeout(
      fetchAvailableModels({ endpointUrl: endpoint, apiKey: aiConfig.apiKey, useProxy: aiConfig.useProxy, signal: controller.signal }),
      signal
    );
    const latencyMs = Date.now() - started;
    return result.ok ? { ok: true, models: result.models, latencyMs } : { ok: false, error: result.error || 'endpoint unreachable', latencyMs };
  } catch (err) {
    if (signal?.aborted) throw err;
    return { ok: false, error: err instanceof TimeoutError ? `no response within ${CHECK_TIMEOUT_MS / 1000} s` : 'endpoint unreachable' };
  } finally {
    signal?.removeEventListener('abort', onAbort);
    controller.abort();
  }
}

function checkKnowledgeIndex(): ServiceHealth {
  const { documents, projects } = useDocumentStore.getState();
  const indexed = documents.filter((d) => d.status === 'indexed').length;
  const inProgress = documents.filter((d) => d.status === 'pending' || d.status === 'indexing').length;
  const failed = documents.filter((d) => d.status === 'error');

  const parts = [`${indexed} indexed`];
  if (inProgress > 0) parts.push(`${inProgress} indexing`);
  if (failed.length > 0) parts.push(`${failed.length} failed (${failed.map((d) => d.documentId || d.title).join(', ')})`);

  // ADM-007 switches are intentional, so they're reported but don't degrade the status.
  const offProjects = projects.filter((p) => p.disabled).length;
  const offSubsystems = projects.filter((p) => !p.disabled).reduce((n, p) => n + (p.disabledSubsystems?.length || 0), 0);
  if (offProjects > 0) parts.push(`${offProjects} project${offProjects === 1 ? '' : 's'} switched off`);
  if (offSubsystems > 0) parts.push(`${offSubsystems} subsystem${offSubsystems === 1 ? '' : 's'} switched off`);

  let status: ServiceStatus = 'operational';
  if (failed.length > 0) status = 'degraded';
  if (indexed === 0) {
    status = 'degraded';
    parts.push('the Copilot has nothing to search');
  }

  return { id: 'knowledge-index', name: 'Knowledge index', status, detail: parts.join(' · '), checkedAt: Date.now() };
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), CHECK_TIMEOUT_MS);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}
