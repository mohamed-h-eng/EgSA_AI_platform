import React, { useRef } from 'react';
import { XIcon } from './Icons';
import { useUiStore } from '../../stores/uiStore';
import { useDialog } from '../../hooks/useDialog';
import { SHORTCUTS } from '../../hooks/useShortcuts';

// Keyboard shortcuts sheet (PRODUCTIVITY_UX_PLAN §1), opened with "?" or from the account menu.
export const ShortcutsDialog: React.FC = () => {
  const isOpen = useUiStore((s) => s.isShortcutsOpen);
  const close = useUiStore((s) => s.closeShortcuts);
  const ref = useRef<HTMLDivElement>(null);
  useDialog(isOpen, close, ref);

  if (!isOpen) return null;

  return (
    <div className="confirm-backdrop" style={{ position: 'fixed', zIndex: 120 }} onClick={close}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="confirm-card"
        style={{ width: 'min(460px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h3 id="shortcuts-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Keyboard shortcuts
          </h3>
          <button type="button" className="icon-button" onClick={close} aria-label="Close">
            <XIcon size={14} />
          </button>
        </div>
        <dl style={{ margin: 0 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="shortcut-row">
              <dt style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.label}</dt>
              <dd style={{ margin: 0, display: 'inline-flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                {s.keys.map((k, i) => (
                  <kbd key={`${k}-${i}`} className="kbd">
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

// Brief confirmation for keyboard actions that have no visible result (e.g. copy).
export const Toast: React.FC = () => {
  const message = useUiStore((s) => s.toast);
  return (
    <div role="status" aria-live="polite" className="toast" data-visible={message ? 'true' : undefined}>
      {message}
    </div>
  );
};
