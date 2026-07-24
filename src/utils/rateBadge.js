import { taipeiToday, dateKeyDaysAgo } from './date';

/** 由長到短，優先顯示涵蓋範圍最大的區間 */
const WINDOWS = [
  { days: 365, label: '近一年' },
  { days: 180, label: '近半年' },
  { days: 30, label: '近月' },
  { days: 7, label: '近7天' },
];

/**
 * 判斷 current 是否為某個區間內的最低/最高，回傳可顯示的徽章文字（例如「近月最低」）。
 * 資料涵蓋範圍不足該區間天數時，該區間不會被採用；找不到任何符合的區間則回傳 null。
 * @param {Array<{date: string, [field: string]: number}>} rows 依日期由舊到新排序的歷史資料
 * @param {number} current 目前顯示的即時價格
 * @param {string} field Firestore 欄位名，例如 'spotBuy' / 'cashSell'
 * @param {'low' | 'high'} kind 'low' 用於賣出（越低對使用者越有利），'high' 用於買入
 */
export function computeRateBadge(rows, current, field, kind) {
  if (!rows.length || typeof current !== 'number') return null;

  const today = taipeiToday();
  const earliest = rows[0].date;

  for (const w of WINDOWS) {
    const cutoff = dateKeyDaysAgo(w.days - 1);
    if (earliest > cutoff) continue; // 資料天數不足，跳過這個區間

    const values = rows
      .filter((r) => r.date >= cutoff && r.date <= today)
      .map((r) => r[field])
      .filter((v) => typeof v === 'number');
    if (!values.length) continue; // 區間內剛好沒有實際資料（例如連假），無從比較，跳過

    values.push(current);
    const extreme = kind === 'low' ? Math.min(...values) : Math.max(...values);
    const qualifies = kind === 'low' ? current <= extreme : current >= extreme;
    if (qualifies) return `${w.label}${kind === 'low' ? '最低' : '最高'}`;
  }

  return null;
}
