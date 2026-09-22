import React, { useId, useState } from 'react';
import { ThumbsDownIcon, ThumbsUpIcon } from '../ui/Icons';
import { useFeedbackStore, type FeedbackMeta } from '../../stores/feedbackStore';
import { FEEDBACK_REASONS } from '../../constants/defaults';

// Three-layer answer feedback (PRODUCTIVITY_UX_PLAN §2): thumbs up/down (one click); a thumbs-down
// opens reason chips inline (second click); an optional comment. No modals.
// `getMeta` is called on click so the rated answer's context is captured as it is at that moment.
// Other answer actions (copy, retry…) can be passed as children to share the thumbs' row.
export const AnswerFeedback: React.FC<{
  answerId: string;
  surface: 'chat' | 'copilot';
  getMeta: () => Omit<FeedbackMeta, 'surface'>;
  children?: React.ReactNode;
  rowStyle?: React.CSSProperties;
  /** Extra class on the thumbs/actions row (e.g. show-on-hover in chat). Rated rows add data-rated. */
  rowClassName?: string;
  /** False for failed answers: the row keeps its other actions but offers no rating. */
  ratable?: boolean;
}> = ({ answerId, surface, getMeta, children, rowStyle, rowClassName, ratable = true }) => {
  const entry = useFeedbackStore((s) => s.entries[answerId]);
  const rate = useFeedbackStore((s) => s.rate);
  const toggleReason = useFeedbackStore((s) => s.toggleReason);
  const setComment = useFeedbackStore((s) => s.setComment);
  const [draft, setDraft] = useState<string | null>(null);
  const commentId = useId();

  const meta = (): FeedbackMeta => ({ ...getMeta(), surface });
  const reasons = FEEDBACK_REASONS.filter((r) => !r.copilotOnly || surface === 'copilot');

  return (
    <div className="answer-feedback">
      <div className={`answer-feedback-row ${rowClassName || ''}`} data-rated={entry ? 'true' : undefined} style={rowStyle}>
        {ratable && (
          <div className="answer-feedback-buttons" role="group" aria-label="Rate this answer">
            <button
              type="button"
              className="feedback-button"
              aria-pressed={entry?.rating === 'up'}
              title="Helpful"
              aria-label="Helpful"
              onClick={() => rate(answerId, 'up', meta())}
            >
              <ThumbsUpIcon size={14} />
            </button>
            <button
              type="button"
              className="feedback-button"
              aria-pressed={entry?.rating === 'down'}
              title="Not helpful"
              aria-label="Not helpful"
              onClick={() => rate(answerId, 'down', meta())}
            >
              <ThumbsDownIcon size={14} />
            </button>
            {entry?.rating === 'up' && <span className="feedback-thanks">Thanks for the feedback</span>}
          </div>
        )}
        {children}
      </div>

      {ratable && entry?.rating === 'down' && (
        <div className="answer-feedback-detail">
          <div role="group" aria-label="What went wrong?" className="feedback-reasons">
            <span className="feedback-question">What went wrong?</span>
            {reasons.map((r) => (
              <button
                key={r.id}
                type="button"
                className="chip"
                aria-pressed={entry.reasons.includes(r.id)}
                onClick={() => toggleReason(answerId, r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label htmlFor={commentId} className="visually-hidden">
            Tell us more (optional)
          </label>
          <input
            id={commentId}
            type="text"
            className="feedback-comment"
            placeholder="Tell us more (optional)"
            value={draft ?? entry.comment ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) setComment(answerId, draft);
              setDraft(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
        </div>
      )}
    </div>
  );
};
