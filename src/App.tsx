import React, { useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatPage } from './components/chat/ChatPage';
import { KnowledgeCopilotPage } from './components/knowledge/KnowledgeCopilotPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { DocumentManagerModal } from './components/documents/DocumentManagerModal';
import { DocumentUploadModal } from './components/documents/DocumentUploadModal';
import { useSettingsStore } from './stores/settingsStore';
import { useChatStore } from './stores/chatStore';
import { useNavigationStore } from './stores/navigationStore';
import { LiveAnnouncer } from './components/ui/LiveAnnouncer';
import { ShortcutsDialog, Toast } from './components/ui/ShortcutsDialog';
import { useShortcuts } from './hooks/useShortcuts';

export const App: React.FC = () => {
  const preferences = useSettingsStore((s) => s.preferences);
  const activeView = useNavigationStore((s) => s.activeView);
  const hasInitializedSidebarRef = useRef(false);
  useShortcuts();

  // Auto-close sidebar on mobile devices on initial mount or when screen shrinks
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && !hasInitializedSidebarRef.current) {
        useChatStore.getState().setSidebarOpen(false);
        hasInitializedSidebarRef.current = true;
      }
    };

    if (window.innerWidth < 768) {
      useChatStore.getState().setSidebarOpen(false);
      hasInitializedSidebarRef.current = true;
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and synchronize theme tokens and font size on document element
  useEffect(() => {
    const updateTheme = () => {
      let resolvedTheme = preferences.theme;
      if (resolvedTheme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    updateTheme();

    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [preferences.theme]);

  useEffect(() => {
    const scaleMap: Record<
      string,
      { root: string; chat: string; iconScale: string; headerHeight: string; sidebarWidth: string }
    > = {
      sm: { root: '14px', chat: '13.5px', iconScale: '0.88', headerHeight: '48px', sidebarWidth: '245px' },
      md: { root: '16px', chat: '15px', iconScale: '1.0', headerHeight: '52px', sidebarWidth: '260px' },
      lg: { root: '18px', chat: '17.5px', iconScale: '1.14', headerHeight: '58px', sidebarWidth: '280px' },
    };

    const config = scaleMap[preferences.fontSize] || scaleMap.md;

    // Scale root html font size so all rem tokens in all components scale proportionally
    document.documentElement.style.fontSize = config.root;
    document.documentElement.style.setProperty('--chat-font-size', config.chat);
    document.documentElement.style.setProperty('--icon-scale', config.iconScale);
    document.documentElement.style.setProperty('--header-height', config.headerHeight);
    document.documentElement.style.setProperty('--sidebar-width', config.sidebarWidth);
    document.documentElement.setAttribute('data-font-size', preferences.fontSize);
  }, [preferences.fontSize]);

  useEffect(() => {
    if (preferences.customAccentColor) {
      document.documentElement.style.setProperty('--accent-primary', preferences.customAccentColor);
    } else {
      document.documentElement.style.removeProperty('--accent-primary');
    }
  }, [preferences.customAccentColor]);

  useEffect(() => {
    if (preferences.arabicFont) {
      document.documentElement.setAttribute('data-arabic-font', preferences.arabicFont);
    }
  }, [preferences.arabicFont]);

  useEffect(() => {
    if (preferences.textDirection && preferences.textDirection !== 'auto') {
      document.documentElement.setAttribute('data-text-direction', preferences.textDirection);
    } else {
      document.documentElement.removeAttribute('data-text-direction');
    }
  }, [preferences.textDirection]);


  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      {/* Navigation & History Sidebar */}
      <Sidebar />

      {/* Active page: general chat or Knowledge Copilot (#/chat, #/knowledge) */}
      {activeView === 'knowledge' ? <KnowledgeCopilotPage /> : <ChatPage />}

      {/* Customization & Settings Modal */}
      <SettingsModal />

      {/* Engineering Knowledge Base: document management & upload workflow */}
      <DocumentManagerModal />
      <DocumentUploadModal />

      {/* Screen-reader announcements for answers (starts and short excerpts, never token by token) */}
      <LiveAnnouncer />

      {/* Keyboard shortcuts sheet (?) and confirmations for shortcut actions */}
      <ShortcutsDialog />
      <Toast />
    </div>
  );
};

export default App;
