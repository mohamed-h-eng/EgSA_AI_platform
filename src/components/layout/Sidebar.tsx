import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  SearchIcon,
  SettingsIcon,
  DownloadIcon,
  MessageSquareIcon,
  SparklesIcon,
  XIcon
} from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const Sidebar: React.FC = () => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
    <aside
      className="glass-panel"
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
        zIndex: 20,
        transition: 'all var(--transition-normal)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '1.15rem 1rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <SparklesIcon size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '0.02em' }}>
              EgSA Space AI
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Mission Operations v2.0
            </p>
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          style={{
            color: 'var(--text-muted)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-xs)',
          }}
          title="Close sidebar"
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '0.85rem 1rem 0.5rem' }}>
        <button
          onClick={() => createNewSession()}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-surface)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-glow)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-surface)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
        >
          <PlusIcon size={16} />
          <span>New Mission Chat</span>
        </button>
      </div>

      {/* Search Conversations */}
      <div style={{ padding: '0.4rem 1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <SearchIcon size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Sessions List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            padding: '0.25rem 0.45rem',
            fontWeight: 600,
          }}
        >
          Conversations ({filteredSessions.length})
        </div>

        {filteredSessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isEditing = editingSessionId === session.id;

          return (
            <div
              key={session.id}
              onClick={() => selectSession(session.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--accent-surface)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent-glow)' : 'transparent'}`,
                color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden', flex: 1 }}>
                <MessageSquareIcon size={15} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />

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
                      padding: '0.1rem 0.35rem',
                      width: '90%',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => handleStartRename(session.id, session.title, e)}
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title="Double-click to rename"
                  >
                    {session.title}
                  </span>
                )}
              </div>

              {/* Action Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: isActive ? 1 : 0.6 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportConversation(session.id, 'markdown');
                  }}
                  title="Export Markdown"
                  style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                >
                  <DownloadIcon size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Delete chat"
                  style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                >
                  <TrashIcon size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => openSettings()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            padding: '0.35rem 0.5rem',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <SettingsIcon size={16} />
          <span>Customize Platform</span>
        </button>

        <span
          style={{
            fontSize: '0.65rem',
            padding: '0.15rem 0.4rem',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          v2.0
        </span>
      </div>
    </aside>
  );
};
