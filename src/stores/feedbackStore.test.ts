import { beforeEach, describe, expect, it } from 'vitest';
import { feedbackToCsv, useFeedbackStore, type FeedbackMeta } from './feedbackStore';

const meta: FeedbackMeta = { surface: 'copilot', question: 'What is the "ADCS" accuracy?', answerExcerpt: 'Line one,\nline two', context: 'Quick · All projects' };

describe('feedbackStore', () => {
  beforeEach(() => useFeedbackStore.setState({ entries: {} }));

  it('rates, un-rates on a repeat click, and switches rating', () => {
    const { rate } = useFeedbackStore.getState();
    rate('a1', 'up', meta);
    expect(useFeedbackStore.getState().entries.a1.rating).toBe('up');
    rate('a1', 'up', meta);
    expect(useFeedbackStore.getState().entries.a1).toBeUndefined();
    rate('a1', 'down', meta);
    expect(useFeedbackStore.getState().entries.a1.rating).toBe('down');
  });

  it('keeps reasons and comment only for thumbs down', () => {
    const { rate, toggleReason, setComment } = useFeedbackStore.getState();
    rate('a1', 'down', meta);
    toggleReason('a1', 'inaccurate');
    toggleReason('a1', 'wrong-source');
    toggleReason('a1', 'inaccurate');
    setComment('a1', '  cites Rev B, current is Rev C  ');
    const entry = useFeedbackStore.getState().entries.a1;
    expect(entry.reasons).toEqual(['wrong-source']);
    expect(entry.comment).toBe('cites Rev B, current is Rev C');

    rate('a1', 'up', meta);
    expect(useFeedbackStore.getState().entries.a1.reasons).toEqual([]);
    expect(useFeedbackStore.getState().entries.a1.comment).toBeUndefined();
  });
});

describe('feedbackToCsv', () => {
  it('writes a header and quotes cells with commas, quotes or line breaks', () => {
    const { rate, toggleReason } = useFeedbackStore.getState();
    useFeedbackStore.setState({ entries: {} });
    rate('a1', 'down', meta);
    toggleReason('a1', 'incomplete');
    const csv = feedbackToCsv(Object.values(useFeedbackStore.getState().entries));
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('date,surface,rating,reasons,comment,question,answer_excerpt,context,source_document_ids');
    expect(row).toContain(',copilot,down,incomplete,,');
    expect(row).toContain('"What is the ""ADCS"" accuracy?"');
    expect(csv).toContain('"Line one,\nline two"');
  });
});
