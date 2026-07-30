import { useState, useEffect, useCallback } from 'react';

const KEY = 'elderMode';

function resolveInitial() {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch { /* private mode */ }
  return false;
}

export function useElderMode() {
  const [elderMode, setElderModeState] = useState(resolveInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-elder', String(elderMode));
    try { localStorage.setItem(KEY, String(elderMode)); } catch { /* private mode */ }
  }, [elderMode]);

  const toggle = useCallback(() => setElderModeState((v) => !v), []);

  return { elderMode, toggle };
}
