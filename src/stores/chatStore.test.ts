import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from './chatStore';
import type { ChatMessage, ConversationSession } from '../types';

const msg = (id: string, role: ChatMessage['role'], content: string): ChatMessage => ({ id, role, content, timestamp: 0, status: 'complete' });

function seed(messages: ChatMessage[]) {
  const session: ConversationSession = { id: 's1', title: 'Test', createdAt: 0, updatedAt: 0, messages };
  useChatStore.setState({ sessions: [session], activeSessionId: 's1', isStreaming: false, abortStream: null });
}
const current = () => useChatStore.getState().sessions.find((s) => s.id === 's1')!.messages;

describe('retry and edit keep one clean question → answer record', () => {
  // The demo provider streams on timers; freeze them so only the store's own updates run.
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('Retry re-asks the same question instead of adding a duplicate', async () => {
    seed([msg('u1', 'user', 'q1'), msg('a1', 'assistant', 'a1'), msg('u2', 'user', 'q2'), msg('a2', 'assistant', 'bad answer')]);
    await useChatStore.getState().regenerateResponse();
    const after = current();
    expect(after.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(after.filter((m) => m.role === 'user').map((m) => m.content)).toEqual(['q1', 'q2']);
    expect(after[2].id).toBe('u2'); // the same question message, re-used
    expect(after[3].id).not.toBe('a2'); // a new answer
  });

  it('Edit & resend replaces the edited question and everything after it', async () => {
    seed([msg('u1', 'user', 'q1'), msg('a1', 'assistant', 'a1'), msg('u2', 'user', 'q2'), msg('a2', 'assistant', 'a2')]);
    await useChatStore.getState().editAndResend('u1', 'q1 edited');
    const after = current();
    expect(after).toHaveLength(2);
    expect(after[0]).toMatchObject({ role: 'user', content: 'q1 edited' });
    expect(after[1].role).toBe('assistant');
  });

  it('Stop marks the unfinished answer as stopped', () => {
    seed([msg('u1', 'user', 'q1'), { ...msg('a1', 'assistant', 'partial'), status: 'streaming' }]);
    useChatStore.getState().stopGeneration();
    expect(current()[1]).toMatchObject({ status: 'complete', stopped: true });
  });
});
