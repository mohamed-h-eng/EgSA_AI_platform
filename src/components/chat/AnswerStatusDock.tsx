import React from 'react';
import { Astronaut } from '../ui/Astronaut';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AnswerStage } from '../../hooks/useAnswerStage';

// The astronaut docked just above the message box, with the model's status written beside it
// (ASTRONAUT_STATUS_PLAN §9): "Thinking…" / "Writing…" / "Done", plus which model is answering.
// No border or background. In Chat it stays docked between answers (still "idle" pose, "Ready")
// and is the model control: clicking it opens Settings → Intelligence (§12). In the Copilot it
// shows only while an answer is produced, plus a short "done" beat.
export const AnswerStatusDock: React.FC<{ stage: AnswerStage | null; onOpen?: () => void }> = ({ stage, onOpen }) => {
  const enabled = useSettingsStore((s) => s.preferences.statusCompanion ?? true);
  // As a control (Chat) the status stays even with the companion off; only the astronaut goes.
  if (!stage || (!enabled && !onOpen)) return null;

  // One element for the dock's whole life: stages only swap the pose and text in place, so it
  // never blinks out and back between thinking → writing → done/failed → ready.
  const content = (
    <>
      {enabled && <Astronaut pose={stage.pose} size={32} />}
      <span className="answer-dock-status">
        <span className="answer-dock-label">{stage.label}</span>
        {stage.detail && <span className="answer-dock-detail">{stage.detail}</span>}
      </span>
    </>
  );

  if (onOpen) {
    const summary = [stage.label, stage.detail].filter(Boolean).join(' · ');
    return (
      <button
        type="button"
        className="answer-dock answer-dock--action"
        data-pose={stage.pose}
        onClick={onOpen}
        title="Change model or persona"
        aria-label={`${summary}. Change model or persona`}
      >
        {content}
      </button>
    );
  }

  // Screen readers already hear the stage from LiveAnnouncer, so the passive dock is aria-hidden.
  return (
    <div className="answer-dock" data-pose={stage.pose} aria-hidden="true">
      {content}
    </div>
  );
};
