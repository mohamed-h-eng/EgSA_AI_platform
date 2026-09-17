import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CopyIcon, CheckIcon, RefreshCwIcon, PencilIcon, ArrowUpIcon } from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';

interface MessageItemProps {
  message: ChatMessage;
  isLatestAssistant: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLatestAssistant }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isStreaming = useChatStore((s) => s.isStreaming);
  const regenerateResponse = useChatStore((s) => s.regenerateResponse);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditedContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleSendEdited = () => {
    if (!editedContent.trim() || isStreaming) return;
    sendMessage(editedContent.trim());
    setIsEditing(false);
  };

  if (isUser) {
    if (isEditing) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: '100%',
            animation: 'fadeIn 0.18s ease-out forwards',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '85%',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '16px',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendEdited();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              autoFocus
              rows={Math.min(Math.max(editedContent.split('\n').length, 2), 8)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                color: 'var(--text-primary)',
                fontSize: 'var(--chat-font-size, var(--text-base))',
                lineHeight: 1.45,
                fontFamily: 'inherit',
                padding: 0,
                minHeight: '48px',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.45rem',
                paddingTop: '0.35rem',
                borderTop: '1px solid var(--hairline)',
              }}
            >
              <button
                type="button"
                onClick={handleCancelEdit}
                className="apple-button"
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEdited}
                disabled={!editedContent.trim() || isStreaming}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: editedContent.trim() && !isStreaming ? 'var(--accent-primary)' : 'var(--bg-hover)',
                  color: editedContent.trim() && !isStreaming ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: editedContent.trim() && !isStreaming ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <ArrowUpIcon size={12} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          width: '100%',
          animation: 'fadeIn 0.2s ease-out forwards',
        }}
      >
        <div
          style={{
            maxWidth: '78%',
            backgroundColor: 'var(--msg-user-bg)',
            color: 'var(--msg-user-text)',
            borderRadius: '18px 18px 4px 18px',
            padding: '0.65rem 1rem',
            fontSize: 'var(--chat-font-size, var(--text-base))',
            lineHeight: 1.45,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {message.content}
        </div>

        {/* Subtle Apple Hover Action Bar for User Message */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.3rem',
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? 'auto' : 'none',
            transition: 'opacity var(--transition-fast)',
          }}
        >
          <button
            onClick={handleCopy}
            className="apple-button"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-xs)',
              gap: '0.35rem',
            }}
            title="Copy prompt"
          >
            {copied ? <CheckIcon size={13} style={{ color: 'var(--success)' }} /> : <CopyIcon size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleStartEdit}
            disabled={isStreaming}
            className="apple-button"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: 'var(--text-xs)',
              color: isStreaming ? 'var(--text-quaternary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-xs)',
              gap: '0.35rem',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
            }}
            title="Edit prompt and resend"
          >
            <PencilIcon size={13} />
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  }

  // Assistant Message: Apple Intelligence Editorial Flow (Borderless & Cardless)
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        animation: 'fadeIn 0.2s ease-out forwards',
        position: 'relative',
      }}
    >
      {/* Editorial Content Container */}
      <div style={{ width: '100%', padding: '0.25rem 0' }}>
        <MarkdownRenderer
          content={message.content}
          isStreaming={message.status === 'streaming'}
        />

        {message.error && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              color: 'var(--danger)',
              fontSize: 'var(--text-xs)',
              border: '1px solid rgba(255, 59, 48, 0.2)',
            }}
          >
            {message.error}
          </div>
        )}
      </div>

      {/* Subtle Apple Hover Action Bar */}
      {!isStreaming && message.content && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.4rem',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity var(--transition-fast)',
          }}
        >
          <button
            onClick={handleCopy}
            className="apple-button"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-xs)',
              gap: '0.35rem',
            }}
            title="Copy response"
          >
            {copied ? <CheckIcon size={13} style={{ color: 'var(--success)' }} /> : <CopyIcon size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {isLatestAssistant && (
            <button
              onClick={() => regenerateResponse()}
              className="apple-button"
              style={{
                padding: '0.2rem 0.45rem',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-xs)',
                gap: '0.35rem',
              }}
              title="Regenerate response"
            >
              <RefreshCwIcon size={13} />
              <span>Retry</span>
            </button>
          )}

          {message.stats?.latencyMs && (
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                marginLeft: '0.5rem',
              }}
            >
              {(message.stats.latencyMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>
      )}
    </div>
  );
};
