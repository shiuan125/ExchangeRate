import { useState, useEffect } from 'react';
import { fetchYearRows } from './useHistory';
import { taipeiToday } from '../utils/date';
import { historyCollection } from '../utils/bank';

/** 抓某幣別跨今年／去年的歷史資料（合併排序），供「近N天最低/最高」徽章與歷史走勢圖使用 */
/** @param {'cathay' | 'sinopac'} bank 決定讀哪一家銀行的歷史資料 */
export function useRateHistory(currency, bank = 'cathay') {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const collection = historyCollection(bank);
    setLoading(true);
    (async () => {
      const thisYear = taipeiToday().slice(0, 4);
      const lastYear = String(Number(thisYear) - 1);

      try {
        const [prevRows, curRows] = await Promise.all([
          fetchYearRows(currency, lastYear, collection),
          fetchYearRows(currency, thisYear, collection),
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
  }, [currency, bank]);

  return { rows, loading };
}
