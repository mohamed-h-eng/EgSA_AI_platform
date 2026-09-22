import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, StopCircleIcon, AlignLeftIcon, AlignRightIcon } from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_PERSONAS } from '../../constants/defaults';
import type { TextDirection } from '../../types';
import { useDraft } from '../../utils/drafts';
import { AnswerStatusDock } from './AnswerStatusDock';
import { useChatAnswerStage } from '../../hooks/useAnswerStage';
import { EDIT_LAST_MESSAGE_EVENT } from '../../utils/keyboard';

export const ChatInput: React.FC = () => {
  // Unsent text is kept per conversation (PRODUCTIVITY_UX_PLAN §4).
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const [input, setInput] = useDraft(activeSessionId);
  const answerStage = useChatAnswerStage();
  const openSettings = useSettingsStore((s) => s.openSettings);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Publish the composer's real height (fade + status dock + input, which grows with the text) so
  // the message list's end padding and the scroll-to-latest button stay clear of it.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const root = document.documentElement.style;
    const ro = new ResizeObserver(() => root.setProperty('--chat-composer-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.removeProperty('--chat-composer-h');
    };
  }, []);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);

  const [directionOverride, setDirectionOverride] = useState<TextDirection | null>(null);
  const inputDirection: TextDirection = directionOverride ?? (preferences.textDirection || 'auto');

  const toggleInputDirection = () => {
    const next: TextDirection =
      inputDirection === 'auto' ? 'ltr' : inputDirection === 'ltr' ? 'rtl' : 'auto';
    setDirectionOverride(next);
  };

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
  }, [setInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ↑ in an empty box edits your last message (PRODUCTIVITY_UX_PLAN §1).
    if (e.key === 'ArrowUp' && !input && !isStreaming && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent(EDIT_LAST_MESSAGE_EVENT));
      return;
    }
    if (preferences.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <div
      ref={composerRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // Top padding = fade zone (--composer-fade) + the status dock's row. Messages fade out in the
        // zone and the astronaut + status sit on a solid background, never over text.
        padding: 'calc(var(--composer-fade) + 2.75rem) clamp(0.5rem, 3vw, 1.25rem) calc(0.75rem + var(--safe-area-bottom))',
        background: 'linear-gradient(to bottom, transparent 0, var(--bg-primary) var(--composer-fade))',
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
          position: 'relative',
        }}
      >
        <AnswerStatusDock stage={answerStage} onOpen={() => openSettings('model')} />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.45rem',
            backgroundColor: 'var(--bg-glass-heavy)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid var(--hairline)',
            borderRadius: '26px',
            padding: '0.38rem 0.48rem 0.38rem clamp(0.75rem, 2.5vw, 1.15rem)',
            boxShadow: 'var(--shadow-md)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
        >
          {/* Multiline auto-expanding textarea */}
          <textarea
            ref={textareaRef}
            data-composer
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activePersona.name}...`}
            rows={1}
            dir={inputDirection}
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
              unicodeBidi: 'plaintext',
              textAlign: 'start',
            }}
          />

          {/* Text Direction Indicator & Quick Toggle */}
          <button
            type="button"
            onClick={toggleInputDirection}
            style={{
              height: '28px',
              padding: '0 0.45rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              color: inputDirection !== 'auto' ? 'var(--accent-primary)' : 'var(--text-muted)',
              backgroundColor: inputDirection !== 'auto' ? 'var(--accent-surface)' : 'transparent',
              border: inputDirection !== 'auto' ? '1px solid var(--accent-surface)' : '1px solid transparent',
              fontSize: '0.6875rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              marginBottom: '3px',
              transition: 'all var(--transition-fast)',
            }}
            title={`Prompt text direction: ${inputDirection.toUpperCase()}. Click to cycle Auto, LTR, RTL.`}
          >
            {inputDirection === 'ltr' ? <AlignLeftIcon size={13} /> : <AlignRightIcon size={13} />}
            <span>{inputDirection === 'auto' ? 'Auto' : inputDirection.toUpperCase()}</span>
          </button>

          {/* Action Button: Send or Stop */}
          {isStreaming ? (
            <button
              onClick={stopGeneration}
              style={{
                width: '34px',
                height: '34px',
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
              <StopCircleIcon size={19} />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!hasText}
              style={{
                width: '34px',
                height: '34px',
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
