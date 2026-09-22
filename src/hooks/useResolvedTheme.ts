import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/** True when the app is showing dark colours: the Dark theme, or System while the OS is dark. */
export function useIsDarkTheme(): boolean {
  const theme = useSettingsStore((s) => s.preferences.theme);
  const [systemIsDark, setSystemIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return theme === 'dark' || (theme === 'system' && systemIsDark);
}

