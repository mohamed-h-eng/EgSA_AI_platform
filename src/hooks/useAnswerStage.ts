import { useEffect, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useSettingsStore } from '../stores/settingsStore';
import { resolveProfile, resolveModelTarget } from '../services/ai/modelProfiles';
import type { AstronautPose } from '../components/ui/Astronaut';

export interface AnswerStage {
  pose: AstronautPose;
  label: string;
  /** Shown beside the label: the model answering (Chat) or the search scope (Copilot). */
  detail?: string;
}

const DONE_LINGER_MS = 1400;

/**
 * What the astronaut dock shows (ASTRONAUT_STATUS_PLAN): the live stage while an answer is being
 * produced, then a short "done" / "stopped" beat, then nothing (null) so the page is still again.
 */
function useStageWithLinger(isStreaming: boolean, live: AnswerStage | null, outcome: () => AnswerStage | null): AnswerStage | null {
  const [wasStreaming, setWasStreaming] = useState(isStreaming);
  const [ending, setEnding] = useState<AnswerStage | null>(null);

  // Streaming just finished: show the outcome pose briefly (render-time state adjustment).
  if (wasStreaming !== isStreaming) {
    setWasStreaming(isStreaming);
    setEnding(isStreaming ? null : outcome());
  }

  useEffect(() => {
    if (!ending) return;
    const timer = setTimeout(() => setEnding(null), DONE_LINGER_MS);
    return () => clearTimeout(timer);
  }, [ending]);

  return isStreaming ? live : ending;
}

const insideCodeBlock = (text: string) => (text.match(/```/g) || []).length % 2 === 1;

/** "General assistant · llama3.1:8b", or "… · demo" when no live model is connected. */
const modelDetail = (profileName?: string, modelId?: string) =>
  [profileName, modelId || (profileName ? 'demo' : undefined)].filter(Boolean).join(' · ') || undefined;

/** Chat: idle ("Ready") → thinking (no text yet) → writing / writing code → done or stopped → idle. */
export function useChatAnswerStage(): AnswerStage {
  const idle = useChatIdleStage();
  const isStreaming = useChatStore((s) => s.isStreaming);
  const last = useChatStore((s) => s.sessions.find((x) => x.id === s.activeSessionId)?.messages.slice(-1)[0]);

  const detail = last?.role === 'assistant' ? modelDetail(last.profileName, last.modelId) : undefined;
  const live: AnswerStage | null =
    last?.role !== 'assistant'
      ? null
      : !last.content
        ? { pose: 'thinking', label: 'Thinking…', detail }
        : { pose: 'writing', label: insideCodeBlock(last.content) ? 'Writing code…' : 'Writing…', detail };

  const stage = useStageWithLinger(isStreaming, live, () => {
    const m = useChatStore.getState().sessions.find((x) => x.id === useChatStore.getState().activeSessionId)?.messages.slice(-1)[0];
    if (!m || m.role !== 'assistant') return null;
    const d = modelDetail(m.profileName, m.modelId);
    if (m.status === 'error' || m.stopped) return { pose: 'stopped', label: m.status === 'error' ? 'Couldn’t answer' : 'Stopped', detail: d };
    return { pose: 'done', label: 'Done', detail: d };
  });
  return stage ?? idle;
}

/** Between answers the astronaut stays docked, still, with the conversation's profile and model. */
function useChatIdleStage(): AnswerStage {
  const profileId = useChatStore((s) => s.sessions.find((x) => x.id === s.activeSessionId)?.profileId);
  const profiles = useSettingsStore((s) => s.profiles);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const profile = resolveProfile(profiles, profileId);
  const target = resolveModelTarget(profile, aiConfig);
  if (target.mode === 'unconfigured') return { pose: 'idle', label: 'No model set', detail: profile.name };
  return { pose: 'idle', label: 'Ready', detail: modelDetail(profile.name, target.mode === 'live' ? target.modelId : undefined) };
}

/** Knowledge Copilot: searching documents → writing the answer → done or stopped. */
export function useCopilotAnswerStage(): AnswerStage | null {
  const isStreaming = useKnowledgeStore((s) => s.isStreaming);
  const turn = useKnowledgeStore((s) => s.threads.find((t) => t.id === s.activeThreadId)?.turns.slice(-1)[0]);

  const scope = turn ? (turn.depth === 'deep' ? 'Deep research' : 'Quick answer') : undefined;
  const live: AnswerStage | null = !turn
    ? null
    : !turn.answer
      ? { pose: 'thinking', label: 'Searching documents…', detail: scope }
      : { pose: 'writing', label: 'Writing the answer…', detail: scope };

  return useStageWithLinger(isStreaming, live, () => {
    const { threads, activeThreadId } = useKnowledgeStore.getState();
    const t = threads.find((x) => x.id === activeThreadId)?.turns.slice(-1)[0];
    if (!t) return null;
    if (t.status === 'error' || t.status === 'stopped') return { pose: 'stopped', label: t.status === 'error' ? 'Research failed' : 'Stopped' };
    const n = t.sources.length;
    return { pose: 'done', label: t.grounding === 'insufficient' ? 'No supporting source found' : `Done · ${n} source${n === 1 ? '' : 's'}` };
  });
}
