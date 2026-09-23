import React, { useId, useState } from 'react';
import { PlusIcon, RefreshCwIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRoleStore } from '../../stores/roleStore';
import { fetchAvailableModels } from '../../services/ai/apiProvider';
import { useChatStore } from '../../stores/chatStore';
import { DEFAULT_CONTEXT_TOKENS } from '../../services/ai/context';
import { ROLES, ROLE_LABEL, canRemoveProfile, resolveModelTarget, resolveProfile } from '../../services/ai/modelProfiles';
import type { ModelProfile, ModelRole } from '../../types';
import { GroupedSection } from './SettingsControls';

// Settings → Models: the general/coding model profiles (CHAT-006). Admin View edits them; User
// View lists them read-only (profiles are platform configuration, not personal preferences).
export const ModelProfilesSection: React.FC = () => {
  const profiles = useSettingsStore((s) => s.profiles);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const addProfile = useSettingsStore((s) => s.addProfile);
  const isAdmin = useRoleStore((s) => s.isAdmin);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <GroupedSection title="Model profiles">
      <p style={{ padding: 'var(--space-3) var(--space-4) 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {isAdmin
          ? 'Each conversation uses one profile. Leave the model empty to use the endpoint’s default model from Engine & API.'
          : 'Profiles are set by an administrator. Pick one per conversation from the header.'}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 'var(--space-2) 0' }}>
        {ROLES.flatMap((role) => profiles.filter((p) => p.role === role)).map((profile) => {
          const target = resolveModelTarget(profile, aiConfig);
          const modelText =
            target.mode === 'live' ? target.modelId : target.mode === 'demo' ? 'Demo mode (no endpoint)' : 'No model set';
          const isEditing = editingId === profile.id;
          return (
            <li key={profile.id} className="profile-row" data-editing={isEditing || undefined}>
              <div className="profile-row-summary">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {profile.name}
                  </span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: target.mode === 'unconfigured' ? 'var(--danger)' : 'var(--text-muted)', marginTop: '2px' }}>
                    {ROLE_LABEL[profile.role]}
                    {profile.isDefault ? ' · default' : ''} · {modelText}
                    {profile.contextMode === 'server' ? ' · server keeps context' : ''}
                  </span>
                </span>
                {isAdmin && (
                  <button type="button" className="text-action" aria-expanded={isEditing} onClick={() => setEditingId(isEditing ? null : profile.id)}>
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>
              {isAdmin && isEditing && <ProfileEditor profile={profile} onRemoved={() => setEditingId(null)} />}
            </li>
          );
        })}
      </ul>
      {isAdmin && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <button
            type="button"
            className="text-action"
            onClick={() => setEditingId(addProfile({ name: 'New profile', role: 'general', modelId: '' }))}
          >
            <PlusIcon size={13} />
            Add profile
          </button>
        </div>
      )}
    </GroupedSection>
  );
};

