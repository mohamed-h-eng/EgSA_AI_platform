import { useCallback, useEffect, useState } from 'react';

// Unsent composer text, kept per conversation / research thread (PRODUCTIVITY_UX_PLAN §4).
// Stored in sessionStorage: survives switching conversations and reloading, not closing the browser.

const KEY = 'egsa_ai_drafts';
let cache: Record<string, string> | null = null;

function load(): Record<string, string> {
  if (cache) return cache;
  try {
    cache = JSON.parse(sessionStorage.getItem(KEY) || '{}') as Record<string, string>;
  } catch {
    cache = {};
  }
  return cache;
}

export function readDraft(id: string | null | undefined): string {
  return id ? load()[id] || '' : '';
}

export function writeDraft(id: string | null | undefined, text: string): void {
  if (!id) return;
  const drafts = load();
  if (text.trim()) drafts[id] = text;
  else delete drafts[id];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    // Storage blocked: the draft still lives in memory for this page.
  }
}

/**
 * Composer text that belongs to conversation `id`: switching `id` swaps in that conversation's
 * draft, and every change is saved for it.
 */
export function useDraft(id: string | null | undefined): [string, (text: string) => void] {
  const [state, setState] = useState(() => ({ id, text: readDraft(id) }));

  // Conversation switched: load its draft (the previous one was already saved on each change).
  let current = state;
  if (state.id !== id) {
    current = { id, text: readDraft(id) };
    setState(current);
  }

  useEffect(() => {
    writeDraft(current.id, current.text);
  }, [current.id, current.text]);

  const setText = useCallback((text: string) => setState({ id, text }), [id]);
  return [current.text, setText];
}
