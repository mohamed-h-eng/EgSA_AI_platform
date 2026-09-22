import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeftIcon,
  SettingsIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SlidersIcon,
  LogOutIcon,
  KeyboardIcon,
} from '../ui/Icons';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);

  const preferences = useSettingsStore((s) => s.preferences);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const openShortcuts = useUiStore((s) => s.openShortcuts);

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  const isDarkMode =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node) &&
        accountTriggerRef.current &&
        !accountTriggerRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAccountMenuOpen]);

  return (
    <header
      className="apple-glass"
      style={{
        height: 'var(--header-height)',
        padding: '0 clamp(0.5rem, 2.5vw, 1rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 30,
        userSelect: 'none',
        position: 'relative',
        gap: '0.4rem',
      }}
    >
      {/* Left Section: Sidebar Toggle & Conversation Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="apple-button"
            title="Show Sidebar"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <PanelLeftIcon size={16} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <h1
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'clamp(90px, 25vw, 240px)',
            }}
          >
            {currentSession ? currentSession.title : 'New Conversation'}
          </h1>
        </div>
      </div>

      {/* Right Section: Account Trigger & Dropdown Menu */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
        <button
          ref={accountTriggerRef}
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          className="apple-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem clamp(0.2rem, 1vw, 0.45rem) 0.2rem 0.2rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--hairline)',
            backgroundColor: isAccountMenuOpen ? 'var(--bg-active)' : 'transparent',
            cursor: 'pointer',
          }}
          title="Account details & management"
        >
          {/* Avatar circle */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            ME
          </div>

          <span
            className="hide-on-mobile"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              maxWidth: '120px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Mohamed E.
          </span>

          <ChevronDownIcon
            size={12}
            className="hide-on-mobile"
            style={{
              color: 'var(--text-muted)',
              transform: isAccountMenuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--transition-fast)',
            }}
          />
        </button>

        {/* Apple-style Account Popover Dropdown Menu */}
        {isAccountMenuOpen && (
          <div
            ref={accountMenuRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              maxWidth: 'min(280px, 90vw)',
              backgroundColor: 'var(--bg-elevated)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--hairline)',
              boxShadow: 'var(--shadow-modal)',
              padding: '0.5rem',
              zIndex: 100,
              animation: 'slideDown 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {/* Account Details Header */}
            <div
              style={{
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                ME
              </div>

              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Mohamed Emad
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  m.emad@egsa.gov.eg
                </div>
                <div style={{ marginTop: '0.3rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--accent-surface)',
                      color: 'var(--accent-text)',
                      fontWeight: 500,
                    }}
                  >
                    <ShieldCheckIcon size={10} />
                    EgSA Orbital Specialist
                  </span>
                </div>
              </div>
            </div>

            {/* Hairline Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--hairline)', margin: '0.35rem 0.4rem' }} />

            {/* Account Management & System Actions */}
            <DropdownMenuItem
              icon={<SettingsIcon size={14} />}
              label="Account & Preferences"
              onClick={() => {
                setIsAccountMenuOpen(false);
                openSettings('appearance');
              }}
            />

            <DropdownMenuItem
              icon={<SparklesIcon size={14} />}
              label="Intelligence & Models"
              onClick={() => {
                setIsAccountMenuOpen(false);
                openSettings('model');
              }}
            />

            <DropdownMenuItem
              icon={<SlidersIcon size={14} />}
              label="Engine & API Keys"
              onClick={() => {
                setIsAccountMenuOpen(false);
                openSettings('api');
              }}
            />

            <DropdownMenuItem
              icon={<KeyboardIcon size={14} />}
              label="Keyboard shortcuts"
              secondaryAction={<kbd className="kbd">?</kbd>}
              onClick={() => {
                setIsAccountMenuOpen(false);
                openShortcuts();
              }}
            />

            {/* Quick Appearance Toggle */}
            <DropdownMenuItem
              icon={isDarkMode ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              label={`Appearance: ${isDarkMode ? 'Dark' : 'Light'}`}
              secondaryAction={
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 500,
                  }}
                >
                  Switch
                </span>
              }
              onClick={(e) => {
                toggleTheme(e);
              }}
            />

            {/* Hairline Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--hairline)', margin: '0.35rem 0.4rem' }} />

            {/* Sign Out Action */}
            <DropdownMenuItem
              icon={<LogOutIcon size={14} />}
              label="Sign Out Station"
              isDestructive
              onClick={() => {
                setIsAccountMenuOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
};

/* --- Dropdown Menu Row Component --- */
const DropdownMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  secondaryAction?: React.ReactNode;
  isDestructive?: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ icon, label, secondaryAction, isDestructive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.45rem 0.65rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: isHovered
          ? isDestructive
            ? 'rgba(255, 59, 48, 0.1)'
            : 'var(--bg-hover)'
          : 'transparent',
        color: isDestructive && isHovered ? 'var(--danger)' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 'var(--text-xs)',
        fontWeight: 400,
        textAlign: 'left',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        <span
          style={{
            color: isDestructive && isHovered ? 'var(--danger)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>

      {secondaryAction && <div>{secondaryAction}</div>}
    </button>
  );
};
