import type { ChatMessage } from '../types';

// Conversation memory (plan: PRODUCTIVITY_UX_PLAN.md §6): only the last `limit` messages are sent
// to the model, so very long conversations don't silently overflow its context window.

/** Messages to send for the next answer: the last `limit`, starting with a user message. */
export function trimHistory<T extends Pick<ChatMessage, 'role'>>(messages: T[], limit: number): T[] {
  const recent = limit > 0 ? messages.slice(-limit) : messages;
  const firstUser = recent.findIndex((m) => m.role === 'user');
  return firstUser >= 0 ? recent.slice(firstUser) : recent;
}

/**
 * Index of the first message the model still sees for the latest answer, or 0 when nothing is left
 * out. A trailing assistant message is that answer itself, so it isn't counted as context.
 */
export function historyWindowStart(messages: Array<Pick<ChatMessage, 'role'>>, limit: number): number {
  if (limit <= 0) return 0;
  const context = messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? messages.length - 1 : messages.length;
  if (context <= limit) return 0;
  let start = context - limit;
  while (start < context && messages[start].role !== 'user') start++;
  return start;
}
