import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TrashIcon } from '../ui/Icons';

interface DeleteChatModalProps {
  isOpen: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  isOpen,
  chatTitle,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Immediately blur whatever had focus (e.g. ChatInput textarea, sidebar search)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Safely focus the cancel button for clean keyboard navigation
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };

    // Use capture phase so keyboard events don't leak to ChatInput or Header
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999, // Render above all chrome (Header z-30, Sidebar z-20, ChatInput z-20)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        animation: 'fadeIn 0.16s ease-out',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'min(380px, 92vw)',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'clamp(1.2rem, 4vw, 1.6rem) clamp(1rem, 4vw, 1.5rem)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Apple Destructive Badge */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 69, 58, 0.12)',
            border: '1px solid rgba(255, 69, 58, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--danger)',
            marginBottom: '1rem',
          }}
        >
          <TrashIcon size={20} />
        </div>

        <h3
          id="delete-dialog-title"
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            marginBottom: '0.45rem',
          }}
        >
          Delete Conversation?
        </h3>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            marginBottom: '1.5rem',
            wordBreak: 'break-word',
          }}
        >
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>“{chatTitle}”</strong>? This action cannot be undone.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            width: '100%',
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="apple-button"
            style={{
              flex: 1,
              padding: '0.58rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="apple-button"
            style={{
              flex: 1,
              padding: '0.58rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger)',
              border: 'none',
              color: '#ffffff',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 59, 48, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
