import React from 'react';

// Shared building blocks for the Settings modal and its tabs.

export const MobileTabPill: React.FC<{
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

export const SidebarTabButton: React.FC<{
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

export const GroupedSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
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

export const SettingsRow: React.FC<{
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

export const ThemeCard: React.FC<{
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

export const AppleToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({
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

export function AppleSegmentedControl<T extends string>({
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
