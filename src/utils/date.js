/** 台北時區「今天」的 YYYY-MM-DD，跟 Firestore dateKey 格式一致 */
export function taipeiToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
}

/** 台北時區「N 天前」的 YYYY-MM-DD */
export function dateKeyDaysAgo(n) {
  const [y, m, d] = taipeiToday().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - n);
  return dt.toISOString().slice(0, 10);
}
