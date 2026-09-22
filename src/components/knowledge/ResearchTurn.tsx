import React, { useState } from 'react';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';
import { SourceCard } from '../documents/SourceCard';
import { CheckIcon, CopyIcon, AlertCircleIcon, ChevronDownIcon, RefreshCwIcon } from '../ui/Icons';
import { useDocumentStore } from '../../stores/documentStore';
<<<<<<< HEAD
import { AnswerFeedback } from '../feedback/AnswerFeedback';
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
import type { KnowledgeTurn, ResearchStep } from '../../types';

interface ResearchTurnProps {
  turn: KnowledgeTurn;
  // Selected citation for this turn (null when another turn is focused or nothing is selected).
  selectedSourceIndex: number | null;
  onSelectSource: (index: number | null) => void;
  // Below the wide breakpoint there is no Evidence panel: sources render inline behind an
  // Answer | Sources switch instead.
  compact: boolean;
}

export const ResearchTurn: React.FC<ResearchTurnProps> = ({ turn, selectedSourceIndex, onSelectSource, compact }) => {
  const projects = useDocumentStore((s) => s.projects);
  const documents = useDocumentStore((s) => s.documents);
  const [view, setView] = useState<'answer' | 'sources'>('answer');
  const [copied, setCopied] = useState(false);

  const isRunning = turn.status === 'running';
  const projectName = projects.find((p) => p.id === turn.scope.project)?.name;
  const scopeLabel = projectName ? `${projectName}${turn.scope.subsystem ? ` / ${turn.scope.subsystem}` : ''}` : 'All projects';
  const consultedTitles = turn.consultedDocumentIds
    .map((id) => documents.find((d) => d.id === id))
    .filter(Boolean)
    .map((d) => `${d!.title} (Rev ${d!.revision})`);

  const handleCitation = (n: number) => {
    if (compact) setView('sources');
    onSelectSource(selectedSourceIndex === n ? null : n);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(turn.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = [
    turn.depth === 'deep' ? 'Deep research' : 'Quick answer',
    scopeLabel,
    turn.latencyMs && !isRunning ? `${(turn.latencyMs / 1000).toFixed(1)}s` : null,
    turn.status === 'stopped' ? 'Stopped' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const showSourcesSwitch = compact && turn.sources.length > 0 && !isRunning;

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', animation: 'fadeIn var(--transition-normal)' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <h2
          dir="auto"
          style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3, color: 'var(--text-primary)', unicodeBidi: 'plaintext', textAlign: 'start', whiteSpace: 'normal' }}
        >
          {turn.question}
        </h2>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{meta}</span>
      </header>

      {turn.steps.length > 0 && <ResearchSteps steps={turn.steps} isRunning={isRunning} />}

      {showSourcesSwitch && (
        <div className="segmented" role="radiogroup" aria-label="Show answer or sources" style={{ alignSelf: 'flex-start' }}>
          <button type="button" role="radio" aria-checked={view === 'answer'} className="segmented-option" onClick={() => setView('answer')}>
            Answer
          </button>
          <button type="button" role="radio" aria-checked={view === 'sources'} className="segmented-option" onClick={() => setView('sources')}>
            Sources ({turn.sources.length})
          </button>
        </div>
      )}

      {showSourcesSwitch && view === 'sources' ? (
        <div role="list" aria-label="Sources">
          {turn.sources.map((source, i) => (
            <SourceCard
              key={`${source.documentId}-${source.page}-${i}`}
              source={source}
              index={i + 1}
              isSelected={selectedSourceIndex === i + 1}
              onSelect={() => onSelectSource(selectedSourceIndex === i + 1 ? null : i + 1)}
            />
          ))}
        </div>
      ) : (
        <>
          {turn.answer && (
            <div style={{ fontSize: 'var(--chat-font-size, var(--text-base))' }}>
              <MarkdownRenderer
                content={turn.answer}
                isStreaming={isRunning}
                onCitationClick={turn.sources.length > 0 ? handleCitation : undefined}
                activeCitation={selectedSourceIndex}
              />
            </div>
          )}

          {!isRunning && turn.grounding === 'insufficient' && (
            <Notice>No supporting source found. Nothing was cited.</Notice>
          )}

          {!isRunning && turn.grounding === 'grounded' && turn.uncovered.length > 0 && (
            <section aria-label="Not covered" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Notice>Not covered by the indexed documents</Notice>
              <ul style={{ margin: 0, paddingInlineStart: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {turn.uncovered.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          {turn.status === 'error' && <Notice>{turn.error || 'Knowledge query failed.'}</Notice>}
        </>
      )}

      {!isRunning && (consultedTitles.length > 0 || turn.answer) && (
        <footer style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2) var(--space-4)' }}>
          {consultedTitles.length > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flex: '1 1 240px' }}>
              Documents consulted: {consultedTitles.join(', ')}
            </span>
          )}
          {turn.answer && (
<<<<<<< HEAD
            <AnswerFeedback
              answerId={turn.id}
              surface="copilot"
              getMeta={() => ({
                question: turn.question,
                answerExcerpt: turn.answer,
                context: [turn.depth === 'deep' ? 'Deep' : 'Quick', scopeLabel, turn.grounding].filter(Boolean).join(' · '),
                sourceDocumentIds: [...new Set(turn.sources.map((src) => src.documentId))],
              })}
            >
              <button type="button" className="text-action is-muted" onClick={handleCopy}>
                {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                {copied ? 'Copied' : 'Copy answer'}
              </button>
            </AnswerFeedback>
=======
            <button type="button" className="text-action is-muted" onClick={handleCopy}>
              {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              {copied ? 'Copied' : 'Copy answer'}
            </button>
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
          )}
        </footer>
      )}
    </article>
  );
};

const ResearchSteps: React.FC<{ steps: ResearchStep[]; isRunning: boolean }> = ({ steps, isRunning }) => {
  const [open, setOpen] = useState(false);
  const expanded = isRunning || open;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {!isRunning && (
        <button type="button" className="text-action is-muted" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ alignSelf: 'flex-start' }}>
          <ChevronDownIcon size={12} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform var(--transition-fast)' }} />
          Research steps ({steps.length})
        </button>
      )}
      {expanded && (
        <ol aria-label="Research steps" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {steps.map((step) => (
            <li key={step.id} className="research-step">
              <span style={{ display: 'flex', marginTop: '3px', flexShrink: 0, color: step.status === 'done' ? 'var(--success)' : 'var(--text-muted)' }}>
                {step.status === 'running' ? (
                  <RefreshCwIcon size={12} style={{ animation: 'spin 1s linear infinite' }} aria-label="In progress" />
                ) : step.status === 'done' ? (
                  <CheckIcon size={12} aria-label="Done" />
                ) : (
                  <AlertCircleIcon size={12} aria-label="Nothing found" />
                )}
              </span>
              <span>
                {step.label}
                {step.detail && <span style={{ color: 'var(--text-muted)' }}> · {step.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

// Warning state: icon + text + color, never color alone.
const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="note" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--warning)' }}>
    <AlertCircleIcon size={14} style={{ flexShrink: 0 }} />
    <span>{children}</span>
  </div>
);
