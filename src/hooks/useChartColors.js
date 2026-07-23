import { useMemo } from 'react';
import { useTheme } from './useTheme';

/** Recharts 用 inline SVG 屬性，CSS 變數在部分屬性上不會生效，需讀取實際計算值 */
export function useChartColors() {
  const { resolved } = useTheme();
  return useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      rule: s.getPropertyValue('--rule').trim(),
      inkLight: s.getPropertyValue('--ink-light').trim(),
      up: s.getPropertyValue('--up').trim(),
      down: s.getPropertyValue('--down').trim(),
      board: s.getPropertyValue('--board').trim(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);
}
