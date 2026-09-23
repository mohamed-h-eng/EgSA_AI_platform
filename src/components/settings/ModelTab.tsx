import React from 'react';
import { CheckIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_PERSONAS } from '../../constants/defaults';
import { ANSWER_LENGTHS, DEFAULT_ANSWER_LENGTH, answerLengthOf } from '../../services/ai/prompt';
import type { AnswerLength } from '../../types';
import { GroupedSection, SettingsRow } from './SettingsControls';
import { ModelProfilesSection } from './ModelProfilesSection';

export const ModelTab: React.FC = () => {
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const setPersona = useSettingsStore((s) => s.setPersona);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
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

          {/* Answer length sets both the prompt line and the reply budget (PROMPTING_CONTEXT_PLAN §5). */}
          <SettingsRow
            label="Answer length"
            subtitle={`${answerLengthOf(aiConfig.answerLength).line} Reply budget: ${answerLengthOf(aiConfig.answerLength).maxTokens} tokens.`}
          >
            <div className="segmented" role="radiogroup" aria-label="Answer length">
              {(Object.keys(ANSWER_LENGTHS) as AnswerLength[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={(aiConfig.answerLength ?? DEFAULT_ANSWER_LENGTH) === key}
                  className="segmented-option"
                  onClick={() => setAIConfig({ answerLength: key })}
                >
                  {ANSWER_LENGTHS[key].label}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow
            label="Conversation memory"
            subtitle="Older turns are left out when the conversation no longer fits the model's context size, which is set per profile above."
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Automatic</span>
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
