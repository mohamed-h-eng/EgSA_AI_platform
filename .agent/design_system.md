Frontend Design Direction

Build the frontend using a design language inspired by Apple's Human Interface Guidelines and modern Apple product interfaces.

Overall aesthetic

Minimal, refined, premium, and highly intentional.

Prioritize clarity, hierarchy, whitespace, and content over decoration.

Use a restrained visual language with subtle depth rather than heavy shadows, gradients, borders, or visual noise.

The interface should feel calm, responsive, polished, and native.

Avoid generic SaaS/dashboard aesthetics.

Avoid excessive cards, rounded rectangles, badges, gradients, and unnecessary icons.

Layout

Use generous whitespace and strong visual hierarchy.

Prefer simple compositions with large headings, supporting text, and focused actions.

Use a centered content container with sensible maximum widths.

Create clear visual sections rather than placing everything inside cards.

Use asymmetric layouts when appropriate, while maintaining strong alignment.

Design responsively for mobile, tablet, and desktop.

Typography

Use Apple's typographic principles:

Prefer SF Pro / system fonts where available.

Use the platform system font stack as the fallback.

Large headings should be bold but not excessively heavy.

Body text should be highly readable with comfortable line height.

Use typography scale and weight to establish hierarchy instead of relying on colors or borders.

Avoid overly small text.

Example font stack:

font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Helvetica Neue",
  Arial,
  sans-serif;

Colors

Use a restrained Apple-inspired palette.

Primary text: near-black rather than pure black.

Secondary text: muted gray.

Backgrounds: white, very light gray, or appropriate dark-mode surfaces.

Use Apple's system colors conceptually for semantic states.

Accent colors should be used sparingly.

Do not introduce multiple competing accent colors.

Support both light and dark mode when appropriate.

Surfaces

Prefer flat surfaces and subtle tonal separation.

Use translucency/material effects selectively.

Use soft shadows only when they communicate elevation.

Avoid strong borders unless needed for structure.

Use subtle separators for lists and navigation.

Corner radii should be consistent and purposeful.

Components

Buttons:

Clear hierarchy between primary, secondary, and tertiary actions.

Primary buttons should be visually prominent without looking oversized.

Use appropriate hover, pressed, disabled, and focus states.

Avoid excessive pill-shaped buttons unless the context calls for them.

Inputs:

Simple, clean, spacious controls.

Clear labels and validation states.

Strong keyboard and accessibility behavior.

Focus states should be obvious but visually restrained.

Navigation:

Keep navigation simple.

Use clear hierarchy and predictable interaction patterns.

Avoid overcrowding the navigation bar.

On mobile, use appropriate mobile navigation patterns.

Cards:

Do not put every piece of content inside a card.

Use cards only when grouping or elevation is genuinely useful.

Prefer whitespace and typography to create hierarchy.

Motion

Motion should feel subtle and physical.

Use short, smooth transitions.

Prefer opacity, transform, scale, and blur transitions.

Avoid excessive animation.

Animations should communicate hierarchy, state changes, or spatial relationships.

Respect prefers-reduced-motion.

Example:

transition:
  transform 180ms ease,
  opacity 180ms ease,
  background-color 180ms ease;

Interaction

Every interactive element should have:

Hover state

Active/pressed state

Focus-visible state

Disabled state where applicable

Keyboard accessibility

Appropriate cursor behavior

Interactions should feel immediate and predictable.

Accessibility

Follow modern accessibility standards.

Semantic HTML.

Proper labels.

Keyboard navigation.

Visible focus states.

Sufficient color contrast.

ARIA only when necessary.

Respect reduced motion.

Do not communicate important information through color alone.

Responsive behavior

Design mobile-first.

Do not simply shrink the desktop layout.

Instead:

Recompose layouts for smaller screens.

Reduce navigation complexity.

Increase touch target sizes.

Preserve hierarchy.

Keep important actions easily accessible.

Ensure typography remains readable.

Implementation

Before writing code:

Understand the existing project structure.

Identify the framework and component system.

Reuse existing components where appropriate.

Establish design tokens for colors, typography, spacing, radius, shadows, and animation.

Build reusable components instead of duplicating UI.

Keep the implementation clean and maintainable.

Verify the result at mobile, tablet, and desktop widths.

Design tokens

Create a coherent token system rather than hardcoding random values.

Example:

:root {
  --color-background: #ffffff;
  --color-surface: #f5f5f7;
  --color-text: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-accent: #0071e3;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}

Important design rule

Do not copy Apple's website or individual Apple products literally.

Use the underlying principles:

clarity + hierarchy + whitespace + typography + restraint + responsive interaction + subtle motion.

The final result should feel like a thoughtfully designed native Apple-inspired interface, not like a generic website with rounded corners.