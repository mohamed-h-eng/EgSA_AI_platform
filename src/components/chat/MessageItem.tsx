import React, { useEffect, useState } from 'react';
import type { ContextReport, ChatMessage, TextDirection } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CopyIcon, CheckIcon, RefreshCwIcon, PencilIcon, ArrowUpIcon, AlignLeftIcon, AlignRightIcon } from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useRoleStore } from '../../stores/roleStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { AnswerFeedback } from '../feedback/AnswerFeedback';
import { EDIT_LAST_MESSAGE_EVENT } from '../../utils/keyboard';

interface MessageItemProps {
  message: ChatMessage;
  isLatestAssistant: boolean;
  /** The newest user message: ↑ in an empty chat box opens its editor. */
  isLastUser?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLatestAssistant, isLastUser }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = useRoleStore((s) => s.isAdmin);
  const [editedContent, setEditedContent] = useState(message.content);

  const globalDirection = useSettingsStore((s) => s.preferences?.textDirection);
  const [localDir, setLocalDir] = useState<TextDirection | undefined>(message.direction);

  const effectiveDir: TextDirection = localDir || (globalDirection === 'ltr' || globalDirection === 'rtl' ? globalDirection : 'auto');

  const handleToggleDirection = () => {
    // If auto or rtl, toggle to ltr; if ltr, toggle to rtl
    const nextDir: TextDirection = effectiveDir === 'ltr' ? 'rtl' : 'ltr';
    setLocalDir(nextDir);
  };

  const isStreaming = useChatStore((s) => s.isStreaming);
  const regenerateResponse = useChatStore((s) => s.regenerateResponse);
  const editAndResend = useChatStore((s) => s.editAndResend);

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

  useEffect(() => {
    if (!isLastUser) return;
    const openEditor = () => {
      setEditedContent(message.content);
      setIsEditing(true);
    };
    window.addEventListener(EDIT_LAST_MESSAGE_EVENT, openEditor);
    return () => window.removeEventListener(EDIT_LAST_MESSAGE_EVENT, openEditor);
  }, [isLastUser, message.content]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleSendEdited = () => {
    if (!editedContent.trim() || isStreaming) return;
    // Replaces this question and everything after it (no duplicate topics in the conversation).
    void editAndResend(message.id, editedContent.trim());
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
              maxWidth: 'min(92%, 680px)',
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
              dir={effectiveDir}
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
                unicodeBidi: 'plaintext',
                textAlign: 'start',
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
          dir={effectiveDir}
          style={{
            maxWidth: 'min(88%, 680px)',
            backgroundColor: 'var(--msg-user-bg)',
            color: 'var(--msg-user-text)',
            border: '1px solid var(--msg-user-border)',
            borderRadius: '18px 18px 4px 18px',
            padding: '0.65rem 1rem',
            fontSize: 'var(--chat-font-size, var(--text-base))',
            lineHeight: 1.45,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            boxShadow: 'var(--shadow-sm)',
            unicodeBidi: 'plaintext',
            textAlign: 'start',
          }}
        >
          <span className="visually-hidden">You said: </span>
          {message.content}
        </div>

        {/* Subtle Apple Hover Action Bar for User Message */}
        <div
          className={`touch-action-visible message-actions${isHovered ? ' is-visible' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.3rem',
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
            onClick={handleToggleDirection}
            className="apple-button"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-xs)',
              gap: '0.35rem',
            }}
            title={`Direction: ${(effectiveDir || 'auto').toUpperCase()} (Click to toggle)`}
          >
            {effectiveDir === 'ltr' ? <AlignLeftIcon size={13} /> : <AlignRightIcon size={13} />}
            <span>{effectiveDir === 'auto' || !effectiveDir ? 'Auto' : effectiveDir.toUpperCase()}</span>
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
      <div style={{ width: '100%', padding: '0.25rem 0' }} dir={effectiveDir}>
        <span className="visually-hidden">Assistant said: </span>
        {/* Reasoning models: thinking stays collapsed above the answer (PROMPTING_CONTEXT_PLAN §6). */}
        {message.reasoning?.trim() && (
          <details className="reasoning-disclosure">
            <summary>
              {message.status === 'streaming' && !message.content ? 'Thinking…' : `Thought for ${Math.max(1, Math.round((message.reasoningMs ?? 0) / 1000))} s`}
            </summary>
            <div className="reasoning-body" dir={effectiveDir}>{message.reasoning.trim()}</div>
          </details>
        )}
        <MarkdownRenderer content={message.content} isStreaming={message.status === 'streaming'} direction={effectiveDir} />

        {message.error && (
          <div
            role="alert"
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

      {/* Answer actions: rating (always offered on the latest answer, kept once rated), copy, direction,
          retry, and which model answered. Older answers show them on hover or keyboard focus. */}
      {!isStreaming && message.content && (
        <AnswerFeedback
          answerId={message.id}
          surface="chat"
          getMeta={() => chatFeedbackMeta(message)}
          ratable={message.status !== 'error'}
          rowClassName={`touch-action-visible message-actions${isHovered || isLatestAssistant ? ' is-visible' : ''}`}
          rowStyle={{ marginTop: '0.4rem', gap: '0.35rem' }}
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

          <button
            onClick={handleToggleDirection}
            className="apple-button"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-xs)',
              gap: '0.35rem',
            }}
            title={`Direction: ${(effectiveDir || 'auto').toUpperCase()} (Click to toggle)`}
          >
            {effectiveDir === 'ltr' ? <AlignLeftIcon size={13} /> : <AlignRightIcon size={13} />}
            <span>{effectiveDir === 'auto' || !effectiveDir ? 'Auto' : effectiveDir.toUpperCase()}</span>
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

            {isAdmin && message.contextReport && <ContextReportPanel report={message.contextReport} />}

          {message.stats?.latencyMs && (
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                marginInlineStart: '0.5rem',
              }}
              title="Response time"
            >
              {(message.stats.latencyMs / 1000).toFixed(2)}s
            </span>
          )}
        </AnswerFeedback>
      )}
    </div>
  );
};

// Admin debugging (PROMPTING_CONTEXT_PLAN §8): what was actually sent for this answer — how many
// turns, the token estimate against the budget, what was left out and why, and the system prompt.
const ContextReportPanel: React.FC<{ report: ContextReport }> = ({ report }) => (
  <details className="context-report">
    <summary title="Admin view: what this answer was sent">What the model saw</summary>
    <div className="context-report-body">
      <dl>
        <dt>Context</dt>
        <dd>
          {report.mode === 'server'
            ? 'The gateway keeps this conversation; only the new question was sent.'
            : `${report.messagesSent} message${report.messagesSent === 1 ? '' : 's'} sent`}
        </dd>
        <dt>Tokens</dt>
        <dd>
          ~{report.usedTokens.toLocaleString()} of {report.budgetTokens.toLocaleString()} available
          {' · '}context {report.contextTokens.toLocaleString()}, reply up to {report.maxTokens.toLocaleString()}
        </dd>
        <dt>Left out</dt>
        <dd>
          {report.droppedAsNoise + report.droppedForBudget === 0
            ? 'Nothing'
            : [
                report.droppedAsNoise ? `${report.droppedAsNoise} failed, empty or superseded` : '',
                report.droppedForBudget ? `${report.droppedForBudget} over budget` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
        </dd>
      </dl>
      <span className="context-report-label">System prompt</span>
      <pre>{report.systemPrompt}</pre>
    </div>
  </details>
);

// What a chat rating records: the question this answer replied to, and which profile/model wrote it.
function chatFeedbackMeta(message: ChatMessage) {
  const session = useChatStore.getState().sessions.find((sess) => sess.messages.some((m) => m.id === message.id));
  const index = session?.messages.findIndex((m) => m.id === message.id) ?? -1;
  const question = [...(session?.messages.slice(0, Math.max(0, index)) || [])].reverse().find((m) => m.role === 'user')?.content || '';
  return {
    question,
    answerExcerpt: message.content,
    context: [message.profileName, message.modelId].filter(Boolean).join(' · ') || 'Chat',
  };
}
