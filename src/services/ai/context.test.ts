import { describe, expect, it } from 'vitest';
import { buildBudgetedContext, cleanHistory, estimateTokens, historyBudget, historyWindowStart } from './context';
import type { ChatMessage } from '../../types';

let n = 0;
const user = (content: string): ChatMessage => ({ id: `u${n++}`, role: 'user', content, timestamp: 0, status: 'complete' });
const ai = (content: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({ id: `a${n++}`, role: 'assistant', content, timestamp: 0, status: 'complete', ...extra });
const roles = (h: Array<{ role: string; content: string }>) => h.map((m) => `${m.role[0]}:${m.content}`);

describe('cleanHistory (app-managed context)', () => {
  it('keeps a normal question → answer record and the new question', () => {
    expect(roles(cleanHistory([user('q1'), ai('a1'), user('q2')]))).toEqual(['u:q1', 'a:a1', 'u:q2']);
  });

  it('drops failed answers together with their question', () => {
    const h = cleanHistory([user('q1'), ai('⚠️ Connection Error', { status: 'error' }), user('q2'), ai('a2'), user('q3')]);
    expect(roles(h)).toEqual(['u:q2', 'a:a2', 'u:q3']);
  });

  it('drops answers stopped before any text, keeps and marks partial ones', () => {
    expect(roles(cleanHistory([user('q1'), ai('', { stopped: true }), user('q2')]))).toEqual(['u:q2']);
    expect(roles(cleanHistory([user('q1'), ai('half an', { stopped: true }), user('q2')]))).toEqual([
      'u:q1',
      'a:half an\n\n[answer interrupted]',
      'u:q2',
    ]);
  });

  it('keeps only the last of several unanswered questions in a row', () => {
    expect(roles(cleanHistory([user('q1'), user('q1 again'), user('q1 once more')]))).toEqual(['u:q1 once more']);
  });

  it('never sends reasoning back', () => {
    const h = cleanHistory([user('q1'), ai('<think>long private reasoning</think>The answer.'), user('q2')]);
    expect(h[1].content).toBe('The answer.');
    // An answer that was only reasoning counts as empty.
    expect(roles(cleanHistory([user('q1'), ai('<think>still thinking'), user('q2')]))).toEqual(['u:q2']);
  });

  it('always keeps the question being asked now', () => {
    const h = buildBudgetedContext([user('q1'), ai('a1'), user('q2'), ai('x', { status: 'error' }), user('now')], 4000).sent;
    expect(h[h.length - 1]).toEqual({ role: 'user', content: 'now' });
  });
});

describe('token budget (§5)', () => {
  it('estimates Arabic text as more tokens per character than Latin', () => {
    const latin = 'a'.repeat(100);
    const arabic = 'ب'.repeat(100);
    expect(estimateTokens(latin)).toBe(25);
    expect(estimateTokens(arabic)).toBe(40);
    expect(estimateTokens('')).toBe(0);
  });

  it('reserves room for the answer, the system prompt and a safety margin', () => {
    const budget = historyBudget({ contextTokens: 8192, maxTokens: 1536, systemPrompt: 'x'.repeat(400) });
    expect(budget).toBe(Math.floor(8192 * 0.9) - 1536 - 100 - 4);
    // Never negative, however small the context is.
    expect(historyBudget({ contextTokens: 1024, maxTokens: 3072, systemPrompt: '' })).toBe(0);
  });

  it('keeps the newest turns that fit, starting on a question', () => {
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < 20; i++) msgs.push(user(`q${i} ${'x'.repeat(200)}`), ai(`a${i} ${'y'.repeat(200)}`));
    msgs.push(user('now'));
    const report = buildBudgetedContext(msgs, 400);
    expect(report.sent[0].role).toBe('user');
    expect(report.sent[report.sent.length - 1].content).toBe('now');
    expect(report.usedTokens).toBeLessThanOrEqual(400);
    expect(report.droppedForBudget).toBeGreaterThan(0);
  });

  it('keeps the latest question even when it alone is over budget', () => {
    const report = buildBudgetedContext([user('old'), ai('answer'), user('z'.repeat(8000))], 100);
    expect(report.sent).toHaveLength(1);
    expect(report.sent[0].content).toHaveLength(8000);
  });

  it('counts turns removed as noise separately from those dropped for budget', () => {
    const report = buildBudgetedContext([user('q1'), ai('boom', { status: 'error' }), user('now')], 4000);
    expect(report.droppedAsNoise).toBe(2);
    expect(report.droppedForBudget).toBe(0);
  });

  it('marks where the model context starts for the divider', () => {
    const messages = Array.from({ length: 20 }, (_, i) =>
      i % 2 === 0 ? user(`q${i} ${'x'.repeat(400)}`) : ai(`a${i} ${'y'.repeat(400)}`)
    );
    const start = historyWindowStart(messages, 300);
    expect(start).toBeGreaterThan(0);
    expect(messages[start].role).toBe('user');
    // Everything fits when the budget is large.
    expect(historyWindowStart(messages, 100000)).toBe(0);
  });
});
