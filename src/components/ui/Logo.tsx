import React from 'react';
import logoLight from '../../assets/logo_light.webp';
import logoDark from '../../assets/logo_dark.webp';
import { useIsDarkTheme } from '../../hooks/useResolvedTheme';

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
  const themeIsDark = useIsDarkTheme();
  const isDark = variant === 'dark' || (variant === 'auto' && themeIsDark);

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
