import { useSyncExternalStore } from 'react';

/**
 * Custom hook to listen to CSS media query changes using React's useSyncExternalStore.
 * Guarantees zero cascading renders and immediate synchronization.
 * @param query CSS media query string (e.g. '(max-width: 767px)')
 * @returns boolean indicating if the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    },
    () => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(query).matches;
    },
    () => false
  );
}

/**
 * Convenience hook to check if the viewport is mobile-sized (< breakpoint).
 * Default breakpoint is 768px (iPad portrait / phone width).
 */
export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
