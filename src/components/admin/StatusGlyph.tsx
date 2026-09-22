import React from 'react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'muted' | 'progress';

// A distinct shape per tone so status reads without colour (design system): dot, triangle,
// crossed dot, ring, and a turning arc for work in progress. Colour comes from data-tone in
// components.css. Always pair it with a status word.
export const StatusGlyph: React.FC<{ tone: StatusTone }> = ({ tone }) => (
  <svg className="status-glyph" data-tone={tone} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    {tone === 'success' && <circle cx="6" cy="6" r="5" fill="currentColor" />}
    {tone === 'warning' && <path d="M6 1.2 11 10.4H1z" fill="currentColor" />}
    {tone === 'danger' && (
      <>
        <circle cx="6" cy="6" r="5" fill="currentColor" />
        <path d="M4 4l4 4M8 4l-4 4" stroke="var(--bg-primary)" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
    {tone === 'muted' && <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    {tone === 'progress' && (
      <g className="is-spinning" style={{ transformOrigin: '6px 6px' }}>
        <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M6 1.75a4.25 4.25 0 0 1 4.25 4.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
