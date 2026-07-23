/**
 * 解析報價時間字串（台北時間）
 * new Date("2026/07/23 14:34:22") 在 Safari 會回傳 Invalid Date，只有 Chrome 容錯，
 * 所以必須手動解析。
 * @param {string} s - "2026/07/23 14:34:22"
 * @returns {{ dateKey: string, ts: Date } | null}
 */
export function parseBoardTime(s) {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m.map(Number);
  return {
    dateKey: `${m[1]}-${m[2]}-${m[3]}`,
    ts: new Date(Date.UTC(y, mo - 1, d, h - 8, mi, se)),
  };
}

/** 距今幾分鐘 */
export function minutesSince(ts) {
  return (Date.now() - ts.getTime()) / 60000;
}