const ProfileEditor: React.FC<{ profile: ModelProfile; onRemoved: () => void }> = ({ profile, onRemoved }) => {
  const profiles = useSettingsStore((s) => s.profiles);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const removeProfile = useSettingsStore((s) => s.removeProfile);
  const setDefaultProfile = useSettingsStore((s) => s.setDefaultProfile);
  // The open conversation can be switched to this profile from here, since the header picker went
  // away (ASTRONAUT_STATUS_PLAN §12); "make default" only affects new conversations.
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessionProfileId = useChatStore((s) => s.sessions.find((x) => x.id === s.activeSessionId)?.profileId);
  const setSessionProfile = useChatStore((s) => s.setSessionProfile);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const uid = useId();
  const [models, setModels] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle');

  const endpoint = profile.endpointUrl?.trim() || aiConfig.customEndpointUrl?.trim() || '';
  const removable = canRemoveProfile(profiles, profile.id);
  // Changing role must not leave the old role without a profile (CHAT-006).
  const roleLocked = !canRemoveProfile(profiles, profile.id);
  const usedHere = !!activeSessionId && resolveProfile(profiles, sessionProfileId).id === profile.id;

  const loadModels = async () => {
    if (!endpoint) return;
    setLoadState('loading');
    const result = await fetchAvailableModels({ endpointUrl: endpoint, apiKey: aiConfig.apiKey, useProxy: aiConfig.useProxy ?? true });
    setModels(result.models);
    setLoadState(result.ok ? 'idle' : 'error');
  };

  return (
    <div className="profile-editor">
      <label className="field">
        <span className="field-label">Name</span>
        <input type="text" value={profile.name} onChange={(e) => updateProfile(profile.id, { name: e.target.value })} />
      </label>

      <div className="field">
        <span className="field-label" id={`${uid}-role`}>Role</span>
        <div className="segmented" role="radiogroup" aria-labelledby={`${uid}-role`}>
          {ROLES.map((role: ModelRole) => (
            <button
              key={role}
              type="button"
              role="radio"
              aria-checked={profile.role === role}
              className="segmented-option"
              disabled={roleLocked && profile.role !== role}
              title={roleLocked && profile.role !== role ? `This is the only ${ROLE_LABEL[profile.role].toLowerCase()} profile` : undefined}
              onClick={() => updateProfile(profile.id, { role })}
            >
              {ROLE_LABEL[role]}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field-label">Model</span>
        <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="text"
            list={`${uid}-models`}
            value={profile.modelId}
            placeholder={aiConfig.customModelId ? `Endpoint default (${aiConfig.customModelId})` : 'e.g. qwen2.5-coder:7b'}
            onChange={(e) => updateProfile(profile.id, { modelId: e.target.value })}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button type="button" className="text-action" onClick={loadModels} disabled={!endpoint || loadState === 'loading'} title={endpoint ? `List models from ${endpoint}` : 'Set an endpoint in Engine & API first'}>
            <RefreshCwIcon size={12} className={loadState === 'loading' ? 'is-spinning' : undefined} />
            Load
          </button>
        </span>
        <datalist id={`${uid}-models`}>
          {models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        {loadState === 'error' && <span className="field-help" style={{ color: 'var(--danger)' }}>Couldn’t list models from the endpoint. Type the name instead.</span>}
      </label>

      <label className="field">
        <span className="field-label">Endpoint (optional)</span>
        <input
          type="text"
          value={profile.endpointUrl || ''}
          placeholder={aiConfig.customEndpointUrl || 'Uses the Engine & API endpoint'}
          onChange={(e) => updateProfile(profile.id, { endpointUrl: e.target.value })}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <span className="field-help">Only for a model served on a different machine; the API key and proxy settings are shared.</span>
      </label>

      <label className="field">
        <span className="field-label">Context size (tokens)</span>
        <input
          type="number"
          min={1024}
          step={1024}
          value={profile.contextTokens ?? DEFAULT_CONTEXT_TOKENS}
          onChange={(e) => updateProfile(profile.id, { contextTokens: Math.max(1024, parseInt(e.target.value, 10) || DEFAULT_CONTEXT_TOKENS) })}
          style={{ fontFamily: 'var(--font-mono)', maxWidth: '10rem' }}
        />
        <span className="field-help">
          What the server really allows. History is filled newest-first until it's spent. On Ollama set OLLAMA_CONTEXT_LENGTH or the
          Modelfile num_ctx — the /v1 endpoint ignores per-request values and silently drops the oldest messages.
        </span>
      </label>

      <div className="field">
        <span className="field-label" id={`${uid}-context`}>Conversation context</span>
        <div className="segmented" role="radiogroup" aria-labelledby={`${uid}-context`}>
          <button
            type="button"
            role="radio"
            aria-checked={(profile.contextMode ?? 'app') === 'app'}
            className="segmented-option"
            onClick={() => updateProfile(profile.id, { contextMode: 'app' })}
          >
            This app sends it
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={profile.contextMode === 'server'}
            className="segmented-option"
            onClick={() => updateProfile(profile.id, { contextMode: 'server' })}
          >
            Server keeps it
          </button>
        </div>
        <span className="field-help">
          {profile.contextMode === 'server'
            ? 'Only the new message is sent, with conversation and message ids. Use this with the EgSA gateway, which stores conversations; a plain model endpoint would forget earlier messages.'
            : 'Each request carries a cleaned recent history (Ollama, LM Studio and OpenRouter don’t remember earlier messages on their own).'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
        <button type="button" className="text-action" disabled={profile.isDefault} onClick={() => setDefaultProfile(profile.id)}>
          {profile.isDefault ? `Default ${ROLE_LABEL[profile.role].toLowerCase()} profile` : `Make default ${ROLE_LABEL[profile.role].toLowerCase()} profile`}
        </button>
        {activeSessionId && (
          <button
            type="button"
            className="text-action"
            disabled={usedHere || isStreaming}
            title={isStreaming ? 'Wait for the current answer to finish' : 'Applies from the next answer in the open conversation'}
            onClick={() => setSessionProfile(activeSessionId, profile.id)}
          >
            {usedHere ? 'Used in the open conversation' : 'Use in the open conversation'}
          </button>
        )}
        <button
          type="button"
          className="text-action"
          style={{ color: removable ? 'var(--danger)' : undefined }}
          disabled={!removable}
          title={removable ? undefined : `At least one ${ROLE_LABEL[profile.role].toLowerCase()} profile is required`}
          onClick={() => {
            removeProfile(profile.id);
            onRemoved();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
};
