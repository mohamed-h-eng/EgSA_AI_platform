import React, { useState } from 'react';
import {
  XIcon,
  PaletteIcon,
  SparklesIcon,
  SlidersIcon,
  OrbitIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  AlertCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
} from '../ui/Icons';
import { Logo } from '../ui/Logo';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_MODELS, DEFAULT_PERSONAS, PROVIDER_PRESETS, type ProviderPreset } from '../../constants/defaults';
import { testEndpointConnection, fetchAvailableModels, type ConnectionTestResult } from '../../services/ai/apiProvider';
import type { FontSizeOption, ChatDensity } from '../../types';
import { useIsMobile } from '../../hooks/useMediaQuery';

export const SettingsModal: React.FC = () => {
  const isMobile = useIsMobile(640);
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
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  const setModel = useSettingsStore((s) => s.setModel);
  const setPersona = useSettingsStore((s) => s.setPersona);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const setMaxTokens = useSettingsStore((s) => s.setMaxTokens);
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsFetchError, setModelsFetchError] = useState<string | null>(null);
  const [isManualModelEntry, setIsManualModelEntry] = useState(false);

  if (!isSettingsOpen) return null;

  const APPLE_ACCENTS = [
    { name: 'Blue', color: '#0071e3' },
    { name: 'Purple', color: '#af52de' },
    { name: 'Pink', color: '#ff2d55' },
    { name: 'Orange', color: '#ff9500' },
    { name: 'Green', color: '#34c759' },
    { name: 'Graphite', color: '#8e8e93' },
  ];

  const handleSelectPreset = (preset: ProviderPreset) => {
    setAIConfig({
      providerType: 'custom-api',
      providerPreset: preset.id,
      customEndpointUrl: preset.endpointUrl,
      customModelId: '',
    });
    setTestResult(null);
    setAvailableModels([]);
    setModelsFetchError(null);
    setIsManualModelEntry(false);
  };

  const handleFetchModels = async () => {
    if (!aiConfig.customEndpointUrl?.trim()) return;
    setIsFetchingModels(true);
    setModelsFetchError(null);

    const result = await fetchAvailableModels({
      endpointUrl: aiConfig.customEndpointUrl,
      apiKey: aiConfig.apiKey,
      useProxy: aiConfig.useProxy ?? true,
    });

    setIsFetchingModels(false);

    if (result.ok && result.models.length > 0) {
      setAvailableModels(result.models);
      if (!aiConfig.customModelId || !result.models.includes(aiConfig.customModelId)) {
        setAIConfig({ customModelId: result.models[0] });
      }
      setTestResult(null);
    } else {
      setModelsFetchError(result.error || 'Failed to retrieve models from endpoint.');
    }
  };

  const handleTestEndpoint = async () => {
    if (!aiConfig.customEndpointUrl?.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    const result = await testEndpointConnection({
      endpointUrl: aiConfig.customEndpointUrl,
      apiKey: aiConfig.apiKey,
      modelId: aiConfig.customModelId,
      useProxy: aiConfig.useProxy ?? true,
    });

    setTestResult(result);
    setIsTesting(false);
  };



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
      onClick={closeSettings}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100vw' : '780px',
          height: isMobile ? '100dvh' : '560px',
          maxHeight: isMobile ? '100dvh' : '90vh',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: isMobile ? 'none' : 'var(--shadow-modal)',
          border: isMobile ? 'none' : '1px solid var(--hairline)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* macOS Settings Sidebar (Desktop / Tablet >= 640px) */}
        {!isMobile && (
          <div
            style={{
              width: '210px',
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--hairline)',
              padding: '1rem 0.65rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0.65rem 0.6rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Preferences
              </div>

              <SidebarTabButton
                active={activeSettingsTab === 'appearance'}
                onClick={() => openSettings('appearance')}
                icon={<PaletteIcon size={15} />}
                label="Appearance"
              />
              <SidebarTabButton
                active={activeSettingsTab === 'model'}
                onClick={() => openSettings('model')}
                icon={<SparklesIcon size={15} />}
                label="Intelligence"
              />
              <SidebarTabButton
                active={activeSettingsTab === 'api'}
                onClick={() => openSettings('api')}
                icon={<SlidersIcon size={15} />}
                label="Engine & API"
              />
              <SidebarTabButton
                active={activeSettingsTab === 'personas'}
                onClick={() => openSettings('personas')}
                icon={<OrbitIcon size={15} />}
                label="About EgSA"
              />
            </div>

            <button
              onClick={() => resetToDefaults()}
              className="apple-button"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                justifyContent: 'flex-start',
                padding: '0.45rem 0.65rem',
              }}
            >
              Reset to Defaults
            </button>
          </div>
        )}

        {/* Settings Content Pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: isMobile ? 'calc(0.65rem + var(--safe-area-top)) 1rem 0.65rem' : '0.85rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--hairline)',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {activeSettingsTab === 'appearance' && 'Appearance'}
              {activeSettingsTab === 'model' && 'Intelligence & Models'}
              {activeSettingsTab === 'api' && 'Engine & API Connection'}
              {activeSettingsTab === 'personas' && 'About EgSA Intelligence'}
            </h3>

            <button
              onClick={closeSettings}
              className="apple-button"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                borderRadius: '50%',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
              }}
              title="Close (Esc)"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Top Tabs Segment Strip for Mobile Viewports (< 640px) */}
          {isMobile && (
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid var(--hairline)',
                backgroundColor: 'var(--bg-secondary)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                flexShrink: 0,
              }}
            >
              <MobileTabPill
                active={activeSettingsTab === 'appearance'}
                onClick={() => openSettings('appearance')}
                icon={<PaletteIcon size={13} />}
                label="Appearance"
              />
              <MobileTabPill
                active={activeSettingsTab === 'model'}
                onClick={() => openSettings('model')}
                icon={<SparklesIcon size={13} />}
                label="Intelligence"
              />
              <MobileTabPill
                active={activeSettingsTab === 'api'}
                onClick={() => openSettings('api')}
                icon={<SlidersIcon size={13} />}
                label="Engine & API"
              />
              <MobileTabPill
                active={activeSettingsTab === 'personas'}
                onClick={() => openSettings('personas')}
                icon={<OrbitIcon size={13} />}
                label="About EgSA"
              />
            </div>
          )}

          {/* Scrollable Settings Form */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile
                ? '1rem clamp(0.75rem, 3vw, 1.25rem) calc(2.5rem + var(--safe-area-bottom))'
                : '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* TAB 1: APPEARANCE */}
            {activeSettingsTab === 'appearance' && (
              <>
                <GroupedSection title="Appearance Theme">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                      gap: '0.65rem',
                      padding: '0.85rem',
                    }}
                  >
                    <ThemeCard
                      label="System"
                      icon={<LaptopIcon size={20} />}
                      active={preferences.theme === 'system'}
                      onClick={() => setTheme('system')}
                    />
                    <ThemeCard
                      label="Light"
                      icon={<SunIcon size={20} />}
                      active={preferences.theme === 'light'}
                      onClick={() => setTheme('light')}
                    />
                    <ThemeCard
                      label="Dark"
                      icon={<MoonIcon size={20} />}
                      active={preferences.theme === 'dark'}
                      onClick={() => setTheme('dark')}
                    />
                  </div>
                </GroupedSection>

                <GroupedSection title="Accent Color">
                  <div
                    style={{
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {APPLE_ACCENTS.map((swatch) => {
                      const isSelected = preferences.customAccentColor === swatch.color;
                      return (
                        <button
                          key={swatch.color}
                          onClick={() => setAccentColor(swatch.color)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: swatch.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            cursor: 'pointer',
                            outline: isSelected ? `2px solid var(--accent-primary)` : 'none',
                            outlineOffset: '2px',
                            transition: 'transform var(--transition-fast)',
                          }}
                          title={swatch.name}
                        >
                          {isSelected && <CheckIcon size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </GroupedSection>

                <GroupedSection title="Typography & Layout">
                  <SettingsRow label="Text Size" subtitle="Adjust the reading size of conversation text">
                    <AppleSegmentedControl<FontSizeOption>
                      value={preferences.fontSize}
                      onChange={setFontSize}
                      options={[
                        { label: 'Small', value: 'sm' },
                        { label: 'Default', value: 'md' },
                        { label: 'Large', value: 'lg' },
                      ]}
                    />
                  </SettingsRow>

                  <SettingsRow label="Chat Density" subtitle="Control message padding and vertical rhythm">
                    <AppleSegmentedControl<ChatDensity>
                      value={preferences.chatDensity}
                      onChange={setChatDensity}
                      options={[
                        { label: 'Comfortable', value: 'comfortable' },
                        { label: 'Compact', value: 'compact' },
                      ]}
                    />
                  </SettingsRow>

                  <SettingsRow label="Auto-scroll" subtitle="Automatically scroll to latest incoming responses">
                    <AppleToggle
                      checked={preferences.autoScroll}
                      onChange={(checked) => setPreferences({ autoScroll: checked })}
                    />
                  </SettingsRow>

                  <SettingsRow label="Send on Return (↵)" subtitle="Press Return to send, Shift+Return for new line">
                    <AppleToggle
                      checked={preferences.sendOnEnter}
                      onChange={(checked) => setPreferences({ sendOnEnter: checked })}
                    />
                  </SettingsRow>
                </GroupedSection>
              </>
            )}

            {/* TAB 2: INTELLIGENCE & MODELS */}
            {activeSettingsTab === 'model' && (
              <>
                <GroupedSection title="Active Intelligence Model">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {DEFAULT_MODELS.map((model, idx) => {
                      const isSelected = aiConfig.activeModelId === model.id;
                      return (
                        <div
                          key={model.id}
                          onClick={() => setModel(model.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom:
                              idx < DEFAULT_MODELS.length - 1 ? '1px solid var(--hairline)' : 'none',
                            backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {model.name}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {model.description}
                            </div>
                          </div>
                          {isSelected && <CheckIcon size={16} style={{ color: 'var(--accent-primary)' }} />}
                        </div>
                      );
                    })}
                  </div>
                </GroupedSection>

                <GroupedSection title="Specialist Persona">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {DEFAULT_PERSONAS.map((persona, idx) => {
                      const isSelected = aiConfig.activePersonaId === persona.id;
                      return (
                        <div
                          key={persona.id}
                          onClick={() => setPersona(persona.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom:
                              idx < DEFAULT_PERSONAS.length - 1 ? '1px solid var(--hairline)' : 'none',
                            backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{persona.avatar}</span>
                            <div>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {persona.name}
                              </div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {persona.tagline}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckIcon size={16} style={{ color: 'var(--accent-primary)' }} />}
                        </div>
                      );
                    })}
                  </div>
                </GroupedSection>

                <GroupedSection title="Model Parameters">
                  <SettingsRow
                    label="Temperature"
                    subtitle={`Controls randomness vs determinism: ${aiConfig.temperature}`}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={aiConfig.temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
                    />
                  </SettingsRow>

                  <SettingsRow label="Max Tokens" subtitle={`Completion token limit: ${aiConfig.maxTokens}`}>
                    <input
                      type="range"
                      min="256"
                      max="8192"
                      step="256"
                      value={aiConfig.maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                      style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
                    />
                  </SettingsRow>
                </GroupedSection>

                <GroupedSection title="System Instructions">
                  <div style={{ padding: '0.85rem' }}>
                    <textarea
                      rows={4}
                      value={aiConfig.systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--hairline)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.6rem 0.75rem',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </GroupedSection>
              </>
            )}

            {/* TAB 3: ENGINE & API */}
            {activeSettingsTab === 'api' && (
              <>
                <GroupedSection title="Engine Provider">
                  <SettingsRow label="Provider Engine" subtitle="Select local mock simulation or live LLM endpoint">
                    <AppleSegmentedControl<'mock' | 'custom-api'>
                      value={aiConfig.providerType === 'mock' ? 'mock' : 'custom-api'}
                      onChange={(val) => setAIConfig({ providerType: val })}
                      options={[
                        { label: 'EgSA Mock Core', value: 'mock' },
                        { label: 'Live Custom API', value: 'custom-api' },
                      ]}
                    />
                  </SettingsRow>

                  <SettingsRow label="Stream Responses" subtitle="Stream tokens smoothly in real-time">
                    <AppleToggle
                      checked={aiConfig.streamResponse}
                      onChange={(checked) => setAIConfig({ streamResponse: checked })}
                    />
                  </SettingsRow>
                </GroupedSection>

                {aiConfig.providerType !== 'mock' && (
                  <>
                    {/* Quick Provider Presets */}
                    <GroupedSection title="Provider Presets (1-Click Setup)">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                          gap: '0.6rem',
                          padding: '0.85rem',
                        }}
                      >
                        {PROVIDER_PRESETS.map((preset) => {
                          const isSelected =
                            aiConfig.providerPreset === preset.id ||
                            (preset.endpointUrl && aiConfig.customEndpointUrl === preset.endpointUrl);

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '0.65rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
                                border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--hairline)'}`,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all var(--transition-fast)',
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  marginBottom: '0.2rem',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 600,
                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                  }}
                                >
                                  {preset.name}
                                </span>
                                {isSelected && (
                                  <CheckIcon size={13} style={{ color: 'var(--accent-primary)' }} />
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: isSelected ? 'var(--accent-surface)' : 'rgba(0,0,0,0.05)',
                                  color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                                  fontWeight: 500,
                                  marginBottom: '0.35rem',
                                }}
                              >
                                {preset.badge}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-muted)',
                                  lineHeight: 1.25,
                                }}
                              >
                                {preset.notes}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </GroupedSection>

                    {/* Custom Endpoint & Model Configuration */}
                    <GroupedSection title="Connection Parameters">
                      <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {/* Endpoint URL Field */}
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 500,
                              color: 'var(--text-secondary)',
                              marginBottom: '0.35rem',
                            }}
                          >
                            Endpoint URL
                          </label>
                          <input
                            type="text"
                            value={aiConfig.customEndpointUrl || ''}
                            onChange={(e) => {
                              setAIConfig({ customEndpointUrl: e.target.value });
                              setTestResult(null);
                              setAvailableModels([]);
                              setModelsFetchError(null);
                            }}
                            placeholder="https://api.openai.com/v1/chat/completions"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              fontSize: 'var(--text-xs)',
                              backgroundColor: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--hairline)',
                              fontFamily: 'monospace',
                            }}
                          />
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            OpenAI-compatible URL. Missing <code>/chat/completions</code> paths are auto-resolved.
                          </div>
                        </div>

                        {/* Live Model Retrieval & Selection */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.35rem',
                            }}
                          >
                            <label
                              style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Model Selection
                            </label>

                            <button
                              type="button"
                              onClick={handleFetchModels}
                              disabled={isFetchingModels || !aiConfig.customEndpointUrl}
                              className="apple-button"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.55rem',
                                gap: '0.35rem',
                                opacity: !aiConfig.customEndpointUrl ? 0.5 : 1,
                                color: 'var(--accent-primary)',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--hairline)',
                                cursor: !aiConfig.customEndpointUrl ? 'not-allowed' : 'pointer',
                              }}
                              title="Query the endpoint to retrieve live list of available models"
                            >
                              <RefreshCwIcon
                                size={12}
                                style={{
                                  animation: isFetchingModels ? 'spin 1s linear infinite' : 'none',
                                }}
                              />
                              {isFetchingModels ? 'Querying Endpoint...' : 'Retrieve Models from Endpoint'}
                            </button>
                          </div>

                          {/* Dropdown mode when models have been fetched */}
                          {availableModels.length > 0 && !isManualModelEntry ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <select
                                value={aiConfig.customModelId || ''}
                                onChange={(e) => {
                                  setAIConfig({ customModelId: e.target.value });
                                  setTestResult(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.55rem 0.65rem',
                                  fontSize: 'var(--text-xs)',
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--hairline)',
                                  color: 'var(--text-primary)',
                                  fontFamily: 'monospace',
                                  cursor: 'pointer',
                                }}
                              >
                                {!aiConfig.customModelId && (
                                  <option value="" disabled>
                                    -- Select from {availableModels.length} models on endpoint --
                                  </option>
                                )}
                                {availableModels.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  <CheckIcon size={12} /> {availableModels.length} models retrieved live from endpoint
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsManualModelEntry(true)}
                                  style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--text-muted)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  Type manually
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Manual entry mode */
                            <div>
                              <input
                                type="text"
                                value={aiConfig.customModelId || ''}
                                onChange={(e) => {
                                  setAIConfig({ customModelId: e.target.value });
                                  setTestResult(null);
                                }}
                                placeholder="Click 'Retrieve Models from Endpoint' above or enter model name"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.65rem',
                                  fontSize: 'var(--text-xs)',
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--hairline)',
                                  fontFamily: 'monospace',
                                }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {availableModels.length === 0
                                    ? "Click 'Retrieve Models from Endpoint' to query the live list of models."
                                    : "Manual entry mode."}
                                </span>
                                {availableModels.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setIsManualModelEntry(false)}
                                    style={{
                                      fontSize: '0.68rem',
                                      color: 'var(--accent-primary)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Back to dropdown list ({availableModels.length})
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Fetch Error Feedback */}
                          {modelsFetchError && (
                            <div
                              style={{
                                marginTop: '0.35rem',
                                padding: '0.4rem 0.6rem',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'rgba(255, 59, 48, 0.08)',
                                border: '1px solid rgba(255, 59, 48, 0.2)',
                                fontSize: '0.68rem',
                                color: 'var(--danger)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <AlertCircleIcon size={13} style={{ flexShrink: 0 }} />
                              <span>{modelsFetchError}</span>
                            </div>
                          )}
                        </div>

                        {/* API Key Field */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <label
                              style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              API Key / Secret Token
                            </label>
                            {(() => {
                              const preset = PROVIDER_PRESETS.find((p) => p.id === aiConfig.providerPreset);
                              if (preset && !preset.requiresKey) {
                                return (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    (Optional for local models)
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span
                              style={{
                                position: 'absolute',
                                left: '0.65rem',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <KeyIcon size={14} />
                            </span>
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={aiConfig.apiKey || ''}
                              onChange={(e) => {
                                setAIConfig({ apiKey: e.target.value });
                                setTestResult(null);
                              }}
                              placeholder={
                                PROVIDER_PRESETS.find((p) => p.id === aiConfig.providerPreset)?.placeholderKey ||
                                'sk-...'
                              }
                              style={{
                                width: '100%',
                                padding: '0.5rem 2.2rem 0.5rem 2rem',
                                fontSize: 'var(--text-xs)',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--hairline)',
                                fontFamily: 'monospace',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              style={{
                                position: 'absolute',
                                right: '0.5rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={showApiKey ? 'Hide key' : 'Show key'}
                            >
                              {showApiKey ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                            </button>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {PROVIDER_PRESETS.find((p) => p.id === aiConfig.providerPreset)?.keyHelp ||
                              'Stored locally in your browser session.'}
                          </div>
                        </div>
                      </div>

                      {/* CORS Dev Proxy Toggle */}
                      <SettingsRow
                        label="Bypass Browser CORS (Vite Dev Proxy)"
                        subtitle="Routes requests via local server middleware to prevent browser cross-origin blocks."
                      >
                        <AppleToggle
                          checked={aiConfig.useProxy ?? true}
                          onChange={(checked) => setAIConfig({ useProxy: checked })}
                        />
                      </SettingsRow>
                    </GroupedSection>

                    {/* Diagnostic Connection Tester */}
                    <GroupedSection title="Connection Health & Diagnostics">
                      <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={handleTestEndpoint}
                            disabled={isTesting || !aiConfig.customEndpointUrl}
                            className="apple-button apple-button-primary"
                            style={{
                              fontSize: 'var(--text-xs)',
                              padding: '0.45rem 0.95rem',
                              opacity: !aiConfig.customEndpointUrl ? 0.6 : 1,
                            }}
                          >
                            {isTesting ? 'Probing Connection...' : 'Test Connection'}
                          </button>

                          {isTesting && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                              Sending handshake to endpoint...
                            </span>
                          )}
                        </div>

                        {/* Test Result Diagnostic Card */}
                        {testResult && (
                          <div
                            style={{
                              padding: '0.75rem 0.95rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: testResult.ok ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                              border: `1px solid ${testResult.ok ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                              animation: 'fadeIn 0.15s ease-out',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span style={{ color: testResult.ok ? 'var(--success)' : 'var(--danger)', marginTop: '1px' }}>
                                {testResult.ok ? <CheckIcon size={16} /> : <AlertCircleIcon size={16} />}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 600,
                                    color: testResult.ok ? 'var(--success)' : 'var(--danger)',
                                    marginBottom: '0.2rem',
                                  }}
                                >
                                  {testResult.ok
                                    ? `Ready to Use (${testResult.latencyMs}ms latency)`
                                    : `Connection Failed ${testResult.status ? `(HTTP ${testResult.status})` : ''}`}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {testResult.message}
                                </div>

                                {testResult.ok && testResult.modelUsed && (
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Model handshake verified for <code>{testResult.modelUsed}</code>. You can now chat in real-time.
                                  </div>
                                )}

                                {!testResult.ok && (
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      color: 'var(--text-muted)',
                                      marginTop: '0.35rem',
                                      paddingTop: '0.35rem',
                                      borderTop: '1px solid rgba(0,0,0,0.06)',
                                    }}
                                  >
                                    💡 <strong>Troubleshooting:</strong>{' '}
                                    {testResult.status === 401
                                      ? 'Verify your API key in the provider console.'
                                      : testResult.status === 404
                                      ? `Ensure model '${testResult.modelUsed || 'specified'}' exists on this server (e.g. run 'ollama pull ${testResult.modelUsed || 'llama3.2'}').`
                                      : testResult.message.includes('CORS') || testResult.message.includes('Failed to fetch')
                                      ? 'Ensure "Bypass Browser CORS (Vite Dev Proxy)" is enabled above, or launch Ollama with OLLAMA_ORIGINS="*".'
                                      : 'Verify that the endpoint URL is active and reachable.'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </GroupedSection>
                  </>
                )}
              </>
            )}

            {/* TAB 4: ABOUT EGSA INTELLIGENCE */}
            {activeSettingsTab === 'personas' && (
              <GroupedSection title="Egyptian Space Agency">
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Logo size="lg" style={{ height: '44px', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>EgSA Intelligence Platform</h4>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        Version 2.0.0 (Apple HIG Design Architecture)
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    EgSA Intelligence is a specialized mission-support conversational system developed to assist engineers,
                    researchers, and operations staff at the Egyptian Space Agency in satellite orbit determination, ADCS
                    telemetry review, remote sensing processing, and spacecraft engineering.
                  </p>
                </div>
              </GroupedSection>
            )}

            {/* Mobile Reset to Defaults button */}
            {isMobile && (
              <div style={{ paddingTop: '0.5rem', paddingBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => resetToDefaults()}
                  className="apple-button"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    padding: '0.45rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  Reset All to Defaults
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- macOS & iOS Reusable Subcomponents --- */

const MobileTabPill: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.35rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-canvas)',
      color: active ? '#ffffff' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--hairline)'}`,
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'all var(--transition-fast)',
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SidebarTabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.55rem',
      padding: '0.42rem 0.65rem',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
      color: active ? '#ffffff' : 'var(--text-primary)',
      fontSize: 'var(--text-xs)',
      fontWeight: active ? 500 : 400,
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'background-color var(--transition-fast), color var(--transition-fast)',
    }}
  >
    <span style={{ color: active ? '#ffffff' : 'var(--text-secondary)' }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const GroupedSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <div
      style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-muted)',
        paddingLeft: '0.25rem',
      }}
    >
      {title}
    </div>
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  </div>
);

const SettingsRow: React.FC<{
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ label, subtitle, children }) => (
  <div
    style={{
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--hairline)',
    }}
  >
    <div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
      {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const ThemeCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.45rem',
      padding: '0.75rem 0.5rem',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: active ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
      border: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
      cursor: 'pointer',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
    }}
  >
    {icon}
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{label}</span>
  </button>
);

const AppleToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: '38px',
      height: '22px',
      borderRadius: '9999px',
      backgroundColor: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
      border: '1px solid var(--hairline)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background-color var(--transition-fast)',
    }}
  >
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        position: 'absolute',
        top: '1px',
        left: checked ? '17px' : '1px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left var(--transition-fast)',
      }}
    />
  </button>
);

function AppleSegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (val: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '2px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--hairline)',
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: 'var(--text-xs)',
              fontWeight: isSelected ? 500 : 400,
              backgroundColor: isSelected ? 'var(--bg-canvas)' : 'transparent',
              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
