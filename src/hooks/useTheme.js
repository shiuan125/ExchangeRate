import { useState, useEffect, useCallback } from 'react';

const KEY = 'theme';
const ORDER = ['system', 'light', 'dark'];

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(KEY) || 'system'; }
    catch { return 'system'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (!ORDER.includes(t)) return;
    setThemeState(t);
  }, []);

  // 供 UI 顯示目前實際生效的是亮還是暗
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return { theme, setTheme, resolved };
}
