import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CopyIcon, CheckIcon, RefreshCwIcon, UserIcon, BotIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';
import { DEFAULT_PERSONAS } from '../../constants/defaults';

interface MessageItemProps {
  message: ChatMessage;
  isLatestAssistant: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLatestAssistant }) => {
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const regenerateResponse = useChatStore((s) => s.regenerateResponse);

  const isUser = message.role === 'user';
  const persona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBubbleStyle = () => {
    if (isUser) {
      return {
        background: 'var(--msg-user-bg)',
        color: 'var(--msg-user-text)',
        borderRadius: preferences.bubbleStyle === 'minimal' ? 'var(--radius-sm)' : 'var(--radius-md) var(--radius-sm) var(--radius-xs) var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
      };
    }

    switch (preferences.bubbleStyle) {
      case 'minimal':
        return {
          background: 'transparent',
          borderLeft: '2px solid var(--accent-primary)',
          borderRadius: 0,
          paddingLeft: '0.85rem',
        };
      case 'bordered':
        return {
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-md)',
        };
      case 'modern':
      default:
        return {
          background: 'var(--msg-assistant-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xs) var(--radius-md) var(--radius-md) var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '0.85rem',
        padding: preferences.chatDensity === 'compact' ? '0.45rem 0' : '0.85rem 0',
        animation: 'fadeIn 0.25s ease-out forwards',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
          border: `1px solid ${isUser ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          color: isUser ? 'var(--accent-primary)' : 'var(--text-primary)',
          fontSize: '1.15rem',
          userSelect: 'none',
        }}
        title={isUser ? 'You' : persona?.name || 'AI Assistant'}
      >
        {isUser ? <UserIcon size={18} /> : persona?.avatar || <BotIcon size={18} />}
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: '85%', minWidth: '120px' }}>
        {/* Header (Author, Model, Time) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.35rem',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isUser ? 'You' : persona?.name || 'EgSA Assistant'}
          </span>
          {!isUser && message.modelId && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {message.modelId}
            </span>
          )}
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: preferences.chatDensity === 'compact' ? '0.65rem 0.95rem' : '0.85rem 1.15rem',
            fontSize: 'var(--chat-font-size, var(--text-base))',
            position: 'relative',
            ...getBubbleStyle(),
          }}
        >
          {message.status === 'error' ? (
            <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️ {message.error || message.content}</span>
            </div>
          ) : isUser ? (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
          ) : (
            <MarkdownRenderer
              content={message.content}
              isStreaming={message.status === 'streaming'}
            />
          )}

          {/* Assistant Metadata / Token Stats Bar */}
          {!isUser && message.stats && (
            <div
              style={{
                marginTop: '0.6rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <button
                onClick={() => setShowStats(!showStats)}
                style={{
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--accent-primary)',
                }}
              >
                <span>⚡ {message.stats.latencyMs}ms</span>
                {message.stats.charsPerSec && <span>• {message.stats.charsPerSec} c/s</span>}
                {message.stats.totalTokens && <span>• {message.stats.totalTokens} tokens</span>}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={handleCopy}
                  title="Copy response"
                  style={{
                    padding: '0.2rem 0.4rem',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: copied ? 'var(--accent-primary)' : 'inherit',
                  }}
                >
                  {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                </button>

                {isLatestAssistant && !isStreaming && (
                  <button
                    onClick={() => regenerateResponse(message.id)}
                    title="Regenerate response"
                    style={{
                      padding: '0.2rem 0.4rem',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <RefreshCwIcon size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
