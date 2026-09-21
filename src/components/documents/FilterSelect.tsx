import React from 'react';

// Project/subsystem filter pill shared by the document manager and the knowledge query scope bar.
export const FilterSelect: React.FC<{
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  maxWidth?: string;
}> = ({ icon, value, onChange, allLabel, options, disabled, maxWidth }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', opacity: disabled ? 0.5 : 1, minWidth: 0 }}>
    <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', cursor: disabled ? 'not-allowed' : 'pointer', maxWidth, minWidth: 0, textOverflow: 'ellipsis' }}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);
