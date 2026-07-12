import type { ThreeBioThemeName } from '@/constants';
import { useEffect } from 'react';

export const useTheme = (theme: ThreeBioThemeName) => {
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);

    return () => {
      root.removeAttribute('data-theme');
    };
  }, [theme]);
};
