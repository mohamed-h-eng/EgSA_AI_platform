import React, { useId } from 'react';

export type AstronautPose = 'idle' | 'thinking' | 'writing' | 'done' | 'stopped';

// The EgSA astronaut (plan: agent/ASTRONAUT_STATUS_PLAN.md), redrawn from src/assets/pet.jpg as a
// small theme-aware SVG: white suit, dark visor, rounded proportions, dark outline. Each pose
// matches an answer stage (Searching → thinking, Coding → writing, PASS → done). Motion is pure CSS
// on groups (see .astro-* in components.css) and stops under prefers-reduced-motion.

// Arms are drawn as an outline stroke with a narrower suit-coloured stroke on top.
const Arm: React.FC<{ d: string; className?: string; hand: [number, number] }> = ({ d, className, hand }) => (
  <g className={className}>
    <path d={d} className="astro-limb-outline" />
    <path d={d} className="astro-limb" />
    <circle cx={hand[0]} cy={hand[1]} r={2.9} className="astro-part" />
  </g>
);

export const Astronaut: React.FC<{ pose: AstronautPose; size?: number }> = ({ pose, size = 36 }) => {
  const clipId = useId();
  return (
    <svg className="astronaut" data-pose={pose} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="32" cy="22" rx="10.5" ry="9" />
        </clipPath>
      </defs>

      <g className="astro-body">
        {/* backpack, legs, torso */}
        <rect x="17" y="29" width="30" height="21" rx="7" className="astro-shade" />
        {pose !== 'writing' && (
          <>
            <rect x="22.5" y="47" width="8" height="11" rx="4" className="astro-part" />
            <rect x="33.5" y="47" width="8" height="11" rx="4" className="astro-part" />
          </>
        )}
        <rect x="20" y="32" width="24" height="20" rx="9" className="astro-part" />
        <rect x="26" y="38" width="12" height="7" rx="2" className="astro-shade" />
        <circle cx="32" cy="41.5" r="1.9" className="astro-accent" />

        {/* arms, props */}
        {pose === 'idle' && (
          <>
            <Arm d="M22 36 L18.5 46" hand={[18, 47]} />
            <Arm d="M42 36 L45.5 46" hand={[46, 47]} />
          </>
        )}
        {pose === 'thinking' && (
          <>
            <Arm d="M22 36 L17 45" hand={[16.5, 46]} />
            <g className="astro-lens-arm">
              <Arm d="M42 36 L47 30" hand={[47.5, 29.5]} />
              <line x1="48" y1="29" x2="50.5" y2="26" className="astro-line" />
              <circle cx="53.5" cy="22.5" r="4.6" className="astro-lens" />
            </g>
          </>
        )}
        {pose === 'writing' && (
          <>
            <Arm className="astro-tap-left" d="M22 36 L25 45.5" hand={[25.5, 46]} />
            <Arm className="astro-tap-right" d="M42 36 L39 45.5" hand={[38.5, 46]} />
            <rect x="15" y="47.5" width="34" height="8" rx="2.4" className="astro-shade" />
            <path d="M19 51.5h3M24 51.5h3M29 51.5h6M37 51.5h3M42 51.5h3" className="astro-keys" />
          </>
        )}
        {pose === 'done' && (
          <>
            <Arm d="M22 36 L17 45" hand={[16.5, 46]} />
            <Arm d="M42 36 L48 27" hand={[48.5, 26]} />
            <g className="astro-badge">
              <circle cx="53.5" cy="18.5" r="5.2" className="astro-check-bg" />
              <path d="M51 18.6 l1.8 1.9 l3.4-3.7" className="astro-check" />
            </g>
          </>
        )}
        {pose === 'stopped' && (
          <>
            <Arm d="M22 36 L13 39" hand={[12, 39.5]} />
            <Arm d="M42 36 L51 39" hand={[52, 39.5]} />
          </>
        )}

        {/* helmet: ear pods, shell, visor + what it shows, highlight */}
        <circle cx="16.8" cy="22" r="3.6" className="astro-part" />
        <circle cx="47.2" cy="22" r="3.6" className="astro-part" />
        <circle cx="32" cy="21" r="15" className="astro-part" />
        <ellipse cx="32" cy="22" rx="10.5" ry="9" className="astro-visor" />
        <g clipPath={`url(#${clipId})`}>
          {pose === 'thinking' && (
            <path d="M21 18.5h22M21 22h22M21 25.5h22M27 13v18M32 13v18M37 13v18" className="astro-visor-grid" />
          )}
          {pose === 'writing' && (
            <g className="astro-visor-lines">
              {[15, 18.5, 22, 25.5, 29, 32.5, 36].map((y, i) => (
                <rect key={y} x={24 + (i % 3) * 2} y={y} width={i % 2 ? 9 : 12} height="1.6" rx="0.8" className="astro-code" />
              ))}
            </g>
          )}
          {pose === 'done' && <path d="M27.5 22.5 l3 3 l6-6.5" className="astro-visor-check" />}
          {pose === 'stopped' && (
            <g className="astro-code">
              <circle cx="28" cy="23" r="1.2" />
              <circle cx="32" cy="23" r="1.2" />
              <circle cx="36" cy="23" r="1.2" />
            </g>
          )}
        </g>
        <ellipse cx="36.5" cy="17" rx="3.2" ry="1.5" transform="rotate(-28 36.5 17)" className="astro-highlight" />
      </g>
    </svg>
  );
};
