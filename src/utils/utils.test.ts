import { describe, expect, it } from 'vitest';
import { dateGroupOf, groupByDate } from './dateGroups';
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
