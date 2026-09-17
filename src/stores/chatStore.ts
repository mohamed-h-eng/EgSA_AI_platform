import { createStore } from './createStore';
import type { ChatMessage, ConversationSession, StreamChunk } from '../types';
import { providerRegistry } from '../services/ai/providerRegistry';
import { SmoothStreamBuffer } from '../services/ai/streamBuffer';
import { useSettingsStore } from './settingsStore';
import { DEFAULT_PERSONAS } from '../constants/defaults';

interface ChatState {
  sessions: ConversationSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  abortStream: (() => void) | null;
  searchQuery: string;
  isSidebarOpen: boolean;

  // Actions
  createNewSession: (personaId?: string) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  clearAllSessions: () => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  sendMessage: (content: string) => Promise<void>;
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
    modelId: settings.aiConfig.activeModelId,
    personaId: persona.id,
    systemPrompt: persona.systemPrompt,
    temperature: persona.temperature,
    messages: [
      {
        id: generateId(),
        role: 'assistant',
        content: `**EgSA AI Platform Online**.\n\n` +
          `Active Persona: **${persona.name}** (${persona.avatar})\n` +
          `Calibrated for *${persona.tagline}*.\n\n` +
          `Feel free to ask a technical question or choose one of the starter prompts below!`,
        timestamp: Date.now(),
        status: 'complete',
        modelId: settings.aiConfig.activeModelId,
      },
    ],
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
      modelId: settings.aiConfig.activeModelId,
      personaId: persona.id,
      systemPrompt: persona.systemPrompt,
      temperature: persona.temperature,
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: `**${persona.name} Ready** (${persona.avatar})\n\n${persona.description}\n\nHow can I help you today?`,
          timestamp: Date.now(),
          status: 'complete',
          modelId: settings.aiConfig.activeModelId,
        },
      ],
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

  deleteSession: (id) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      let nextActive = state.activeSessionId;
      if (nextActive === id) {
        nextActive = remaining.length > 0 ? remaining[0].id : null;
      }
      return {
        sessions: remaining.length > 0 ? remaining : [createInitialSession()],
        activeSessionId: nextActive || (remaining.length > 0 ? remaining[0].id : null),
      };
    });
  },

  renameSession: (id, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s)),
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

  sendMessage: async (content: string) => {
    const { sessions, activeSessionId, isStreaming } = get();
    if (!content.trim() || isStreaming || !activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    const settings = useSettingsStore.getState();

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      status: 'complete',
    };

    const isCustomApi = settings.aiConfig.providerType === 'custom-api' || settings.aiConfig.providerType === 'openai-compatible';
    const effectiveModelId = isCustomApi
      ? (settings.aiConfig.customModelId || 'gpt-4o-mini')
      : settings.aiConfig.activeModelId;

    const assistantMessageId = generateId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
      modelId: effectiveModelId,
    };

    const isFirstUserMessage = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const nextTitle = isFirstUserMessage
      ? content.trim().slice(0, 32) + (content.trim().length > 32 ? '...' : '')
      : currentSession.title;

    const updatedMessages = [...currentSession.messages, userMessage, assistantPlaceholder];

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: nextTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      ),
      isStreaming: true,
    }));

    const provider = providerRegistry.getActiveProvider(settings.aiConfig);

    const historyForLLM = updatedMessages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const smoothBuffer = new SmoothStreamBuffer((displayedContent, isDone, stats) => {
      set((state) => {
        const active = state.sessions.find((s) => s.id === activeSessionId);
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
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, messages: msgs } : s
          ),
          isStreaming: !isDone,
          abortStream: isDone ? null : state.abortStream,
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
        },
        (chunk: StreamChunk) => {
          smoothBuffer.append(chunk.content, chunk.done, chunk.stats);
        },
        (err: Error) => {
          smoothBuffer.abort();
          set((state) => {
            const active = state.sessions.find((s) => s.id === activeSessionId);
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
              sessions: state.sessions.map((s) =>
                s.id === activeSessionId ? { ...s, messages: msgs } : s
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
      set({ isStreaming: false, abortStream: null });
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
              m.status === 'streaming' ? { ...m, status: 'complete' } : m
            ),
          };
        }),
        isStreaming: false,
        abortStream: null,
      };
    });
  },

  regenerateResponse: async (targetMessageId?: string) => {
    const { sessions, activeSessionId, isStreaming, sendMessage } = get();
    if (isStreaming || !activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0) return;

    const lastUserMsg = [...currentSession.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        let msgs = [...s.messages];
        if (targetMessageId) {
          msgs = msgs.filter((m) => m.id !== targetMessageId);
        } else if (msgs[msgs.length - 1]?.role === 'assistant') {
          msgs.pop();
        }
        return { ...s, messages: msgs };
      }),
    }));

    await sendMessage(lastUserMsg.content);
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
      content = `# ${session.title}\n*Created: ${new Date(session.createdAt).toLocaleString()}*\n*Model: ${session.modelId}*\n\n---\n\n`;
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
