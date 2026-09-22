import React, { useRef } from 'react';
import { XIcon, PaletteIcon, SparklesIcon, SlidersIcon, OrbitIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useDialog } from '../../hooks/useDialog';
import { MobileTabPill, SidebarTabButton } from './SettingsControls';
import { AppearanceTab } from './AppearanceTab';
import { ModelTab } from './ModelTab';
import { ApiTab } from './ApiTab';
import { AboutTab } from './AboutTab';

// Settings shell: tab navigation (sidebar on desktop, pills on mobile) and the active tab.
// Each tab lives in its own file and reads the settings store directly.
export const SettingsModal: React.FC = () => {
  const isMobile = useIsMobile(640);
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const activeSettingsTab = useSettingsStore((s) => s.activeSettingsTab);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialog(isSettingsOpen, closeSettings, dialogRef);

  if (!isSettingsOpen) return null;

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
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
            {activeSettingsTab === 'appearance' && <AppearanceTab />}
            {activeSettingsTab === 'model' && <ModelTab />}
            {activeSettingsTab === 'api' && <ApiTab />}
            {activeSettingsTab === 'personas' && <AboutTab />}

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
