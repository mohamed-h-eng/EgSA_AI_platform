import React, { useState, useEffect } from 'react';
import logoLight from '../../assets/logo_light.webp';
import logoDark from '../../assets/logo_dark.webp';
import { useSettingsStore } from '../../stores/settingsStore';

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'auto' | 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'auto',
  style,
  className = '',
  alt = 'Egyptian Space Agency (EgSA)',
  ...props
}) => {
  const theme = useSettingsStore((s) => s.preferences.theme);

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const isDark =
    variant === 'dark' ||
    (variant === 'auto' && (theme === 'dark' || (theme === 'system' && systemIsDark)));

  const logoSrc = isDark ? logoDark : logoLight;
  const mixBlendMode = isDark ? 'screen' : 'multiply';

  const heightMap: Record<string, string> = {
    sm: '26px',
    md: '34px',
    lg: '48px',
    hero: '76px',
  };

  const height = heightMap[size] || heightMap.md;

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`egsa-logo ${className}`}
      style={{
        height,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        userSelect: 'none',
        mixBlendMode,
        ...style,
      }}
      {...props}
    />
  );
};
