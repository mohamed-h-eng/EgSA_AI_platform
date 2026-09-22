import React, { useEffect, useRef } from 'react';
import { ArrowUpIcon, StopCircleIcon } from '../ui/Icons';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDraft } from '../../utils/drafts';
import { AnswerStatusDock } from '../chat/AnswerStatusDock';
import { useCopilotAnswerStage } from '../../hooks/useAnswerStage';

// Question input for the Copilot page: auto-growing textarea, Quick | Deep depth control and
// send/stop. The only elevated surface on the page besides the mobile scope sheet.
export const KnowledgeComposer: React.FC = () => {
  // Unsent question is kept per research thread (PRODUCTIVITY_UX_PLAN §4).
  const activeThreadId = useKnowledgeStore((s) => s.activeThreadId);
  const [input, setInput] = useDraft(activeThreadId ? `thread:${activeThreadId}` : 'thread:new');
  const answerStage = useCopilotAnswerStage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const depth = useKnowledgeStore((s) => s.depth);
  const setDepth = useKnowledgeStore((s) => s.setDepth);
  const ask = useKnowledgeStore((s) => s.ask);
  const stop = useKnowledgeStore((s) => s.stop);
  const isStreaming = useKnowledgeStore((s) => s.isStreaming);
  const sendOnEnter = useSettingsStore((s) => s.preferences.sendOnEnter);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const hasText = input.trim().length > 0;

  const submit = () => {
    if (!hasText || isStreaming) return;
    ask(input);
    setInput('');
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-3) var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--hairline)',
        backgroundColor: 'var(--bg-glass-heavy)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <AnswerStatusDock stage={answerStage} />
      <textarea
        aria-label="Question for the knowledge base"
        ref={textareaRef}
        data-composer
        className="chat-textarea"
        rows={1}
        dir="auto"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={depth === 'deep' ? 'Ask a multi-part research question…' : 'Ask the engineering knowledge base…'}
        style={{
          width: '100%',
          resize: 'none',
          padding: 'var(--space-1) 0',
          minHeight: '28px',
          maxHeight: '180px',
          fontSize: 'var(--chat-font-size, var(--text-base))',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          unicodeBidi: 'plaintext',
          textAlign: 'start',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div className="segmented" role="radiogroup" aria-label="Research depth">
          <button
            type="button"
            role="radio"
            aria-checked={depth === 'quick'}
            className="segmented-option"
            disabled={isStreaming}
            onClick={() => setDepth('quick')}
            title="Top passages for the whole question"
          >
            Quick
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={depth === 'deep'}
            className="segmented-option"
            disabled={isStreaming}
            onClick={() => setDepth('deep')}
            title="Splits the question into parts, researches each, and reports what is not covered"
          >
            Deep research
          </button>
        </div>

        {isStreaming ? (
          <button type="button" onClick={stop} className="apple-button" title="Stop" aria-label="Stop" style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }}>
            <StopCircleIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!hasText}
            className="apple-button apple-button-primary"
            title="Ask"
            aria-label="Ask"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
          >
            <ArrowUpIcon size={17} />
          </button>
        )}
      </div>
    </div>
  );
};
