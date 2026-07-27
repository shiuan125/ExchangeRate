import { useState, useEffect } from 'react';
import { fetchYearRows } from './useHistory';
import { taipeiToday } from '../utils/date';

/** 抓某幣別跨今年／去年的歷史資料（合併排序），供「近N天最低/最高」徽章與歷史走勢圖使用 */
export function useRateHistory(currency) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const thisYear = taipeiToday().slice(0, 4);
      const lastYear = String(Number(thisYear) - 1);

      try {
        const [prevRows, curRows] = await Promise.all([
          fetchYearRows(currency, lastYear),
          fetchYearRows(currency, thisYear),
        ]);
        if (!alive) return;
        setRows([...prevRows, ...curRows].sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currency]);

  return { rows, loading };
}
