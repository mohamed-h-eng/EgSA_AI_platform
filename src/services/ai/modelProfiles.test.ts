import { describe, expect, it } from 'vitest';
import {
  canRemoveProfile,
  defaultProfile,
  ensureDefaults,
  reconcileProfiles,
  removeProfile,
  resolveModelTarget,
  resolveProfile,
  setDefaultProfile,
} from './modelProfiles';
import { DEFAULT_AI_CONFIG, DEFAULT_MODEL_PROFILES } from '../../constants/defaults';
import type { AIConfiguration, ModelProfile } from '../../types';

const general: ModelProfile = { id: 'g', name: 'General', role: 'general', modelId: 'llama3.1:8b', isDefault: true };
const general2: ModelProfile = { id: 'g2', name: 'General 2', role: 'general', modelId: 'qwen2.5:14b' };
const coding: ModelProfile = { id: 'c', name: 'Coding', role: 'coding', modelId: '', isDefault: true };
const profiles = [general, general2, coding];

const live: AIConfiguration = { ...DEFAULT_AI_CONFIG, providerType: 'custom-api', customEndpointUrl: 'http://gpu:11434/v1', customModelId: '' };

describe('profile rules (CHAT-006)', () => {
  it('keeps at least one profile per role', () => {
    expect(canRemoveProfile(profiles, 'g2')).toBe(true);
    expect(canRemoveProfile(profiles, 'c')).toBe(false);
    expect(removeProfile(profiles, 'c')).toBe(profiles);
  });

  it('moves the default when the default profile is removed', () => {
    const next = removeProfile(profiles, 'g');
    expect(defaultProfile(next, 'general').id).toBe('g2');
    expect(next.find((p) => p.id === 'g2')?.isDefault).toBe(true);
  });

  it('has exactly one default per role', () => {
    const fixed = ensureDefaults([{ ...general }, { ...general2, isDefault: true }, { ...coding, isDefault: false }]);
    expect(fixed.filter((p) => p.role === 'general' && p.isDefault).map((p) => p.id)).toEqual(['g']);
    expect(fixed.find((p) => p.id === 'c')?.isDefault).toBe(true);
    const switched = setDefaultProfile(profiles, 'g2');
    expect(switched.filter((p) => p.isDefault).map((p) => p.id).sort()).toEqual(['c', 'g2']);
  });

  it('restores a missing role from the seed and keeps saved profiles', () => {
    const merged = reconcileProfiles([general2], DEFAULT_MODEL_PROFILES);
    expect(merged.map((p) => p.role).sort()).toEqual(['coding', 'general']);
    expect(merged[0]).toMatchObject({ id: 'g2', isDefault: true });
    expect(reconcileProfiles(undefined, DEFAULT_MODEL_PROFILES)).toHaveLength(2);
  });

  it('falls back to the default general profile for old or unknown sessions', () => {
    expect(resolveProfile(profiles, undefined).id).toBe('g');
    expect(resolveProfile(profiles, 'deleted').id).toBe('g');
    expect(resolveProfile(profiles, 'c').id).toBe('c');
  });
});

describe('resolveModelTarget', () => {
  it('is demo mode without a live endpoint', () => {
    expect(resolveModelTarget(general, DEFAULT_AI_CONFIG).mode).toBe('demo');
  });

  it('uses the profile model on the platform endpoint', () => {
    expect(resolveModelTarget(general, live)).toEqual({ mode: 'live', endpointUrl: 'http://gpu:11434/v1', modelId: 'llama3.1:8b' });
  });

  it('falls back to the endpoint default model, and reports when there is none (no cloud fallback)', () => {
    expect(resolveModelTarget(coding, { ...live, customModelId: 'qwen2.5-coder:7b' })).toMatchObject({ mode: 'live', modelId: 'qwen2.5-coder:7b' });
    expect(resolveModelTarget(coding, live).mode).toBe('unconfigured');
  });

  it('lets a profile use its own endpoint even when the platform is in demo mode', () => {
    const remote = { ...coding, modelId: 'deepseek-coder', endpointUrl: 'http://code-box:8000/v1' };
    expect(resolveModelTarget(remote, DEFAULT_AI_CONFIG)).toMatchObject({ mode: 'live', endpointUrl: 'http://code-box:8000/v1' });
  });
});
