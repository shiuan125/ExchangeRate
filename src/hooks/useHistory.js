import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/** 抓單一年份的歷史資料，依日期由舊到新排序 */
export async function fetchYearRows(currency, year) {
  const snap = await getDoc(doc(db, 'rates', `${currency}_${year}`));
  const raw = snap.exists() ? snap.data() : {};
  return Object.entries(raw)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function useHistory(currency, year = new Date().getFullYear()) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchYearRows(currency, year);
        if (alive) setRows(list);
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currency, year]);

  return { rows, loading };
}
