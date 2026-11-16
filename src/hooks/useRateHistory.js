import { useState, useEffect } from 'react';
import { fetchYearRows } from './useHistory';
import { taipeiToday } from '../utils/date';
import { historyCollection } from '../utils/bank';

/**
 * 抓某幣別跨今年／去年的歷史資料（合併排序），供「近N天最低/最高」徽章與歷史走勢圖使用
 * @param {'cathay' | 'sinopac'} bank 決定讀哪一家銀行的歷史資料
 */
export function useRateHistory(currency, bank = 'cathay') {
  const key = `${bank}/${currency}`;
  // 記住手上的 rows 屬於哪一家銀行、哪個幣別：切換後、新資料回來前不顯示舊資料
  const [state, setState] = useState({ key: null, rows: [] });

  useEffect(() => {
    let alive = true;
    const collection = historyCollection(bank);
    (async () => {
      const thisYear = taipeiToday().slice(0, 4);
      const lastYear = String(Number(thisYear) - 1);

      try {
        const [prevRows, curRows] = await Promise.all([
          fetchYearRows(currency, lastYear, collection),
          fetchYearRows(currency, thisYear, collection),
        ]);
        if (alive) {
          setState({ key, rows: [...prevRows, ...curRows].sort((a, b) => a.date.localeCompare(b.date)) });
        }
      } catch (e) {
        console.error(e);
        if (alive) setState({ key, rows: [] });
      }
    })();
    return () => { alive = false; };
  }, [currency, bank, key]);

  const ready = state.key === key;
  return { rows: ready ? state.rows : [], loading: !ready };
}
