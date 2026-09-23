import type { ChatMessage } from '../../types';

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

// --- Token budget (PROMPTING_CONTEXT_PLAN §5) ---------------------------------------------------
// Counting messages can't stop a server from silently truncating: Ollama's /v1 endpoint drops the
// oldest messages past its own context length, and OpenRouter compresses the middle of long
// prompts. So the history is filled newest-first until the profile's real context size is spent.

/** Rough token count, no tokenizer dependency: ~4 chars per token, ~2.5 for Arabic script. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const arabic = (text.match(/[؀-ۿ]/g) || []).length;
  const rest = text.length - arabic;
  return Math.ceil(arabic / 2.5 + rest / 4);
}

/** Per message: the text plus the few tokens every chat message costs in the wire format. */
const MESSAGE_OVERHEAD_TOKENS = 4;
const SAFETY_MARGIN = 0.1;

export const DEFAULT_CONTEXT_TOKENS = 8192;

/**
 * How many tokens the history may use: the model's context, less the answer, the system prompt and
 * a 10% margin. Never negative.
 */
export function historyBudget(options: { contextTokens?: number; maxTokens: number; systemPrompt: string }): number {
  const context = options.contextTokens && options.contextTokens > 0 ? options.contextTokens : DEFAULT_CONTEXT_TOKENS;
  const reserved = options.maxTokens + estimateTokens(options.systemPrompt) + MESSAGE_OVERHEAD_TOKENS;
  return Math.max(0, Math.floor(context * (1 - SAFETY_MARGIN)) - reserved);
}

type Sent = { role: ChatMessage['role']; content: string };

/**
 * The newest turns that fit `budget`, starting on a user turn. The latest question is always kept,
 * even when it alone is over budget — dropping it would leave nothing to answer.
 */
export function fitBudget(turns: Sent[], budget: number): { sent: Sent[]; dropped: number } {
  const kept: Sent[] = [];
  let used = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const cost = estimateTokens(turns[i].content) + MESSAGE_OVERHEAD_TOKENS;
    const mustKeep = i === turns.length - 1;
    if (!mustKeep && used + cost > budget) break;
    used += cost;
    kept.unshift(turns[i]);
  }
  while (kept.length > 1 && kept[0].role !== 'user') kept.shift();
  return { sent: kept, dropped: turns.length - kept.length };
}

export interface ContextReport {
  sent: Sent[];
  /** Turns left out because the budget ran out (after the cleanup above). */
  droppedForBudget: number;
  /** Turns removed by the cleanup: failed, empty or superseded. */
  droppedAsNoise: number;
  budgetTokens: number;
  usedTokens: number;
}

/** App-managed context: clean the record (§3), then fit the profile's token budget (§5). */
export function buildBudgetedContext(messages: Turn[], budget: number): ContextReport {
  const cleaned = cleanHistory(messages);
  const { sent, dropped } = fitBudget(cleaned, budget);
  return {
    sent,
    droppedForBudget: dropped,
    droppedAsNoise: messages.length - cleaned.length,
    budgetTokens: budget,
    usedTokens: sent.reduce((n, m) => n + estimateTokens(m.content) + MESSAGE_OVERHEAD_TOKENS, 0),
  };
}

/**
 * Index of the first message still sent for the next answer, or 0 when everything fits. Used for
 * the divider in the chat: it counts raw turns (what the reader sees), not the cleaned record.
 */
export function historyWindowStart(messages: Array<{ role: ChatMessage['role']; content: string }>, budget: number): number {
  // A trailing assistant message is the answer being produced, not context.
  const end = messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? messages.length - 1 : messages.length;
  let used = 0;
  let start = end;
  for (let i = end - 1; i >= 0; i--) {
    const cost = estimateTokens(messages[i].content) + MESSAGE_OVERHEAD_TOKENS;
    if (i < end - 1 && used + cost > budget) break;
    used += cost;
    start = i;
  }
  while (start < end && messages[start].role !== 'user') start++;
  return start >= end ? 0 : start;
}

