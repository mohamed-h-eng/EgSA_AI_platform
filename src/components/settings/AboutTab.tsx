import React from 'react';
import { Logo } from '../ui/Logo';
import { GroupedSection } from './SettingsControls';

export const AboutTab: React.FC = () => (
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
);
