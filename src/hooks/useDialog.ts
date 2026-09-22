import { useEffect, useRef, type RefObject } from 'react';

// Open dialogs, newest last, so only the topmost one reacts to Esc / traps Tab
// (e.g. the upload modal opened on top of the Administration modal).
const openDialogs: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour for modal dialogs (design system: keyboard accessibility):
 * Esc closes, focus moves into the dialog on open and back to the opener on close,
 * and Tab / Shift+Tab stay inside the dialog while it is the topmost one.
 * Pair with role="dialog" aria-modal="true" on the element passed as `ref`.
 */
export function useDialog(isOpen: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const id = Symbol('dialog');
    openDialogs.push(id);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isTop = () => openDialogs[openDialogs.length - 1] === id;

    // Focus the dialog itself rather than its first control, so nothing is pre-activated.
    const focusTimer = setTimeout(() => {
      const el = ref.current;
      if (el && !el.contains(document.activeElement)) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') {
        // An open popover menu inside the dialog handles its own Esc first (components/ui/Menu).
        if (document.activeElement instanceof HTMLElement && document.activeElement.closest('[role="menu"]')) return;
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      const idx = openDialogs.indexOf(id);
      if (idx >= 0) openDialogs.splice(idx, 1);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [isOpen, ref]);
}
