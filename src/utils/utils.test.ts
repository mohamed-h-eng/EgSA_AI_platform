import { describe, expect, it } from 'vitest';
import { dateGroupOf, groupByDate } from './dateGroups';
import { historyWindowStart, trimHistory } from './history';
import { speakableExcerpt } from './speech';

const NOW = new Date(2026, 8, 22, 15, 0).getTime();
const daysAgo = (n: number, hour = 10) => new Date(2026, 8, 22 - n, hour).getTime();

describe('dateGroupOf', () => {
  it('buckets by calendar day, not by 24-hour windows', () => {
    expect(dateGroupOf(daysAgo(0, 0), NOW)).toBe('Today');
    expect(dateGroupOf(daysAgo(1, 23), NOW)).toBe('Yesterday');
    expect(dateGroupOf(daysAgo(7), NOW)).toBe('Previous 7 days');
    expect(dateGroupOf(daysAgo(20), NOW)).toBe('Previous 30 days');
    expect(dateGroupOf(daysAgo(45), NOW)).toBe('Older');
  });

  it('groups in fixed order, newest first, skipping empty groups', () => {
    const items = [{ t: daysAgo(40) }, { t: daysAgo(0, 9) }, { t: daysAgo(0, 14) }, { t: daysAgo(3) }];
    const groups = groupByDate(items, (i) => i.t, NOW);
    expect(groups.map((g) => g.group)).toEqual(['Today', 'Previous 7 days', 'Older']);
    expect(groups[0].items.map((i) => i.t)).toEqual([daysAgo(0, 14), daysAgo(0, 9)]);
  });
});

describe('conversation memory', () => {
  const convo = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant' }));

  it('sends everything when the conversation is short', () => {
    expect(trimHistory(convo(5), 30)).toHaveLength(5);
    expect(historyWindowStart(convo(6), 30)).toBe(0);
  });

  it('keeps the last messages and starts on a user message', () => {
    const trimmed = trimHistory(convo(41), 30); // ends with a user message
    expect(trimmed[0].role).toBe('user');
    expect(trimmed.length).toBeLessThanOrEqual(30);
    // The newest message (the question being asked) is always included.
    expect(trimmed[trimmed.length - 1].role).toBe('user');
    expect(trimmed.length).toBe(29); // last 30, minus the leading assistant message
  });

  it('marks where the model context starts for the latest answer', () => {
    const messages = convo(42); // 21 exchanges, last is the assistant's answer
    const start = historyWindowStart(messages, 30);
    expect(start).toBeGreaterThan(0);
    expect(messages[start].role).toBe('user');
    expect(messages.length - 1 - start).toBeLessThanOrEqual(30);
  });

  it('treats a non-positive limit as unlimited', () => {
    expect(trimHistory(convo(50), 0)).toHaveLength(50);
    expect(historyWindowStart(convo(50), 0)).toBe(0);
  });
});


describe('speakableExcerpt', () => {
  it('strips Markdown, code and citation markers for screen readers', () => {
    expect(speakableExcerpt('## Result\n**ADCS-SRS-021**: pointing ≤ 0.1° [1] [2]\n```py\nx=1\n```')).toBe('Result ADCS SRS 021 : pointing ≤ 0.1° (code)');
  });

  it('cuts long answers at a word boundary', () => {
    const out = speakableExcerpt('word '.repeat(200), 30);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(31);
  });
});
