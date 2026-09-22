import React, { useEffect, useRef, useState } from 'react';
import { FileTextIcon, ChevronDownIcon } from '../ui/Icons';
import type { SourceReference } from '../../types';

<<<<<<< HEAD
// Relevance at or above this reads as a strong match.
const STRONG_MATCH = 0.5;

=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
interface SourceCardProps {
  source: SourceReference;
  defaultExpanded?: boolean;
  // Citation number matching the [n] marker in the answer text.
  index?: number;
  // Controlled selection (Evidence panel): selected rows are highlighted, expanded and scrolled into view.
  isSelected?: boolean;
  onSelect?: () => void;
}

// Renders a grounded-answer citation (KB-009/010/018, NFR-USE-002) as a flat list row: document
// identity, revision and page are always visible so an engineer can verify the claim; the
// passage excerpt expands underneath. Rows are separated by hairlines via .source-row + .source-row.
export const SourceCard: React.FC<SourceCardProps> = ({ source, defaultExpanded = false, index, isSelected, onSelect }) => {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const rowRef = useRef<HTMLDivElement>(null);
  const canExpand = Boolean(source.excerpt);
  const isExpanded = canExpand && (isSelected || localExpanded);

  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isSelected]);

  const meta = [`Rev ${source.revision}`, `p. ${source.page}`, source.section].filter(Boolean).join(' · ');
<<<<<<< HEAD
  // Freshness and match strength help engineers decide what to double-check. Words, not colour.
  const indexed = source.indexedAt
    ? `indexed ${new Date(source.indexedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : undefined;
  const match = source.relevance === undefined ? undefined : source.relevance >= STRONG_MATCH ? 'Strong match' : 'Partial match';
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

  return (
    <div ref={rowRef} className="source-row" data-selected={isSelected ? 'true' : undefined}>
      <button
        type="button"
        className="source-row-trigger"
        aria-expanded={canExpand ? isExpanded : undefined}
        onClick={() => {
          if (onSelect) onSelect();
          else if (canExpand) setLocalExpanded((v) => !v);
        }}
        style={{ cursor: canExpand || onSelect ? 'pointer' : 'default' }}
      >
        {index !== undefined ? (
          <span className="source-index" aria-label={`Source ${index}`}>{index}</span>
        ) : (
          <FileTextIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
        )}

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {source.documentTitle}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {meta}
            {source.requirementId && (
              <>
                {' · '}
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{source.requirementId}</span>
              </>
            )}
          </span>
<<<<<<< HEAD
          {(match || indexed) && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {match && <span className="match-strength" data-strength={match === 'Strong match' ? 'strong' : 'partial'}>{match}</span>}
              {match && indexed && ' · '}
              {indexed}
            </span>
          )}
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
        </span>

        {canExpand && (
          <ChevronDownIcon
            size={14}
            style={{
              color: 'var(--text-muted)',
              flexShrink: 0,
              marginTop: '3px',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--transition-fast)',
            }}
          />
        )}
      </button>

<<<<<<< HEAD
      {isExpanded && (
        <blockquote className="source-excerpt">
          “{source.excerpt}”
          {match === 'Partial match' && <span className="source-caution">Partial match: check this passage answers the question.</span>}
        </blockquote>
      )}
=======
      {isExpanded && <blockquote className="source-excerpt">“{source.excerpt}”</blockquote>}
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
    </div>
  );
};
