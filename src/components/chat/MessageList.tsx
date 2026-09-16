import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MessageItem } from './MessageItem';
import { DEFAULT_PERSONAS } from '../../constants/defaults';
import { SparklesIcon } from '../ui/Icons';

export const MessageList: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = currentSession?.messages || [];

  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  // Auto-scroll to bottom on new messages or stream chunks
  useEffect(() => {
    if (preferences.autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming, preferences.autoScroll]);

  const hasOnlyGreeting = messages.length <= 1;

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 1.5rem',
        scrollBehavior: 'smooth',
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
        {/* Starter Prompts / Welcome Hero if conversation just started */}
        {hasOnlyGreeting && (
          <div
            style={{
              padding: '1.5rem 0 2rem',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-surface)',
                  border: '1px solid var(--border-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                }}
              >
                {activePersona.avatar}
              </div>
              <div>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                  {activePersona.name}
                </h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {activePersona.tagline}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <SparklesIcon size={14} />
                <span>Suggested Starter Inquiries</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {activePersona.starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    disabled={isStreaming}
                    className="glass-panel"
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Render Message List */}
        {messages.map((message, index) => {
          const isLatestAssistant =
            message.role === 'assistant' &&
            index === messages.length - 1;

          return (
            <MessageItem
              key={message.id}
              message={message}
              isLatestAssistant={isLatestAssistant}
            />
          );
        })}
      </div>
    </div>
  );
};
