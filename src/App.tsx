import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageList } from './components/chat/MessageList';
import { ChatInput } from './components/chat/ChatInput';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSettingsStore } from './stores/settingsStore';

export const App: React.FC = () => {
  const preferences = useSettingsStore((s) => s.preferences);

  // Initialize and synchronize theme tokens on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
    if (preferences.customAccentColor) {
      document.documentElement.style.setProperty('--accent-primary', preferences.customAccentColor);
    }
    const sizeMap = { sm: '14px', md: '15px', lg: '17px' };
    document.documentElement.style.setProperty('--chat-font-size', sizeMap[preferences.fontSize]);
  }, [preferences.theme, preferences.customAccentColor, preferences.fontSize]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Navigation & History Sidebar */}
      <Sidebar />

      {/* Main Mission Workspace */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Header />
        <MessageList />
        <ChatInput />
      </main>

      {/* Customization & Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default App;
