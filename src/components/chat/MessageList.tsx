import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MessageItem } from './MessageItem';
import { DEFAULT_PERSONAS } from '../../constants/defaults';
import { ArrowDownIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';

export const MessageList: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isUserBrowsingUpRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const touchStartYRef = useRef(0);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = useMemo(() => currentSession?.messages || [], [currentSession?.messages]);
  const prevMessageCountRef = useRef(messages.length);

  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  const autoScrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    isProgrammaticScrollRef.current = true;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    if (isProgrammaticScrollRef.current) {
      lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const delta = scrollTop - lastScrollTopRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // Update last known scrollTop
    lastScrollTopRef.current = scrollTop;

    // User scrolled UP (even by a fraction of a pixel) -> detach IMMEDIATELY!
    if (delta < -0.5) {
      isUserBrowsingUpRef.current = true;
      setShowScrollBottomBtn(true);
      return;
    }

    // User intentionally scrolled back DOWN to the very bottom:
    if (delta >= 0 && distanceFromBottom <= 10) {
      isUserBrowsingUpRef.current = false;
      setShowScrollBottomBtn(false);
    } else if (distanceFromBottom > 30) {
      setShowScrollBottomBtn(true);
    }
  };

  // Immediate detachment on upward wheel scroll (zero latency)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      isProgrammaticScrollRef.current = false;
      isUserBrowsingUpRef.current = true;
      setShowScrollBottomBtn(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const currentY = e.touches[0].clientY;
      // Dragging down moves content down, i.e. scrolling up to older messages
      if (currentY - touchStartYRef.current > 6) {
        isProgrammaticScrollRef.current = false;
        isUserBrowsingUpRef.current = true;
        setShowScrollBottomBtn(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) {
      isProgrammaticScrollRef.current = false;
      isUserBrowsingUpRef.current = true;
      setShowScrollBottomBtn(true);
    }
  };

  // Reset scroll lock when a new message is appended (e.g. user sends inquiry)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      isUserBrowsingUpRef.current = false;
      requestAnimationFrame(() => {
        setShowScrollBottomBtn(false);
        autoScrollToBottom();
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Reset scroll position when switching sessions
  useEffect(() => {
    isUserBrowsingUpRef.current = false;
    requestAnimationFrame(() => {
      setShowScrollBottomBtn(false);
      autoScrollToBottom();
    });
  }, [activeSessionId]);

  // Auto-scroll during streaming ONLY when user is at the bottom
  useEffect(() => {
    if (isUserBrowsingUpRef.current) return;

    if (preferences.autoScroll) {
      autoScrollToBottom();
    }
  }, [messages, isStreaming, preferences.autoScroll]);

  const scrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    isProgrammaticScrollRef.current = true;
    isUserBrowsingUpRef.current = false;
    setShowScrollBottomBtn(false);
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      if (scrollContainerRef.current) {
        lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
      }
    }, 450);
  };

  const isEmptySession = messages.length === 0;

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.5rem 6rem',
          outline: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--content-max-width)',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Apple HIG Welcome Hero if conversation has no messages */}
          {isEmptySession ? (
            <div
              style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 1rem',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              {/* Official EgSA Agency Logo */}
              <div
                style={{
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Logo size="hero" style={{ height: '76px' }} />
              </div>

              <h1
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem',
                }}
              >
                EgSA Intelligence
              </h1>

              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  maxWidth: '480px',
                  lineHeight: 1.5,
                  marginBottom: '2.5rem',
                }}
              >
                Orbital telemetry, mission flight dynamics, and aerospace systems analysis.
              </p>

              {/* Starter Suggestions */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {activePersona.starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    disabled={isStreaming}
                    className="apple-card"
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-muted)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span>{prompt}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: preferences.chatDensity === 'compact' ? '1rem' : '1.75rem',
              }}
            >
              {messages.map((message, index) => {
                const isLatestAssistant =
                  message.role === 'assistant' &&
                  index === messages.length - 1;

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isLatestAssistant={isLatestAssistant}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating "Return to Bottom" Button Centered in Chat Layout */}
      {showScrollBottomBtn && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            pointerEvents: 'none',
            animation: 'slideDown 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <button
            onClick={scrollToBottom}
            className="apple-button"
            style={{
              pointerEvents: 'auto',
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-glass-heavy)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid var(--hairline)',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
            title="Scroll to latest response"
          >
            <ArrowDownIcon size={16} style={{ color: 'var(--accent-primary)' }} />
            {isStreaming && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'inline-block',
                  animation: 'appleCaretBreathe 0.9s infinite',
                }}
              />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
