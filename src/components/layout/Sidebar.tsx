import React, { useState } from 'react';
import {
  SquarePenIcon,
  TrashIcon,
  SearchIcon,
  SettingsIcon,
  DownloadIcon,
  MessageSquareIcon,
  BookOpenIcon,
<<<<<<< HEAD
  PinIcon,
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
  DatabaseIcon,
} from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
<<<<<<< HEAD
import { groupByDate } from '../../utils/dateGroups';
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
import { useNavigationStore, type AppView } from '../../stores/navigationStore';
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
  const togglePinSession = useChatStore((s) => s.togglePinSession);

  const openSettings = useSettingsStore((s) => s.openSettings);
  const preferences = useSettingsStore((s) => s.preferences);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const openDocumentManager = useDocumentStore((s) => s.openManager);

  const activeView = useNavigationStore((s) => s.activeView);
  const setView = useNavigationStore((s) => s.setView);
  const isKnowledgeView = activeView === 'knowledge';

  const threads = useKnowledgeStore((s) => s.threads);
  const activeThreadId = useKnowledgeStore((s) => s.activeThreadId);
  const createThread = useKnowledgeStore((s) => s.createThread);
  const selectThread = useKnowledgeStore((s) => s.selectThread);
  const renameThread = useKnowledgeStore((s) => s.renameThread);
  const deleteThread = useKnowledgeStore((s) => s.deleteThread);
  const exportThread = useKnowledgeStore((s) => s.exportThread);
