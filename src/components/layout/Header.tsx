import React from 'react';
import {
  MenuIcon,
  SettingsIcon,
  SparklesIcon,
  PaletteIcon,
} from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_MODELS, DEFAULT_PERSONAS } from '../../constants/defaults';
import type { ThemeMode } from '../../types';

export const Header: React.FC = () => {
  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);

  const preferences = useSettingsStore((s) => s.preferences);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const openSettings = useSettingsStore((s) => s.openSettings);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const activeModel = DEFAULT_MODELS.find((m) => m.id === aiConfig.activeModelId) || DEFAULT_MODELS[0];
  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === aiConfig.activePersonaId) || DEFAULT_PERSONAS[0];

  const cycleTheme = () => {
    const themes: ThemeMode[] = ['egsa-cosmic', 'dark', 'light', 'cyberpunk'];
    const currentIndex = themes.indexOf(preferences.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <header
      className="glass-panel"
      style={{
        height: 'var(--header-height)',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-glass)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left Section: Sidebar Toggle & Session Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Open navigation sidebar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <MenuIcon size={18} />
          </button>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {currentSession ? currentSession.title : 'EgSA Space AI Chat'}
            </h1>

            {/* Live Engine Status Indicator */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.68rem',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                background: isStreaming ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                color: isStreaming ? 'var(--accent-primary)' : 'var(--success)',
                border: `1px solid ${isStreaming ? 'var(--accent-primary)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isStreaming ? 'var(--accent-primary)' : 'var(--success)',
                  display: 'inline-block',
                  animation: isStreaming ? 'streamBlink 0.8s infinite' : 'none',
                }}
              />
              {isStreaming ? 'Streaming' : 'Ready'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Persona: <strong style={{ color: 'var(--text-secondary)' }}>{activePersona.name}</strong>
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Model: <strong style={{ color: 'var(--text-secondary)' }}>{activeModel.name}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Customization Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        {/* Quick Model Selector Button */}
        <button
          onClick={() => openSettings('model')}
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Switch active AI model or adjust parameters"
        >
          <SparklesIcon size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>{activeModel.name}</span>
        </button>

        {/* Quick Theme Cycle Button */}
        <button
          onClick={cycleTheme}
          className="glass-panel"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          title={`Cycle theme (current: ${preferences.theme})`}
        >
          <PaletteIcon size={17} />
        </button>

        {/* Full Settings Modal Trigger */}
        <button
          onClick={() => openSettings('appearance')}
          className="glass-panel"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Open Customization & Configuration"
        >
          <SettingsIcon size={17} />
        </button>
      </div>
    </header>
  );
};
