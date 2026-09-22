import { createStore } from './createStore';
import { useChatStore } from './chatStore';
import { queryKnowledgeBase } from '../services/knowledge/knowledgeService';
import { SmoothStreamBuffer } from '../services/ai/streamBuffer';
import type {
  ChatMessage,
  ConversationSession,
  KnowledgeDepth,
  KnowledgeGrounding,
  KnowledgeScope,
  KnowledgeThread,
  KnowledgeTurn,
  SourceReference,
} from '../types';

interface KnowledgeState {
  threads: KnowledgeThread[];
  activeThreadId: string | null;
  // Composer settings; each turn records the scope/depth it actually ran with.
  scope: KnowledgeScope;
  depth: KnowledgeDepth;
  // Evidence panel focus: which turn's sources are shown, and which citation is selected (1-based).
  focusedTurnId: string | null;
  selectedSourceIndex: number | null;
  // Same names as chatStore so createStore resets them on load.
  isStreaming: boolean;
  abortStream: (() => void) | null;

  createThread: () => string;
  selectThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  togglePinThread: (id: string) => void;
  deleteThread: (id: string) => void;
  exportThread: (id: string) => void;
  setScope: (scope: KnowledgeScope) => void;
  setDepth: (depth: KnowledgeDepth) => void;
  focusSource: (turnId: string, index: number | null) => void;
  ask: (question: string) => Promise<void>;
  stop: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const NEW_THREAD_TITLE = 'New research';

export const useKnowledgeStore = createStore<KnowledgeState>((set, get) => {
  const patchTurn = (threadId: string, turnId: string, patch: Partial<KnowledgeTurn>) =>
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, updatedAt: Date.now(), turns: t.turns.map((u) => (u.id === turnId ? { ...u, ...patch } : u)) } : t
      ),
    }));

  return {
    threads: [],
    activeThreadId: null,
    scope: {},
    depth: 'quick',
    focusedTurnId: null,
    selectedSourceIndex: null,
    isStreaming: false,
    abortStream: null,

    createThread: () => {
      const active = get().threads.find((t) => t.id === get().activeThreadId);
      // Reuse an untouched thread instead of stacking empty ones.
      if (active && active.turns.length === 0) return active.id;

      const thread: KnowledgeThread = { id: generateId(), title: NEW_THREAD_TITLE, createdAt: Date.now(), updatedAt: Date.now(), turns: [] };
      set((s) => ({ threads: [thread, ...s.threads], activeThreadId: thread.id, focusedTurnId: null, selectedSourceIndex: null }));
      return thread.id;
    },

    selectThread: (id) => {
      const thread = get().threads.find((t) => t.id === id);
      const lastTurn = thread?.turns[thread.turns.length - 1];
      set({
        activeThreadId: id,
        focusedTurnId: lastTurn?.id || null,
        selectedSourceIndex: null,
        ...(lastTurn ? { scope: lastTurn.scope, depth: lastTurn.depth } : {}),
      });
    },

    renameThread: (id, title) => {
      set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, title, updatedAt: Date.now() } : t)) }));
    },

    // Pinning doesn't touch updatedAt, so it doesn't reorder the date groups.
    togglePinThread: (id) => {
      set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)) }));
    },

    deleteThread: (id) => {
      set((s) => {
        const remaining = s.threads.filter((t) => t.id !== id);
        const activeThreadId = s.activeThreadId === id ? remaining[0]?.id || null : s.activeThreadId;
        const lastTurn = remaining.find((t) => t.id === activeThreadId)?.turns.slice(-1)[0];
        return { threads: remaining, activeThreadId, focusedTurnId: lastTurn?.id || null, selectedSourceIndex: null };
      });
    },

    exportThread: (id) => {
      const thread = get().threads.find((t) => t.id === id);
      if (!thread) return;

      let content = `# ${thread.title}\n*Knowledge Copilot · created ${new Date(thread.createdAt).toLocaleString()}*\n\n---\n\n`;
      thread.turns.forEach((turn) => {
        content += `## ${turn.question}\n*${turn.depth === 'deep' ? 'Deep research' : 'Quick answer'} · ${new Date(turn.createdAt).toLocaleString()}*\n\n${turn.answer}\n\n`;
        if (turn.uncovered.length) {
          content += `**Not covered:** ${turn.uncovered.join('; ')}\n\n`;
        }
        if (turn.sources.length) {
          content += `**Sources:**\n\n`;
          turn.sources.forEach((src, i) => {
            const ref = [`Rev ${src.revision}`, `p. ${src.page}`, src.section, src.requirementId].filter(Boolean).join(', ');
            content += `${i + 1}. ${src.documentTitle} (${ref})\n`;
          });
          content += `\n`;
        }
        content += `---\n\n`;
      });

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${thread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    setScope: (scope) => set({ scope }),
    setDepth: (depth) => set({ depth }),
    focusSource: (turnId, index) => set({ focusedTurnId: turnId, selectedSourceIndex: index }),

    ask: async (question) => {
      const text = question.trim();
      if (!text || get().isStreaming) return;

      let threadId = get().activeThreadId;
      if (!threadId || !get().threads.some((t) => t.id === threadId)) {
        threadId = get().createThread();
      }
      const { scope, depth } = get();

      const turn: KnowledgeTurn = {
        id: generateId(),
        question: text,
        depth,
        scope,
        createdAt: Date.now(),
        status: 'running',
        answer: '',
        sources: [],
        steps: [],
        consultedDocumentIds: [],
        uncovered: [],
      };

      set((s) => ({
        threads: s.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                title: t.turns.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '...' : '') : t.title,
                updatedAt: Date.now(),
                turns: [...t.turns, turn],
              }
            : t
        ),
        isStreaming: true,
        focusedTurnId: turn.id,
        selectedSourceIndex: null,
      }));

      const tid = threadId;
      const controller = new AbortController();
      const buffer = new SmoothStreamBuffer((displayed, isDone) => {
        patchTurn(tid, turn.id, { answer: displayed, ...(isDone ? { status: 'complete' as const } : {}) });
        if (isDone) set({ isStreaming: false, abortStream: null });
      });

      set({
        abortStream: () => {
          controller.abort();
          buffer.flushAndStop();
          patchTurn(tid, turn.id, { status: 'stopped' });
        },
      });

      const startedAt = Date.now();
      try {
        const result = await queryKnowledgeBase(
          { question: text, scope, depth },
          { signal: controller.signal, onStep: (steps) => patchTurn(tid, turn.id, { steps }) }
        );
        patchTurn(tid, turn.id, {
          sources: result.sources,
          grounding: result.grounding,
          steps: result.steps,
          consultedDocumentIds: result.consultedDocumentIds,
          uncovered: result.uncovered,
          latencyMs: Date.now() - startedAt,
        });
        buffer.append(result.answer, true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        buffer.abort();
        patchTurn(tid, turn.id, { status: 'error', error: err?.message || 'Knowledge query failed' });
        set({ isStreaming: false, abortStream: null });
      }
    },

    stop: () => {
      get().abortStream?.();
      set({ isStreaming: false, abortStream: null });
    },
  };
}, 'egsa_ai_knowledge');

