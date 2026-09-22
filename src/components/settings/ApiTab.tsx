import React, { useState } from 'react';
import { AlertCircleIcon, CheckIcon, EyeIcon, EyeOffIcon, KeyIcon, RefreshCwIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { PROVIDER_PRESETS, type ProviderPreset } from '../../constants/defaults';
import { testEndpointConnection, fetchAvailableModels, type ConnectionTestResult } from '../../services/ai/apiProvider';
import { GroupedSection, SettingsRow, AppleToggle, AppleSegmentedControl } from './SettingsControls';

export const ApiTab: React.FC = () => {
  const aiConfig = useSettingsStore((s) => s.aiConfig);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);

  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsFetchError, setModelsFetchError] = useState<string | null>(null);
  const [isManualModelEntry, setIsManualModelEntry] = useState(false);

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
                    placeholder="http://gpu-server.egsa.local:11434/v1/chat/completions"
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
                      Endpoint default model
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
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Used by model profiles that leave their model empty. The general and coding profiles are set in Settings → Models.
                  </div>
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
                    {PROVIDER_PRESETS.find((p) => p.id === aiConfig.providerPreset)?.keyHelp}
                    {PROVIDER_PRESETS.find((p) => p.id === aiConfig.providerPreset)?.keyHelp ? ' ' : ''}
                    Kept for this browser tab only. You'll need to re-enter it after closing the browser.
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
  );
};
