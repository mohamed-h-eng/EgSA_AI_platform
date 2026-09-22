import { createStore } from './createStore';
import type { AnswerFeedback, FeedbackRating, FeedbackReason } from '../types';

export type FeedbackMeta = Pick<AnswerFeedback, 'surface' | 'question' | 'answerExcerpt' | 'context' | 'sourceDocumentIds'>;

interface FeedbackState {
  entries: Record<string, AnswerFeedback>;

  /** Sets (or, when repeated, clears) the rating for an answer. */
  rate: (answerId: string, rating: FeedbackRating, meta: FeedbackMeta) => void;
  toggleReason: (answerId: string, reason: FeedbackReason) => void;
  setComment: (answerId: string, comment: string) => void;
}

// Answer ratings (PRODUCTIVITY_UX_PLAN §2). Kept in this browser until POST /api/feedback exists;
// Administration → Feedback reads and exports them for the pilot evaluation (D-14).
export const useFeedbackStore = createStore<FeedbackState>(
  (set) => ({
    entries: {},

    rate: (answerId, rating, meta) =>
      set((s) => {
        const existing = s.entries[answerId];
        const entries = { ...s.entries };
        if (existing?.rating === rating) {
          delete entries[answerId];
        } else {
          const now = Date.now();
          entries[answerId] = {
            answerId,
            ...meta,
            answerExcerpt: meta.answerExcerpt.slice(0, 400),
            rating,
            // Reasons and comments explain a thumbs-down; they don't carry over to a thumbs-up.
            reasons: rating === 'down' ? existing?.reasons || [] : [],
            comment: rating === 'down' ? existing?.comment : undefined,
            createdAt: existing?.createdAt || now,
            updatedAt: now,
          };
        }
        return { entries };
      }),

    toggleReason: (answerId, reason) =>
      set((s) => {
        const entry = s.entries[answerId];
        if (!entry) return {};
        const reasons = entry.reasons.includes(reason) ? entry.reasons.filter((r) => r !== reason) : [...entry.reasons, reason];
        return { entries: { ...s.entries, [answerId]: { ...entry, reasons, updatedAt: Date.now() } } };
      }),

    setComment: (answerId, comment) =>
      set((s) => {
        const entry = s.entries[answerId];
        if (!entry) return {};
        return { entries: { ...s.entries, [answerId]: { ...entry, comment: comment.trim() || undefined, updatedAt: Date.now() } } };
      }),
  }),
  'egsa_ai_feedback'
);

const CSV_COLUMNS: Array<[string, (f: AnswerFeedback) => string]> = [
  ['date', (f) => new Date(f.updatedAt).toISOString()],
  ['surface', (f) => f.surface],
  ['rating', (f) => f.rating],
  ['reasons', (f) => f.reasons.join('; ')],
  ['comment', (f) => f.comment || ''],
  ['question', (f) => f.question],
  ['answer_excerpt', (f) => f.answerExcerpt],
  ['context', (f) => f.context],
  ['source_document_ids', (f) => (f.sourceDocumentIds || []).join('; ')],
];

const csvCell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** Feedback as CSV (RFC 4180 quoting), newest first, for the pilot evaluation report. */
export function feedbackToCsv(entries: AnswerFeedback[]): string {
  const rows = [...entries].sort((a, b) => b.updatedAt - a.updatedAt).map((f) => CSV_COLUMNS.map(([, get]) => csvCell(get(f))).join(','));
  return [CSV_COLUMNS.map(([name]) => name).join(','), ...rows].join('\r\n');
}
