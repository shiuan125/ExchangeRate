import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createCachedLoader } from '../utils/cache';

// 卡片（徽章／漲跌箭頭）與走勢圖會讀同一份文件，5 分鐘內共用一次讀取
const HISTORY_CACHE_TTL_MS = 5 * 60_000;

const loadDocRows = createCachedLoader(async (path) => {
  const snap = await getDoc(doc(db, path));
  const raw = snap.exists() ? snap.data() : {};
  return Object.entries(raw)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}, HISTORY_CACHE_TTL_MS);

/** 抓單一年份的歷史資料，依日期由舊到新排序；collection 國泰為 rates、永豐為 sinopac_rates */
export function fetchYearRows(currency, year, collection = 'rates') {
  return loadDocRows(`${collection}/${currency}_${year}`);
}
