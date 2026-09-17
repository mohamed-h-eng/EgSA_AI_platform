import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, StopCircleIcon } from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_PERSONAS } from '../../constants/defaults';

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);

  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  // Auto-focus chat input when user starts typing anywhere on the page,
  // including Space, Enter, and Backspace, unless focusing on another input.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Skip if modifier keys are pressed (shortcuts like Ctrl+C, Cmd+V, Alt+Tab, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      // 2. If already focused on chat textarea, let native input handling proceed
      if (document.activeElement === textarea) {
        return;
      }

      // 3. Check active element to avoid hijacking other user inputs
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          activeEl.isContentEditable ||
          activeEl.getAttribute('role') === 'textbox' ||
          activeEl.getAttribute('role') === 'combobox'
        ) {
          return;
        }

        // Do not hijack if inside an open dialog or modal
        if (activeEl.closest('[role="dialog"]') || document.querySelector('[role="dialog"]')) {
          return;
        }

        // If user is focused on a button and presses Enter or Space, preserve native button activation
        if (tagName === 'button' && (e.key === 'Enter' || e.key === ' ')) {
          return;
        }
      }

      // 4. Do not hijack if settings modal is open in global state
      if (useSettingsStore.getState().isSettingsOpen) {
        return;
      }

      // 5. Handle Space key
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        textarea.focus();
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        const prev = textarea.value;
        const nextVal = prev.slice(0, start) + ' ' + prev.slice(end);
        setInput(nextVal);
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        });
        return;
      }

      // 6. Handle Backspace key
      if (e.key === 'Backspace') {
        e.preventDefault();
        textarea.focus();
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        const prev = textarea.value;
        if (start !== end) {
          const nextVal = prev.slice(0, start) + prev.slice(end);
          setInput(nextVal);
          requestAnimationFrame(() => {
            textarea.setSelectionRange(start, start);
          });
        } else if (start > 0) {
          const nextVal = prev.slice(0, start - 1) + prev.slice(start);
          setInput(nextVal);
          requestAnimationFrame(() => {
            textarea.setSelectionRange(start - 1, start - 1);
          });
        }
        return;
      }

      // 7. Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        textarea.focus();
        const prefs = useSettingsStore.getState().preferences;
        const streaming = useChatStore.getState().isStreaming;
        if (prefs.sendOnEnter && !e.shiftKey && textarea.value.trim().length > 0 && !streaming) {
          handleSubmitRef.current();
        } else if (e.shiftKey || !prefs.sendOnEnter) {
          const start = textarea.selectionStart ?? textarea.value.length;
          const end = textarea.selectionEnd ?? textarea.value.length;
          const prev = textarea.value;
          const nextVal = prev.slice(0, start) + '\n' + prev.slice(end);
          setInput(nextVal);
          requestAnimationFrame(() => {
            textarea.setSelectionRange(start + 1, start + 1);
          });
        }
        return;
      }

      // 8. Handle any single printable character key
      if (e.key.length === 1) {
        textarea.focus();
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (preferences.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.75rem 1.25rem 1.25rem',
        background: 'linear-gradient(to top, var(--bg-primary) 70%, transparent 100%)',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--content-max-width)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-glass-heavy)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid var(--hairline)',
            borderRadius: '24px',
            padding: '0.45rem 0.55rem 0.45rem 1.15rem',
            boxShadow: 'var(--shadow-md)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
        >
          {/* Multiline auto-expanding textarea */}
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activePersona.name}...`}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              resize: 'none',
              outline: 'none',
              boxShadow: 'none',
              fontSize: 'var(--chat-font-size, var(--text-base))',
              color: 'var(--text-primary)',
              padding: '0.35rem 0',
              maxHeight: '160px',
              minHeight: '26px',
              lineHeight: 1.5,
              fontFamily: 'inherit',
            }}
          />

          {/* Action Button: Send or Stop */}
          {isStreaming ? (
            <button
              onClick={stopGeneration}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), opacity var(--transition-fast)',
              }}
              title="Stop Generation"
            >
              <StopCircleIcon size={18} />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!hasText}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: hasText ? 'var(--accent-primary)' : 'var(--bg-hover)',
                color: hasText ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: hasText ? 'pointer' : 'default',
                transition: 'background-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
                transform: hasText ? 'scale(1)' : 'scale(0.96)',
              }}
              title="Send Message"
            >
              <ArrowUpIcon size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
