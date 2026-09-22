import React from 'react';
import { DownloadIcon, ThumbsDownIcon, ThumbsUpIcon } from '../ui/Icons';
import { feedbackToCsv, useFeedbackStore } from '../../stores/feedbackStore';
import { FEEDBACK_REASONS } from '../../constants/defaults';
import { useIsMobile } from '../../hooks/useMediaQuery';

// Administration → Feedback (PRODUCTIVITY_UX_PLAN §2): what people think of the answers, for the
// pilot evaluation (D-14). Reads this browser's ratings until POST /api/feedback collects them centrally.
export const FeedbackPanel: React.FC = () => {
  const isMobile = useIsMobile(720);
  const entries = useFeedbackStore((s) => s.entries);
  const all = Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt);
  const up = all.filter((f) => f.rating === 'up').length;
  const down = all.length - up;
  const reasonCounts = FEEDBACK_REASONS.map((r) => ({ ...r, count: all.filter((f) => f.reasons.includes(r.id)).length })).filter((r) => r.count > 0);

  const exportCsv = () => {
    const blob = new Blob([feedbackToCsv(all)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `egsa-answer-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-5) var(--space-4)' : 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div>
          <h4 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Answer feedback</h4>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {all.length === 0
              ? 'No ratings yet. People rate answers with the thumbs under each Chat and Copilot answer.'
              : `${all.length} rating${all.length === 1 ? '' : 's'} · ${up} helpful · ${down} not helpful`}
          </p>
          {reasonCounts.length > 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              Reasons: {reasonCounts.map((r) => `${r.label} ${r.count}`).join(' · ')}
            </p>
          )}
        </div>
        <button type="button" className="text-action" onClick={exportCsv} disabled={all.length === 0} style={{ flexShrink: 0 }}>
          <DownloadIcon size={13} />
          Export CSV
        </button>
      </div>

      {all.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {all.slice(0, 50).map((f) => (
            <li key={f.answerId} className="feedback-row">
              <span className="doc-status" style={{ flex: '0 0 auto' }}>
                {f.rating === 'up' ? <ThumbsUpIcon size={14} /> : <ThumbsDownIcon size={14} />}
                {f.rating === 'up' ? 'Helpful' : 'Not helpful'}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="doc-title" style={{ fontSize: 'var(--text-sm)' }} dir="auto">
                  {f.question || '(no question)'}
                </span>
                <span className="doc-meta">
                  {[
                    f.surface === 'copilot' ? 'Copilot' : 'Chat',
                    f.context,
                    f.reasons.map((r) => FEEDBACK_REASONS.find((x) => x.id === r)?.label).join(', ') || undefined,
                    new Date(f.updatedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {f.comment && (
                  <span style={{ display: 'block', marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} dir="auto">
                    “{f.comment}”
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-5)', lineHeight: 1.5 }}>
        Ratings are stored in this browser until the gateway collects them (<code>POST /api/feedback</code>). Export regularly for the pilot evaluation report.
      </p>
    </div>
  );
};
