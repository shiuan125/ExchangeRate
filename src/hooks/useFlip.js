import { useRef, useState, useEffect } from 'react';

/** 雙段翻牌：數值變動時保留舊值一小段時間，讓「舊值翻走、新值翻入」依序播放 */
const FLIP_DURATION = 420;

export function useFlip(value) {
  const [state, setState] = useState({ display: value, prev: value, flipping: false });
  const timer = useRef(null);

  useEffect(() => {
    setState((s) => (s.display === value ? s : { display: value, prev: s.display, flipping: true }));
  }, [value]);

  useEffect(() => {
    if (!state.flipping) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState((s) => ({ ...s, flipping: false }));
    }, FLIP_DURATION);
    return () => clearTimeout(timer.current);
  }, [state.flipping]);

  return state;
}
