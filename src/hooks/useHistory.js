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