// A reload mid-query leaves a turn stuck in 'running'; nothing is streaming any more.
useKnowledgeStore.setState((s) => ({
  threads: s.threads.map((t) => ({
    ...t,
    turns: t.turns.map((u) => (u.status === 'running' ? { ...u, status: 'stopped' as const } : u)),
  })),
}));

// --- One-time migration: chat sessions from the old in-chat "Knowledge mode" become Copilot
// threads, keeping their questions, answers and citations exactly as they were displayed. ---

type LegacySession = ConversationSession & { mode?: string; knowledgeScope?: KnowledgeScope };
type LegacyMessage = ChatMessage & { sources?: SourceReference[]; grounding?: KnowledgeGrounding };

const migrateLegacyKnowledgeSessions = () => {
  const chat = useChatStore.getState();
  const legacy = (chat.sessions as LegacySession[]).filter((s) => s.mode === 'knowledge');
  if (legacy.length === 0) return;

  const existingIds = new Set(useKnowledgeStore.getState().threads.map((t) => t.id));
  const migrated: KnowledgeThread[] = legacy
    .filter((session) => !existingIds.has(session.id))
    .map((session) => {
      const messages = session.messages as LegacyMessage[];
      const turns: KnowledgeTurn[] = [];
      messages.forEach((m, i) => {
        const reply = messages[i + 1];
        if (m.role !== 'user' || !reply || reply.role !== 'assistant') return;
        const sources = reply.sources || [];
        turns.push({
          id: reply.id,
          question: m.content,
          depth: 'quick',
          scope: session.knowledgeScope || {},
          createdAt: m.timestamp,
          status: reply.status === 'error' ? 'error' : 'complete',
          answer: reply.content,
          sources,
          grounding: reply.grounding,
          steps: [],
          consultedDocumentIds: Array.from(new Set(sources.map((s) => s.documentId))),
          uncovered: [],
          latencyMs: reply.stats?.latencyMs,
          error: reply.error,
        });
      });
      return { id: session.id, title: session.title, createdAt: session.createdAt, updatedAt: session.updatedAt, turns };
    });

  useKnowledgeStore.setState((s) => ({
    threads: [...migrated, ...s.threads],
    activeThreadId: s.activeThreadId || migrated[0]?.id || null,
  }));

  const remaining = chat.sessions.filter((s) => (s as LegacySession).mode !== 'knowledge');
  if (remaining.length === 0) {
    chat.clearAllSessions();
  } else {
    useChatStore.setState({
      sessions: remaining,
      activeSessionId: remaining.some((s) => s.id === chat.activeSessionId) ? chat.activeSessionId : remaining[0].id,
    });
  }
};

migrateLegacyKnowledgeSessions();
