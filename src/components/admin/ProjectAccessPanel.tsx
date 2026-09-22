import React, { useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { ProjectDefinition } from '../../types';

// ADM-007: switch a project or one of its subsystems (a document set) out of retrieval without
// deleting anything. Documents keep their status; access is gated where they're searched/listed.
export const ProjectAccessPanel: React.FC = () => {
  const isMobile = useIsMobile(720);
  const projects = useDocumentStore((s) => s.projects);
  const documents = useDocumentStore((s) => s.documents);
  const setProjectEnabled = useDocumentStore((s) => s.setProjectEnabled);
  const setSubsystemEnabled = useDocumentStore((s) => s.setSubsystemEnabled);

  // Turning a whole project off asks for confirmation inline; turning on or toggling a subsystem doesn't.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const countFor = (projectId: string, subsystem?: string) =>
    documents.filter((d) => d.project === projectId && (!subsystem || d.subsystem === subsystem)).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 'var(--space-5) var(--space-4)' : 'var(--space-6)' }}>
      <h4 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Project access</h4>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-5)', lineHeight: 1.5, maxWidth: '36rem' }}>
        Switch a project or subsystem off to stop the Knowledge Copilot searching it. Documents and source files are kept, and nothing needs re-indexing when it's switched back on.
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {projects.map((project) => (
          <ProjectGroup
            key={project.id}
            project={project}
            isMobile={isMobile}
            countFor={countFor}
            isConfirming={confirmingId === project.id}
            onProjectToggle={(on) => (on ? setProjectEnabled(project.id, true) : setConfirmingId(project.id))}
            onConfirmOff={() => {
              setProjectEnabled(project.id, false);
              setConfirmingId(null);
            }}
            onCancel={() => setConfirmingId(null)}
            onSubsystemToggle={(sub, on) => setSubsystemEnabled(project.id, sub, on)}
          />
        ))}
      </ul>
    </div>
  );
};

const ProjectGroup: React.FC<{
  project: ProjectDefinition;
  isMobile: boolean;
  countFor: (projectId: string, subsystem?: string) => number;
  isConfirming: boolean;
  onProjectToggle: (on: boolean) => void;
  onConfirmOff: () => void;
  onCancel: () => void;
  onSubsystemToggle: (subsystem: string, on: boolean) => void;
}> = ({ project, isMobile, countFor, isConfirming, onProjectToggle, onConfirmOff, onCancel, onSubsystemToggle }) => {
  const projectOn = !project.disabled;
  const total = countFor(project.id);

  return (
    <li className="access-group">
      <AccessRow
        label={project.name}
        count={`${total} document${total === 1 ? '' : 's'}`}
        on={projectOn}
        onChange={onProjectToggle}
        isMobile={isMobile}
        strong
      />

      {isConfirming && (
        <div role="alert" className="access-confirm">
          <span>
            The Copilot will stop searching {total} document{total === 1 ? '' : 's'}. Nothing is deleted.
          </span>
          <span style={{ display: 'inline-flex', gap: 'var(--space-3)' }}>
            <button type="button" className="text-action" style={{ color: 'var(--danger)' }} onClick={onConfirmOff}>
              Turn off
            </button>
            <button type="button" className="text-action is-muted" onClick={onCancel}>
              Cancel
            </button>
          </span>
        </div>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {project.subsystems.map((sub) => {
          const count = countFor(project.id, sub);
          return (
            <li key={sub}>
              <AccessRow
                label={sub}
                count={String(count)}
                on={projectOn && !project.disabledSubsystems?.includes(sub)}
                disabledReason={projectOn ? undefined : 'Project is off'}
                onChange={(on) => onSubsystemToggle(sub, on)}
                isMobile={isMobile}
                indent
              />
            </li>
          );
        })}
      </ul>
    </li>
  );
};

const AccessRow: React.FC<{
  label: string;
  count: string;
  on: boolean;
  onChange: (on: boolean) => void;
  isMobile: boolean;
  strong?: boolean;
  indent?: boolean;
  disabledReason?: string;
}> = ({ label, count, on, onChange, isMobile, strong, indent, disabledReason }) => (
  <label className="access-row" data-indent={indent || undefined} data-inactive={disabledReason ? true : undefined}>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: strong ? 'var(--text-base)' : 'var(--text-sm)', fontWeight: strong ? 600 : 400, color: 'var(--text-primary)' }}>
        {label}
      </span>
      {isMobile && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{disabledReason || count}</span>}
    </span>
    {!isMobile && (
      <span style={{ width: '8rem', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{disabledReason || count}</span>
    )}
    <span style={{ width: '1.75rem', fontSize: 'var(--text-xs)', fontWeight: 500, color: on ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'end' }} aria-hidden="true">
      {on ? 'On' : 'Off'}
    </span>
    <input
      type="checkbox"
      role="switch"
      className="switch"
      checked={on}
      disabled={!!disabledReason}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={`${label} access`}
    />
  </label>
);
