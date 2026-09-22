import React from 'react';
import { CheckIcon, LaptopIcon, MoonIcon, SunIcon } from '../ui/Icons';
import { useSettingsStore } from '../../stores/settingsStore';
import type { FontSizeOption, ChatDensity, TextDirection, ArabicFontOption } from '../../types';
import { GroupedSection, SettingsRow, ThemeCard, AppleToggle, AppleSegmentedControl } from './SettingsControls';

const APPLE_ACCENTS = [
  { name: 'Blue', color: '#0071e3' },
  { name: 'Purple', color: '#af52de' },
  { name: 'Pink', color: '#ff2d55' },
  { name: 'Orange', color: '#ff9500' },
  { name: 'Green', color: '#34c759' },
  { name: 'Graphite', color: '#8e8e93' },
];

export const AppearanceTab: React.FC = () => {
  const preferences = useSettingsStore((s) => s.preferences);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setChatDensity = useSettingsStore((s) => s.setChatDensity);
  const setTextDirection = useSettingsStore((s) => s.setTextDirection);
  const setArabicFont = useSettingsStore((s) => s.setArabicFont);
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  return (
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

          <SettingsRow label="Arabic Typography Font" subtitle="Modern high-legibility Arabic typefaces">
            <AppleSegmentedControl<ArabicFontOption>
              value={preferences.arabicFont || 'ibm-plex'}
              onChange={setArabicFont}
              options={[
                { label: 'IBM Plex', value: 'ibm-plex' },
                { label: 'Cairo', value: 'cairo' },
                { label: 'Readex', value: 'readex' },
                { label: 'System', value: 'system' },
              ]}
            />
          </SettingsRow>

          <SettingsRow label="Text Direction" subtitle="Bi-directional default alignment for prompts and answers">
            <AppleSegmentedControl<TextDirection>
              value={preferences.textDirection || 'auto'}
              onChange={setTextDirection}
              options={[
                { label: 'Auto-Detect', value: 'auto' },
                { label: 'Force LTR', value: 'ltr' },
                { label: 'Force RTL', value: 'rtl' },
              ]}
            />
          </SettingsRow>

          <div
            style={{
              margin: '0.4rem 0.85rem 0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Arabic Typography Sample ({preferences.arabicFont === 'cairo' ? 'Cairo' : preferences.arabicFont === 'readex' ? 'Readex Pro' : preferences.arabicFont === 'system' ? 'System' : 'IBM Plex Sans Arabic'})
            </div>
            <div
              dir="rtl"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-base)',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}
            >
              وكالة الفضاء المصرية — Egyptian Space Agency (EgSA)
            </div>
          </div>

          <SettingsRow label="Answer status companion" subtitle="Show a small astronaut beside the model status above the message box: ready, thinking, writing, or done">
            <AppleToggle
              checked={preferences.statusCompanion ?? true}
              onChange={(checked) => setPreferences({ statusCompanion: checked })}
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
  );
};
