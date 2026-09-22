import { createStore } from './createStore';
import type { ChatMessage, ConversationSession, StreamChunk } from '../types';
import { providerRegistry } from '../services/ai/providerRegistry';
import { SmoothStreamBuffer } from '../services/ai/streamBuffer';
import { useSettingsStore } from './settingsStore';
import { DEFAULT_PERSONAS } from '../constants/defaults';
import { defaultProfile, resolveProfile, resolveModelTarget } from '../services/ai/modelProfiles';
import { buildAppContext } from '../services/ai/context';

interface ChatState {
  sessions: ConversationSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  abortStream: (() => void) | null;
  searchQuery: string;
  isSidebarOpen: boolean;

  // Actions
  createNewSession: (personaId?: string) => string;
  /** CHAT-006: switch the model profile; the next answer uses it. */
  setSessionProfile: (sessionId: string, profileId: string) => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  togglePinSession: (id: string) => void;
  clearAllSessions: () => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /**
   * Asks `content` in the active conversation. `resend` re-asks an existing question (Retry) instead
   * of adding a new one; `replacesMessageId` tells a server-managed backend to discard that message
   * and everything after it first (Retry / Edit).
   */
  sendMessage: (content: string, options?: { resend?: ChatMessage; replacesMessageId?: string }) => Promise<void>;
  /** Edit & resend: replaces the message and everything after it with the edited question. */
  editAndResend: (messageId: string, content: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateResponse: (messageId?: string) => Promise<void>;
  exportConversation: (id: string, format: 'json' | 'markdown') => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const createInitialSession = (): ConversationSession => {
  const settings = useSettingsStore.getState();
  const persona = DEFAULT_PERSONAS.find((p) => p.id === settings.aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  return {
    id: generateId(),
    title: 'New Mission Session',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    profileId: defaultProfile(settings.profiles, 'general').id,
    personaId: persona.id,
    systemPrompt: persona.systemPrompt,
    temperature: persona.temperature,
    messages: [],
  };
};

const initialSession = createInitialSession();

export const useChatStore = createStore<ChatState>((set, get) => ({
  sessions: [initialSession],
  activeSessionId: initialSession.id,
  isStreaming: false,
  abortStream: null,
  searchQuery: '',
  isSidebarOpen: true,

  createNewSession: (personaId?: string) => {
    const settings = useSettingsStore.getState();
    const pid = personaId || settings.aiConfig.activePersonaId;
    const persona = DEFAULT_PERSONAS.find((p) => p.id === pid) || DEFAULT_PERSONAS[0];

    const newSession: ConversationSession = {
      id: generateId(),
      title: `${persona.name} Chat`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      profileId: defaultProfile(settings.profiles, 'general').id,
      personaId: persona.id,
      systemPrompt: persona.systemPrompt,
      temperature: persona.temperature,
      messages: [],
    };

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: newSession.id,
    }));

    return newSession.id;
  },

  selectSession: (id) => {
    set({ activeSessionId: id });
  },

  setSessionProfile: (sessionId, profileId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, profileId } : s)),
    }));
  },

  deleteSession: (id) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      let nextActive = state.activeSessionId;
      if (nextActive === id) {
        nextActive = remaining.length > 0 ? remaining[0].id : null;
      }
      // Deleting the last conversation leaves a fresh one, which must also become the active one.
      if (remaining.length === 0) {
        const fresh = createInitialSession();
        return { sessions: [fresh], activeSessionId: fresh.id };
      }
      return {
        sessions: remaining,
        activeSessionId: nextActive || remaining[0].id,
      };
    });
  },

  renameSession: (id, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s)),
    }));
  },

  // Pinning doesn't touch updatedAt, so it doesn't reorder the date groups.
  togglePinSession: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
    }));
  },

  clearAllSessions: () => {
    const fresh = createInitialSession();
    set({
      sessions: [fresh],
      activeSessionId: fresh.id,
    });
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (isSidebarOpen) => {
    set({ isSidebarOpen });
  },

  sendMessage: async (content: string, options = {}) => {
    const state = get();
    if (!content.trim() || state.isStreaming) return;

    let targetSessionId = state.activeSessionId;
    let currentSession = state.sessions.find((s) => s.id === targetSessionId);

    // Auto-create or select session if none is active
    if (!currentSession) {
      targetSessionId = get().createNewSession();
      currentSession = get().sessions.find((s) => s.id === targetSessionId);
      if (!currentSession) return;
    }

    const settings = useSettingsStore.getState();

    // Retry re-asks the existing question rather than adding a duplicate of it.
    const userMessage: ChatMessage = options.resend ?? {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      status: 'complete',
    };

    // CHAT-006: the conversation's profile decides endpoint + model. No silent fallback model.
    const profile = resolveProfile(settings.profiles, currentSession.profileId);
    const target = resolveModelTarget(profile, settings.aiConfig);
    const effectiveModelId = target.mode === 'unconfigured' ? '' : target.modelId;

    const assistantMessageId = generateId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
      modelId: target.mode === 'live' ? target.modelId : undefined,
      profileName: profile.name,
    };

    const isFirstUserMessage = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const nextTitle = isFirstUserMessage
      ? content.trim().slice(0, 32) + (content.trim().length > 32 ? '...' : '')
      : currentSession.title;

    // Filter out initial boilerplate assistant greeting if this is the first user prompt
    const baseMessages = currentSession.messages.filter(
      (m, idx) => !(idx === 0 && m.role === 'assistant' && currentSession!.messages.length === 1)
    );

    const updatedMessages = options.resend ? [...baseMessages, assistantPlaceholder] : [...baseMessages, userMessage, assistantPlaceholder];

    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === targetSessionId
          ? {
              ...sess,
              title: nextTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : sess
      ),
      isStreaming: true,
    }));

    if (target.mode === 'unconfigured') {
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === targetSessionId
            ? {
                ...sess,
                messages: sess.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? ({ ...msg, content: `⚠️ **Model not configured**: ${target.problem}`, status: 'error' } as ChatMessage)
                    : msg
                ),
              }
            : sess
        ),
        isStreaming: false,
      }));
      return;
    }

    const provider = providerRegistry.getProvider(target, settings.aiConfig);

    // What the model is sent (PROMPTING_CONTEXT_PLAN §3). Server-managed profiles: only the new
    // question, plus ids, because the gateway keeps the conversation. App-managed (stateless
    // endpoints): a cleaned history (no failed, empty or superseded turns) within the memory limit.
    const serverContext = profile.contextMode === 'server';
    const historyForLLM = serverContext
      ? [{ role: userMessage.role, content: userMessage.content }]
      : buildAppContext(updatedMessages.slice(0, -1), settings.aiConfig.historyLimit ?? 30);

    const smoothBuffer = new SmoothStreamBuffer((displayedContent, isDone, stats) => {
      set((s) => {
        const active = s.sessions.find((sess) => sess.id === targetSessionId);
        if (!active) return {};

        const msgs = active.messages.map((msg) => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: displayedContent,
              status: isDone ? 'complete' : 'streaming',
              stats: stats || msg.stats,
            } as ChatMessage;
          }
          return msg;
        });

        return {
          sessions: s.sessions.map((sess) =>
            sess.id === targetSessionId ? { ...sess, messages: msgs } : sess
          ),
          isStreaming: !isDone,
          abortStream: isDone ? null : s.abortStream,
        };
      });
    });

    try {
      const abort = await provider.generateStream(
        {
          messages: historyForLLM,
          modelId: effectiveModelId,
          systemPrompt: currentSession.systemPrompt || settings.aiConfig.systemPrompt,
          temperature: currentSession.temperature ?? settings.aiConfig.temperature,
          maxTokens: settings.aiConfig.maxTokens,
          conversation: serverContext
            ? { conversationId: targetSessionId!, messageId: userMessage.id, replacesMessageId: options.replacesMessageId }
            : undefined,
        },
        (chunk: StreamChunk) => {
          smoothBuffer.append(chunk.content, chunk.done, chunk.stats);
        },
        (err: Error) => {
          smoothBuffer.abort();
          set((s) => {
            const active = s.sessions.find((sess) => sess.id === targetSessionId);
            if (!active) return { isStreaming: false, abortStream: null };

            const msgs = active.messages.map((msg) => {
              if (msg.id === assistantMessageId) {
                return {
                  ...msg,
                  content:
                    msg.content ||
                    `⚠️ **Connection Error**: ${err.message}\n\nPlease check your endpoint URL, API key, and model ID in **Preferences > Engine & API**.`,
                  status: 'error',
                  error: err.message,
                } as ChatMessage;
              }
              return msg;
            });

            return {
              sessions: s.sessions.map((sess) =>
                sess.id === targetSessionId ? { ...sess, messages: msgs } : sess
              ),
              isStreaming: false,
              abortStream: null,
            };
          });
        }
      );

      const combinedAbort = () => {
        abort();
        smoothBuffer.flushAndStop();
      };

      set({ abortStream: combinedAbort });
    } catch (err: any) {
      console.error('Failed to launch LLM stream', err);
      smoothBuffer.abort();
      set((s) => {
        const active = s.sessions.find((sess) => sess.id === targetSessionId);
        if (!active) return { isStreaming: false, abortStream: null };

        const msgs = active.messages.map((msg) => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: `⚠️ **Connection Error**: ${err.message || 'Failed to connect'}\n\nPlease check your endpoint URL, API key, and model ID in **Preferences > Engine & API**.`,
              status: 'error',
              error: err.message,
            } as ChatMessage;
          }
          return msg;
        });

        return {
          sessions: s.sessions.map((sess) =>
            sess.id === targetSessionId ? { ...sess, messages: msgs } : sess
          ),
          isStreaming: false,
          abortStream: null,
        };
      });
    }
  },

  stopGeneration: () => {
    const { abortStream, activeSessionId } = get();
    if (abortStream) {
      abortStream();
    }
    set((state) => {
      if (!activeSessionId) return { isStreaming: false, abortStream: null };
      return {
        sessions: state.sessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.status === 'streaming' ? { ...m, status: 'complete', stopped: true } : m
            ),
          };
        }),
        isStreaming: false,
        abortStream: null,
      };
    });
  },

  // Retry: drop the answer being replaced and re-ask the same question (no duplicate question).
  regenerateResponse: async (targetMessageId?: string) => {
    const { sessions, activeSessionId, isStreaming, sendMessage } = get();
    if (isStreaming || !activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0) return;

    let msgs = [...currentSession.messages];
    if (targetMessageId) msgs = msgs.filter((m) => m.id !== targetMessageId);
    else if (msgs[msgs.length - 1]?.role === 'assistant') msgs.pop();

    const question = msgs[msgs.length - 1];
    if (!question || question.role !== 'user') return;

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSessionId ? { ...s, messages: msgs } : s)),
    }));

    await sendMessage(question.content, { resend: question, replacesMessageId: question.id });
  },

  // Edit & resend replaces: the edited question and everything after it are removed first, so the
  // conversation stays one clean question → answer record.
  editAndResend: async (messageId, content) => {
    const { sessions, activeSessionId, isStreaming, sendMessage } = get();
    if (isStreaming || !activeSessionId || !content.trim()) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    const index = session?.messages.findIndex((m) => m.id === messageId) ?? -1;
    if (!session || index < 0) return;

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, index) } : s)),
    }));

    await sendMessage(content, { replacesMessageId: messageId });
  },

  exportConversation: (id: string, format: 'json' | 'markdown') => {
    const { sessions } = get();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    let content = '';
    let filename = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else {
      content = `# ${session.title}\n*Created: ${new Date(session.createdAt).toLocaleString()}*\n*Model: ${resolveProfile(useSettingsStore.getState().profiles, session.profileId).name}*\n\n---\n\n`;
      session.messages.forEach((m) => {
        const author = m.role === 'user' ? '👤 User' : '🤖 Assistant';
        content += `### ${author} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n---\n\n`;
      });
      filename += '.md';
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}), 'egsa_ai_sessions');
