import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/** 抓單一年份的歷史資料，依日期由舊到新排序；collection 國泰為 rates、永豐為 sinopac_rates */
export async function fetchYearRows(currency, year, collection = 'rates') {
  const snap = await getDoc(doc(db, collection, `${currency}_${year}`));
  const raw = snap.exists() ? snap.data() : {};
  return Object.entries(raw)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
