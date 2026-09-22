import React, { useEffect, useId, useRef, useState } from 'react';

// Small popover menu: trigger button + role="menu" list. Closes on outside click, Esc, or after
// an item is chosen; Up/Down/Home/End move focus between items (design system: keyboard access).
// Items are plain <button className="menu-item" role="menuitem"> children; see components.css.
export const Menu: React.FC<{
  label: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  title?: string;
  align?: 'start' | 'end' | 'center';
  children: (close: () => void) => React.ReactNode;
}> = ({ label, trigger, triggerClassName, triggerStyle, title, align = 'end', children }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();

  // Closing by choice or Esc returns focus to the trigger (looked up by id so render-time
  // callbacks don't read refs); clicking elsewhere just closes.
  const close = () => {
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') || []);
    // Focus the checked item if there is one, else the first.
    const checked = menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    (checked || items()[0])?.focus();

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const list = items();
      const index = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        document.getElementById(triggerId)?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = e.key === 'ArrowDown' ? (index + 1) % list.length : (index - 1 + list.length) % list.length;
        list[next]?.focus();
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        list[e.key === 'Home' ? 0 : list.length - 1]?.focus();
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    // Capture phase so the Esc doesn't also close a surrounding dialog (useDialog).
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, triggerId]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex', minWidth: 0 }}>
      <button
        id={triggerId}
        type="button"
        className={triggerClassName}
        style={triggerStyle}
        title={title}
        aria-label={title ? undefined : label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div ref={menuRef} id={menuId} role="menu" aria-label={label} className="menu" data-align={align} onClick={(e) => e.stopPropagation()}>
          {children(close)}
        </div>
      )}
    </div>
  );
};
