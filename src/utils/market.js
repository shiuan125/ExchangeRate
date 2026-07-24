/** 取得當前台北時間的 { day, minutes } */
function taipeiNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: dayMap[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** 報價更新時間：週一至週五 09:00–15:30（台北時間） */
export function isMarketOpen() {
  const { day, minutes } = taipeiNow();
  return day >= 1 && day <= 5 && minutes >= 540 && minutes <= 930;
}

/**
 * 收盤（15:30）後、Firestore 每日同步（排程 15:40）完成前的空窗期。
 * GitHub Actions 排程曾觀察到延遲達 2 小時以上，緩衝到 18:30 避免這段時間內
 * 使用者看到的是 Firestore 裡尚未更新的前一交易日資料。
 * 此時 Firestore 尚未寫入今天的收盤價，這段時間仍需直接打 API 才能拿到今天最後一筆報價。
 */
export function isSyncPending() {
  const { day, minutes } = taipeiNow();
  return day >= 1 && day <= 5 && minutes > 930 && minutes <= 1110;
}
