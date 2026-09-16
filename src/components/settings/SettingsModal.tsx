import React, { useState } from 'react';
import {
  XIcon,
  PaletteIcon,
  SparklesIcon,
  SlidersIcon,
  RocketIcon,
  CheckIcon,
} from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_MODELS, DEFAULT_PERSONAS } from '../../constants/defaults';
import type { ThemeMode, FontSizeOption, ChatDensity, BubbleStyle } from '../../types';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const activeSettingsTab = useSettingsStore((s) => s.activeSettingsTab);
  const preferences = useSettingsStore((s) => s.preferences);
  const aiConfig = useSettingsStore((s) => s.aiConfig);

  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setChatDensity = useSettingsStore((s) => s.setChatDensity);
  const setBubbleStyle = useSettingsStore((s) => s.setBubbleStyle);
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  const setModel = useSettingsStore((s) => s.setModel);
  const setPersona = useSettingsStore((s) => s.setPersona);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const setMaxTokens = useSettingsStore((s) => s.setMaxTokens);
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  const [testApiStatus, setTestApiStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  if (!isSettingsOpen) return null;

  const ACCENT_SWATCHES = [
    { name: 'Cosmic Cyan', color: '#38bdf8' },
    { name: 'Deep Indigo', color: '#6366f1' },
    { name: 'Emerald Orbit', color: '#10b981' },
    { name: 'Solar Amber', color: '#f59e0b' },
    { name: 'Supernova Rose', color: '#f43f5e' },
    { name: 'Violet Nebula', color: '#a855f7' },
  ];

  const THEMES: Array<{ id: ThemeMode; name: string; desc: string }> = [
    { id: 'egsa-cosmic', name: 'EgSA Cosmic', desc: 'Space-grade deep navy with cyan glow' },
    { id: 'dark', name: 'Minimal Dark', desc: 'Sleek OLED monochrome black' },
    { id: 'light', name: 'Clean Light', desc: 'Crisp high-readability daylight theme' },
    { id: 'cyberpunk', name: 'Neon Cyberpunk', desc: 'Vibrant neon pink and cyber blue' },
  ];

  const handleTestEndpoint = async () => {
    if (!aiConfig.customEndpointUrl) return;
    setTestApiStatus('testing');
    try {
      const res = await fetch(aiConfig.customEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.apiKey ? { Authorization: `Bearer ${aiConfig.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: aiConfig.activeModelId,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        setTestApiStatus('success');
      } else {
        setTestApiStatus('failed');
      }
    } catch {
      setTestApiStatus('failed');
    }
    setTimeout(() => setTestApiStatus('idle'), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={closeSettings}
    >
      <div
        className="glass-panel-heavy"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '88vh',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-highlight)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <SlidersIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Customization & Configuration</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Fine-tune appearance, models, personas, and pluggable endpoints
              </p>
            </div>
          </div>

          <button
            onClick={closeSettings}
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            padding: '0 1rem',
          }}
        >
          <TabButton
            active={activeSettingsTab === 'appearance'}
            onClick={() => openSettings('appearance')}
            icon={<PaletteIcon size={15} />}
            label="Appearance"
          />
          <TabButton
            active={activeSettingsTab === 'model'}
            onClick={() => openSettings('model')}
            icon={<SparklesIcon size={15} />}
            label="AI & Parameters"
          />
          <TabButton
            active={activeSettingsTab === 'personas'}
            onClick={() => openSettings('personas')}
            icon={<RocketIcon size={15} />}
            label="Personas"
          />
          <TabButton
            active={activeSettingsTab === 'api'}
            onClick={() => openSettings('api')}
            icon={<SlidersIcon size={15} />}
            label="Endpoints & API"
          />
        </div>

        {/* Modal Tab Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: APPEARANCE */}
          {activeSettingsTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Theme Selection */}
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.65rem' }}>
                  Theme Preset
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'left',
                        background: preferences.theme === th.id ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                        border: `1px solid ${preferences.theme === th.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                          {th.name}
                        </span>
                        {preferences.theme === th.id && <CheckIcon size={14} style={{ color: 'var(--accent-primary)' }} />}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{th.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Swatches */}
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.65rem' }}>
                  Primary Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {ACCENT_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => setAccentColor(swatch.color)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${preferences.customAccentColor === swatch.color ? swatch.color : 'var(--border-subtle)'}`,
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: swatch.color,
                          display: 'inline-block',
                        }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size, Bubble Style, Chat Density */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Font Size
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['sm', 'md', 'lg'] as FontSizeOption[]).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-xs)',
                          background: preferences.fontSize === sz ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                          border: `1px solid ${preferences.fontSize === sz ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          fontSize: 'var(--text-xs)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Bubble Appearance
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['modern', 'bordered', 'minimal'] as BubbleStyle[]).map((bs) => (
                      <button
                        key={bs}
                        onClick={() => setBubbleStyle(bs)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-xs)',
                          background: preferences.bubbleStyle === bs ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                          border: `1px solid ${preferences.bubbleStyle === bs ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          fontSize: 'var(--text-xs)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {bs}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Layout Density
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['comfortable', 'compact'] as ChatDensity[]).map((cd) => (
                      <button
                        key={cd}
                        onClick={() => setChatDensity(cd)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-xs)',
                          background: preferences.chatDensity === cd ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                          border: `1px solid ${preferences.chatDensity === cd ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          fontSize: 'var(--text-xs)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {cd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Density & Behavior */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Interaction Preferences</label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Send on Enter</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Press Shift+Enter for newline</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.sendOnEnter}
                    onChange={(e) => setPreferences({ sendOnEnter: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Auto-scroll on stream</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Follow incoming tokens automatically</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.autoScroll}
                    onChange={(e) => setPreferences({ autoScroll: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI & PARAMETERS */}
          {activeSettingsTab === 'model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Model Selector */}
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.65rem' }}>
                  Select Primary AI Model
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {DEFAULT_MODELS.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setModel(model.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: aiConfig.activeModelId === model.id ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                        border: `1px solid ${aiConfig.activeModelId === model.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{model.name}</span>
                          {model.badge && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-xs)',
                                background: 'var(--accent-primary)',
                                color: 'var(--text-inverse)',
                                fontWeight: 700,
                              }}
                            >
                              {model.badge}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{model.contextWindow}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {model.description}
                        </p>
                      </div>

                      {aiConfig.activeModelId === model.id && (
                        <CheckIcon size={18} style={{ color: 'var(--accent-primary)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Temperature</label>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {aiConfig.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={aiConfig.temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>0.0 (Precise, Deterministic)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (Creative, Exploratory)</span>
                </div>
              </div>

              {/* Max Tokens Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Max Generation Length (Tokens)</label>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {aiConfig.maxTokens}
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={aiConfig.maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* System Prompt Customization */}
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  System Prompt Directive
                </label>
                <textarea
                  value={aiConfig.systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="Define custom behaviors, roles, or domain constraints..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAS */}
          {activeSettingsTab === 'personas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {DEFAULT_PERSONAS.map((persona) => {
                const isActive = aiConfig.activePersonaId === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => setPersona(persona.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{persona.avatar}</span>
                        <div>
                          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{persona.name}</h4>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {persona.category}
                          </span>
                        </div>
                      </div>
                      {isActive && <CheckIcon size={16} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {persona.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: API & ENDPOINTS */}
          {activeSettingsTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Execution Engine Provider
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setAIConfig({ providerType: 'mock' })}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: aiConfig.providerType === 'mock' ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                      border: `1px solid ${aiConfig.providerType === 'mock' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Simulated Engine (Local Mock)
                  </button>
                  <button
                    onClick={() => setAIConfig({ providerType: 'openai-compatible' })}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: aiConfig.providerType !== 'mock' ? 'var(--accent-surface)' : 'var(--bg-tertiary)',
                      border: `1px solid ${aiConfig.providerType !== 'mock' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Custom API Endpoint / SSE
                  </button>
                </div>
              </div>

              {aiConfig.providerType !== 'mock' && (
                <>
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={aiConfig.customEndpointUrl || ''}
                      onChange={(e) => setAIConfig({ customEndpointUrl: e.target.value })}
                      placeholder="e.g. https://api.egsa.gov.eg/v1/chat/completions or http://localhost:11434/v1/chat/completions"
                      style={{ width: '100%', padding: '0.55rem', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      API Key (Bearer Token)
                    </label>
                    <input
                      type="password"
                      value={aiConfig.apiKey || ''}
                      onChange={(e) => setAIConfig({ apiKey: e.target.value })}
                      placeholder="Enter optional Bearer API key..."
                      style={{ width: '100%', padding: '0.55rem', fontSize: 'var(--text-xs)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <button
                      onClick={handleTestEndpoint}
                      disabled={testApiStatus === 'testing' || !aiConfig.customEndpointUrl}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-surface)',
                        color: 'var(--accent-primary)',
                        border: '1px solid var(--accent-glow)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                      }}
                    >
                      {testApiStatus === 'testing' ? 'Testing Connection...' : 'Test Endpoint Connection'}
                    </button>
                    {testApiStatus === 'success' && <span style={{ color: 'var(--success)', fontSize: 'var(--text-xs)' }}>✅ Connection valid!</span>}
                    {testApiStatus === 'failed' && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>❌ Connection failed</span>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={resetToDefaults}
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--danger)',
              textDecoration: 'underline',
            }}
          >
            Reset All Customizations to Defaults
          </button>

          <button
            onClick={closeSettings}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.75rem 1rem',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      borderBottom: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
      background: 'transparent',
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);
