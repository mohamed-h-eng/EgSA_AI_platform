import type React from 'react';

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** The platform's primary modifier: ⌘ on Apple devices, Ctrl elsewhere. */
export const MOD_LABEL = isMac ? '⌘' : 'Ctrl';

export const hasMod = (e: KeyboardEvent | React.KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey);

/** True when the element takes text input, so single-key shortcuts must not fire. */
export function isTypingTarget(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select' || el.isContentEditable) return true;
  if (tag !== 'input') return false;
  const type = (el as HTMLInputElement).type;
  return !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes(type);
}

/**
 * ↑/↓ (and Home/End) move focus between the buttons inside a list container.
 * Attach as onKeyDown on the container (e.g. starter prompts).
 */
export function handleListArrowKeys(e: React.KeyboardEvent<HTMLElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)'));
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  e.preventDefault();
  const next =
    e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
  items[next]?.focus();
}

/** Fired by the chat box on ↑ when empty; the last user message opens its editor. */
export const EDIT_LAST_MESSAGE_EVENT = 'egsa:edit-last-message';
