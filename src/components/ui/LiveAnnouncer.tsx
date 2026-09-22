import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { speakableExcerpt } from '../../utils/speech';

// Screen-reader announcements for answers (PRODUCTIVITY_UX_PLAN §3). One polite live region for the
// whole app. It announces the start of an answer and a short excerpt when it's done, never token by
// token (the article's "debounced" approach). Written straight to the DOM from store subscriptions,
// so streaming doesn't re-render anything here.
export const LiveAnnouncer: React.FC = () => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const say = (text: string) => {
      const region = regionRef.current;
      if (!region) return;
      // Clear first so repeating the same sentence is still announced.
      region.textContent = '';
      window.setTimeout(() => {
        region.textContent = text;
      }, 60);
    };

    let chatStreaming = useChatStore.getState().isStreaming;
    const unsubscribeChat = useChatStore.subscribe(() => {
      const { isStreaming, sessions, activeSessionId } = useChatStore.getState();
      if (isStreaming === chatStreaming) return;
      chatStreaming = isStreaming;
      if (isStreaming) return say('Assistant is responding…');
      const last = sessions.find((s) => s.id === activeSessionId)?.messages.slice(-1)[0];
      if (!last || last.role !== 'assistant') return;
      say(last.status === 'error' ? `The answer failed. ${speakableExcerpt(last.content, 160)}` : `Assistant answered: ${speakableExcerpt(last.content)}`);
    });

    let copilotStreaming = useKnowledgeStore.getState().isStreaming;
    const unsubscribeCopilot = useKnowledgeStore.subscribe(() => {
      const { isStreaming, threads, activeThreadId } = useKnowledgeStore.getState();
      if (isStreaming === copilotStreaming) return;
      copilotStreaming = isStreaming;
      if (isStreaming) return say('Researching the knowledge base…');
      const turn = threads.find((t) => t.id === activeThreadId)?.turns.slice(-1)[0];
      if (!turn) return;
      if (turn.status === 'error') return say(`The research failed. ${turn.error || ''}`);
      const sources = turn.sources.length;
      say(
        `${turn.grounding === 'insufficient' ? 'Insufficient information.' : `Answer with ${sources} source${sources === 1 ? '' : 's'}.`} ${speakableExcerpt(turn.answer)}`
      );
    });

    return () => {
      unsubscribeChat();
      unsubscribeCopilot();
    };
  }, []);

  return <div ref={regionRef} className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" />;
};
