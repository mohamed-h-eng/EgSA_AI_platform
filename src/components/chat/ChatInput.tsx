import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, StopCircleIcon, SparklesIcon, SlidersIcon } from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_MODELS, DEFAULT_PERSONAS } from '../../constants/defaults';

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const openSettings = useSettingsStore((s) => s.openSettings);

  const activeModel = DEFAULT_MODELS.find((m) => m.id === aiConfig.activeModelId) || DEFAULT_MODELS[0];
  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (preferences.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        padding: '0.85rem 1.25rem 1.25rem',
        maxWidth: '840px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '0.65rem 0.85rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
      >
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activePersona.name} (${activeModel.name})...`}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            resize: 'none',
            outline: 'none',
            fontSize: 'var(--chat-font-size, var(--text-base))',
            color: 'var(--text-primary)',
            padding: '0.35rem 0.45rem',
            maxHeight: '180px',
            minHeight: '26px',
            lineHeight: 1.5,
          }}
        />

        {/* Input Bar Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.35rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Quick Model and Persona Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => openSettings('model')}
              title="Click to customize AI model & parameters"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: 'var(--text-xs)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-surface)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 500,
              }}
            >
              <SparklesIcon size={13} />
              <span>{activeModel.name}</span>
            </button>

            <button
              onClick={() => openSettings('personas')}
              title="Active Persona Preset"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: 'var(--text-xs)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>{activePersona.avatar}</span>
              <span>{activePersona.name}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              onClick={() => openSettings('model')}
              title="Fine-tune temperature & parameters"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
            >
              <SlidersIcon size={16} />
            </button>

            {isStreaming ? (
              <button
                onClick={stopGeneration}
                title="Stop generation"
                style={{
                  height: '34px',
                  padding: '0 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                }}
              >
                <StopCircleIcon size={15} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                title="Send message (Enter)"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  background: input.trim() ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: input.trim() ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() ? 'var(--shadow-glow)' : 'none',
                }}
              >
                <SendIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.4rem',
          padding: '0 0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>EgSA AI Interface • Modular & Extensible Architecture</span>
        <span>{preferences.sendOnEnter ? 'Press Enter to send, Shift+Enter for new line' : 'Press button to send'}</span>
      </div>
    </div>
  );
};