<<<<<<< HEAD
  const togglePinThread = useKnowledgeStore((s) => s.togglePinThread);
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
  const documentCount = useDocumentStore((s) => s.documents.length);

  const isDarkMode =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  // The history list follows the active page: chat sessions, or Knowledge Copilot threads.
  const handleNavigate = (view: AppView) => {
    setView(view);
    if (isMobile) toggleSidebar();
  };

  const handleSelectSession = (id: string) => {
    if (isKnowledgeView) selectThread(id);
    else selectSession(id);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleCreateNew = () => {
    if (isKnowledgeView) createThread();
    else createNewSession();
    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleExport = (id: string) => (isKnowledgeView ? exportThread(id) : exportConversation(id, 'markdown'));
  const handleDelete = (id: string) => (isKnowledgeView ? deleteThread(id) : deleteSession(id));
<<<<<<< HEAD
  const handleTogglePin = (id: string) => (isKnowledgeView ? togglePinThread(id) : togglePinSession(id));

  const activeItemId = isKnowledgeView ? activeThreadId : activeSessionId;
  const listItems = isKnowledgeView
    ? threads.map((t) => ({ id: t.id, title: t.title, pinned: !!t.pinned, updatedAt: t.updatedAt, text: t.turns.map((u) => `${u.question} ${u.answer}`).join(' ') }))
    : sessions.map((s) => ({ id: s.id, title: s.title, pinned: !!s.pinned, updatedAt: s.updatedAt, text: s.messages.map((m) => m.content).join(' ') }));
  const query = searchQuery.toLowerCase();
  const filteredSessions = listItems.filter((item) => item.title.toLowerCase().includes(query) || item.text.toLowerCase().includes(query));

  // Pinned first, then by date (Today, Yesterday, …). While searching, one flat list of results.
  const pinnedItems = filteredSessions.filter((i) => i.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const sections: Array<{ label: string; items: typeof filteredSessions }> = searchQuery.trim()
    ? [{ label: 'Results', items: [...filteredSessions].sort((a, b) => b.updatedAt - a.updatedAt) }]
    : [
        ...(pinnedItems.length > 0 ? [{ label: 'Pinned', items: pinnedItems }] : []),
        ...groupByDate(
          filteredSessions.filter((i) => !i.pinned),
          (i) => i.updatedAt
        ).map((g) => ({ label: g.group, items: g.items })),
      ];
=======

  const activeItemId = isKnowledgeView ? activeThreadId : activeSessionId;
  const listItems = isKnowledgeView
    ? threads.map((t) => ({ id: t.id, title: t.title, text: t.turns.map((u) => `${u.question} ${u.answer}`).join(' ') }))
    : sessions.map((s) => ({ id: s.id, title: s.title, text: s.messages.map((m) => m.content).join(' ') }));
  const query = searchQuery.toLowerCase();
  const filteredSessions = listItems.filter((item) => item.title.toLowerCase().includes(query) || item.text.toLowerCase().includes(query));
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      if (isKnowledgeView) renameThread(id, editingTitle.trim());
      else renameSession(id, editingTitle.trim());
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
              title={isKnowledgeView ? 'New Research' : 'New Conversation (Cmd+N)'}
              aria-label={isKnowledgeView ? 'New research' : 'New conversation'}
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

      {/* Primary navigation: general chat vs. Knowledge Copilot */}
      <nav aria-label="Primary" style={{ padding: 'var(--space-2) var(--space-2) var(--space-1)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button type="button" className="nav-item" aria-current={!isKnowledgeView ? 'page' : undefined} onClick={() => handleNavigate('chat')}>
          <MessageSquareIcon size={15} />
          Chat
        </button>
        <button type="button" className="nav-item" aria-current={isKnowledgeView ? 'page' : undefined} onClick={() => handleNavigate('knowledge')}>
          <BookOpenIcon size={15} />
          Knowledge Copilot
        </button>
      </nav>

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
<<<<<<< HEAD
=======
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
          {isKnowledgeView ? 'Research' : 'Recent'}
        </div>

>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
        {filteredSessions.length === 0 ? (
          <div
            style={{
              padding: '1.5rem 0.75rem',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {isKnowledgeView ? (searchQuery ? 'No research found' : 'No research yet') : 'No conversations found'}
          </div>
        ) : (
<<<<<<< HEAD
          sections.map((section) => (
            <div key={section.label} role="group" aria-label={section.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div className="sidebar-group-label">{section.label}</div>
              {section.items.map((session) => {
=======
          filteredSessions.map((session) => {
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
            const isActive = session.id === activeItemId;
            const isEditing = editingSessionId === session.id;

            return (
              <div
                key={session.id}
                className="sidebar-row"
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => handleSelectSession(session.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSelectSession(session.id);
                  }
                }}
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
                  {isKnowledgeView ? (
                    <BookOpenIcon
                      size={14}
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <MessageSquareIcon
                      size={14}
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                  )}

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
<<<<<<< HEAD
                      handleTogglePin(session.id);
                    }}
                    title={session.pinned ? 'Unpin' : 'Pin to top'}
                    aria-label={session.pinned ? `Unpin ${session.title}` : `Pin ${session.title}`}
                    aria-pressed={session.pinned}
                    className="apple-button"
                    style={{
                      padding: '0.15rem',
                      width: '20px',
                      height: '20px',
                      color: session.pinned ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    <PinIcon size={12} style={{ fill: session.pinned ? 'currentColor' : 'none' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
=======
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
                      handleExport(session.id);
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
              })}
            </div>
          ))
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          {/* Knowledge Base: document upload/management entry point (KB-013, ADM-003) */}
          <button
            onClick={() => {
              openDocumentManager();
              if (isMobile) toggleSidebar();
            }}
            className="apple-button"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              position: 'relative',
            }}
<<<<<<< HEAD
            title={`Administration: documents and service health (${documentCount} document${documentCount === 1 ? '' : 's'})`}
=======
            title={`Knowledge Base (${documentCount} document${documentCount === 1 ? '' : 's'})`}
>>>>>>> 1a9f2bb6deaf13c617293d2cfbcf636048d420af
          >
            <DatabaseIcon size={14} />
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
      </div>

      {/* Verification Modal for Chat Deletion */}
      <DeleteChatModal
        isOpen={sessionToDelete !== null}
        chatTitle={sessionToDelete?.title || ''}
        onConfirm={() => {
          if (sessionToDelete) {
            handleDelete(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
    </>
  );
};
