import React from 'react';
import { SourceCard } from '../documents/SourceCard';
import type { KnowledgeTurn } from '../../types';

interface EvidencePanelProps {
  turn: KnowledgeTurn | undefined;
  selectedSourceIndex: number | null;
  onSelectSource: (index: number | null) => void;
}

// Wide-screen side panel listing the sources behind the focused answer (KB-009/010/018).
export const EvidencePanel: React.FC<EvidencePanelProps> = ({ turn, selectedSourceIndex, onSelectSource }) => (
  <aside
    aria-label="Evidence"
    style={{
      width: '340px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderInlineStart: '1px solid var(--hairline)',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: 0,
    }}
  >
    <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <h2 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Evidence
      </h2>
      {turn && (
        <p
          dir="auto"
          title={turn.question}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, whiteSpace: 'normal', unicodeBidi: 'plaintext', textAlign: 'start' }}
        >
          {turn.question}
        </p>
      )}
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-3) var(--space-5)' }}>
      {turn && turn.sources.length > 0 ? (
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
        <p style={{ padding: '0 var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {!turn
            ? 'Sources cited in an answer appear here.'
            : turn.status === 'running'
              ? 'Searching indexed documents…'
              : 'This answer cites no sources.'}
        </p>
      )}
    </div>
  </aside>
);
