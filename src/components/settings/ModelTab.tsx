import React from 'react';
import { CheckIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_PERSONAS } from '../../constants/defaults';
import { GroupedSection, SettingsRow } from './SettingsControls';
import { ModelProfilesSection } from './ModelProfilesSection';

export const ModelTab: React.FC = () => {
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const setPersona = useSettingsStore((s) => s.setPersona);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const setMaxTokens = useSettingsStore((s) => s.setMaxTokens);
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);

  return (
      <>
        <ModelProfilesSection />

        <GroupedSection title="Specialist Persona">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DEFAULT_PERSONAS.map((persona, idx) => {
              const isSelected = aiConfig.activePersonaId === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setPersona(persona.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom:
                      idx < DEFAULT_PERSONAS.length - 1 ? '1px solid var(--hairline)' : 'none',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{persona.avatar}</span>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {persona.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {persona.tagline}
                      </div>
                    </div>
                  </div>
                  {isSelected && <CheckIcon size={16} style={{ color: 'var(--accent-primary)' }} />}
                </div>
              );
            })}
          </div>
        </GroupedSection>

        <GroupedSection title="Model Parameters">
          <SettingsRow
            label="Temperature"
            subtitle={`Controls randomness vs determinism: ${aiConfig.temperature}`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={aiConfig.temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
            />
          </SettingsRow>

          <SettingsRow label="Max Tokens" subtitle={`Completion token limit: ${aiConfig.maxTokens}`}>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={aiConfig.maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
              style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
            />
          </SettingsRow>

          <SettingsRow
            label="Conversation memory"
            subtitle={`Recent messages sent to the model: ${aiConfig.historyLimit ?? 30}. Older ones are left out so long chats keep working.`}
          >
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={aiConfig.historyLimit ?? 30}
              onChange={(e) => setAIConfig({ historyLimit: parseInt(e.target.value, 10) })}
              aria-label="Conversation memory, in messages"
              style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
            />
          </SettingsRow>
        </GroupedSection>

        <GroupedSection title="System Instructions">
          <div style={{ padding: '0.85rem' }}>
            <textarea
              rows={4}
              value={aiConfig.systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.75rem',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>
        </GroupedSection>
      </>
  );
};
