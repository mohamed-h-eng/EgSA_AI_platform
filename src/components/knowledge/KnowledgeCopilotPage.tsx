import React, { useEffect, useRef, useState } from 'react';
import { PanelLeftIcon, FolderIcon, FilterIcon, ArrowUpIcon } from '../ui/Icons';
import { FilterSelect } from '../documents/FilterSelect';
import { ResearchTurn } from './ResearchTurn';
import { EvidencePanel } from './EvidencePanel';
import { KnowledgeComposer } from './KnowledgeComposer';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useChatStore } from '../../stores/chatStore';
import { useIsMobile, useMediaQuery } from '../../hooks/useMediaQuery';
import { KNOWLEDGE_SUGGESTIONS } from '../../constants/defaults';
import type { KnowledgeScope } from '../../types';

// Knowledge Copilot: grounded Q&A and deep research over indexed engineering documents
// (KB-009..KB-012, KB-018, NFR-USE-002). All answers come from queryKnowledgeBase().
export const KnowledgeCopilotPage: React.FC = () => {
  const isMobile = useIsMobile();
  const showInlineScope = useMediaQuery('(min-width: 1024px)');
  const showEvidencePanel = useMediaQuery('(min-width: 1100px)');

  const threads = useKnowledgeStore((s) => s.threads);
  const activeThreadId = useKnowledgeStore((s) => s.activeThreadId);
  const focusedTurnId = useKnowledgeStore((s) => s.focusedTurnId);
  const selectedSourceIndex = useKnowledgeStore((s) => s.selectedSourceIndex);
  const focusSource = useKnowledgeStore((s) => s.focusSource);
  const scope = useKnowledgeStore((s) => s.scope);
  const setScope = useKnowledgeStore((s) => s.setScope);
  const setDepth = useKnowledgeStore((s) => s.setDepth);
  const ask = useKnowledgeStore((s) => s.ask);
  const isStreaming = useKnowledgeStore((s) => s.isStreaming);

  const documents = useDocumentStore((s) => s.documents);
  const projects = useDocumentStore((s) => s.projects);
  const openManager = useDocumentStore((s) => s.openManager);
  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);

  const [isScopeSheetOpen, setScopeSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === activeThreadId);
  const turns = thread?.turns || [];
  const lastTurn = turns[turns.length - 1];
  const focusedTurn = turns.find((t) => t.id === focusedTurnId) || lastTurn;

  const searchableCount = documents.filter(
    (d) => d.status === 'indexed' && (!scope.project || d.project === scope.project) && (!scope.subsystem || d.subsystem === scope.subsystem)
  ).length;
  const projectName = projects.find((p) => p.id === scope.project)?.name;
  const scopeLabel = projectName ? `${projectName}${scope.subsystem ? ` / ${scope.subsystem}` : ''}` : 'All projects';

  // New question or thread switch: jump to the latest turn.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, activeThreadId]);

  // While an answer streams in, follow it only if the reader is already near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [lastTurn?.answer, lastTurn?.steps.length]);

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <header
        className="apple-glass"
        style={{
          height: 'var(--header-height)',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          {!isSidebarOpen && (
            <button onClick={toggleSidebar} className="apple-button" title="Show Sidebar" aria-label="Show sidebar" style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius-xs)', color: 'var(--text-secondary)' }}>
              <PanelLeftIcon size={16} />
            </button>
          )}
          <h1 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Knowledge Copilot
          </h1>
          {thread && turns.length > 0 && !isMobile && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              · {thread.title}
            </span>
          )}
        </div>

        {showInlineScope ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            <ScopeControls scope={scope} onChange={setScope} projects={projects} disabled={isStreaming} />
            <span style={{ fontSize: 'var(--text-xs)', color: searchableCount === 0 ? 'var(--warning)' : 'var(--text-muted)', whiteSpace: 'nowrap', marginInlineStart: 'var(--space-2)' }}>
              {searchableCount} indexed
            </span>
            <button type="button" className="text-action" onClick={openManager} style={{ marginInlineStart: 'var(--space-2)' }}>
              Manage documents
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="apple-button"
            onClick={() => setScopeSheetOpen(true)}
            aria-haspopup="dialog"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: 'var(--space-1) var(--space-2)', maxWidth: '55vw' }}
          >
            <FolderIcon size={13} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scopeLabel}</span>
          </button>
        )}
      </header>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: `var(--space-6) clamp(var(--space-4), 4vw, var(--space-6)) var(--space-5)` }}>
            <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', width: '100%' }}>
              {turns.length === 0 ? (
                <EmptyState
                  searchableCount={searchableCount}
                  scopeLabel={scopeLabel}
                  onManage={openManager}
                  disabled={isStreaming}
                  onAsk={(question, depth) => {
                    setDepth(depth);
                    ask(question);
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {turns.map((turn, i) => (
                    <div
                      key={turn.id}
                      style={{
                        paddingTop: i === 0 ? 0 : 'var(--space-6)',
                        marginTop: i === 0 ? 0 : 'var(--space-6)',
                        borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                      }}
                    >
                      <ResearchTurn
                        turn={turn}
                        compact={!showEvidencePanel}
                        selectedSourceIndex={turn.id === focusedTurn?.id ? selectedSourceIndex : null}
                        onSelectSource={(index) => focusSource(turn.id, index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: `var(--space-2) clamp(var(--space-3), 3vw, var(--space-5)) calc(var(--space-3) + var(--safe-area-bottom))` }}>
            <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
              <KnowledgeComposer />
            </div>
          </div>
        </div>

        {showEvidencePanel && (
          <EvidencePanel
            turn={focusedTurn}
            selectedSourceIndex={selectedSourceIndex}
            onSelectSource={(index) => focusedTurn && focusSource(focusedTurn.id, index)}
          />
        )}
      </div>

      {isScopeSheetOpen && (
        <ScopeSheet
          scope={scope}
          onChange={setScope}
          projects={projects}
          disabled={isStreaming}
          searchableCount={searchableCount}
          onManage={() => {
            setScopeSheetOpen(false);
            openManager();
          }}
          onClose={() => setScopeSheetOpen(false)}
        />
      )}
    </div>
  );
};

const ScopeControls: React.FC<{
  scope: KnowledgeScope;
  onChange: (scope: KnowledgeScope) => void;
  projects: Array<{ id: string; name: string; subsystems: string[] }>;
  disabled?: boolean;
  stacked?: boolean;
}> = ({ scope, onChange, projects, disabled, stacked }) => {
  const selectedProject = projects.find((p) => p.id === scope.project);
  return (
    <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 'var(--space-2)' }}>
      <FilterSelect
        icon={<FolderIcon size={12} />}
        value={scope.project || ''}
        onChange={(project) => onChange({ project: project || undefined })}
        allLabel="All Projects"
        disabled={disabled}
        maxWidth={stacked ? 'none' : '12rem'}
        options={projects.map((p) => ({ value: p.id, label: p.name }))}
      />
      <FilterSelect
        icon={<FilterIcon size={12} />}
        value={scope.subsystem || ''}
        onChange={(subsystem) => onChange({ ...scope, subsystem: subsystem || undefined })}
        allLabel="All Subsystems"
        disabled={disabled || !selectedProject}
        maxWidth={stacked ? 'none' : '10rem'}
        options={(selectedProject?.subsystems || []).map((s) => ({ value: s, label: s }))}
      />
    </div>
  );
};

const ScopeSheet: React.FC<{
  scope: KnowledgeScope;
  onChange: (scope: KnowledgeScope) => void;
  projects: Array<{ id: string; name: string; subsystems: string[] }>;
  disabled?: boolean;
  searchableCount: number;
  onManage: () => void;
  onClose: () => void;
}> = ({ scope, onChange, projects, disabled, searchableCount, onManage, onClose }) => {
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    doneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="scope-sheet-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="scope-sheet-title" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
          Search scope
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Limit answers to one project or subsystem. {searchableCount} indexed document{searchableCount === 1 ? '' : 's'} in scope.
        </p>
        <ScopeControls scope={scope} onChange={onChange} projects={projects} disabled={disabled} stacked />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-5)' }}>
          <button type="button" className="text-action" onClick={onManage}>
            Manage documents
          </button>
          <button ref={doneRef} type="button" className="apple-button apple-button-primary" onClick={onClose} style={{ minHeight: '44px', padding: '0 var(--space-5)' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  searchableCount: number;
  scopeLabel: string;
  onManage: () => void;
  onAsk: (question: string, depth: 'quick' | 'deep') => void;
  disabled: boolean;
}> = ({ searchableCount, scopeLabel, onManage, onAsk, disabled }) => (
  <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-3)', animation: 'fadeIn var(--transition-normal)' }}>
    <h2 style={{ fontSize: 'clamp(var(--text-2xl), 4vw, var(--text-3xl))', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--text-primary)' }}>
      Knowledge Copilot
    </h2>
    <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '560px' }}>
      Research the engineering knowledge base. Every answer comes from indexed documents with page-level citations, and says so plainly when the
      documents don’t support one.
    </p>
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span>
        {searchableCount} indexed document{searchableCount === 1 ? '' : 's'} · {scopeLabel}
      </span>
      <button type="button" className="text-action" onClick={onManage}>
        Manage documents
      </button>
    </p>

    <div style={{ marginTop: 'var(--space-6)', maxWidth: '560px' }}>
      <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
        Try asking
      </h3>
      {KNOWLEDGE_SUGGESTIONS.map((s) => (
        <button key={s.question} type="button" className="suggestion-row" disabled={disabled} onClick={() => onAsk(s.question, s.depth)}>
          <span>
            {s.question}
            {s.depth === 'deep' && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}> · Deep research</span>}
          </span>
          <ArrowUpIcon size={14} style={{ transform: 'rotate(45deg)', color: 'var(--text-muted)', flexShrink: 0 }} />
        </button>
      ))}
    </div>
  </div>
);
