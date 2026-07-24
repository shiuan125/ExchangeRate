import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { taipeiToday } from '../utils/date';

/** 抓某幣別跨今年／去年的歷史資料（合併排序），供「近N天最低/最高」徽章判斷用 */
export function useRateHistory(currency) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const thisYear = taipeiToday().slice(0, 4);
      const lastYear = String(Number(thisYear) - 1);

      const toRows = (snap) =>
        snap.exists()
          ? Object.entries(snap.data()).map(([date, v]) => ({ date, ...v }))
          : [];

      try {
        const [prevSnap, curSnap] = await Promise.all([
          getDoc(doc(db, 'rates', `${currency}_${lastYear}`)),
          getDoc(doc(db, 'rates', `${currency}_${thisYear}`)),
        ]);
        if (!alive) return;
        const combined = [...toRows(prevSnap), ...toRows(curSnap)]
          .sort((a, b) => a.date.localeCompare(b.date));
        setRows(combined);
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      }
    })();
    return () => { alive = false; };
  }, [currency]);

  return rows;
}
