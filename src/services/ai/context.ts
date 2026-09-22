import type { ChatMessage } from '../../types';
import { trimHistory } from '../../utils/history';

// What the model sees of a conversation (plan: agent/PROMPTING_CONTEXT_PLAN.md §3).
//
// Two modes, chosen per model profile:
// - 'app'    : this app sends a cleaned history (direct Ollama / LM Studio / OpenRouter endpoints,
//              which are stateless and remember nothing between requests).
// - 'server' : the gateway keeps the conversation; the app sends only the new message plus
//              conversation / message ids, so no history is sent at all.

export type ContextMode = 'app' | 'server';
type Turn = Pick<ChatMessage, 'id' | 'role' | 'content' | 'status' | 'stopped'>;

const INTERRUPTED_NOTE = '\n\n[answer interrupted]';
const THINK_BLOCK = /<think>[\s\S]*?(<\/think>|$)/gi;

/**
 * Clean question → answer record for app-managed context:
 * - failed answers are dropped together with the question they answered (the model would
 *   otherwise see an unanswered question and answer it again);
 * - answers stopped before any text are dropped the same way; partial ones are kept and marked;
 * - a run of questions with no answer between them keeps only the last (retries, re-asks);
 * - reasoning (<think> blocks) is never sent back.
 * The input must end with the question being asked now; it is always kept.
 */
export function cleanHistory(messages: Turn[]): Array<{ role: ChatMessage['role']; content: string }> {
  const out: Array<{ role: ChatMessage['role']; content: string }> = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isLast = i === messages.length - 1;

    if (m.role === 'user') {
      const next = messages[i + 1];
      // Another question follows with no answer between them: this one was superseded.
      if (!isLast && next?.role === 'user') continue;
      out.push({ role: 'user', content: m.content });
      continue;
    }

    if (m.role !== 'assistant') continue;
    const answer = m.content.replace(THINK_BLOCK, '').trim();
    const failed = m.status === 'error' || m.status === 'streaming' || !answer;
    if (failed) {
      // Drop the question this answer belonged to as well.
      if (out.length > 0 && out[out.length - 1].role === 'user') out.pop();
      continue;
    }
    out.push({ role: 'assistant', content: m.stopped ? `${answer}${INTERRUPTED_NOTE}` : answer });
  }
  return out;
}

/** History for an app-managed request: cleaned, then limited to the most recent messages. */
export function buildAppContext(messages: Turn[], historyLimit: number) {
  return trimHistory(cleanHistory(messages), historyLimit);
}
