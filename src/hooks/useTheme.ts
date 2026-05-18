import { useEffect } from 'react';

export const useTheme = (theme: string) => {
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);

    return () => {
      root.removeAttribute('data-theme');
    };
  }, [theme]);
};
