import React, { useState } from 'react';
import {
  SquarePenIcon,
  TrashIcon,
  SearchIcon,
  SettingsIcon,
  DownloadIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
} from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DeleteChatModal } from '../chat/DeleteChatModal';
import { Logo } from '../ui/Logo';
import { useIsMobile } from '../../hooks/useMediaQuery';

export const Sidebar: React.FC = () => {
  const isMobile = useIsMobile(768);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);

  const createNewSession = useChatStore((s) => s.createNewSession);
  const selectSession = useChatStore((s) => s.selectSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const renameSession = useChatStore((s) => s.renameSession);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const exportConversation = useChatStore((s) => s.exportConversation);

  const openSettings = useSettingsStore((s) => s.openSettings);
  const preferences = useSettingsStore((s) => s.preferences);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const isDarkMode =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleCreateNew = () => {
    createNewSession();
    if (isMobile) {
      toggleSidebar();
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Dimmed glass backdrop on mobile screens */}
      {isMobile && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 40,
            animation: 'fadeInOverlay 0.2s ease-out',
          }}
        />
      )}

      <aside
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? 'min(300px, 84vw)' : 'var(--sidebar-width)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--hairline)',
          backgroundColor: 'var(--bg-sidebar)',
          flexShrink: 0,
          zIndex: isMobile ? 50 : 20,
          boxShadow: isMobile ? 'var(--shadow-modal)' : 'none',
          animation: isMobile ? 'slideDrawerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          userSelect: 'none',
          paddingBottom: isMobile ? 'var(--safe-area-bottom)' : 0,
        }}
      >
        {/* macOS Sidebar Header Toolbar */}
        <div
          style={{
            height: 'var(--header-height)',
            padding: '0 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--hairline)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
            <Logo size="sm" style={{ height: '24px', flexShrink: 0 }} />
            <div>
              <h2
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                EgSA Intelligence
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {/* New Chat Action */}
            <button
              onClick={handleCreateNew}
              className="apple-button"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-secondary)',
              }}
              title="New Conversation (Cmd+N)"
            >
              <SquarePenIcon size={16} />
            </button>

            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="apple-button"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-secondary)',
              }}
              title="Collapse Sidebar"
            >
              <PanelLeftIcon size={16} />
            </button>
          </div>
        </div>

      {/* Search Input Field */}
      <div style={{ padding: '0.65rem 0.85rem 0.45rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid transparent',
            transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
          }}
        >
          <SearchIcon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            className="borderless-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.35rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '0.4rem 0.5rem 0.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Recent
        </div>

        {filteredSessions.length === 0 ? (
          <div
            style={{
              padding: '1.5rem 0.75rem',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            No conversations found
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingSessionId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.42rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  <MessageSquareIcon
                    size={14}
                    style={{
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      autoFocus
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveRename(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.id);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 'var(--text-xs)',
                        padding: '0.1rem 0.3rem',
                        width: '90%',
                        backgroundColor: 'var(--bg-canvas)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--accent-primary)',
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => handleStartRename(session.id, session.title, e)}
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: isActive ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                      title="Double-click to rename"
                    >
                      {session.title}
                    </span>
                  )}
                </div>

                {/* Subtle Hover Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    opacity: isActive ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportConversation(session.id, 'markdown');
                    }}
                    title="Export Markdown"
                    className="apple-button"
                    style={{
                      padding: '0.15rem',
                      width: '20px',
                      height: '20px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <DownloadIcon size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete({ id: session.id, title: session.title });
                    }}
                    title="Delete Conversation"
                    className="apple-button"
                    style={{
                      padding: '0.15rem',
                      width: '20px',
                      height: '20px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* macOS Sidebar Footer */}
      <div
        style={{
          padding: '0.55rem 0.85rem',
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            openSettings();
            if (isMobile) toggleSidebar();
          }}
          className="apple-button"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            padding: '0.35rem 0.5rem',
            gap: '0.45rem',
          }}
          title="Settings"
        >
          <SettingsIcon size={14} />
          <span>Settings</span>
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="apple-button"
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-secondary)',
          }}
          title={isDarkMode ? 'Switch to Light Appearance' : 'Switch to Dark Appearance'}
        >
          {isDarkMode ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>
      </div>

      {/* Verification Modal for Chat Deletion */}
      <DeleteChatModal
        isOpen={sessionToDelete !== null}
        chatTitle={sessionToDelete?.title || ''}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
    </>
  );
};
