import { describe, expect, it } from 'vitest';
import { buildAppContext, cleanHistory } from './context';
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
    const h = buildAppContext([user('q1'), ai('a1'), user('q2'), ai('x', { status: 'error' }), user('now')], 30);
    expect(h[h.length - 1]).toEqual({ role: 'user', content: 'now' });
  });

  it('applies the message limit after cleaning', () => {
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < 20; i++) msgs.push(user(`q${i}`), ai(`a${i}`));
    msgs.push(user('now'));
    const h = buildAppContext(msgs, 10);
    expect(h.length).toBeLessThanOrEqual(10);
    expect(h[0].role).toBe('user');
    expect(h[h.length - 1].content).toBe('now');
  });
});
