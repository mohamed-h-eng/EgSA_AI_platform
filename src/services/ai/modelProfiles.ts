import type { AIConfiguration, ModelProfile, ModelRole } from '../../types';

// Model profile rules (CHAT-006). Pure functions so the settings store, chat store, header and
// health checks agree on them, and so they can be tested. When GET /api/models exists, the
// profile list comes from there and these rules move server-side; resolveModelTarget stays.

export const ROLES: ModelRole[] = ['general', 'coding'];
export const ROLE_LABEL: Record<ModelRole, string> = { general: 'General', coding: 'Coding' };

/** Exactly one default per role: keeps the first marked one, or marks the first of the role. */
export function ensureDefaults(profiles: ModelProfile[]): ModelProfile[] {
  const seen = new Set<ModelRole>();
  const withDefault = new Set(profiles.filter((p) => p.isDefault).map((p) => p.role));
  return profiles.map((p) => {
    const shouldBeDefault = withDefault.has(p.role) ? !!p.isDefault && !seen.has(p.role) : !seen.has(p.role);
    seen.add(p.role);
    return p.isDefault === shouldBeDefault ? p : { ...p, isDefault: shouldBeDefault };
  });
}

/** CHAT-006 requires at least one general and one coding profile at all times. */
export function canRemoveProfile(profiles: ModelProfile[], id: string): boolean {
  const target = profiles.find((p) => p.id === id);
  if (!target) return false;
  return profiles.some((p) => p.id !== id && p.role === target.role);
}

export function removeProfile(profiles: ModelProfile[], id: string): ModelProfile[] {
  if (!canRemoveProfile(profiles, id)) return profiles;
  return ensureDefaults(profiles.filter((p) => p.id !== id));
}

export function setDefaultProfile(profiles: ModelProfile[], id: string): ModelProfile[] {
  const target = profiles.find((p) => p.id === id);
  if (!target) return profiles;
  return profiles.map((p) => (p.role === target.role ? { ...p, isDefault: p.id === id } : p));
}

/** Saved profiles win; a role with no profile gets its seed back; defaults are re-validated. */
export function reconcileProfiles(saved: ModelProfile[] | undefined, seed: ModelProfile[]): ModelProfile[] {
  if (!saved || saved.length === 0) return ensureDefaults(seed);
  const missing = ROLES.filter((role) => !saved.some((p) => p.role === role))
    .map((role) => seed.find((p) => p.role === role))
    .filter((p): p is ModelProfile => !!p && !saved.some((s) => s.id === p.id));
  return ensureDefaults([...saved, ...missing]);
}

export function defaultProfile(profiles: ModelProfile[], role: ModelRole = 'general'): ModelProfile {
  return profiles.find((p) => p.role === role && p.isDefault) || profiles.find((p) => p.role === role) || profiles[0];
}

/** The conversation's profile, or the default general one for older sessions / deleted profiles. */
export function resolveProfile(profiles: ModelProfile[], profileId?: string): ModelProfile {
  return (profileId && profiles.find((p) => p.id === profileId)) || defaultProfile(profiles, 'general');
}

export type ModelTarget =
  | { mode: 'demo'; modelId: string }
  | { mode: 'live'; endpointUrl: string; modelId: string }
  | { mode: 'unconfigured'; endpointUrl: string; problem: string };

/**
 * Where a profile's requests go. Demo (mock provider) unless an endpoint is configured — either
 * the profile's own or the platform endpoint from Engine & API. A live profile with no model name
 * falls back to the platform default model; with neither, it is reported rather than guessed
 * (there is no silent cloud-model fallback any more).
 */
export function resolveModelTarget(profile: ModelProfile, config: AIConfiguration): ModelTarget {
  const platformLive = config.providerType !== 'mock' && !!config.customEndpointUrl?.trim();
  const endpointUrl = profile.endpointUrl?.trim() || (platformLive ? config.customEndpointUrl!.trim() : '');
  if (!endpointUrl) return { mode: 'demo', modelId: profile.modelId.trim() || `${profile.name} (demo)` };

  const modelId = profile.modelId.trim() || config.customModelId?.trim() || '';
  if (!modelId) {
    return {
      mode: 'unconfigured',
      endpointUrl,
      problem: `No model is set for the "${profile.name}" profile. An administrator can choose one in Settings → Models.`,
    };
  }
  return { mode: 'live', endpointUrl, modelId };
}

/** Short label for headers and captions: "Coding assistant · qwen2.5-coder:7b". */
export function describeTarget(profile: ModelProfile, target: ModelTarget): string {
  if (target.mode === 'live') return `${profile.name} · ${target.modelId}`;
  if (target.mode === 'demo') return `${profile.name} · demo`;
  return `${profile.name} · no model set`;
}
