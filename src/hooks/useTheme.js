import { useState, useEffect, useCallback } from 'react';

const KEY = 'theme';
const ORDER = ['light', 'dark'];

function resolveInitial() {
  try {
    const stored = localStorage.getItem(KEY);
    if (ORDER.includes(stored)) return stored;
  } catch { /* private mode */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState(resolveInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (!ORDER.includes(t)) return;
    setThemeState(t);
  }, []);

  return { theme, setTheme, resolved: theme };
}
