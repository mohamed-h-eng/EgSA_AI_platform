import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useUiStore } from '../stores/uiStore';
import { hasMod, isTypingTarget, MOD_LABEL } from '../utils/keyboard';

// Keyboard shortcuts (PRODUCTIVITY_UX_PLAN §1). Keys follow ChatGPT's where they overlap, so they're
// already familiar. Listed in the ? sheet from this table, so the two can't drift apart.
export const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: [MOD_LABEL, 'Shift', 'O'], label: 'New conversation or research thread' },
  { keys: ['/'], label: 'Focus the message box' },
  { keys: ['Enter'], label: 'Send (Shift + Enter for a new line)' },
  { keys: ['Esc'], label: 'Stop the answer being written (in the message box)' },
  { keys: ['↑'], label: 'Edit your last message (empty message box, Chat)' },
  { keys: [MOD_LABEL, 'Shift', 'C'], label: 'Copy the last answer' },
  { keys: [MOD_LABEL, 'Shift', 'S'], label: 'Show or hide the sidebar' },
  { keys: ['↑', '↓'], label: 'Move between suggestions and menu items' },
  { keys: ['Esc'], label: 'Close a window or menu' },
  { keys: ['?'], label: 'Show these shortcuts' },
];

const focusComposer = () => document.querySelector<HTMLTextAreaElement>('[data-composer]')?.focus();

function lastAnswer(): string | undefined {
  if (useNavigationStore.getState().activeView === 'knowledge') {
    const { threads, activeThreadId } = useKnowledgeStore.getState();
    return threads.find((t) => t.id === activeThreadId)?.turns.slice(-1)[0]?.answer || undefined;
  }
  const { sessions, activeSessionId } = useChatStore.getState();
  const messages = sessions.find((s) => s.id === activeSessionId)?.messages || [];
  return [...messages].reverse().find((m) => m.role === 'assistant' && m.status !== 'streaming')?.content;
}

/** App-wide shortcut handler; mount once (App.tsx). */
export function useShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Dialogs handle their own keys (useDialog); menus handle theirs.
      if (document.querySelector('[role="dialog"]') || (document.activeElement as HTMLElement | null)?.closest?.('[role="menu"]')) return;

      const view = useNavigationStore.getState().activeView;
      const key = e.key.toLowerCase();

      if (hasMod(e) && e.shiftKey && !e.altKey) {
        if (key === 'o') {
          e.preventDefault();
          if (view === 'knowledge') useKnowledgeStore.getState().createThread();
          else useChatStore.getState().createNewSession();
          setTimeout(focusComposer, 0);
          return;
        }
        if (key === 'c') {
          const answer = lastAnswer();
          if (!answer) return;
          e.preventDefault();
          void navigator.clipboard.writeText(answer).then(
            () => useUiStore.getState().showToast('Copied the last answer'),
            () => useUiStore.getState().showToast('Couldn’t copy. Try the Copy button')
          );
          return;
        }
        if (key === 's') {
          e.preventDefault();
          useChatStore.getState().toggleSidebar();
          return;
        }
      }

      // Esc in the message box stops the answer being written.
      if (e.key === 'Escape' && (document.activeElement as HTMLElement | null)?.hasAttribute?.('data-composer')) {
        if (view === 'knowledge' && useKnowledgeStore.getState().isStreaming) useKnowledgeStore.getState().stop();
        else if (view === 'chat' && useChatStore.getState().isStreaming) useChatStore.getState().stopGeneration();
        return;
      }

      // Single keys never fire while typing.
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(document.activeElement)) return;
      if (e.key === '/' || e.key === '?') {
        // Stop here so the chat box's type-anywhere handler doesn't also type the character.
        e.preventDefault();
        e.stopPropagation();
        if (e.key === '/') focusComposer();
        else useUiStore.getState().openShortcuts();
      }
    };

    // Capture phase, so '/' and '?' aren't swallowed by the chat box's type-anywhere focus.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);
}
